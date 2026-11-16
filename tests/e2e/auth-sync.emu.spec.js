const { test, expect, openApp, submitCredentials, waitForApp, readUserDocs, uidFromStorage } = require('./emulator-fixtures');

const PASSWORD = 'correct horse 1';
const tab = (page, name) => page.locator('nav.tabs').getByRole('button', { name });
const row1 = (page) => page.locator('article.ex').first();

async function signUp(page, email) {
  await openApp(page);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await submitCredentials(page, email, PASSWORD, 'signup');
  await waitForApp(page);
}

test.describe('Auth + Firestore sync (emulator)', () => {
  test('create account, log a set, and it is saved to Firestore', async ({ page, email }) => {
    await signUp(page, email);
    await tab(page, 'Settings').click();
    await expect(page.locator('#savestat')).toHaveText('Saved to your account');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();

    await tab(page, 'Today').click();
    await row1(page).getByLabel('Set 1 weight in pounds').fill('55');
    await row1(page).getByLabel('Set 1 reps').fill('5');
    await row1(page).getByLabel('Set 1 done').check();

    const uid = await uidFromStorage(page);
    expect(uid).toBeTruthy();
    // writes are debounced ~700ms, then sent to the emulator
    await expect.poll(async () => (await readUserDocs(uid)).some((id) => id.startsWith('log-')), { timeout: 10_000 }).toBe(true);
  });

  test('logs sync to a second device that signs in', async ({ page, browser, email }) => {
    await signUp(page, email);
    await row1(page).getByLabel('Set 1 weight in pounds').fill('65');
    await row1(page).getByLabel('Set 1 reps').fill('6');
    await row1(page).getByLabel('Set 1 done').check();
    const uid = await uidFromStorage(page);
    await expect.poll(async () => (await readUserDocs(uid)).some((id) => id.startsWith('log-')), { timeout: 10_000 }).toBe(true);

    // brand-new browser context = empty localStorage, like a different phone
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const other = await ctx.newPage();
    await openApp(other);
    await submitCredentials(other, email, PASSWORD, 'signin');
    await waitForApp(other);
    await expect(row1(other).getByLabel('Set 1 weight in pounds')).toHaveValue('65');
    await expect(row1(other).getByLabel('Set 1 reps')).toHaveValue('6');
    await ctx.close();
  });

  test('wrong password shows an error and stays on the sign-in form', async ({ page, browser, email }) => {
    await signUp(page, email);
    const ctx = await browser.newContext();
    const other = await ctx.newPage();
    await openApp(other);
    await submitCredentials(other, email, 'not the password', 'signin');
    await expect(other.locator('#autherr')).not.toHaveText('');
    await expect(other.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await ctx.close();
  });

  test('sign out returns to the sign-in form; signing back in restores data', async ({ page, email }) => {
    await signUp(page, email);
    await row1(page).getByLabel('Set 1 weight in pounds').fill('70');
    await row1(page).getByLabel('Set 1 reps').fill('5');
    const uid = await uidFromStorage(page);
    await expect.poll(async () => (await readUserDocs(uid)).some((id) => id.startsWith('log-')), { timeout: 10_000 }).toBe(true);

    await tab(page, 'Settings').click();
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    await submitCredentials(page, email, PASSWORD, 'signin');
    await waitForApp(page);
    await expect(row1(page).getByLabel('Set 1 weight in pounds')).toHaveValue('70');
  });

  test('"Use on this device only" skips sign-in and stays local', async ({ page }) => {
    await openApp(page);
    await page.getByRole('button', { name: 'Use on this device only' }).click();
    await waitForApp(page);
    await tab(page, 'Settings').click();
    await expect(page.locator('#savestat')).toHaveText('Saved on this device only');
    await expect(page.getByRole('button', { name: 'Sign out' })).toHaveCount(0);
  });
});
