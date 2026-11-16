const { test, expect, uniqueEmail, createUser, authenticate, openApp, goTab } = require('./fixtures');

test.describe('authentication', () => {
  test('first visit shows the sign-in screen', async ({ page }) => {
    await openApp(page);
    await expect(page.locator('#authov')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  test('create account lands in the app and saves to the account', async ({ page }) => {
    await openApp(page);
    await authenticate(page, uniqueEmail(), 'up');
    await expect(page.locator('#authov')).toHaveCount(0);
    await expect(page.getByText('Month 1 · Week 1')).toBeVisible();
    await goTab(page, 'data');
    await expect(page.locator('#savestat')).toHaveText('Saved to your account');
  });

  test('existing user can sign in', async ({ page }) => {
    const email = uniqueEmail();
    await createUser(email);
    await openApp(page);
    await authenticate(page, email, 'in');
    await expect(page.locator('#authov')).toHaveCount(0);
    await expect(page.getByText('Month 1 · Week 1')).toBeVisible();
  });

  test('wrong password shows an error and keeps the sign-in screen', async ({ page }) => {
    const email = uniqueEmail();
    await createUser(email);
    await openApp(page);
    await authenticate(page, email, 'in', 'not-the-password');
    await expect(page.locator('#autherr')).not.toBeEmpty();
    await expect(page.locator('#authov')).toBeVisible();
  });

  test('weak password is rejected on create account', async ({ page }) => {
    await openApp(page);
    await authenticate(page, uniqueEmail(), 'up', '123');
    await expect(page.locator('#autherr')).not.toBeEmpty();
    await expect(page.locator('#authov')).toBeVisible();
  });

  test('"Use on this device only" works without an account', async ({ page }) => {
    await openApp(page);
    await page.locator('#authskip').click();
    await expect(page.locator('#authov')).toHaveCount(0);
    await goTab(page, 'data');
    await expect(page.locator('#savestat')).toHaveText('Saved on this device only');
  });

  test('stays signed in after reload', async ({ page }) => {
    await openApp(page);
    await authenticate(page, uniqueEmail(), 'up');
    await expect(page.getByText('Month 1 · Week 1')).toBeVisible();
    await page.reload();
    await expect(page.getByText('Month 1 · Week 1')).toBeVisible();
    await expect(page.locator('#authov')).toHaveCount(0);
  });

  test('sign out returns to the sign-in screen', async ({ page }) => {
    await openApp(page);
    await authenticate(page, uniqueEmail(), 'up');
    await goTab(page, 'data');
    await page.locator('button[data-act="signout"]').click();
    await expect(page.locator('#authov')).toBeVisible();
  });
});
