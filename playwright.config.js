const { defineConfig, devices } = require('@playwright/test');

const PORT = +process.env.E2E_PORT || 4173;

module.exports = defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    // Phone-sized: the app is built for the iPhone Home Screen.
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    serviceWorkers: 'block',
  },
  projects: [
    // Hermetic: device-only mode, no network, no emulator.
    { name: 'chromium', testIgnore: /\.emu\.spec\.js$/, use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } },
    // Needs the Auth + Firestore emulators: run via `npm run test:e2e:emulator`.
    { name: 'emulator', testMatch: /\.emu\.spec\.js$/, use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: {
    command: 'node tests/e2e/server.js',
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
  },
});
