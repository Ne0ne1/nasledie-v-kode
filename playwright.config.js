import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  outputDir: './test-results',
  use: {
    baseURL: 'http://127.0.0.1:4187',
    channel: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
  webServer: { command: 'pnpm exec vite preview --host 127.0.0.1 --port 4187', port: 4187, reuseExistingServer: true },
});
