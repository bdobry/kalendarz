import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const key = 'nierobie.personal-plan.v1';
const calendar = '/kalkulator-urlopu/#rok=2026&widok=kalendarz';
const donorCalendar = '/planer-krwiodawcy/#rok=2026&widok=kalendarz';
const seed = {
  version: 1,
  leave: ['2026-01-02', '2027-01-04'],
  donations: [{ date: '2026-09-17', type: 'plasma' }, { date: '2027-01-14', type: 'blood' }],
  donorProfile: 'unspecified',
  budgets: { '2026': 20 },
  school: { enabled: false, region: 'mazowieckie' },
};

test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-16T12:00:00Z'));
  await page.addInitScript(({ key, seed }) => {
    localStorage.setItem('cookie_consent', 'granted');
    if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed));
  }, { key, seed });
});

test('quick year planner hides donation tools and resets only leave', async ({ page }) => {
  await page.goto('/2026/#planer');
  await expect(page.getByRole('button', { name: /♡ (Krew|Osocze)/ })).toHaveCount(0);
  await expect(page.locator('#donation-form')).toHaveCount(0);
  await expect(page.locator('[data-date="2026-09-17"]')).toHaveClass(/is-donation/);
  await expect(page.locator('.calendar-legend')).toContainText('Donacja + dzień po');
  await page.getByRole('button', { name: /Resetuj/ }).click();
  await expect(page.locator('[data-date="2026-01-02"]')).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual({ ...seed, leave: ['2027-01-04'] });
  await page.getByRole('button', { name: 'Cofnij', exact: true }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(seed);
});

test('separate workspaces share the plan and reset only their own current-year data', async ({ page }) => {
  await page.goto(calendar);
  await expect(page.getByRole('button', { name: /♡ (Krew|Osocze)/ })).toHaveCount(0);
  await expect(page.locator('[data-date="2026-09-18"]')).toHaveClass(/is-donation/);
  await page.getByRole('button', { name: /Resetuj/ }).click();
  await page.goto(donorCalendar);
  await expect(page.locator('[data-date="2026-01-02"]')).not.toHaveClass(/is-leave/);
  await expect(page.locator('[data-date="2026-09-17"]')).toHaveClass(/is-donation/);
  await page.getByRole('button', { name: /Resetuj/ }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual({ ...seed, leave: ['2027-01-04'], donations: [seed.donations[1]] });
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2027');
  await expect(page).toHaveURL(/\/planer-krwiodawcy\/#.*rok=2027/);
  await expect(page.locator('[data-date="2027-01-04"]')).toHaveClass(/is-leave/);
  await expect(page.locator('[data-date="2027-01-14"]')).toHaveClass(/is-donation/);
});

test('legacy donation deep links open the donor workspace without losing saved dates', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2027&sekcja=donacje');
  await expect(page).toHaveURL(/\/planer-krwiodawcy\/#.*rok=2027/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Planer krwiodawcy');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(seed);
});

test('both planner pages hydrate cleanly, fit narrow screens and have independent canonicals', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/kalkulator-urlopu/', '/planer-krwiodawcy/']) {
    await page.goto(path + '#rok=2026');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nierobie.pl' + path);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
  expect(errors).toEqual([]);
});

test('adding a complete trip skips natural days off and charges each year separately', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026');
  await page.locator('.planner-range-control > summary').click();
  await page.getByLabel('Początek urlopu').fill('2026-12-24');
  await page.getByLabel('Koniec urlopu').fill('2027-01-06');
  await expect(page.locator('.planner-range-preview')).toContainText('5 dni');
  await expect(page.locator('.planner-range-preview')).toContainText('2026: 4 dni');
  await expect(page.locator('.planner-range-preview')).toContainText('2027: 1');
  await page.locator('.planner-range').getByRole('button', { name: 'Dodaj do planu' }).click();
  await expect(page.locator('.planner-range-control')).not.toHaveAttribute('open');
  await expect(page.locator('.planner-range-control > summary')).toBeFocused();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.leave).toEqual(['2026-01-02', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-04', '2027-01-05']);
  expect(saved.donations).toEqual(seed.donations);
  expect(saved.budgets).toEqual(seed.budgets);
});

test('range preview excludes donation release and existing leave before saving', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026');
  await page.locator('.planner-range-control > summary').click();
  await page.getByLabel('Początek urlopu').fill('2026-09-14');
  await page.getByLabel('Koniec urlopu').fill('2026-09-20');
  await expect(page.locator('.planner-range-preview')).toContainText('3 dni');
  await page.locator('.planner-range').getByRole('button', { name: 'Dodaj do planu' }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).leave, key)).toEqual(['2026-01-02', '2026-09-14', '2026-09-15', '2026-09-16', '2027-01-04']);
});

