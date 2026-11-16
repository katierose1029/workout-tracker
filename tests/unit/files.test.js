const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { appScripts } = require('./harness');

const ROOT = path.join(__dirname, '../..');

test('service worker caches every css/ and js/ file that index.html loads', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  const css = [...html.matchAll(/href="(css\/[^"]+)"/g)].map((m) => m[1]);
  [...css, ...appScripts(), 'js/app.js'].forEach((f) => {
    assert.ok(fs.existsSync(path.join(ROOT, f)), f + ' exists');
    assert.ok(sw.includes(`'${f}'`), f + ' is in SHELL');
  });
});
