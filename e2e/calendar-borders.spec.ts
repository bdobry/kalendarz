import { test, expect } from '@playwright/test';

test('selected leave has one continuous border at both ends, with open joins between days', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-09-17T12:00:00Z'));
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.goto('/2026/#planer');
  const day = (date: string) => page.locator(`[data-date="2026-${date}"]`);
  // Wednesday ends a break after the Tuesday holiday; Friday starts another.
  for (const date of ['01-07', '01-09', '01-14', '01-30']) await day(date).click();
  for (const [date, side] of [['01-07', 'right'], ['01-09', 'left'], ['01-14', 'both']]) {
    const cell = day(date);
    await expect(cell).toHaveCSS('border-top-width', '1px');
    const border = await cell.evaluate(el => {
      const css = getComputedStyle(el);
      return {
        colors: [css.borderTopColor, css.borderRightColor, css.borderBottomColor, css.borderLeftColor],
        top: css.borderTopWidth, bottom: css.borderBottomWidth,
        left: css.borderLeftWidth, right: css.borderRightWidth, shadow: css.boxShadow,
      };
    });
    expect(new Set(border.colors).size).toBe(1);
    expect(border.top).toBe('1px');
    expect(border.bottom).toBe('1px');
    expect(border.left).toBe(side === 'left' || side === 'both' ? '1px' : '0px');
    expect(border.right).toBe(side === 'right' || side === 'both' ? '1px' : '0px');
    expect(border.shadow).toBe('none');
    await cell.hover();
    await expect(cell).toHaveCSS('box-shadow', 'none');
  }
  await day('01-08').click();
  await expect(day('01-07')).toHaveCSS('border-right-width', '0px');
  await expect(day('01-08')).toHaveCSS('border-left-width', '0px');
  const seventh = (await day('01-07').boundingBox())!;
  const eighth = (await day('01-08').boundingBox())!;
  expect(Math.abs(seventh.x + seventh.width - eighth.x)).toBeLessThan(.1);
  expect(seventh.y).toBe(eighth.y);
  expect(seventh.height).toBe(eighth.height);
  // A month boundary continues the same break without adding a side seam.
  await expect(day('01-31')).toHaveCSS('border-right-width', '0px');
  await expect(day('02-01')).toHaveCSS('border-left-width', '0px');
  await expect(day('02-01')).toHaveCSS('border-right-width', '1px');
});
