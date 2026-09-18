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
  await page.getByLabel('Początek urlopu').fill('2026-12-24');
  await page.getByLabel('Koniec urlopu').fill('2027-01-06');
  await expect(page.locator('.planner-range-preview')).toContainText('5 dni');
  await expect(page.locator('.planner-range-preview')).toContainText('2026: 4 dni');
  await expect(page.locator('.planner-range-preview')).toContainText('2027: 1');
  await page.getByRole('button', { name: 'Dodaj do planu' }).click();
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.leave).toEqual(['2026-01-02', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31', '2027-01-04', '2027-01-05']);
  expect(saved.donations).toEqual(seed.donations);
  expect(saved.budgets).toEqual(seed.budgets);
});

test('range preview excludes donation release and existing leave before saving', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026');
  await page.getByLabel('Początek urlopu').fill('2026-09-14');
  await page.getByLabel('Koniec urlopu').fill('2026-09-20');
  await expect(page.locator('.planner-range-preview')).toContainText('3 dni');
  await page.getByRole('button', { name: 'Dodaj do planu' }).click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).leave, key)).toEqual(['2026-01-02', '2026-09-14', '2026-09-15', '2026-09-16', '2027-01-04']);
});

test('calendar export downloads only the selected workspace and year', async ({ page }) => {
  for (const [path, filename, included, excluded] of [
    ['/kalkulator-urlopu/', 'urlop', 'SUMMARY:Urlop', 'Donacja'],
    ['/planer-krwiodawcy/', 'donacje', 'SUMMARY:Donacja osocza i dzień po', 'SUMMARY:Urlop'],
  ]) {
    await page.goto(path + '#rok=2026');
    const downloaded = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Eksport ICS' }).click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(`nierobie-${filename}-2026.ics`);
    const contents = await readFile((await download.path())!, 'utf8');
    expect(contents).toContain(included);
    expect(contents).not.toContain(excluded);
    expect(contents).not.toContain('202701');
    expect(contents.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  }
});

test('overview month shortcuts open the right calendar month and keep the selected year', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026');
  await page.getByRole('button', { name: /Styczeń 2026: 1 (dni|dzień) urlopu. Otwórz kalendarz/ }).click();
  await expect(page).toHaveURL(/rok=2026&widok=kalendarz/);
  await expect(page.getByRole('region', { name: 'Styczeń 2026', exact: true })).toBeFocused();
  await expect(page.locator('[data-date="2026-01-02"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Przegląd', exact: true }).click();
  await expect(page.locator('.planner-metric-primary')).toContainText('19');
  await page.getByRole('button', { name: 'Cały rok', exact: true }).click();
  await expect(page.locator('.planner-break-row')).toHaveCount(2);
});
