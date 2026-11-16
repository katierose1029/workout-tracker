const { defineConfig, devices } = require('@playwright/test');

/* Run via `npm run test:e2e`, which wraps this in the Firebase emulators (Auth, Firestore, Hosting). */
module.exports = defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: false,
  workers: 1, // tests share one Auth/Firestore emulator; each test uses its own unique user
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:5000',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    ...devices['iPhone 13'],
    browserName: 'chromium', // iPhone-sized viewport/touch; Chromium engine keeps CI simple
  },
});