test('calendar export downloads only the selected workspace and year', async ({ page }) => {
  for (const [path, filename, included, excluded] of [
    ['/kalkulator-urlopu/', 'urlop', 'SUMMARY:Urlop', 'Donacja'],
    ['/planer-krwiodawcy/', 'donacje', 'SUMMARY:Donacja osocza i dzień po', 'SUMMARY:Urlop'],
  ]) {
    await page.goto(path + '#rok=2026');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Eksport do kalendarza (.ics)' }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(`nierobie-${filename}-2026.ics`);
    const contents = await readFile((await download.path())!, 'utf8');
    expect(contents).toContain(included);
    expect(contents).not.toContain(excluded);
    expect(contents).not.toContain('202701');
    expect(contents.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  }
});

test('both workspaces show the calendar immediately, also with legacy view links', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const path of ['/kalkulator-urlopu/', '/planer-krwiodawcy/']) {
    for (const suffix of ['#rok=2026', '#rok=2026&widok=kalendarz']) {
      await page.goto(path + suffix);
      await expect(page.locator('#planner-calendar-view')).toBeVisible();
      await expect(page.locator('.plan-month:not(.plan-month-adjacent)')).toHaveCount(12);
      await expect(page.getByRole('group', { name: 'Widok planera' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Przegląd', exact: true })).toHaveCount(0);
      await expect(page.locator('.calendar-efficiency-grade')).toHaveCount(0);
      const firstMonth = (await page.locator('.plan-month').first().boundingBox())!;
      expect(firstMonth.y, 'The calendar starts on the first desktop screen').toBeLessThan(800);
    }
  }
});

test('workspace navigation names each tool, shows the active one and preserves the selected year', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026');
  const navigation = page.getByRole('navigation', { name: 'Wybierz planer' });
  await expect(navigation.getByRole('link', { name: /Planer urlopu/ })).toHaveAttribute('aria-current', 'page');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2027');
  await navigation.getByRole('link', { name: /Planer krwiodawcy/ }).click();
  await expect(page).toHaveURL(/\/planer-krwiodawcy\/#rok=2027/);
  await expect(navigation.getByRole('link', { name: /Planer krwiodawcy/ })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('[data-date="2027-01-14"]')).toHaveClass(/is-donation/);
  await expect(page.locator('[data-date="2027-01-04"]')).toHaveClass(/is-leave/);
  await expect(page.locator('.plan-day.is-suggestion')).toHaveCount(0);
  await expect(page.locator('[data-calendar-swatch="suggestion"]')).toHaveCount(0);
  await navigation.getByRole('link', { name: /Planer urlopu/ }).click();
  await expect(page).toHaveURL(/\/kalkulator-urlopu\/#rok=2027/);
  await expect(page.locator('[data-date="2027-01-04"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-calendar-swatch="suggestion"]')).toHaveCount(1);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(seed);
});

test('both calendars remain readable without JavaScript and never show a holiday grade', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const path of ['/kalkulator-urlopu/', '/planer-krwiodawcy/']) {
    await page.goto(path);
    await expect(page.locator('.plan-month')).toHaveCount(12);
    await expect(page.locator('.plan-month').first()).toBeVisible();
    await expect(page.locator('.calendar-efficiency-grade')).toHaveCount(0);
    await expect(page.getByRole('navigation', { name: 'Wybierz planer' }).getByRole('link')).toHaveCount(2);
  }
  await context.close();
});

test('a suggested donation fills the form without saving and keeps the calendar mounted', async ({ page }) => {
  const history = { ...seed, donations: [{ date: '2026-08-01', type: 'blood' }] };
  await page.addInitScript(({ key, history }) => localStorage.setItem(key, JSON.stringify(history)), { key, history });
  await page.goto('/planer-krwiodawcy/#rok=2026');
  const brief = page.getByRole('region', { name: 'Terminy donacji' });
  await expect(brief.locator('.planner-donor-slot time')).toHaveAttribute('dateTime', '2026-09-25');
  await expect(page.getByRole('group', { name: 'Co zaznaczasz w kalendarzu' })).toHaveCount(1);
  const calendarNode = await page.locator('#planner-calendar-view').elementHandle();
  await brief.getByRole('button', { name: 'Wybierz termin' }).click();
  await expect(page.getByLabel('Data donacji', { exact: true })).toHaveValue('2026-09-25');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(history);
  await page.getByRole('button', { name: 'Dodaj do kalendarza' }).click();
  await expect(page.locator('[data-date="2026-09-25"]')).toHaveClass(/is-donation/);
  expect(await calendarNode!.evaluate(node => node.isConnected)).toBe(true);
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donations, key)).toEqual([...history.donations, { date: '2026-09-25', type: 'blood' }]);
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2025');
  await expect(brief).toContainText('Ten rok już minął');
  await expect(brief.getByRole('button', { name: 'Wybierz termin' })).toHaveCount(0);
});

