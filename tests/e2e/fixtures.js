/* Shared Playwright fixtures.
   `app` opens the app in "device only" mode: CDN scripts (Firebase, fonts) are blocked so the app
   falls back to localStorage, which makes every test hermetic. The clock is frozen so "today"
   (and therefore the selected month/week) is deterministic. */
const base = require('@playwright/test');

const FROZEN_NOW = new Date('2026-03-11T10:00:00'); // a Wednesday

const test = base.test.extend({
  app: async ({ page }, use) => {
    await page.route(/^https:\/\/(fonts\.googleapis|www\.gstatic|fonts\.gstatic)\.com/, (r) => r.abort());
    await page.clock.install({ time: FROZEN_NOW });
    await page.goto('/index.html');
    await base.expect(page.getByText('Loading your logs')).toBeHidden();
    await use(page);
  },
});

const tab = (page, name) => page.locator('nav.tabs').getByRole('button', { name });

/* Log (and tick done) one set on the Nth exercise card of the Today page. */
async function logSet(page, { ex = 0, set = 1, weight = '40', reps = '8' } = {}) {
  const card = page.locator('article.ex').nth(ex);
  await card.getByLabel(`Set ${set} weight in pounds`).fill(weight);
  await card.getByLabel(`Set ${set} reps`).fill(reps);
  await card.getByLabel(`Set ${set} done`).check();
}

module.exports = { logSet, test, expect: base.expect, tab, FROZEN_NOW };
