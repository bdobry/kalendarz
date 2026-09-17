import { test, expect } from '@playwright/test';
const route = '/kalkulator-urlopu/#rok=2026';
const key = 'nierobie.personal-plan.v1';
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-16T12:00:00Z'));
  await page.addInitScript(() => { try { localStorage.setItem('cookie_consent', 'granted'); } catch {} });
});

test('calendar bridges merge, persist, reset and keep annual budgets separate', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(route);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Planer urlopu.');
  await page.locator('[data-date="2026-01-02"]').click();
  await page.locator('[data-date="2026-01-05"]').press('Space');
  await expect(page.locator('.plan-total')).toContainText('2 dni urlopu');
  await expect(page.locator('.plan-total')).toContainText('6 dni w Twoich przerwach');
  await expect(page.locator('.plan-break')).toHaveCount(1);
  await page.getByLabel('Roczna pula urlopu').fill('1');
  await expect(page.locator('.plan-over-budget')).toContainText('o 1 dni');
  await page.reload();
  await expect(page.locator('[data-date="2026-01-02"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByLabel('Roczna pula urlopu')).toHaveValue('1');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2027');
  await expect(page.getByLabel('Roczna pula urlopu')).toHaveValue('26');
  await page.locator('[data-date="2027-01-04"]').click();
  await page.getByRole('button', { name: 'Resetuj' }).click();
  await expect(page.locator('[data-date="2027-01-04"]')).toHaveAttribute('aria-pressed', 'false');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2026');
  await expect(page.locator('.plan-total')).toContainText('2 dni urlopu');
  expect(errors).toEqual([]);
});

test('strategy CTA immediately selects and saves dates, preserves the existing plan and survives reload', async ({ page }) => {
  await page.goto(route);
  await page.locator('[data-date="2026-09-17"]').click();
  const before = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).leave, key);
  await page.goto('/2026/');
  await expect(page.locator('.year-plan-cta')).toHaveAttribute('href', '/kalkulator-urlopu/#rok=2026');
  const link = page.locator('.strategy-plan-cta').first();
  const target = await link.getAttribute('href');
  const dates = new URLSearchParams(target!.split('#')[1]).get('dni')!.split(',');
  await link.click();
  await expect(page.locator('.plan-feedback')).toContainText('Dodano mostek ze strategii');
  const firstYear = dates[0].slice(0, 4);
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue(firstYear);
  await expect(page).toHaveURL(new RegExp(`#rok=${firstYear}$`));
  for (const selectedYear of [...new Set([...before, ...dates].map(date => date.slice(0, 4)))]) {
    await page.getByLabel('Rok planu', { exact: true }).selectOption(selectedYear);
    for (const date of [...before, ...dates].filter(date => date.startsWith(selectedYear))) await expect(page.locator(`[data-date="${date}"]`)).toHaveAttribute('aria-pressed', 'true');
  }
  const combined = [...new Set([...before, ...dates])].sort();
  await page.reload();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).leave, key)).toEqual(combined);
  // Returning to the same document with another strategy fragment also applies it.
  await page.goto(target!);
  for (const date of dates.filter(date => date.startsWith(firstYear))) await expect(page.locator(`[data-date="${date}"]`)).toHaveAttribute('aria-pressed', 'true');
});

test('donation release and school overlays do not consume leave', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: '♡ Osocze', exact: true }).click();
  await page.locator('[data-date="2026-09-17"]').click();
  await expect(page.locator('[data-date="2026-09-18"]')).toHaveClass(/is-donation/);
  await expect(page.locator('.plan-total')).toContainText('0 dni urlopu');
  await expect(page.locator('.plan-total')).toContainText('4 dni w Twoich przerwach');
  await page.getByLabel('Tryb uczniowski').check();
  await expect(page.locator('[data-date="2026-01-19"]')).toHaveClass(/is-school/);
  await page.getByLabel('Województwo').selectOption('małopolskie');
  await expect(page.locator('[data-date="2026-01-19"]')).not.toHaveClass(/is-school/);
  await expect(page.locator('[data-date="2026-02-02"]')).toHaveClass(/is-school/);
  await expect(page.locator('[data-date="2026-07-01"]')).toHaveClass(/is-school/);
  await page.getByRole('button', { name: 'Usuń donację 2026-09-17' }).click();
  await expect(page.locator('.plan-total')).toContainText('0 dni w Twoich przerwach');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2099');
  await expect(page.locator('.plan-data-missing').first()).toContainText('Brak zweryfikowanych');
});

