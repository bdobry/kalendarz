import { test, expect } from '@playwright/test';
import { analyzeVacationStrategies } from '../utils/vacationStrategyUtils';

test('real static HTTP routes, redirect and 404 semantics', async ({ request }) => {
  for (const path of ['/', '/2026/', '/2027/', '/kalkulator-urlopu/', '/planer-krwiodawcy/']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('<h1');
    expect(html).not.toMatch(/BreadcrumbList|aria-label="Okruszki"/i);
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
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('2027');
  await expect(page.locator('#swieta tbody tr')).toHaveCount(14);
  await expect(page.locator('[id^="strategy-card-"]').first()).toBeVisible();
  await expect(page.locator('.year-curiosities-grid')).toContainText('Dni robocze w 2027');
  await page.locator('.year-monthly-stats summary').click();
  await expect(page.locator('.year-monthly-stats tbody tr')).toHaveCount(12);
  await expect(page.locator('.year-monthly-stats table')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toHaveCSS('font-weight', '800');
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
  for (const year of [2026, 2027]) {
    await page.goto(`/${year}/`);
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('dashboard separates one-day bridges from breaks requiring no leave', async ({ page }) => {
  await page.goto('/2026/');
  const panel = page.locator('.year-opportunities');
  const bridges = panel.locator('#potential-weekends-list');
  const natural = panel.locator('#long-weekends-list');
  await expect(bridges.getByRole('button')).toHaveCount(3);
  await expect(bridges.getByRole('button').first()).toContainText('Wypoczynek: 01.01 – 04.01');
  await expect(natural).toBeHidden();
  await page.locator('.year-balance .year-metric').first().click();
  await expect(natural).toBeVisible();
  await expect(bridges).toBeHidden();
  await expect(natural.getByRole('button')).toHaveCount(3);
  await panel.locator('summary').filter({ hasText: 'Z 2 dniami urlopu' }).click();
  const twoDays = panel.locator('#two-day-weekends-list');
  await expect(twoDays).toBeVisible();
  await expect(natural).toBeHidden();
  await expect(twoDays.getByRole('button').first()).toContainText('Weź urlop 02.01 i 05.01');
  await expect(twoDays.getByRole('button').first()).toContainText('Wypoczynek: 01.01 – 06.01');
  await expect(twoDays.locator('.opportunity-result').first()).toHaveText('6dni wolnego');
  await twoDays.getByRole('button').first().click();
  await expect(page.locator('#day-2026-0-2').first()).toBeInViewport();
  await expect(page.locator('#day-2026-0-5').first()).toHaveClass(/calendar-leave-highlight/);
  await page.locator('.year-metric-potential').click();
  await expect(bridges).toBeVisible();
  await bridges.getByRole('button').first().click();
  await expect(page.locator('#day-2026-0-2').first()).toBeInViewport();
});


test('homepage prioritizes this year and next year, and year view starts with the calendar UI', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-14T12:00:00Z'));
  await page.goto('/');
  const actions = page.getByRole('navigation', { name: 'Kalendarze lat' });
  await expect(actions.getByRole('link')).toHaveCount(2);
  await expect(actions.getByRole('link').first()).toHaveAttribute('href', '/2026/');
  await expect(actions.getByRole('link').last()).toHaveAttribute('href', '/2027/');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await actions.getByRole('link').first().click();
  await expect(page.getByRole('navigation', { name: 'Okruszki' })).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Na tej stronie' })).toHaveCount(0);
  await expect(page.getByText('Kalendarz świąt 2026 i planer urlopu w Polsce.', { exact: false })).toHaveCount(0);
  await expect(page.locator('#kalendarz h1')).toHaveText('2026');
});
