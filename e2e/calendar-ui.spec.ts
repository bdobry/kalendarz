import { test, expect } from '@playwright/test';

test('home bridge works with the keyboard and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.setFixedTime(new Date('2028-01-01T12:00:00Z'));
  await page.goto('/');
  const leave = page.getByRole('button', { name: 'Dodaj dzień urlopu w piątek' });
  await expect(leave).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.bridge-calendar-heading')).toContainText('2028');
  await expect(page.locator('.bridge-result')).toContainText('2dni weekendu.');
  await leave.press('Enter');
  await expect(leave).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.bridge-result')).toContainText('4dni wolnego ciągiem.');
  await expect(page.locator('.bridge-scene')).toHaveCSS('transform', 'none');
  await leave.press('Space');
  await expect(leave).toHaveAttribute('aria-pressed', 'false');
});

test('print contains all months on one A4 landscape page with minimal branding', async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    window.print = () => { document.documentElement.dataset.printRequested = 'true'; };
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/2028/');
  await page.getByRole('button', { name: 'Drukuj / PDF' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-print-requested', 'true');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.year-header')).toBeHidden();
  await expect(page.locator('.year-dashboard')).toBeHidden();
  await expect(page.locator('#planer-urlopu')).toBeHidden();
  await expect(page.locator('.calendar-print-button')).toBeHidden();
  await expect(page.locator('#kalendarz .year-month:visible')).toHaveCount(12);
  await expect(page.locator('.calendar-print-footer')).toBeVisible();
  // Match browser print preview even when its headers/footers option is on.
  const pdf = await page.pdf({ path: testInfo.outputPath('calendar-2028.pdf'), preferCSSPageSize: true, printBackground: true, displayHeaderFooter: true });
  await testInfo.attach('calendar-2028.pdf', { body: pdf, contentType: 'application/pdf' });
  expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
  // A4 landscape, in PDF points (allow sub-point rounding).
  expect(pdf.toString('latin1')).toMatch(/\/MediaBox \[0 0 84[12][.\d]* 59[45][.\d]*\]/);
  await page.setViewportSize({ width: 1123, height: 794 });
  const year = (await page.locator('.calendar-year').boundingBox())!;
  const legend = (await page.locator('.calendar-legend').boundingBox())!;
  expect(Math.abs(year.y + year.height / 2 - legend.y - legend.height / 2)).toBeLessThan(1);
});
