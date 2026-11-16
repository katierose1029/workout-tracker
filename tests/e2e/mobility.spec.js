const { test, expect, tab } = require('./fixtures');

const mobItems = (page) => page.locator('input[data-f="mchk"]');
const dayBtn = (page, i) => page.locator(`.strip button.day[data-v="${i}"]`);

test.describe('Mobility week', () => {
  test.beforeEach(async ({ app }) => {
    await app.getByRole('button', { name: 'Mobility week' }).click();
    await expect(app.getByText('Mobility week', { exact: true }).first()).toBeVisible();
  });

  test('shows the selected day with its checklist and no lifts', async ({ app }) => {
    await expect(app.getByRole('heading', { level: 1 })).toContainText('Wednesday');
    expect(await mobItems(app).count()).toBeGreaterThan(0);
    await expect(app.locator('article.ex')).toHaveCount(0);
  });

  test('ticking items fills the progress bar and survives a reload', async ({ app }) => {
    const bar = app.locator('.progress i');
    await expect(bar).toHaveCSS('width', '0px');
    await mobItems(app).first().check();
    await expect(mobItems(app).first()).toBeChecked();
    await expect(bar).not.toHaveCSS('width', '0px');

    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    await expect(mobItems(app).first()).toBeChecked();
  });

  test('finish day, then reopen it', async ({ app }) => {
    await app.getByRole('button', { name: 'Finish day' }).click();
    await expect(app.getByText('Day saved')).toBeVisible();
    await expect(app.getByRole('button', { name: 'Reopen day' })).toBeVisible();
    await expect(dayBtn(app, 2)).toHaveAttribute('data-st', 'done');
    await app.getByRole('button', { name: 'Reopen day' }).click();
    await expect(app.getByRole('button', { name: 'Finish day' })).toBeVisible();
    await expect(dayBtn(app, 2)).not.toHaveAttribute('data-st', 'done');
  });

  test('notes are saved per day', async ({ app }) => {
    await app.getByLabel('Notes').fill('Left hip tight');
    await dayBtn(app, 3).click();
    await expect(app.getByLabel('Notes')).toHaveValue('');
    await dayBtn(app, 2).click();
    await expect(app.getByLabel('Notes')).toHaveValue('Left hip tight');
    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    await expect(app.getByLabel('Notes')).toHaveValue('Left hip tight');
  });

  test('switching day shows a different date heading', async ({ app }) => {
    await dayBtn(app, 4).click();
    await expect(app.getByRole('heading', { level: 1 })).toContainText('Friday');
  });

  test('choosing a different mobility workout for the day', async ({ app }) => {
    const pick = app.getByLabel('Mobility workout for this day');
    const before = await app.locator('.dayhead h2').textContent();
    const options = await pick.locator('option').allTextContents();
    const other = options.find((t) => t !== before);
    await pick.selectOption({ label: other });
    await expect(app.getByText(`${other} set for Wed`)).toBeVisible();
    await expect(app.locator('.dayhead h2')).toHaveText(other);
  });

  test('mobility choice and training/mobility mode persist; switching back restores lifts', async ({ app }) => {
    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    await expect(app.getByRole('button', { name: 'Mobility week' })).toHaveAttribute('aria-pressed', 'true');
    await app.getByRole('button', { name: 'Training week' }).click();
    await expect(app.locator('article.ex').first()).toBeVisible();
  });
});
