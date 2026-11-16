const { test, expect, uniqueEmail, authenticate, openApp, waitForDoc, uidFor } = require('./fixtures');

const chip = (page, k) => page.locator(`button[data-act="setphase"][data-v="${k}"]`);
const dayLabel = (page) => page.locator('.cyc b', { hasText: /^Day \d+$/ });

test.describe('cycle phases', () => {
  let email;
  test.beforeEach(async ({ page }) => {
    email = uniqueEmail();
    await openApp(page);
    await authenticate(page, email, 'up');
    await expect(page.locator('.cyc')).toBeVisible();
  });

  for (const [k, name, day] of [['m', 'Menstrual', 1], ['f', 'Follicular', 8], ['o', 'Ovulation', 14], ['l', 'Luteal', 21]]) {
    test(`tapping ${name} starts the cycle at day ${day}`, async ({ page }) => {
      await chip(page, k).click();
      await expect(chip(page, k)).toHaveAttribute('aria-pressed', 'true');
      await expect(dayLabel(page)).toHaveText(`Day ${day}`);
    });
  }

  test('phase boundaries follow 1-7 / 8-13 / 14-20 / 21-40', async ({ page }) => {
    const cases = [[7, 'm'], [8, 'f'], [13, 'f'], [14, 'o'], [20, 'o'], [21, 'l'], [40, 'l']];
    for (const [day, k] of cases) {
      await page.locator('#cycday').selectOption(String(day));
      await expect(chip(page, k), `day ${day}`).toHaveAttribute('aria-pressed', 'true');
    }
  });

  test('+1 Day advances the cycle day and can cross into the next phase', async ({ page }) => {
    await page.locator('#cycday').selectOption('20');
    await expect(chip(page, 'o')).toHaveAttribute('aria-pressed', 'true');
    await page.locator('button[data-act="cycplus"]').click();
    await expect(dayLabel(page)).toHaveText('Day 21');
    await expect(chip(page, 'l')).toHaveAttribute('aria-pressed', 'true');
  });

  test('cycle day persists after reload and is saved to Firestore settings', async ({ page }) => {
    await page.locator('#cycday').selectOption('16');
    await expect(chip(page, 'o')).toHaveAttribute('aria-pressed', 'true');
    const meta = await waitForDoc(await uidFor(email), 'meta', (d) => JSON.stringify(d).includes('"cycle"'));
    expect(JSON.stringify(meta)).toContain('"16"'); // cycle day 16 stored in the settings document
    await page.reload();
    await expect(dayLabel(page)).toHaveText('Day 16');
    await expect(chip(page, 'o')).toHaveAttribute('aria-pressed', 'true');
  });
});
