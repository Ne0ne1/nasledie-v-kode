import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

await fs.mkdir('renders', { recursive: true });
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4197'], {
  stdio: 'ignore',
});

async function waitForServer() {
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch('http://127.0.0.1:4197/');
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('Preview server did not start');
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ channel: 'chromium', headless: false });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:4197/?capture=1', { waitUntil: 'load' });
  await page.locator('.loader').waitFor({ state: 'hidden', timeout: 12_000 });
  await page.screenshot({ path: 'renders/01-hero.png' });

  await page.locator('#explore').click();
  await page.locator('.hero').waitFor({ state: 'hidden', timeout: 5_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'renders/02-front.png' });

  await page.evaluate(() => window.__TOWER_API__.switchMode('explode'));
  await page.waitForTimeout(1600);
  await page.screenshot({ path: 'renders/03-exploded.png' });

  await page.evaluate(() => window.__TOWER_API__.switchMode('xray'));
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'renders/04-xray.png' });
  console.log('PNG renders saved to renders/ (hero, front, exploded, x-ray)');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
