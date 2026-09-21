import { test, expect } from '@playwright/test';
import { generateCalendarData, getYearStats } from '../utils/dateUtils';
import { EFFICIENCY_CLASSES } from '../utils/efficiencyClasses';

const holidayClass = (year: number, redeemSaturdays = false) => getYearStats(generateCalendarData(year), redeemSaturdays).efficiencyClass;

test('planner navigation stays inside the year badge with only the planner mode action', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/2026/');
  await expect(page.locator('.calendar-efficiency-grade')).toHaveText(holidayClass(2026));
  const plannerLink = page.getByRole('navigation', { name: 'Menu główne' }).getByRole('link', { name: 'Planer urlopu' });
  await expect(plannerLink).toHaveAttribute('href', '/kalkulator-urlopu/#rok=2026');
  await plannerLink.click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Planer urlopu.');
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveValue('2026');
  await page.goto('/2026/');
  await expect(page.locator('.calendar-year select')).toHaveCount(0);
  await expect(page.locator('.calendar-heading-actions button')).toHaveCount(1);
  await page.getByRole('switch', { name: 'Planer urlopu' }).click();
  await expect(page.locator('.calendar-year')).toHaveCSS('background-color', 'rgb(32, 32, 36)');
  await expect(page.locator('.calendar-year select')).toHaveValue('2026');
  await expect(page.locator('.plan-editing-controls').getByLabel('Rok planu', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Następny rok planu', exact: true }).click();
  await expect(page).toHaveURL(/\/2027\/#planer$/);
  await expect(page.locator('.calendar-year select')).toHaveValue('2027');
  await expect(page.locator('.calendar-efficiency-grade')).toHaveText(holidayClass(2027));
  await page.goto('/kalkulator-urlopu/#rok=2026&widok=kalendarz');
  await expect(page.getByLabel('Rok planu', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Następny rok planu', exact: true }).click();
  await expect(page.locator('.calendar-year select')).toHaveValue('2027');
  await expect(page.locator('.calendar-efficiency-grade')).toHaveCount(0);
  await page.getByRole('button', { name: 'Poprzedni rok planu', exact: true }).click();
  await expect(page.locator('.calendar-year select')).toHaveValue('2026');
  await expect(page.locator('.calendar-efficiency-grade')).toHaveCount(0);
  await expect(page.locator('.calendar-heading-actions button')).toHaveCount(0);
  await page.locator('.year-calendar').screenshot({ path: testInfo.outputPath('calendar-controls.png') });
  await expect(page.getByRole('switch', { name: 'Planer urlopu' })).toHaveCount(0);
  await expect(page.getByRole('group', { name: 'Widok planera' })).toHaveCount(0);
  await expect(page.locator('.year-calendar')).toBeVisible();
});

test('holiday class follows the Saturday setting and stays to the right of the year on small screens', async ({ page }) => {
  const year = Array.from({ length: 30 }, (_, i) => 2026 + i).find(y => holidayClass(y) !== holidayClass(y, true))!;
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.goto(`/${year}/`);
  await expect(page.locator('.calendar-efficiency-grade')).toHaveText(holidayClass(year));
  await page.getByRole('checkbox', { name: /Odbiór za sobotę/ }).press('Space');
  await expect(page.locator('.calendar-efficiency-grade')).toHaveText(holidayClass(year, true));
  await page.getByRole('switch', { name: 'Planer urlopu' }).click();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const badge = (await page.locator('.calendar-year').boundingBox())!;
    const efficiency = (await page.locator('.calendar-efficiency').boundingBox())!;
    expect(efficiency.x).toBeGreaterThan(badge.x + badge.width);
    expect(efficiency.y).toBeLessThan(badge.y + badge.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('the compact grade shares the scale colour and uses the app tooltip on hover, focus and touch', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.goto('/2026/');
  const badge = page.locator('.calendar-efficiency-grade');
  const tooltip = page.locator('.calendar-efficiency [role="tooltip"]');
  const rating = EFFICIENCY_CLASSES.find(item => item.id === holidayClass(2026))!;
  const scaleColour = await page.locator(`.year-efficiency .${rating.color}`).evaluate(el => getComputedStyle(el).backgroundColor);
  await expect(badge).toHaveCSS('background-color', scaleColour);
  expect(await badge.getAttribute('title')).toBeNull();
  await expect(tooltip).toBeHidden();
  expect(await page.locator('.calendar-efficiency').innerText()).toBe(holidayClass(2026));
  await badge.hover();
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText(rating.label);
  await badge.press('Escape');
  await expect(tooltip).toBeHidden();
  await badge.blur();
  await badge.focus();
  await expect(tooltip).toBeVisible();
  await page.setViewportSize({ width: 320, height: 900 });
  await badge.click();
  const box = (await tooltip.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(320);
});

test('month previews make room across only their own row and never cover dates', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/2026/#planer');
  for (const [width, columns] of [[1440, 6], [900, 3], [600, 2], [390, 1]]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.mouse.move(0, 0);
    await expect(page.locator('.plan-month-row').first().locator('.plan-month')).toHaveCount(columns);
    for (const side of ['previous', 'next']) {
      const boundary = page.locator(`.plan-boundary-${side}`);
      const row = boundary.locator('..');
      const months = row.locator('.plan-month');
      const otherMonths = page.locator('.plan-month-row').filter({ hasNot: boundary }).locator('.plan-month');
      const before = await months.evaluateAll(items => items.map(item => { const r = item.getBoundingClientRect(); return { width: r.width, y: r.y + window.scrollY }; }));
      const otherWidths = await otherMonths.evaluateAll(items => items.map(item => item.getBoundingClientRect().width));
      await boundary.locator('.plan-month-peek').hover();
      const after = await months.evaluateAll(items => items.map(item => { const r = item.getBoundingClientRect(); return { width: r.width, y: r.y + window.scrollY }; }));
      after.forEach((item, i) => {
        expect(item.width).toBeLessThan(before[i].width);
        expect(Math.abs(item.y - before[i].y)).toBeLessThan(1);
      });
      expect(await otherMonths.evaluateAll(items => items.map(item => item.getBoundingClientRect().width))).toEqual(otherWidths);
      const peek = (await boundary.locator('.plan-month-peek').boundingBox())!;
      const month = (await boundary.locator('.plan-month').boundingBox())!;
      if (side === 'previous') expect(peek.x + peek.width).toBeLessThanOrEqual(month.x);
      else expect(peek.x).toBeGreaterThanOrEqual(month.x + month.width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      if (width === 1440 && side === 'previous') await row.screenshot({ path: testInfo.outputPath('month-preview-row.png') });
      await page.mouse.move(0, 0);
    }
  }
});

test('school controls remember the region across years and the compact balance keeps allowance above the calendar', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/2026/#planer');
  const school = page.getByRole('switch', { name: 'Tryb uczniowski' });
  const region = page.getByLabel('Województwo');
  await expect(school).not.toBeChecked();
  await expect(region).toHaveCount(0);
  await school.check();
  await region.selectOption('małopolskie');
  await expect(school).toBeChecked();
  await expect(page.locator('[data-date="2026-02-02"]')).toHaveClass(/is-school/);
  const monthsBox = (await page.locator('.plan-months').boundingBox())!;
  const schoolBox = (await page.locator('.school-panel').boundingBox())!;
  const quotaBox = (await page.locator('.plan-budget-control').boundingBox())!;
  expect(schoolBox.y).toBeGreaterThan(monthsBox.y + monthsBox.height);
  expect(schoolBox.height).toBeLessThan(60);
  expect(quotaBox.y + quotaBox.height).toBeLessThan(monthsBox.y);
  await expect(page.locator('.school-panel a')).toHaveCount(2);
  await page.locator('[data-date="2026-01-02"]').click();
  await page.locator('[data-date="2026-01-05"]').click();
  await expect(page.locator('.plan-budget-values strong')).toHaveAttribute('aria-label', 'Wybrano 2 dni urlopu z 26');
  await page.getByLabel('Roczna pula urlopu').fill('20');
  await expect(page.locator('.plan-budget-values strong')).toHaveAttribute('aria-label', 'Wybrano 2 dni urlopu z 20');
  expect((await page.locator('#plan-summary').boundingBox())!.height).toBeLessThan(160);
  await expect(page.locator('.plan-break')).toBeHidden();
  await page.locator('#kalendarz').screenshot({ path: testInfo.outputPath('compact-planner.png') });
  await page.locator('.plan-summary-details summary').click();
  await expect(page.locator('.plan-break')).toBeVisible();
  await school.uncheck();
  await expect(region).toHaveCount(0);
  await page.goto('/kalkulator-urlopu/#rok=2027&widok=kalendarz');
  await expect(school).not.toBeChecked();
  await expect(region).toHaveCount(0);
  await school.check();
  await expect(region).toHaveValue('małopolskie');
  await page.reload();
  await expect(school).toBeChecked();
  await expect(region).toHaveValue('małopolskie');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.plan-editing-controls').screenshot({ path: testInfo.outputPath('compact-planner-mobile.png') });
});

test('year calendar switches to the shared planner, distinguishes selected bridges and keeps the plan', async ({ page }, testInfo) => {
  await page.clock.setFixedTime(new Date('2026-09-17T12:00:00Z'));
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/2026/');
  const mode = page.getByRole('switch', { name: 'Planer urlopu' });
  await expect(mode).toHaveAttribute('aria-checked', 'false');
  await expect(page.locator('#plan-summary')).toHaveCount(0);
  const monthRows = () => page.locator('#kalendarz .plan-month').evaluateAll(months => {
    const rows = new Map<number, number>();
    months.forEach(month => { const y = Math.round(month.getBoundingClientRect().top); rows.set(y, (rows.get(y) ?? 0) + 1); });
    return [...rows.values()];
  });
  expect(await monthRows()).toEqual([6, 6]);
  await expect(page.locator('#day-2026-0-1 .calendar-day')).toHaveCSS('color', 'rgb(76, 62, 204)');
  await expect(page.locator('#day-2026-0-1 .calendar-day')).toHaveCSS('background-color', 'rgb(231, 223, 255)');
  await page.locator('.year-calendar').screenshot({ path: testInfo.outputPath('shared-calendar.png') });
  await mode.press('Space');
  await expect(mode).toHaveAttribute('aria-checked', 'true');
  expect(await monthRows()).toEqual([6, 6]);
  const bridge = page.locator('[data-date="2026-01-02"]');
  await expect(bridge).toHaveAttribute('aria-pressed', 'false');
  const suggestionColor = await bridge.evaluate(day => getComputedStyle(day).backgroundColor);
  await bridge.click();
  await expect(bridge).toHaveAttribute('aria-pressed', 'true');
  await expect(bridge.locator('svg')).toHaveCount(0);
  await expect(bridge).not.toHaveCSS('background-color', suggestionColor);
  await page.locator('[data-date="2026-01-05"]').click();
  await expect(page.locator('.plan-total')).toContainText('6 dni w Twoich przerwach');
  await expect(page.locator('[data-date="2026-01-01"] .plan-day-number')).toHaveCSS('color', 'rgb(76, 62, 204)');
  await expect(page.locator('[data-date="2026-01-01"]')).toHaveCSS('background-color', 'rgb(231, 223, 255)');
  const calendarBox = (await page.locator('.year-calendar').boundingBox())!;
  const balanceBox = (await page.locator('#plan-summary').boundingBox())!;
  expect(balanceBox.y).toBeGreaterThan(calendarBox.y + calendarBox.height);
  await expect(page.locator('.donor-panel')).toHaveCount(0);
  await page.locator('#kalendarz').screenshot({ path: testInfo.outputPath('shared-planner.png') });
  await mode.click();
  await expect(page.locator('#plan-summary')).toHaveCount(0);
  await page.reload();
  await mode.click();
  await expect(bridge).toHaveAttribute('aria-pressed', 'true');
  await bridge.click();
  await expect(bridge).toHaveAttribute('aria-pressed', 'false');
  await expect(bridge).toHaveCSS('background-color', suggestionColor);
  await page.goto('/kalkulator-urlopu/#rok=2026&widok=kalendarz');
  await expect(page.locator('[data-date="2026-01-05"]')).toHaveAttribute('aria-pressed', 'true');
});

test('year planner keeps cross-year budgets and fits narrow screens', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.goto('/2026/#planer');
  await expect(page.getByRole('switch', { name: 'Planer urlopu' })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Pokaż styczeń 2027' }).click();
  await page.locator('[data-date="2027-01-04"]').click();
  await page.locator('[data-date="2026-12-31"]').click();
  await expect(page.locator('.plan-total')).toContainText('1 dni urlopu w 2026');
  await expect(page.locator('.plan-other-years')).toContainText('1 z 26 dni urlopu');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator('.year-nav-plan')).toBeInViewport();
    const headerItems = await page.locator('.year-nav > *').evaluateAll(items => items.map(item => {
      const r = item.getBoundingClientRect();
      return { x: r.x, y: r.y, right: r.right, bottom: r.bottom };
    }));
    headerItems.forEach((a, i) => headerItems.slice(i + 1).forEach(b => {
      expect(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y).toBe(true);
    }));
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test('bridge examples join days, work with the keyboard and respect reduced motion', async ({ page }, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.clock.setFixedTime(new Date('2028-01-01T12:00:00Z'));
  await page.goto('/');
  const leave = page.getByRole('button', { name: 'Urlop w piątek' });
  await expect(leave).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.bridge-calendar-heading')).toContainText('2028');
  await expect(page.locator('.bridge-result')).toContainText('2dni weekendu.');
  await leave.press('Enter');
  await expect(leave).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.bridge-result')).toContainText('4dni wolnego ciągiem.');
  await expect(page.locator('.bridge-scene')).toHaveCSS('transform', 'none');
  const expectJoinedDays = async () => {
    const bounds = await page.locator('.bridge-day').evaluateAll(days => days.map(day => {
      const r = day.getBoundingClientRect(); return { left: r.left, right: r.right };
    }));
    bounds.slice(1).forEach((day, i) => expect(Math.abs(day.left - bounds[i].right)).toBeLessThan(1));
  };
  await expectJoinedDays();
  await page.locator('.bridge-playground').screenshot({ path: testInfo.outputPath('bridge-connected.png') });
  await leave.press('Space');
  await expect(leave).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.bridge-result')).toContainText('2dni weekendu.');
  await page.locator('.bridge-playground').screenshot({ path: testInfo.outputPath('bridge-disconnected.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await leave.click();
  await expectJoinedDays();
  await page.locator('.bridge-playground').screenshot({ path: testInfo.outputPath('bridge-mobile.png') });

  await page.goto('/kalkulator-urlopu/#rok=2026&sekcja=strategia');
  await page.locator('.planner-strategy-guide > summary').click();
  await expect(leave).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.strategy-equation-total')).toHaveText('4dni wolnego ciągiem');
  await expectJoinedDays();
  await page.locator('.year-strategy-guide').screenshot({ path: testInfo.outputPath('strategy-bridge-mobile.png') });
  await leave.press('Enter');
  await expect(leave).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.strategy-equation-total')).toHaveText('2dni wolnego ciągiem');
  await expect(page.locator('.strategy-example-note')).toContainText('piątek w pracy oddziela go od weekendu');
  await leave.press('Space');
  await expect(leave).toHaveAttribute('aria-pressed', 'true');
  await expectJoinedDays();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('.year-strategy-guide').screenshot({ path: testInfo.outputPath('strategy-bridge-desktop.png') });
  await page.goto('/2026/');
  await page.locator('.year-nav').screenshot({ path: testInfo.outputPath('year-menu-desktop.png') });
});
