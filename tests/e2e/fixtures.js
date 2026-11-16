/* Shared Playwright fixtures.
   `app` opens the app in "device only" mode: CDN scripts (Firebase, fonts) are blocked so the app
   falls back to localStorage, which makes every test hermetic. The clock is frozen so "today"
   (and therefore the selected month/week) is deterministic. */
const base = require('@playwright/test');

const FROZEN_NOW = new Date('2026-03-11T10:00:00'); // a Wednesday

/* ---- Seeded history ----------------------------------------------------------------------
   Preload localStorage (device-only mode) before the app boots, so tests can start with past
   workouts / settings without clicking them in. Usage:

     test.use({ seed: { logs: { m1: { 'w0-push': pastSession('2026-03-02', { 'Plank': [[0, 60]] }) } },
                        meta: { cycle: { '2026-03-09': 1 } } } });

   `logs` maps a month id to {sessionKey: session}; session keys look like 'w<week>-<push|quads|pull|glutes>'.
   The seed is applied once per browser tab (a reload keeps whatever the app has saved since). */
const normKey = (name) => String(name).toLowerCase().replace(/\bdb\b/g, 'dumbbell').replace(/\bkb\b/g, 'kettlebell')
  .replace(/\bbw\b/g, 'bodyweight').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');

/* A finished session on `date`; lifts = { 'Exercise name': [[weight, reps], ...] } (all sets done). */
function pastSession(date, lifts) {
  const ex = {};
  for (const [name, sets] of Object.entries(lifts)) {
    ex[normKey(name)] = { n: name, sets: sets.map(([w, r]) => ({ w: String(w), r: String(r), d: true })) };
  }
  return { date, done: true, ex };
}

function seedScript({ logs = {}, meta = null }) {
  return `(() => {
    try {
      if (sessionStorage.getItem('__seeded')) return;
      const put = (id, body) => localStorage.setItem('ppw1:local:' + id, JSON.stringify({ ts: 1, body }));
      const logs = ${JSON.stringify(logs)}, meta = ${JSON.stringify(meta)};
      for (const [month, body] of Object.entries(logs)) put('log-' + month, body);
      if (meta) put('meta', meta);
      sessionStorage.setItem('__seeded', '1');
    } catch (e) {}
  })();`;
}

const test = base.test.extend({
  seed: [null, { option: true }],
  app: async ({ page, seed }, use) => {
    if (seed) await page.addInitScript(seedScript(seed));
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

module.exports = { pastSession, normKey, logSet, test, expect: base.expect, tab, FROZEN_NOW };
