/* Shared Playwright fixtures.
   `app` opens the app in "device only" mode: CDN scripts (Firebase, fonts) are blocked so the app
   falls back to localStorage, which makes every test hermetic. The clock is frozen so "today"
   (and therefore the selected month/week) is deterministic. */
const base = require('@playwright/test');

const FROZEN_NOW = new Date('2026-03-11T10:00:00'); // a Wednesday

const test = base.test.extend({
  app: async ({ page }, use) => {
    await page.route(/gstatic\.com|googleapis\.com/, (r) => r.abort());
    await page.clock.install({ time: FROZEN_NOW });
    await page.goto('/index.html');
    await base.expect(page.getByText('Loading your logs')).toBeHidden();
    await use(page);
  },
});

const tab = (page, name) => page.locator('nav.tabs').getByRole('button', { name });

module.exports = { test, expect: base.expect, tab, FROZEN_NOW };
