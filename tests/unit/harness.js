/* Loads the app's inline script into a Node vm sandbox and returns its internals,
   so pure logic can be unit tested without refactoring index.html. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const NAMES = ['tc','esc','pad','iso','parseISO','addDays','diffDays','wdIndex','num','clone','nextMonday',
  'fmtNum','normKey','getMonths','getMonth','monthForDate','sessKey','setIsDone','sessionStats','plannedSets',
  'monthStats','restDone','topWeight','totalReps','fmtSets','weekMonday','phOfDay','adjFor','Store','S','DAYS',
  'persistLog','persistMeta','statusText'];

function makeStorage() {
  const m = new Map();
  return {
    get length() { return m.size; },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    clear: () => m.clear(),
    _map: m,
  };
}

function loadApp() {
  const html = fs.readFileSync(path.join(__dirname, '../../index.html'), 'utf8');
  const start = html.indexOf('(function(){\n\'use strict\';');
  const end = html.indexOf('init();\n})();', start);
  if (start < 0 || end < 0) throw new Error('Could not locate app script in index.html');
  const code = html.slice(start, end)
    + 'globalThis.__app={' + NAMES.map((n) => `${n}:typeof ${n}!=='undefined'?${n}:undefined`).join(',') + '};\n})();';
  const noop = () => {};
  const el = () => ({ style: {}, setAttribute: noop, removeAttribute: noop, addEventListener: noop, appendChild: noop });
  const localStorage = makeStorage();
  const sandbox = {
    localStorage, console, setTimeout, clearTimeout, Promise, JSON, Math, Date,
    document: { getElementById: () => null, querySelector: () => null, documentElement: el(), addEventListener: noop, body: el(), createElement: el },
    navigator: {}, location: { search: '', protocol: 'https:' },
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: 'index.html' });
  return Object.assign({ localStorage }, sandbox.__app);
}

module.exports = { loadApp };
