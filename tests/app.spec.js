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
  for (const [key, label] of [['beams2', 'Балки уровня 3'], ['roofStep4', 'Ступень покрытия 5'], ['entrance', 'Входная арка']]) {
    await page.evaluate((part) => window.__TOWER_API__.selectComponent(part), key);
    await expect(page.locator('.detail-title')).toHaveText(label);
  }

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

test('information buttons open the visible panel at the requested section', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.loader')).toBeHidden({ timeout: 12000 });
  for (const anchor of ['about', 'controls', 'sources']) {
    await page.locator('.menu-button').click();
    await page.locator('[data-scroll="' + anchor + '"]').click();
    const panel = page.locator('#info-sheet');
    await expect(panel).toBeInViewport({ ratio: 0.9 });
    await expect(page.locator('#' + anchor)).toBeInViewport();
    await page.locator('#info-close').click();
    await expect(panel).toBeHidden();
  }
  await page.locator('#info-open').click();
  await expect(page.locator('#info-sheet')).toBeInViewport({ ratio: 0.9 });
  await expect(page.locator('#about')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('#info-sheet')).toBeHidden();
});

test('furnishings are separately pickable and move with their floor', async () => {
  const { createTower } = await import('../src/Tower.js');
  const { Vector3 } = await import('three');
  const tower = createTower();
  const exhibits = [];
  tower.root.traverse((object) => { if (object.userData.exhibit) exhibits.push(object); });
  expect(exhibits.map((object) => object.userData.label)).toEqual(expect.arrayContaining([
    'Ручные жернова', 'Деревянное ведро', 'Деревянный сундук', 'Межэтажная лестница', 'Глиняный кувшин',
  ]));
  for (const exhibit of exhibits) {
    exhibit.traverse((mesh) => {
      if (mesh.isMesh) {
        expect(tower.selectables.includes(mesh)).toBeTruthy();
        expect(mesh.userData.component).toBe(exhibit);
      }
    });
  }
  const mill = exhibits.find((object) => object.userData.label === 'Ручные жернова');
  tower.root.updateMatrixWorld(true);
  const before = mill.getWorldPosition(new Vector3());
  tower.components.floors.position.z = 6;
  tower.root.updateMatrixWorld(true);
  expect(mill.getWorldPosition(new Vector3()).z - before.z).toBeCloseTo(6 * .88);
});
