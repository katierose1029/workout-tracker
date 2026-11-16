const { test, expect, tab, logSet, pastSession } = require('./fixtures');

const ROW = 'One Arm Dumbbell Bent Over Row'; // first exercise on the frozen Wednesday
const card = (page) => page.locator('article.ex').first();
const weight = (page, n) => card(page).getByLabel(`Set ${n} weight in pounds`);
const reps = (page, n) => card(page).getByLabel(`Set ${n} reps`);
const done = (page, n) => card(page).getByLabel(`Set ${n} done`);

// Two earlier sessions of the Wednesday lift, oldest first.
const history = {
  m1: {
    'w0-push': pastSession('2026-03-02', { [ROW]: [[25, 10], [25, 10], [25, 8]] }),
    'w0-quads': pastSession('2026-03-09', { [ROW]: [[30, 10], [30, 10], [30, 8]] }),
  },
};

test.describe('Seeded history', () => {
  test.use({ seed: { logs: history } });

  test('"Last time" shows the most recent earlier session', async ({ app }) => {
    const last = card(app).locator('.last').first();
    await expect(last).toContainText('Last time');
    await expect(last).toContainText('Mar 9');
    await expect(last).toContainText('30×10, 30×10, 30×8');
  });

  test('"Use last" pre-fills weights and reps but leaves sets unticked', async ({ app }) => {
    await card(app).getByRole('button', { name: 'Use last' }).click();
    await expect(app.getByText('Filled in from last time')).toBeVisible();
    for (const [n, r] of [[1, '10'], [2, '10'], [3, '8']]) {
      await expect(weight(app, n)).toHaveValue('30');
      await expect(reps(app, n)).toHaveValue(r);
      await expect(done(app, n)).not.toBeChecked();
    }
  });

  test('"New best" appears only when beating the previous top weight', async ({ app }) => {
    const badge = card(app).locator('.pr');
    // The badge is computed on render (typing deliberately doesn't re-render), so bounce through a tab.
    const rerender = async () => { await tab(app, 'Month').click(); await tab(app, 'Today').click(); };
    await logSet(app, { weight: '30', reps: '10' });
    await rerender();
    await expect(badge).toHaveCount(0); // equals the best, not above it
    await weight(app, 1).fill('35');
    await rerender();
    await expect(badge).toHaveText('New best');
    await weight(app, 1).fill('20');
    await rerender();
    await expect(badge).toHaveCount(0);
  });

  test('Progress combines seeded and new sessions for an exercise', async ({ app }) => {
    await logSet(app, { weight: '35', reps: '8' });
    await tab(app, 'Progress').click();
    const entry = app.locator('.exlist button', { hasText: ROW });
    await expect(entry).toContainText('3×'); // two seeded sessions + today
    await entry.click();
    const rows = app.locator('table.t').last().locator('tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(rows.first()).toContainText('35×8'); // newest first
    await expect(rows.last()).toContainText('25×10');
  });

  test('month stats and ridge include the seeded sessions', async ({ app }) => {
    await tab(app, 'Progress').click();
    const row = app.locator('table.t tbody tr').first();
    await expect(row).toContainText('M1');
    await expect(row.locator('td').nth(1)).toHaveText(/^2\//); // two workouts done
    await expect(row.locator('td').nth(2)).toHaveText('6'); // sets
    await expect(row.locator('td').nth(3)).toHaveText('1.5k'); // 700 + 840 = 1,540 lb
  });
});

test.describe('Cycle-based suggestions from seeded history', () => {
  const meta = {
    cycle: { '2026-03-09': 1 }, // day 1 on Mar 9 (Menstrual) -> Wed Mar 11 is day 3, same phase
    cycleAdj: { m: { w: 10, r: 1 }, l: { w: -10, r: -1 } }, // adjustments are relative to last session's phase
  };

  test.describe('same phase as last time', () => {
    test.use({ seed: { logs: history, meta } });
    test('no separate suggestion line', async ({ app }) => {
      await expect(card(app).getByText('Suggested for')).toHaveCount(0);
    });
  });

  test.describe('different phase than last time', () => {
    // Last session (Mar 9) falls in Menstrual; Wednesday (Mar 11) is day 22 = Luteal.
    test.use({ seed: { logs: history, meta: { ...meta, cycle: { '2026-03-09': 1, '2026-03-10': 21 } } } });

    test('suggests adjusted weight and reps for the current phase', async ({ app }) => {
      const sug = card(app).locator('.last', { hasText: 'Suggested for' });
      await expect(sug).toContainText('Suggested for Luteal');
      await expect(sug).toContainText('25×8, 25×8, 25×6'); // 30 x (0.9 / 1.1) = 24.5 -> 25 lb; reps 10 - 1 - 1 = 8
    });

    test('"Use suggestion" fills the adjusted numbers', async ({ app }) => {
      await card(app).getByRole('button', { name: 'Use suggestion' }).click();
      await expect(weight(app, 1)).toHaveValue('25');
      await expect(reps(app, 1)).toHaveValue('8');
      await expect(reps(app, 3)).toHaveValue('6');
      await expect(done(app, 1)).not.toBeChecked();
    });
  });

  test.describe('cycle tracking off', () => {
    test.use({ seed: { logs: history, meta: { ...meta, cycle: { '2026-03-09': 1, '2026-03-10': 21 }, cycleOn: false } } });
    test('no suggestion is shown', async ({ app }) => {
      await expect(card(app).getByText('Suggested for')).toHaveCount(0);
    });
  });
});
