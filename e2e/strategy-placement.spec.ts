import { test, expect } from '@playwright/test';
import { analyzeVacationStrategies } from '../utils/vacationStrategyUtils';
import { formatDateKey } from '../utils/dateUtils';
import { strategyPlannerHref } from '../utils/strategyPreview';

const key = 'nierobie.personal-plan.v1';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
});

test('year has three distinct previews and full strategy exists only in vacation planner', async ({ page }) => {
  await page.goto('/2027/#planer-urlopu');
  await expect(page.locator('.strategy-preview-card')).toHaveCount(3);
  await expect(page.locator('.strategy-preview-card').first()).toContainText('Korzystna długa przerwa');
  await expect(page.locator('#strategy-min-days')).toHaveCount(0);
  await expect(page.locator('.planner-full-strategy')).toHaveCount(0);
  await page.locator('.strategy-preview-all').click();
  await expect(page).toHaveURL('/kalkulator-urlopu/#rok=2027&sekcja=strategia');
  await expect(page.locator('#strategy-heading')).toHaveText('Strategia urlopowa 2027');
  await expect(page.locator('#strategy-min-days')).toBeVisible();
  await expect(page.locator('.planner-ideas')).toHaveCount(0);
  await expect(page.locator('.plan-month:not(.plan-month-adjacent)')).toHaveCount(12);
  await expect(page.locator('.planner-strategy-card')).toHaveCount(6);
  await page.goto('/planer-krwiodawcy/#rok=2027');
  await expect(page.locator('.planner-full-strategy')).toHaveCount(0);
});

test('preview deep link reveals the chosen proposal without selecting leave', async ({ page }) => {
  await page.goto('/2027/#planer-urlopu');
  const card = page.locator('.strategy-preview-card').last();
  const id = await card.getAttribute('id');
  await card.locator('a').click();
  await expect(page.locator(`#${id}`)).toHaveAttribute('data-expanded', 'true');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBeNull();
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue('2027');
});

test('strategy filters and adding leave retain mounted calendar, existing data and cross-year budgets', async ({ page }) => {
  const strategy = analyzeVacationStrategies(2026).find(item => item.vacationDays.some(date => date.getFullYear() === 2027) && item.vacationDays.some(date => date.getFullYear() === 2026))!;
  const seed = { version: 1, leave: ['2026-06-05', formatDateKey(strategy.vacationDays[0])], donations: [], donorProfile: 'unspecified', budgets: { '2026': 20, '2027': 26 }, school: { enabled: false, region: 'mazowieckie' } };
  await page.addInitScript(({ key, seed }) => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(seed)); }, { key, seed });
  await page.goto(strategyPlannerHref(2026, strategy));
  const calendar = await page.locator('#plan-month-2026-5').elementHandle();
  const card = page.locator(`#strategy-card-${strategy.id}`);
  await card.getByRole('button', { name: /Dodaj brakujące dni/ }).click();
  await expect(card.getByRole('button', { name: 'W Twoim planie ✓' })).toBeDisabled();
  expect(await calendar!.evaluate(element => element.isConnected)).toBe(true);
  const saved = await page.evaluate(key => JSON.parse(localStorage.getItem(key)!), key);
  expect(saved.leave).toEqual([...new Set([...seed.leave, ...strategy.vacationDays.map(formatDateKey)])].sort());
  expect(saved.budgets).toEqual(seed.budgets);
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue('2026');
  await page.locator('.strategy-seasons').getByRole('button', { name: 'Majówka', exact: true }).click();
  await expect(page.locator('.planner-strategy-card').first()).toContainText('Majówka');
  expect(await calendar!.evaluate(element => element.isConnected)).toBe(true);
  await page.reload();
  expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).leave, key)).toEqual(saved.leave);
});