test('reset clears the current year, preserves preferences and other years, and backup controls are absent', async ({ page }) => {
  const seed = { version: 1, leave: ['2025-12-29', '2026-01-02', '2026-09-17', '2027-01-04'], donations: [{ date: '2025-12-31', type: 'plasma' }, { date: '2026-03-03', type: 'blood' }, { date: '2027-01-14', type: 'plasma' }], donorProfile: 'female', budgets: { '2026': 20, '2027': 26 }, school: { enabled: true, region: 'małopolskie' } };
  await page.addInitScript(({ key, seed }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed)); }, { key, seed });
  await page.goto(route);
  await expect(page.getByRole('button', { name: 'Pobierz kopię' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Wczytaj kopię' })).toHaveCount(0);
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.locator('.plan-total')).toContainText('2 dni urlopu');
  await page.getByRole('button', { name: 'Resetuj' }).click();
  await expect(page.locator('.plan-total')).toContainText('0 dni urlopu');
  await expect(page.locator('[data-date="2026-01-02"]')).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-date="2026-03-03"]')).not.toHaveClass(/is-donation/);
  const expected = { ...seed, leave: seed.leave.filter(date => !date.startsWith('2026-')), donations: seed.donations.filter(d => !d.date.startsWith('2026-')) };
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(expected);
  await page.reload();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key)).toEqual(expected);
  await expect(page.getByRole('button', { name: 'Resetuj' })).toBeDisabled();
  await expect(page.getByLabel('Roczna pula urlopu')).toHaveValue('20');
  await expect(page.getByLabel('Województwo')).toHaveValue('małopolskie');
});

test('blocked browser storage leaves a usable planner with an honest status', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); }; });
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(route);
  await page.locator('[data-date="2026-01-02"]').click();
  await expect(page.locator('.plan-save-status')).toContainText('Zapis niedostępny');
  await expect(page.locator('.plan-total')).toContainText('4 dni w Twoich przerwach');
  expect(errors).toEqual([]);
});

test('cached HTML hydrates in a new year and stays readable without JavaScript', async ({ browser, page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.clock.setFixedTime(new Date('2027-01-02T12:00:00Z'));
  await page.goto('/kalkulator-urlopu/');
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue('2027');
  expect(errors).toEqual([]);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto('/kalkulator-urlopu/');
  await expect(staticPage.locator('.plan-month')).toHaveCount(12);
  await expect(staticPage.locator('noscript .plan-notice')).toBeVisible();
  await staticPage.getByText('Gdzie zapisuje się mój plan bez konta?', { exact: true }).click();
  await expect(staticPage.getByText('W pamięci tej przeglądarki', { exact: false })).toBeVisible();
  await context.close();
});

test('calendar, advanced controls and summary fit narrow screens', async ({ page }, testInfo) => {
  await page.goto(route);
  await page.getByLabel('Tryb uczniowski').check();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: testInfo.outputPath('planner-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath('planner-mobile.png'), fullPage: true });
});


test('donation calendar blocks invalid spacing, including across years, and reports the reason', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: '♡ Krew', exact: true }).click();
  await page.locator('[data-date="2026-12-20"]').click();
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2027');
  const blocked = page.locator('[data-date="2027-01-15"]');
  await expect(blocked).toHaveAttribute('aria-disabled', 'true');
  await blocked.dispatchEvent('click');
  await expect(page.locator('.plan-feedback')).toContainText('8 tygodni');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donations.length, key)).toBe(1);
  await expect(page.locator('[data-date="2027-02-13"]')).not.toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-date="2027-02-13"]').click();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donations.length, key)).toBe(2);
});

test('donation form edits entries, persists changes and blocks conflicting dates', async ({ page }) => {
  await page.goto(route);
  await page.getByLabel('Data donacji', { exact: true }).fill('2026-09-17');
  await page.getByRole('button', { name: 'Dodaj do kalendarza' }).click();
  await page.getByRole('button', { name: 'Edytuj donację 2026-09-17' }).click();
  await page.getByLabel('Data donacji', { exact: true }).fill('2026-09-24');
  await page.getByRole('button', { name: 'Zapisz zmianę' }).click();
  await expect(page.getByRole('button', { name: 'Edytuj donację 2026-09-24' })).toBeVisible();
  await expect(page.locator('[data-date="2026-09-17"]')).not.toHaveClass(/is-donation/);
  await page.getByLabel('Data donacji', { exact: true }).fill('2026-09-25');
  await expect(page.getByRole('button', { name: 'Dodaj do kalendarza' })).toBeDisabled();
  await expect(page.locator('#donation-form .donor-error')).toContainText('za wcześnie');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donations, key)).toEqual([{ date: '2026-09-24', type: 'blood' }]);
  await page.reload();
  await expect(page.locator('[data-date="2026-09-24"]')).toHaveClass(/is-donation/);
});

