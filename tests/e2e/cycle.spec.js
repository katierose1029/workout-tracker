const { test, expect, tab } = require('./fixtures');

const card = (page) => page.locator('section.cyc');
const phase = (page, name) => card(page).getByRole('button', { name, exact: true });
const cycDay = (page) => card(page).getByLabel('Cycle day');
const dayBtn = (page, i) => page.locator(`.strip button.day[data-v="${i}"]`);

test.describe('Cycle tracking', () => {
  test('can be switched off and on from Settings', async ({ app }) => {
    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: 'Off', exact: true }).click();
    await tab(app, 'Today').click();
    await expect(card(app)).toHaveCount(0);

    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: 'On', exact: true }).click();
    await expect(app.getByText('Suggested weights and reps by phase')).toBeVisible();
    await tab(app, 'Today').click();
    await expect(card(app)).toBeVisible();
  });

  test('nothing selected shows the prompt', async ({ app }) => {
    await expect(card(app)).toContainText('Pick today’s cycle day');
    for (const n of ['Menstrual', 'Follicular', 'Ovulation', 'Luteal']) {
      await expect(phase(app, n)).toHaveAttribute('aria-pressed', 'false');
    }
  });

  test('picking a cycle day selects the matching phase', async ({ app }) => {
    const cases = [[3, 'Menstrual'], [10, 'Follicular'], [15, 'Ovulation'], [25, 'Luteal']];
    for (const [day, name] of cases) {
      await cycDay(app).selectOption(String(day));
      await expect(phase(app, name)).toHaveAttribute('aria-pressed', 'true');
      await expect(card(app)).toContainText(`Day ${day}`);
    }
  });

  test('phase boundaries: first and last day of each phase', async ({ app }) => {
    const cases = [[1, 'Menstrual'], [7, 'Menstrual'], [8, 'Follicular'], [13, 'Follicular'],
      [14, 'Ovulation'], [20, 'Ovulation'], [21, 'Luteal'], [40, 'Luteal']];
    for (const [day, name] of cases) {
      await cycDay(app).selectOption(String(day));
      await expect(phase(app, name), `day ${day}`).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('tapping a phase sets its first day; +1 Day advances', async ({ app }) => {
    await phase(app, 'Follicular').click();
    await expect(cycDay(app)).toHaveValue('8');
    await card(app).getByRole('button', { name: '+1 Day' }).click();
    await expect(cycDay(app)).toHaveValue('9');
    await phase(app, 'Luteal').click();
    await expect(cycDay(app)).toHaveValue('21');
  });

  test('counts forward automatically on later days', async ({ app }) => {
    await cycDay(app).selectOption('6'); // Wednesday = day 6 (Menstrual)
    await dayBtn(app, 3).click(); // Thursday
    await expect(cycDay(app)).toHaveValue('7');
    await expect(card(app)).toContainText('Counted from');
    await dayBtn(app, 4).click(); // Friday = day 8 -> phase rolls over
    await expect(phase(app, 'Follicular')).toHaveAttribute('aria-pressed', 'true');
    await dayBtn(app, 1).click(); // Tuesday is before the entry
    await expect(card(app)).toContainText('Pick today’s cycle day');
  });

  test('clear removes this day’s entry only', async ({ app }) => {
    await cycDay(app).selectOption('2');
    await dayBtn(app, 3).click();
    await cycDay(app).selectOption('20');
    await card(app).getByRole('button', { name: 'Clear' }).click();
    await expect(cycDay(app)).toHaveValue('3'); // falls back to counting from Wednesday
    await dayBtn(app, 2).click();
    await expect(cycDay(app)).toHaveValue('2');
  });

  test('entries persist across reloads', async ({ app }) => {
    await cycDay(app).selectOption('12');
    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    await expect(cycDay(app)).toHaveValue('12');
    await expect(phase(app, 'Follicular')).toHaveAttribute('aria-pressed', 'true');
  });

  test('also works on a mobility week day', async ({ app }) => {
    await app.getByRole('button', { name: 'Mobility week' }).click();
    await cycDay(app).selectOption('21');
    await expect(phase(app, 'Luteal')).toHaveAttribute('aria-pressed', 'true');
  });

  test('clear cycle entries needs confirmation', async ({ app }) => {
    await cycDay(app).selectOption('5');
    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: 'Clear cycle entries' }).click();
    await app.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
    await tab(app, 'Today').click();
    await expect(cycDay(app)).toHaveValue('5');

    await tab(app, 'Settings').click();
    await app.getByRole('button', { name: 'Clear cycle entries' }).click();
    await app.getByRole('dialog').getByRole('button', { name: 'Clear entries' }).click();
    await expect(app.getByText('Cycle entries cleared')).toBeVisible();
    await tab(app, 'Today').click();
    await expect(card(app)).toContainText('Pick today’s cycle day');
  });

  test('phase adjustments in Settings persist', async ({ app }) => {
    await tab(app, 'Settings').click();
    const sel = app.locator('select[data-f="cadj"][data-ph="l"][data-p="w"]');
    await sel.selectOption('-10');
    await app.reload();
    await expect(app.getByText('Loading your logs')).toBeHidden();
    await tab(app, 'Settings').click();
    await expect(sel).toHaveValue('-10');
  });
});
