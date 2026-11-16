const { test, expect, uniqueEmail, authenticate, openApp, waitForDoc, uidFor, readUserDocs, newDevice } = require('./fixtures');

const weight = (page) => page.locator('input[data-f="w"][data-i="0"]').first();
const reps = (page) => page.locator('input[data-f="r"][data-i="0"]').first();

async function signUpAndLog(page, email, w = '25', r = '10') {
  await openApp(page);
  await authenticate(page, email, 'up');
  await expect(weight(page)).toBeVisible();
  await weight(page).fill(w);
  await reps(page).fill(r);
}

test.describe('data storage and sync', () => {
  test('a logged set is saved to Firestore under the user\'s own path', async ({ page }) => {
    const email = uniqueEmail();
    await signUpAndLog(page, email);
    const uid = await uidFor(email);
    const doc = await waitForDoc(uid, 'log-m1', (d) => JSON.stringify(d).includes('"25"'));
    expect(JSON.stringify(doc)).toContain('"10"');
    expect(Object.keys(await readUserDocs(uid))).toContain('log-m1');
  });

  test('a logged set marks the set complete', async ({ page }) => {
    await signUpAndLog(page, uniqueEmail());
    await expect(page.locator('.setrow').first()).toHaveClass(/ok/);
    await expect(page.locator('.setrow input[type="checkbox"]').first()).toBeChecked();
  });

  test('data persists after reload', async ({ page }) => {
    await signUpAndLog(page, uniqueEmail(), '30', '8');
    await page.waitForTimeout(1000); // let the debounced save run
    await page.reload();
    await expect(weight(page)).toHaveValue('30');
    await expect(reps(page)).toHaveValue('8');
  });

  test('data appears on a second device after signing in', async ({ page, browser }) => {
    const email = uniqueEmail();
    await signUpAndLog(page, email, '45', '6');
    await waitForDoc(await uidFor(email), 'log-m1', (d) => JSON.stringify(d).includes('"45"'));

    const { context: phone2, page: page2 } = await newDevice(browser);
    await openApp(page2);
    await authenticate(page2, email, 'in');
    await expect(weight(page2)).toHaveValue('45');
    await expect(reps(page2)).toHaveValue('6');
    await phone2.close();
  });

  test('users cannot see each other\'s data', async ({ page, browser }) => {
    await signUpAndLog(page, uniqueEmail(), '55', '5');
    await page.waitForTimeout(1000);

    const { context: other, page: page2 } = await newDevice(browser);
    await openApp(page2);
    await authenticate(page2, uniqueEmail(), 'up');
    await expect(weight(page2)).toBeVisible();
    await expect(weight(page2)).toHaveValue('');
    await other.close();
  });

  test('sets logged offline are synced once the connection returns', async ({ page, context }) => {
    const email = uniqueEmail();
    await openApp(page);
    await authenticate(page, email, 'up');
    await expect(weight(page)).toBeVisible();
    await context.setOffline(true);
    await weight(page).fill('65');
    await reps(page).fill('4');
    await expect(weight(page)).toHaveValue('65'); // still works offline (local cache)
    await context.setOffline(false);
    const doc = await waitForDoc(await uidFor(email), 'log-m1', (d) => JSON.stringify(d).includes('"65"'), 20000);
    expect(JSON.stringify(doc)).toContain('"4"');
  });

  test('device-only mode keeps data on the device across reloads', async ({ page }) => {
    await openApp(page);
    await page.locator('#authskip').click();
    await weight(page).fill('70');
    await reps(page).fill('3');
    await page.waitForTimeout(1200);
    await page.reload();
    await page.locator('#authskip').click();
    await expect(weight(page)).toHaveValue('70');
  });
});
