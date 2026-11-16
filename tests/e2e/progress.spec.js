const { test, expect, tab, logSet } = require('./fixtures');

test.describe('Progress page', () => {
  test('empty state before anything is logged', async ({ app }) => {
    await tab(app, 'Progress').click();
    await expect(app.getByText('Nothing logged yet')).toBeVisible();
    await expect(app.getByText('Log a few sets and each exercise')).toBeVisible();
  });

  test.describe('with a logged workout', () => {
    test.beforeEach(async ({ app }) => {
      await logSet(app, { weight: '50', reps: '10' });
      await app.getByRole('button', { name: 'Finish workout' }).click();
      await tab(app, 'Progress').click();
    });

    test('month table shows the month with its totals', async ({ app }) => {
      const row = app.locator('table.t tbody tr').first();
      await expect(row).toContainText('M1');
      await expect(row).toContainText('1/'); // 1 workout of N planned
      await expect(row).toContainText('500'); // 50 lb x 10
    });

    test('metric chips switch the range chart', async ({ app }) => {
      const sets = app.getByRole('button', { name: 'Sets', exact: true });
      await sets.click();
      await expect(sets).toHaveAttribute('aria-pressed', 'true');
      await expect(app.locator('.range svg')).toHaveAttribute('aria-label', /more sets/);
    });

    test('exercise history: search, pick, chart and table', async ({ app }) => {
      const name = 'One Arm Dumbbell Bent Over Row';
      await expect(app.locator('.exlist button')).toHaveCount(1);
      await app.getByLabel('Search exercises').fill('zzz');
      await expect(app.getByText('No match.')).toBeVisible();
      await app.getByLabel('Search exercises').fill('bent over');
      await app.locator('.exlist button', { hasText: name }).click();

      await expect(app.getByRole('heading', { name })).toBeVisible();
      await expect(app.locator('.chart svg')).toBeVisible();
      await expect(app.locator('table.t').last()).toContainText('50');
      await app.getByRole('button', { name: 'Est. 1RM' }).click();
      await expect(app.getByRole('button', { name: 'Est. 1RM' })).toHaveAttribute('aria-pressed', 'true');
    });

    test('tapping a month peak opens that month', async ({ app }) => {
      await app.locator('.range rect[data-act="gomonth"]').first().dispatchEvent('click');
      await expect(tab(app, 'Month')).toHaveAttribute('aria-current', 'page');
      await expect(app.getByRole('heading', { level: 1 })).toContainText('Month');
    });
  });
});
