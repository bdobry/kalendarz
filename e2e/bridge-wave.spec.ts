import { test, expect, type Locator } from '@playwright/test';

const paused = (wave: Locator) => wave.evaluate((svg: SVGSVGElement) => svg.animationsPaused());
const seek = (wave: Locator, time: number) => wave.evaluate((svg: SVGSVGElement, time) => {
  svg.pauseAnimations();
  svg.setCurrentTime(time);
}, time);
const curve = (wave: Locator) => wave.locator('.leave-wave-svg-edge').evaluate((path: SVGPathElement) => {
  const length = path.getTotalLength();
  return Array.from({ length: 17 }, (_, i) => {
    const point = path.getPointAtLength(length * i / 16);
    return { x: Number(point.x.toFixed(3)), y: Number(point.y.toFixed(3)) };
  });
});

test('the wave travels repeatedly, keeps joins and fill fixed, and pauses outside the viewport', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/2026/');
  const day = page.locator('#day-2026-0-2 .calendar-day');
  const wave = day.locator('.leave-wave-svg');
  await expect.poll(() => paused(wave)).toBe(true);
  await day.scrollIntoViewIfNeeded();
  await expect.poll(() => paused(wave)).toBe(false);
  const bounds = await day.boundingBox();
  await seek(wave, 0);
  const first = await curve(wave);
  await seek(wave, .8);
  const second = await curve(wave);
  expect(second).not.toEqual(first);
  expect(second[0]).toEqual(first[0]);
  expect(second.at(-1)).toEqual(first.at(-1));
  await seek(wave, 4);
  expect(await curve(wave)).toEqual(second);
  expect(await day.boundingBox()).toEqual(bounds);
  await expect(wave.locator('.leave-wave-svg-fill')).toHaveCSS('fill', 'rgb(232, 252, 169)');
  await day.hover();
  await expect(wave.locator('.leave-wave-svg-fill')).toHaveCSS('fill', 'rgb(232, 252, 169)');
  expect(await wave.evaluate((svg: SVGSVGElement) => svg.getCurrentTime())).toBe(4);

  await wave.evaluate((svg: SVGSVGElement) => svg.unpauseAnimations());
  await page.mouse.move(0, 0);
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => paused(wave)).toBe(true);
  await day.scrollIntoViewIfNeeded();
  await expect.poll(() => paused(wave)).toBe(false);
  await page.getByRole('switch', { name: 'Planer urlopu' }).click();
  const selected = page.locator('[data-date="2026-01-02"]');
  await selected.press('Enter');
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(selected.locator('.leave-wave-svg')).toHaveCount(0);
  await page.reload();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(selected.locator('.leave-wave-svg')).toHaveCount(0);
});

test('mobile and 3D waves use a static fallback for reduced motion and print', async ({ browser, baseURL }) => {
  const page = await browser.newPage({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  try {
    await page.addInitScript(() => localStorage.setItem('cookie_consent', 'granted'));
    await page.goto('/2026/#planer');
    const selected = page.locator('[data-date="2026-01-02"]');
    const wave = selected.locator('.leave-wave-svg');
    await selected.scrollIntoViewIfNeeded();
    await expect.poll(() => paused(wave)).toBe(true);
    await expect(wave).toBeHidden();
    await expect(selected.locator('.leave-wave-fill')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => paused(wave)).toBe(false);
    await expect(wave).toBeVisible();
    await selected.tap();
    await expect(selected.locator('.leave-wave-svg')).toHaveCount(0);

    await page.goto('/');
    const example = page.getByRole('button', { name: 'Urlop w piątek' });
    await example.tap();
    await expect(example).toHaveAttribute('aria-pressed', 'true');
    const exampleWave = example.locator('.leave-wave-svg');
    await expect.poll(() => paused(exampleWave)).toBe(false);
    await expect(exampleWave.locator('.leave-wave-svg-fill')).toHaveCSS('fill', 'rgb(232, 252, 169)');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect.poll(() => paused(exampleWave)).toBe(true);
    await expect(exampleWave).toBeHidden();
    await expect(example.locator('.leave-wave-fill')).toBeVisible();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect.poll(() => paused(exampleWave)).toBe(false);
    await page.emulateMedia({ media: 'print' });
    await expect.poll(() => paused(exampleWave)).toBe(true);
    await expect(exampleWave).toBeHidden();
  } finally {
    await page.close();
  }
});