test('strategy controls and preview fit mobile widths', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/2027/#planer-urlopu', '/kalkulator-urlopu/#rok=2027&sekcja=strategia']) {
      await page.goto(path);
      await expect(page.locator('.personal-planner')).toHaveClass(/is-ready/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test('a new strategy fragment clears filters and reveals cards beyond the first page', async ({ page }) => {
  const strategies = analyzeVacationStrategies(2027).sort((a, b) => b.efficiency - a.efficiency || b.freeDays - a.freeDays || a.startDate.getTime() - b.startDate.getTime());
  const requested = strategies[strategies.length - 1];
  await page.goto('/kalkulator-urlopu/#rok=2027');
  await page.locator('.strategy-seasons').getByRole('button', { name: 'Majówka', exact: true }).click();
  await page.locator('#strategy-sort').selectOption('date');
  await page.evaluate(href => { window.location.hash = href.split('#')[1]; }, strategyPlannerHref(2027, requested));
  const card = page.locator(`#strategy-card-${requested.id}`);
  await expect(card).toHaveAttribute('data-expanded', 'true');
  await expect(card).toBeVisible();
  await expect(page.locator('#strategy-sort')).toHaveValue('efficiency');
  await expect(page.locator('.strategy-seasons').getByRole('button', { name: 'Wszystkie', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Rok planu', { exact: true }).selectOption('2028');
  await page.evaluate(href => { window.location.hash = href.split('#')[1]; }, strategyPlannerHref(2027, requested));
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue('2027');
  await expect(card).toHaveAttribute('data-expanded', 'true');
});

test('preview timelines show every day in a single joined row and explain the comparison', async ({ page }) => {
  await page.goto('/2026/#planer-urlopu');
  const card = page.locator('.strategy-preview-card').first();
  const id = await card.getAttribute('id');
  const strategy = analyzeVacationStrategies(2026).find(item => `strategy-card-${item.id}` === id)!;
  await expect(card.locator('.strategy-timeline-day')).toHaveCount(strategy.freeDays);
  await expect(card.locator('.strategy-timeline-day.is-leave')).toHaveCount(strategy.daysToTake);
  expect(await card.locator('.is-leave').evaluateAll(days => days.map(day => day.getAttribute('data-timeline-date')))).toEqual(strategy.vacationDays.map(formatDateKey));
  const bounds = await card.locator('.strategy-timeline-day').evaluateAll(days => days.map(day => {
    const rect = day.getBoundingClientRect(); return { top: rect.top, left: rect.left, right: rect.right };
  }));
  for (let i = 1; i < bounds.length; i++) {
    expect(bounds[i].top).toBe(bounds[0].top);
    expect(Math.abs(bounds[i].left - bounds[i - 1].right)).toBeLessThan(1);
  }
  await card.locator('.strategy-insights-trigger').focus();
  await expect(card.getByRole('tooltip')).toContainText('remisów nie liczymy jako gorszych');
  await expect(card.getByRole('tooltip')).toContainText('2024–2100');
  await page.keyboard.press('Escape');
  await expect(card.getByRole('tooltip')).toBeHidden();
  await page.setViewportSize({ width: 320, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const scroll = card.locator('.strategy-timeline-scroll');
  await scroll.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => scroll.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
});

test('a strategy opens from its card or keyboard heading but adding and comparison controls stay independent', async ({ page }) => {
  await page.goto('/kalkulator-urlopu/#rok=2026&sekcja=strategia');
  const card = page.locator('.planner-strategy-card').first();
  await expect(card).toHaveAttribute('data-expanded', 'false');
  await card.locator('.planner-strategy-numbers').click();
  await expect(card).toHaveAttribute('data-expanded', 'true');
  await card.getByRole('button', { name: 'Szczegóły' }).click();
  await expect(card).toHaveAttribute('data-expanded', 'false');
  await card.locator('.strategy-add').click();
  await expect(card).toHaveAttribute('data-expanded', 'false');
  await expect(card.locator('.strategy-add')).toBeDisabled();
  await card.locator('.strategy-insights-trigger').click();
  await expect(card.getByRole('tooltip')).toBeVisible();
  await expect(card).toHaveAttribute('data-expanded', 'false');
  await card.locator('.strategy-title-toggle').press('Enter');
  await expect(card).toHaveAttribute('data-expanded', 'true');
  await card.locator('.strategy-title-toggle').press('Space');
  await expect(card).toHaveAttribute('data-expanded', 'false');
});

test('only Saturday and Sunday holidays use red dates and weekday names in the holiday table', async ({ page }) => {
  await page.goto('/2026/#swieta');
  const rows = page.locator('#swieta tbody tr');
  let weekends = 0;
  for (const row of await rows.all()) {
    const weekday = await row.locator('td').nth(1).innerText();
    if (weekday === 'sobota' || weekday === 'niedziela') {
      weekends++;
      await expect(row.locator('.holiday-weekend-date')).toHaveCount(2);
      await expect(row.locator('td').first()).toHaveCSS('color', 'rgb(179, 56, 69)');
      await expect(row.locator('td').nth(1)).toHaveCSS('color', 'rgb(179, 56, 69)');
    } else await expect(row.locator('.holiday-weekend-date')).toHaveCount(0);
  }
  expect(weekends).toBeGreaterThan(0);
});