test('new donors get a useful empty state and in-page actions keep the chosen year', async ({ page }) => {
  await page.addInitScript(({ key, seed }) => localStorage.setItem(key, JSON.stringify({ ...seed, donations: [] })), { key, seed });
  await page.goto('/planer-krwiodawcy/#rok=2027');
  const brief = page.getByRole('region', { name: 'Terminy donacji' });
  await expect(brief).toContainText('Dodaj wcześniejsze donacje');
  await expect(brief).toContainText('pierwszy raz');
  await expect(brief.getByRole('button', { name: 'Wybierz termin' })).toHaveCount(0);
  await brief.getByRole('button', { name: /Uzupełnij historię/ }).click();
  await expect(page.getByLabel('Data donacji', { exact: true })).toBeFocused();
  await expect(page).toHaveURL(/#rok=2027$/);
  await page.reload();
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue('2027');
  await expect(page.locator('#planner-calendar-view')).toBeVisible();
});

test('the donor limit is above the calendar and immediately updates availability across years', async ({ page }) => {
  const history = { ...seed, donations: ['2026-01-01', '2026-03-01', '2026-05-01', '2026-07-01'].map(date => ({ date, type: 'blood' })) };
  await page.addInitScript(({ key, history }) => {
    if (!sessionStorage.getItem('donor-profile-test')) {
      localStorage.setItem(key, JSON.stringify(history));
      sessionStorage.setItem('donor-profile-test', 'true');
    }
  }, { key, history });
  await page.goto('/planer-krwiodawcy/#rok=2026');
  const profile = page.getByRole('group', { name: 'Limit krwi pełnej w 12 miesiącach' });
  await expect(profile).toHaveCount(1);
  expect((await profile.boundingBox())!.y).toBeLessThan((await page.locator('#planner-calendar-view').boundingBox())!.y);
  await expect(page.locator('[data-date="2026-09-17"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('.planner-donor-slot')).toContainText('Brak terminu w 2026');
  await profile.getByRole('button', { name: 'Limit 6 donacji krwi' }).click();
  await expect(page.locator('.planner-donor-slot time')).toHaveAttribute('datetime', '2026-09-16');
  await expect(page.locator('[data-date="2026-09-17"]')).not.toHaveAttribute('aria-disabled', 'true');
  await page.reload();
  await expect(profile.getByRole('button', { name: 'Limit 6 donacji krwi' })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2027');
  await expect(profile.getByRole('button', { name: 'Limit 6 donacji krwi' })).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donations, key)).toEqual(history.donations);
});

test('booking shortcuts lead to official services without sending the personal plan', async ({ page }) => {
  await page.goto('/planer-krwiodawcy/#rok=2026');
  const booking = page.locator('.planner-donor-booking');
  await expect(booking.getByRole('link', { name: 'Otwórz IKP' })).toHaveAttribute('href', 'https://pacjent.gov.pl/ikp/zaloguj');
  await expect(booking.getByRole('link', { name: 'Znajdź centrum' })).toHaveAttribute('href', 'https://pacjent.gov.pl/chce-oddac-krew');
  for (const link of await booking.getByRole('link').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', /noreferrer/);
  }
  await booking.locator('summary').click();
  await expect(booking).toContainText('Apteczka → Krwiodawstwo');
  await expect(booking).toContainText('Zapis w tym planerze nie rezerwuje wizyty.');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(seed);
});

test('break entries jump to the calendar without replacing it or losing the annual balance', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026');
  const calendarNode = await page.locator('#planner-calendar-view').elementHandle();
  await page.getByRole('button', { name: 'Cały rok', exact: true }).click();
  await expect(page.locator('.planner-break-row')).toHaveCount(2);
  await page.locator('.planner-break-row').first().click();
  await expect(page.getByRole('region', { name: 'Styczeń 2026', exact: true })).toBeFocused();
  expect(await calendarNode!.evaluate(node => node.isConnected)).toBe(true);
  await expect(page.locator('.plan-budget-values strong')).toHaveAttribute('aria-label', 'Wybrano 1 dni urlopu z 20');
});
