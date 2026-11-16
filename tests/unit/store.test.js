const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { loadApp } = require('./harness');

let a;
beforeEach(() => { a = loadApp(); });

function fakeDb() {
  const docs = {};
  const calls = [];
  return {
    docs, calls,
    collection(path) {
      return {
        doc: (id) => ({ set: (obj) => { calls.push({ path, id }); docs[path + '/' + id] = obj; return Promise.resolve(); } }),
        get: () => Promise.resolve({ docs: Object.keys(docs).filter((k) => k.startsWith(path + '/'))
          .map((k) => ({ id: k.slice(path.length + 1), data: () => docs[k] })) }),
      };
    },
  };
}
const tick = (ms) => new Promise((r) => setTimeout(r, ms));

describe('Store (local only)', () => {
  test('save writes to localStorage under a per-user key and is readable back', () => {
    a.Store.save('meta', { x: 1 });
    const got = a.Store.localGet('meta');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(got.body)), { x: 1 });
    assert.ok(typeof got.ts === 'number');
    assert.ok(a.localStorage.getItem('ppw1:local:meta'));
  });
  test('localGet returns null when missing or corrupt', () => {
    assert.strictEqual(a.Store.localGet('nothing'), null);
    a.localStorage.setItem('ppw1:local:bad', '{not json');
    assert.strictEqual(a.Store.localGet('bad'), null);
  });
  test('loadAll resolves empty with no db', async () => {
    assert.deepStrictEqual({ ...(await a.Store.loadAll()) }, {});
  });
  test('persistLog / persistMeta store under log-<month> and meta', () => {
    a.S.logs.m1 = { 'w0-push': { done: true } };
    a.persistLog('m1');
    a.persistMeta();
    assert.ok(a.Store.localGet('log-m1'));
    assert.ok(a.Store.localGet('meta'));
  });
  test('statusText reflects mode', () => {
    a.S.mode = 'device';
    assert.match(a.statusText(), /this device only/);
    a.S.mode = 'account';
    assert.match(a.statusText(), /your account/);
  });
});

describe('Store (with Firestore-shaped db)', () => {
  test('saves to users/{uid}/data/{id} after the debounce, and only the last write wins', async () => {
    const db = fakeDb();
    a.Store.db = db;
    a.Store.uid = 'u123';
    a.Store.save('meta', { v: 1 });
    a.Store.save('meta', { v: 2 });
    await tick(900);
    assert.strictEqual(db.calls.length, 1);
    assert.strictEqual(db.calls[0].path, 'users/u123/data');
    assert.strictEqual(db.calls[0].id, 'meta');
    assert.strictEqual(db.docs['users/u123/data/meta'].body.v, 2);
    assert.strictEqual(a.S.mode, 'account');
  });
  test('falls back to device mode when the write fails', async () => {
    const db = fakeDb();
    db.collection = () => ({ doc: () => ({ set: () => Promise.reject(new Error('offline')) }) });
    a.Store.db = db;
    a.Store.save('meta', { v: 1 });
    await tick(900);
    assert.strictEqual(a.S.mode, 'device');
    assert.ok(a.Store.localGet('meta')); // still saved locally
  });
  test('loadAll returns the user documents keyed by id', async () => {
    const db = fakeDb();
    db.docs['users/u1/data/meta'] = { ts: 1, body: { a: 1 } };
    db.docs['users/u1/data/log-m1'] = { ts: 2, body: { b: 2 } };
    db.docs['users/other/data/meta'] = { ts: 3, body: { no: true } };
    a.Store.db = db;
    a.Store.uid = 'u1';
    const res = await a.Store.loadAll();
    assert.deepStrictEqual(Object.keys(res).sort(), ['log-m1', 'meta']);
  });
});
