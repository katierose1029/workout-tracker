/* Loads the app's scripts (in index.html order) into a Node vm sandbox and returns their internals,
   so pure logic can be unit tested without a browser. js/app.js (boot + DOM events) is skipped. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '../..');
const NAMES = ['tc','esc','pad','iso','parseISO','addDays','diffDays','wdIndex','num','clone','nextMonday',
  'fmtNum','normKey','getMonths','getMonth','monthForDate','sessKey','setIsDone','sessionStats','plannedSets',
  'monthStats','restDone','topWeight','totalReps','fmtSets','weekMonday','phOfDay','phaseFor','adjFor','Store','S','DAYS',
  'persistLog','persistMeta','statusText','PAGES','TABS','ICON'];

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

function appScripts() {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const files = [...html.matchAll(/<script src="(js\/[^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => f !== 'js/app.js');
  if (!files.length) throw new Error('Could not find app scripts in index.html');
  return files;
}

function loadApp() {
  const code = '(function(){\n'
    + appScripts().map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n')
    + '\nglobalThis.__app={' + NAMES.map((n) => `${n}:typeof ${n}!=='undefined'?${n}:undefined`).join(',') + '};\n})();';
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
  vm.runInContext(code, sandbox, { filename: 'app-bundle.js' });
  return Object.assign({ localStorage }, sandbox.__app);
}

module.exports = { loadApp, appScripts };
