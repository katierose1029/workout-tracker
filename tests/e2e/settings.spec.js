const fs = require('fs');
const { test, expect, tab } = require('./fixtures');

async function logOneSet(page, weight = '40') {
  const ex = page.locator('article.ex').first();
  await ex.getByLabel('Set 1 weight in pounds').fill(weight);
  await ex.getByLabel('Set 1 reps').fill('8');
  await ex.getByLabel('Set 1 done').check();
}

test.describe('Settings', () => {
  test('theme choice applies and persists', async ({ app }) => {
    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: 'Dark', exact: true }).click();
    await expect(app.locator('html')).toHaveAttribute('data-theme', 'dark');
    await app.reload();
    await expect(app.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('backup download then restore round-trips logs', async ({ app }) => {
    await logOneSet(app, '45');
    await tab(app, 'Settings').click();

    const [download] = await Promise.all([
      app.waitForEvent('download'),
      app.getByRole('button', { name: 'Download backup (JSON)' }).click(),
    ]);
    const file = await download.path();
    const backup = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(backup.app).toBe('workout-tracker');
    expect(JSON.stringify(backup.logs)).toContain('"45"');

    // wipe local data, reload, then restore from the file
    await app.evaluate(() => localStorage.clear());
    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    await tab(app, 'Settings').click();
    await app.locator('input[data-f=import]').setInputFiles(file);
    await app.getByRole('dialog').locator('[data-act=confirm-yes]').click();
    await tab(app, 'Today').click();
    await expect(app.locator('article.ex').first().getByLabel('Set 1 weight in pounds')).toHaveValue('45');
  });

  test('clear this month asks for confirmation and removes logs', async ({ app }) => {
    await logOneSet(app);
    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: /Clear this month/ }).click();
    await app.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await tab(app, 'Today').click();
    await expect(app.locator('article.ex').first().getByLabel('Set 1 weight in pounds')).toHaveValue('40');

    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: /Clear this month/ }).click();
    await app.getByRole('dialog').locator('[data-act=confirm-yes]').click();
    await tab(app, 'Today').click();
    await expect(app.locator('article.ex').first().getByLabel('Set 1 weight in pounds')).toHaveValue('');
  });
});
