/* Fixtures for tests that run against the Firebase Auth + Firestore emulators.
   The Firebase SDK scripts normally come from gstatic; here they are served from node_modules so
   the app boots offline, and `?emulator=1` makes firebase-backend.js point at 127.0.0.1. */
const fs = require('fs');
const path = require('path');
const base = require('@playwright/test');

const SDK = path.resolve(__dirname, '..', '..', 'node_modules', 'firebase');
const PROJECT = 'workout-tracker-48902'; // projectId in firebase-config.js
const FROZEN_NOW = new Date('2026-03-11T10:00:00');

let counter = 0;
const uniqueEmail = () => `e2e-${Date.now()}-${process.pid}-${counter++}@example.com`;

async function openApp(page) {
  await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.route(/gstatic\.com\/firebasejs\/[\d.]+\/(firebase-[\w-]+-compat\.js)/, (route) => {
    const file = route.request().url().match(/(firebase-[\w-]+-compat\.js)/)[1];
    route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(SDK, file)) });
  });
  await page.clock.install({ time: FROZEN_NOW });
  await page.goto('/index.html?emulator=1');
}

/* Fill the sign-in overlay. mode: 'signin' | 'signup'. */
async function submitCredentials(page, email, password, mode) {
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: mode === 'signup' ? 'Create account' : 'Sign in', exact: true }).click();
}

const waitForApp = (page) => base.expect(page.getByText('Loading your logs')).toBeHidden();

/* Read a user's Firestore docs straight from the emulator (admin bypasses rules). */
async function readUserDocs(uid) {
  const url = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}/data`;
  const res = await fetch(url, { headers: { Authorization: 'Bearer owner' } });
  const json = await res.json();
  return (json.documents || []).map((d) => d.name.split('/').pop());
}

const uidFromStorage = (page) =>
  page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const m = localStorage.key(i).match(/^ppw1:([^:]+):(meta|log-.+)$/);
      if (m && m[1] !== 'local') return m[1];
    }
    return null;
  });

const test = base.test.extend({
  email: async ({}, use) => use(uniqueEmail()),
});

module.exports = { test, expect: base.expect, openApp, submitCredentials, waitForApp, readUserDocs, uidFromStorage };
