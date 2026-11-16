const { test, expect, tab } = require('./fixtures');

test('boots in device-only mode and shows the four tabs', async ({ app }) => {
  await expect(app).toHaveTitle('Workout Tracker');
  for (const name of ['Today', 'Month', 'Progress', 'Settings']) {
    await expect(tab(app, name)).toBeVisible();
  }
  await tab(app, 'Settings').click();
  await expect(app.locator('#savestat')).toHaveText('Saved on this device only');
});
