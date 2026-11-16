const { test, expect, tab, logSet } = require('./fixtures');

const WED = { w: 0, d: 2 }; // Week 1, Wednesday (the frozen "today")
const cell = (page, { w, d }) => page.locator(`.mgrid .cell[data-w="${w}"][data-d="${d}"]`);

test.describe('Month page', () => {
  test.beforeEach(async ({ app }) => { await tab(app, 'Month').click(); });

  test('shows the month header, empty stats, and a 4-week grid', async ({ app }) => {
    await expect(app.getByRole('heading', { name: 'Month 1', level: 1 })).toBeVisible();
    await expect(app.locator('.stat').first()).toContainText('0 /');
    await expect(app.locator('.mgrid tbody tr')).toHaveCount(4);
    await expect(app.locator('.mgrid .cell[data-st="done"]')).toHaveCount(0);
  });

  test('tapping a cell opens that day on Today', async ({ app }) => {
    await cell(app, WED).click();
    await expect(tab(app, 'Today')).toHaveAttribute('aria-current', 'page');
    await expect(app.getByRole('heading', { name: /Wednesday/ })).toBeVisible();
  });

  test('finishing a workout marks the cell done and updates the stats', async ({ app }) => {
    await tab(app, 'Today').click();
    await logSet(app);
    await app.getByRole('button', { name: 'Finish workout' }).click();
    await tab(app, 'Month').click();
    await expect(cell(app, WED)).toHaveAttribute('data-st', 'done');
    await expect(app.locator('.stat').nth(0)).toContainText('1 /');
    await expect(app.locator('.stat').nth(1)).toContainText('1');
    await expect(app.locator('.stat').nth(2)).toContainText('320'); // 40 lb x 8 reps
  });

  test('month picker switches the month', async ({ app }) => {
    await app.getByLabel('Month', { exact: true }).selectOption({ label: 'Month 2' });
    await expect(app.getByRole('heading', { name: 'Month 2', level: 1 })).toBeVisible();
  });

  test('plan preview lists exercises for a day', async ({ app }) => {
    const wed = app.locator('details', { hasText: 'Wed' }).first();
    await wed.locator('summary').click();
    await expect(wed.locator('.plist li').first()).toContainText('One Arm Dumbbell Bent Over Row');
  });

  test('editing the plan adds an exercise that shows on Today', async ({ app }) => {
    const wed = app.locator('details', { hasText: 'Wed' }).first();
    await wed.locator('summary').click();
    await wed.getByRole('button', { name: 'Edit exercises' }).click();
    const dlg = app.getByRole('dialog');
    await dlg.getByRole('button', { name: 'Add exercise' }).click();
    await dlg.getByLabel('Exercise name').last().fill('Sled Push');
    await dlg.getByRole('button', { name: 'Save plan' }).click();
    await expect(app.getByText('Plan updated')).toBeVisible();

    await tab(app, 'Today').click();
    await expect(app.locator('article.ex h3', { hasText: 'Sled Push' })).toHaveCount(1);
  });

  test('start a new month creates a new month after the latest one', async ({ app }) => {
    await app.getByRole('button', { name: 'Start a new month' }).click();
    await expect(app.getByRole('dialog').getByRole('heading', { name: 'Start a new month' })).toBeVisible();
    await app.getByRole('button', { name: 'Create month' }).click();
    const toast = app.locator('.toast');
    await expect(toast).toHaveText(/^Month \d+ created$/);
    const label = (await toast.textContent()).replace(' created', '');
    await tab(app, 'Month').click();
    await expect(app.getByRole('heading', { name: label, level: 1 })).toBeVisible();
    await expect(app.getByLabel('Month', { exact: true })).toHaveValue(/^u/); // user-created months have ids starting "u"
  });
});
