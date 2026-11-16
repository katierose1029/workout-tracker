const { test, expect, tab } = require('./fixtures');

const firstEx = (page) => page.locator('article.ex').first();

test.describe('Today: logging a workout', () => {
  test('shows the planned exercises for the frozen Wednesday', async ({ app }) => {
    await expect(app.getByRole('heading', { name: 'Wednesday, March 11' })).toBeVisible();
    await expect(firstEx(app).locator('h3')).toHaveText('One Arm Dumbbell Bent Over Row');
  });

  test('a logged set survives a reload', async ({ app }) => {
    const ex = firstEx(app);
    await ex.getByLabel('Set 1 weight in pounds').fill('35');
    await ex.getByLabel('Set 1 reps').fill('10');
    await ex.getByLabel('Set 1 done').check();
    await expect(ex.locator('.setrow').first()).toHaveClass(/ok/);

    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    const again = firstEx(app);
    await expect(again.getByLabel('Set 1 weight in pounds')).toHaveValue('35');
    await expect(again.getByLabel('Set 1 reps')).toHaveValue('10');
    await expect(again.getByLabel('Set 1 done')).toBeChecked();
  });

  test('add set and remove last set', async ({ app }) => {
    const ex = firstEx(app);
    const before = await ex.locator('.setrow').count();
    await ex.getByRole('button', { name: 'Add set' }).click();
    await expect(ex.locator('.setrow')).toHaveCount(before + 1);
    await ex.getByRole('button', { name: 'Remove last' }).click();
    await expect(ex.locator('.setrow')).toHaveCount(before);
  });

  test('finish and reopen the workout', async ({ app }) => {
    await app.getByRole('button', { name: 'Finish workout' }).click();
    await expect(app.getByRole('button', { name: 'Reopen workout' })).toBeVisible();
    await app.getByRole('button', { name: 'Reopen workout' }).click();
    await expect(app.getByRole('button', { name: 'Finish workout' })).toBeVisible();
  });

  test('remove an exercise, then restore it', async ({ app }) => {
    const name = 'One Arm Dumbbell Bent Over Row';
    await firstEx(app).getByRole('button', { name: '✕ Remove' }).click();
    await app.getByRole('dialog').getByRole('button', { name: 'Remove exercise' }).click();
    await expect(app.locator('article.ex h3', { hasText: name })).toHaveCount(0);
    await app.getByRole('button', { name: 'Restore' }).first().click();
    await expect(app.locator('article.ex h3', { hasText: name })).toHaveCount(1);
  });

  test('substitute an exercise with a custom name, then undo', async ({ app }) => {
    await firstEx(app).getByRole('button', { name: /Substitute/ }).click();
    await app.getByLabel('Or type your own').fill('Dumbbell Goblet Squat');
    await app.getByRole('button', { name: 'Use name' }).click();
    await expect(firstEx(app).locator('h3')).toHaveText('Dumbbell Goblet Squat');
    await expect(firstEx(app).locator('.subnote')).toContainText('Substituted for One Arm Dumbbell Bent Over Row');
    await firstEx(app).getByRole('button', { name: 'Undo' }).click();
    await expect(firstEx(app).locator('h3')).toHaveText('One Arm Dumbbell Bent Over Row');
  });
});

test.describe('Navigation', () => {
  test('previous/next week and back to this week', async ({ app }) => {
    await expect(app.getByText('Week of Mar 9')).toBeVisible();
    await app.getByRole('button', { name: 'Next week' }).click();
    await expect(app.getByText('Week of Mar 16')).toBeVisible();
    await app.getByRole('button', { name: 'This week' }).click();
    await expect(app.getByText('Week of Mar 9')).toBeVisible();
  });

  test('switching a week to mobility and back', async ({ app }) => {
    await app.getByRole('button', { name: 'Mobility week' }).click();
    await expect(app.getByRole('button', { name: 'Mobility week' })).toHaveAttribute('aria-pressed', 'true');
    await app.getByRole('button', { name: 'Training week' }).click();
    await expect(app.getByRole('button', { name: 'Training week' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('every tab renders', async ({ app }) => {
    for (const name of ['Month', 'Progress', 'Settings', 'Today']) {
      await tab(app, name).click();
      await expect(tab(app, name)).toHaveAttribute('aria-current', 'page');
    }
  });
});