test('changing profile cannot bypass rolling annual limits', async ({ page }) => {
  await page.goto(route);
  await expect(page.getByRole('button', { name: 'Limit 4 donacji krwi', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Limit 6 donacji krwi', exact: true }).click();
  for (const date of ['2026-01-01', '2026-02-25', '2026-04-21', '2026-06-15', '2026-08-09']) {
    await page.getByLabel('Data donacji', { exact: true }).fill(date);
    await page.getByRole('button', { name: 'Dodaj do kalendarza' }).click();
  }
  await page.getByRole('button', { name: 'Limit 4 donacji krwi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Limit 6 donacji krwi', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Limit 4 donacji krwi', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#donation-form .donor-error')).toContainText('limit 4');
});

test('expanded months share a cross-year plan, split budgets and reopen saved dates', async ({ page }) => {
  await page.goto(route);
  const expand = page.getByRole('button', { name: 'Pokaż styczeń 2027' });
  await expand.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Styczeń 2027', exact: true }).getByRole('button', { name: 'Schowaj styczeń 2027' })).toBeVisible();
  await expect(expand).toHaveCount(0);
  await expect(page.locator('.plan-month')).toHaveCount(13);
  await expect(page.getByRole('region', { name: 'Styczeń 2027', exact: true })).toBeFocused();
  for (const date of ['2027-01-04', '2027-01-05']) await page.locator(`[data-date="${date}"]`).click();
  await expect(page.locator('.plan-total')).toContainText('0 dni urlopu w 2026');
  await expect(page.locator('.plan-other-years')).toContainText('2 z 26 dni urlopu');
  await expect(page.locator('.plan-month-cost')).toContainText('2 dni urlopu z puli 2027');
  for (const date of ['2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31']) await page.locator(`[data-date="${date}"]`).click();
  await expect(page.locator('.plan-total')).toContainText('4 dni urlopu w 2026');
  await expect(page.locator('.plan-total')).toContainText('14 dni w Twoich przerwach');
  await expect(page.locator('.plan-break-years')).toContainText('2026: 4 dni urlopu');
  await expect(page.locator('.plan-break-years')).toContainText('2027: 2 dni urlopu');
  await expect(page.locator('[data-date="2026-12-31"]')).toHaveCSS('border-top-right-radius', '0px');
  await expect(page.locator('[data-date="2027-01-01"]')).toHaveCSS('border-top-left-radius', '0px');
  await expect(page.locator('[data-date="2027-01-03"]')).toHaveCSS('border-top-right-radius', '0px');
  await expect(page.locator('[data-date="2027-01-04"]')).toHaveCSS('border-top-left-radius', '0px');
  await expect(page.locator('[data-date="2027-01-06"]')).toHaveCSS('border-top-right-radius', '5px');
  await page.reload();
  await expect(page.locator('[data-date="2027-01-04"]')).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2027');
  await expect(page.locator('.plan-total')).toContainText('2 dni urlopu w 2027');
  await expect(page.locator('.plan-total')).toContainText('14 dni w Twoich przerwach');
  await expect(page.locator('[data-date="2026-12-31"]')).toHaveAttribute('aria-pressed', 'true');
  const saved = await page.evaluate(key => localStorage.getItem(key), key);
  await page.getByRole('button', { name: 'Schowaj grudzień 2026' }).click();
  await expect(page.locator('[data-date="2026-12-31"]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Pokaż grudzień 2026' })).toBeFocused();
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(saved);
  await page.getByRole('button', { name: 'Pokaż grudzień 2026' }).click();
  await page.locator('[data-date="2026-12-31"]').click();
  await expect(page.locator('.plan-total')).toContainText('2 dni urlopu w 2027');
  await expect(page.locator('.plan-other-years')).toContainText('3 z 26 dni urlopu');
  await page.locator('[data-date="2026-12-31"]').click();
  await expect(page.locator('.plan-total')).toContainText('14 dni w Twoich przerwach');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2024');
  await expect(page.getByRole('button', { name: /Pokaż grudzień 2023/ })).toHaveCount(0);
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2099');
  await expect(page.getByRole('button', { name: /Pokaż styczeń 2100/ })).toHaveCount(0);
});

test('adjacent months enforce donation limits and load the school dates of their own year', async ({ page }) => {
  await page.goto(route);
  await page.getByRole('button', { name: '♡ Osocze', exact: true }).click();
  await page.locator('[data-date="2026-12-31"]').click();
  // The release on January 1 automatically reveals the adjacent month.
  await expect(page.locator('[data-date="2027-01-01"]')).toHaveClass(/is-donation/);
  await expect(page.locator('[data-date="2027-01-12"]')).toHaveAttribute('aria-disabled', 'true');
  await page.locator('[data-date="2027-01-12"]').dispatchEvent('click');
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).donations.length, key)).toBe(1);
  await page.locator('[data-date="2027-01-14"]').click();
  await expect(page.locator('[data-date="2027-01-15"]')).toHaveClass(/is-donation/);
  await expect(page.locator('.plan-total')).toContainText('1 dni roboczych zwolnienia za donacje');
  await expect(page.locator('.plan-other-years')).toContainText('2 dni za donacje');
  await page.getByLabel('Tryb uczniowski').check();
  await page.getByLabel('Województwo').selectOption('śląskie');
  await expect(page.locator('[data-date="2027-01-18"]')).toHaveClass(/is-school/);
  await expect(page.locator('[data-date="2027-01-17"]')).not.toHaveClass(/is-school/);
});
