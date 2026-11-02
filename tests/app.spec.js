import { test, expect } from '@playwright/test';

test('museum experience supports all interactive modes', async ({ page }) => {
  const errors = [];
  page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  await page.waitForTimeout(1500);
  const ready = await page.evaluate(() => Boolean(window.__APP_READY__));
  if (!ready || errors.length) throw new Error(`App ready: ${ready}. Browser errors: ${errors.join(' | ')}`);
  await expect(page.locator('.loader')).toBeHidden({ timeout: 12_000 });
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.locator('canvas')).toHaveAttribute('data-scene', 'ready');
  await expect(page.locator('h1')).toContainText('Наследие');
  await expect.poll(() => page.evaluate(() => Boolean(window.__APP_READY__))).toBe(true);

  await page.locator('#explore').click();
  await expect(page.locator('#workspace')).toHaveClass(/active/);
  await page.waitForTimeout(1900);

  await page.locator('[data-mode="explode"]').click();
  await expect(page.locator('[data-mode="explode"]')).toHaveClass(/active/);

  await page.locator('[data-mode="build"]').click();
  await page.locator('[data-stage="1"]').click();
  await expect(page.locator('[data-stage="1"]')).toHaveClass(/active/);

  await page.locator('[data-mode="xray"]').click();
  await expect(page.locator('#xray-panel')).toHaveClass(/visible/);
  await page.locator('#opacity').fill('52');
  await expect(page.locator('#xray-panel output')).toHaveText('52%');

  await page.locator('[data-mode="explore"]').click();
  await page.evaluate(() => window.__TOWER_API__.selectComponent('lower'));
  await expect(page.locator('#detail-card')).toHaveClass(/visible/);

  await page.locator('#revive').click();
  await expect(page.locator('body')).toHaveClass(/cinematic/);
  await page.locator('#skip').click({ timeout: 4_000 });
  await expect(page.locator('body')).not.toHaveClass(/cinematic/);

  await expect(page.locator('.source-links a')).toHaveCount(2);
  await page.screenshot({ path: 'test-results/nasledie-main.png', fullPage: true });
  expect(errors).toEqual([]);
});
