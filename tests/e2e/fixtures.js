const path = require('node:path');
const base = require('@playwright/test');

/* The page talks to the emulator using the projectId in firebase-config.js, and the emulator keeps data per project. */
const PROJECT = /projectId:\s*'([^']+)'/.exec(require('node:fs').readFileSync(path.join(__dirname, '../../firebase-config.js'), 'utf8'))[1];
const FS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;
const SDK = path.join(__dirname, '../../node_modules/firebase');

/* Fixed "today" so the plan month/week/day shown is deterministic (Tue 1 Dec 2026 = Month 1, Week 1). */
const FIXED_NOW = new Date('2026-12-01T12:00:00');

let n = 0;
const uniqueEmail = () => `qa-${Date.now()}-${++n}@example.com`;

/* Serve the Firebase SDK from node_modules instead of the gstatic CDN (works offline, no network flake)
   and pin the date. Applied to every page, including extra "devices" opened with newDevice(). */
async function prepare(page) {
  await page.route('https://www.gstatic.com/firebasejs/**', (route) => {
    const file = route.request().url().split('/').pop();
    return route.fulfill({ path: path.join(SDK, file), contentType: 'application/javascript' });
  });
  await page.clock.setFixedTime(FIXED_NOW);
  return page;
}

const test = base.test.extend({
  page: async ({ page }, use) => { await use(await prepare(page)); },
});

/** A second, fully separate browser context (its own storage), e.g. a second phone. */
async function newDevice(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  const page = await prepare(await context.newPage());
  return { context, page };
}

/** Firestore documents for a user, read straight from the emulator (bypasses rules via the owner token). */
async function readUserDocs(uid) {
  const res = await fetch(`${FS}/users/${uid}/data`, { headers: { Authorization: 'Bearer owner' } });
  const json = await res.json();
  const out = {};
  for (const d of json.documents || []) out[d.name.split('/').pop()] = d;
  return out;
}

/** Wait until Firestore holds a doc for the user that satisfies `pred`. */
async function waitForDoc(uid, id, pred = () => true, timeout = 8000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const docs = await readUserDocs(uid);
    if (docs[id] && pred(docs[id])) return docs[id];
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timed out waiting for users/${uid}/data/${id}`);
}

/** The uid of the signed-in user, read from the Auth emulator by email. */
async function uidFor(email) {
  const res = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:lookup?key=x`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ email: [email] }),
  });
  const j = await res.json();
  return j.users && j.users[0] && j.users[0].localId;
}

/** Create an account directly in the Auth emulator (skips the UI). */
async function createUser(email, password = 'secret123') {
  await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
}

module.exports = { test, expect: base.expect, uniqueEmail, readUserDocs, waitForDoc, uidFor, createUser };

/** Drive the sign-in overlay. mode: 'up' (create account) | 'in' (sign in). */
async function authenticate(page, email, mode = 'up', password = 'secret123') {
  await page.locator('#authemail').fill(email);
  await page.locator('#authpass').fill(password);
  await page.locator(mode === 'up' ? '#authup' : '#authin').click();
}
const openApp = (page) => page.goto('/?emulator=1');
const goTab = (page, name) => page.locator(`button[data-act="tab"][data-v="${name}"]`).click();

Object.assign(module.exports, { authenticate, openApp, goTab, newDevice });
