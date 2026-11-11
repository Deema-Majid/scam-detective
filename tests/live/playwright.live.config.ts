import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: '.',
  testMatch: /.*\.live\.ts/,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  outputDir: '../../test-results/live',
  use: { baseURL: 'https://deema-majid.github.io', locale: 'ar-SA', trace: 'off' },
  projects: [
    { name: 'm375', use: { ...devices['iPhone 12'], viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, defaultBrowserType: 'chromium' } },
    { name: 't768', use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'd1440', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
  ],
});
