const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const { doc, setDoc, getDoc, deleteDoc } = require('firebase/firestore');

let env;
before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-workout-tracker',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const good = { ts: Date.now(), body: { sets: 1 } };
const OWNER_EMAIL = 'katiec1029@gmail.com';
const alice = () => env.authenticatedContext('alice', { email: OWNER_EMAIL }).firestore();
const bob = () => env.authenticatedContext('bob', { email: 'bob@example.com' }).firestore();
const aliceWrongEmail = () => env.authenticatedContext('alice', { email: 'someone@else.com' }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

test('owner can write and read own meta and log docs', async () => {
  await assertSucceeds(setDoc(doc(alice(), 'users/alice/data/meta'), good));
  await assertSucceeds(setDoc(doc(alice(), 'users/alice/data/log-m1'), good));
  const snap = await assertSucceeds(getDoc(doc(alice(), 'users/alice/data/meta')));
  assert.deepStrictEqual(snap.data().body, { sets: 1 });
});
test('owner can delete own doc', async () => {
  await setDoc(doc(alice(), 'users/alice/data/meta'), good);
  await assertSucceeds(deleteDoc(doc(alice(), 'users/alice/data/meta')));
});
test('another user cannot read or write', async () => {
  await setDoc(doc(alice(), 'users/alice/data/meta'), good);
  await assertFails(getDoc(doc(bob(), 'users/alice/data/meta')));
  await assertFails(setDoc(doc(bob(), 'users/alice/data/meta'), good));
  await assertFails(deleteDoc(doc(bob(), 'users/alice/data/meta')));
});
test('unauthenticated access is denied', async () => {
  await assertFails(getDoc(doc(anon(), 'users/alice/data/meta')));
  await assertFails(setDoc(doc(anon(), 'users/alice/data/meta'), good));
});
test('rejects bad doc ids and bad shapes', async () => {
  await assertFails(setDoc(doc(alice(), 'users/alice/data/random'), good));
  await assertFails(setDoc(doc(alice(), 'users/alice/data/meta'), { ts: 'x', body: {} }));
  await assertFails(setDoc(doc(alice(), 'users/alice/data/meta'), { ts: 1, body: 'str' }));
  await assertFails(setDoc(doc(alice(), 'users/alice/data/meta'), { ts: 1, body: {}, extra: 1 }));
});
test('other paths are denied', async () => {
  await assertFails(setDoc(doc(alice(), 'other/x'), good));
  await assertFails(getDoc(doc(alice(), 'users/alice/secrets/x')));
});
test('only the owner email may access, even with a matching uid path', async () => {
  await setDoc(doc(alice(), 'users/alice/data/meta'), good);
  await assertFails(getDoc(doc(aliceWrongEmail(), 'users/alice/data/meta')));
  await assertFails(setDoc(doc(aliceWrongEmail(), 'users/alice/data/meta'), good));
});
test('another user cannot read the owner\'s data even via their own uid path', async () => {
  await assertFails(setDoc(doc(bob(), 'users/bob/data/meta'), good)); // not the owner email
});
