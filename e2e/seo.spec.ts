import { test, expect } from '@playwright/test';
import { analyzeVacationStrategies } from '../utils/vacationStrategyUtils';

test('real static HTTP routes, redirect and 404 semantics', async ({ request }) => {
  for (const path of ['/', '/2026/', '/2027/', '/kalkulator-urlopu/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<h1');
  }
  const redirect = await request.get('/2026?utm_source=test', { maxRedirects: 0 });
  expect(redirect.status()).toBe(301);
  expect(redirect.headers().location).toBe('/2026/?utm_source=test');
  for (const path of ['/missing', '/2026garbage', '/2100/']) expect((await request.get(path)).status()).toBe(404);
});

test('year pages remain readable and styled with JavaScript disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/2027/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dni wolne i długie weekendy 2027');
  await expect(page.locator('#swieta tbody tr')).toHaveCount(14);
  await expect(page.locator('[id^="strategy-card-"]').first()).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-weight', '700');
  await page.getByLabel('Poprzedni Rok').click();
  await expect(page).toHaveURL(/\/2026\/$/);
  await context.close();
});

test('hydration, calendar controls, normal navigation and browser history', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  // Cached HTML must hydrate correctly even on a different day and year than the build.
  await page.clock.setFixedTime(new Date('2032-02-29T12:00:00Z'));
  await page.goto('/');
  await expect(page).toHaveURL('http://127.0.0.1:4173/');
  await page.locator('nav[aria-label="Kalendarze lat"] a').first().click();
  await expect(page).toHaveURL(/\/\d{4}\/$/);
  await page.goto('/2026/');
  await page.getByLabel('Wybierz rok').selectOption('2027');
  await expect(page).toHaveURL(/\/2027\/$/);
  await expect(page).toHaveTitle('Dni wolne i długie weekendy 2027 – kalendarz | NieRobie.pl');
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('2026');
  await page.getByText('Odbiór za sobotę', { exact: true }).click();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://nierobie.pl/2026/');
  expect(errors.filter(error => !error.includes('ERR_BLOCKED_BY_CLIENT') && !error.includes('ERR_CERT_AUTHORITY_INVALID'))).toEqual([]);
});

test('calculator updates and validates dates on mobile without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/kalkulator-urlopu/');
  await page.getByLabel('Początek wypoczynku').fill('2026-04-27');
  await page.getByLabel('Koniec wypoczynku').fill('2026-05-03');
  await expect(page.locator('[aria-live="polite"]')).toContainText('4 dni urlopu na 7 dni wypoczynku');
  await page.getByLabel('Koniec wypoczynku').fill('2026-04-26');
  await expect(page.locator('[aria-live="polite"]')).toContainText('Data końca nie może być wcześniejsza');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});


test('strategy IDs and expansion match a build in another timezone', async ({ browser }) => {
  const context = await browser.newContext({ timezoneId: 'Pacific/Auckland' });
  const page = await context.newPage();
  await page.goto('/2027/');
  const expected = analyzeVacationStrategies(2027).map(s => `strategy-card-${s.id}`);
  const actual = await page.locator('[id^="strategy-card-"]').evaluateAll(cards => cards.map(card => card.id));
  expect(actual.length).toBeGreaterThan(0);
  expect(actual.every(id => expected.includes(id))).toBe(true);
  expect(actual.every(id => /^strategy-card-\d{4}-\d{2}-\d{2}_\d{4}-\d{2}-\d{2}$/.test(id))).toBe(true);
  const card = page.locator('[id^="strategy-card-"]').first();
  await card.click();
  await expect(card).toHaveClass(/ring-1/);
  // toggleExpand looks up this exact DOM ID to scroll to the expanded card.
  await expect.poll(async () => Math.round(await card.evaluate(el => el.getBoundingClientRect().top))).toBe(160);
  await context.close();
});

test('year calendar fits a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/2027/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
