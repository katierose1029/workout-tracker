const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { loadApp } = require('./harness');

let a;
beforeEach(() => { a = loadApp(); });

describe('dates', () => {
  test('pad / iso / parseISO round-trip', () => {
    assert.strictEqual(a.pad(5), '05');
    assert.strictEqual(a.pad(12), '12');
    assert.strictEqual(a.iso(a.parseISO('2026-03-09')), '2026-03-09');
  });
  test('addDays crosses month and year boundaries', () => {
    assert.strictEqual(a.addDays('2026-12-31', 1), '2027-01-01');
    assert.strictEqual(a.addDays('2026-03-01', -1), '2026-02-28');
    assert.strictEqual(a.addDays('2028-02-28', 1), '2028-02-29'); // leap year
  });
  test('diffDays is signed', () => {
    assert.strictEqual(a.diffDays('2026-11-30', '2026-11-23'), 7);
    assert.strictEqual(a.diffDays('2026-11-23', '2026-11-30'), -7);
  });
  test('wdIndex is Monday-based', () => {
    assert.strictEqual(a.wdIndex('2026-11-30'), 0); // Monday
    assert.strictEqual(a.wdIndex('2026-12-06'), 6); // Sunday
  });
  test('dayDate / weekSunday put Sunday first', () => {
    assert.strictEqual(a.weekSunday('2026-11-30'), '2026-11-29');
    assert.strictEqual(a.dayDate('2026-11-30', 6), '2026-11-29'); // Sunday
    assert.strictEqual(a.dayDate('2026-11-30', 0), '2026-11-30'); // Monday
    assert.strictEqual(a.dayDate('2026-11-30', 5), '2026-12-05'); // Saturday
  });
  test('weekMonday / nextMonday', () => {
    assert.strictEqual(a.weekMonday('2026-12-03'), '2026-11-30');
    // weeks run Sunday -> Saturday: a Sunday belongs to the week of the following Monday
    assert.strictEqual(a.weekMonday('2026-11-29'), '2026-11-30');
    assert.strictEqual(a.weekMonday('2026-12-05'), '2026-11-30');
    assert.strictEqual(a.nextMonday('2026-11-30'), '2026-11-30');
    assert.strictEqual(a.nextMonday('2026-12-01'), '2026-12-07');
  });
});

describe('helpers', () => {
  test('num parses numbers, commas, and junk', () => {
    assert.strictEqual(a.num('12.5'), 12.5);
    assert.strictEqual(a.num('12,5'), 12.5);
    assert.strictEqual(a.num(''), 0);
    assert.strictEqual(a.num('abc'), 0);
    assert.strictEqual(a.num(undefined), 0);
  });
  test('esc escapes HTML', () => {
    assert.strictEqual(a.esc('<a href="x">&\'</a>'), '&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;');
    assert.strictEqual(a.esc(null), '');
  });
  test('clone deep-copies', () => {
    const o = { x: { y: 1 } };
    const c = a.clone(o);
    c.x.y = 2;
    assert.strictEqual(o.x.y, 1);
  });
  test('fmtNum abbreviates thousands', () => {
    assert.strictEqual(a.fmtNum(950), '950');
    assert.strictEqual(a.fmtNum(1000), '1k');
    assert.strictEqual(a.fmtNum(12345), '12.3k');
  });
  test('normKey normalises exercise names', () => {
    assert.strictEqual(a.normKey('DB Bench Press'), 'dumbbell-bench-press');
    assert.strictEqual(a.normKey('KB  Swing!'), 'kettlebell-swing');
  });
  test('fmtSets shows bodyweight as BW', () => {
    assert.strictEqual(a.fmtSets([{ w: '25', r: '10' }, { w: '', r: '8' }]), '25×10, BW×8');
  });
  test('topWeight / totalReps', () => {
    const sets = [{ w: '20', r: '10' }, { w: '30', r: '5' }, { w: '', r: '12' }];
    assert.strictEqual(a.topWeight(sets), 30);
    assert.strictEqual(a.totalReps(sets), 27);
  });
});

describe('program and logs', () => {
  test('program has months in order with consistent weeks', () => {
    const ms = a.getMonths();
    assert.ok(ms.length >= 1);
    ms.forEach((m, i) => { if (i) assert.ok(m.n >= ms[i - 1].n); assert.ok(m.weeks > 0); });
  });
  test('getMonth falls back to the last month for unknown ids', () => {
    const ms = a.getMonths();
    assert.strictEqual(a.getMonth('nope').id, ms[ms.length - 1].id);
  });
  test('monthForDate finds the month and week, or null', () => {
    const m = a.getMonths().find((x) => x.start);
    const hit = a.monthForDate(a.addDays(m.start, 8));
    assert.strictEqual(hit.m.id, m.id);
    assert.strictEqual(hit.week, 1);
    assert.strictEqual(a.monthForDate('1999-01-01'), null);
  });
  test('a month runs from the Sunday before its first Monday to a Saturday', () => {
    const m = a.getMonths().find((x) => x.start);
    const sun = a.addDays(m.start, -1);
    assert.strictEqual(a.monthForDate(sun).m.id, m.id);
    assert.strictEqual(a.monthForDate(sun).week, 0);
    assert.strictEqual(a.monthForDate(a.addDays(m.start, 6)).week, 1); // the Sunday after week 1's Monday starts week 2
    assert.strictEqual(a.monthEnd(m), a.addDays(m.start, m.weeks * 7 - 2));
    assert.strictEqual(a.slotDate(m, 0, 6), sun);
  });
  test('sessKey distinguishes training and rest days', () => {
    assert.strictEqual(a.sessKey(2, 0), 'w2-' + a.DAYS[0].k);
    assert.strictEqual(a.sessKey(2, 5), 'w2-r5');
  });
  test('setIsDone needs done flag and positive reps', () => {
    assert.strictEqual(a.setIsDone({ d: true, r: '8' }), true);
    assert.strictEqual(a.setIsDone({ d: true, r: '0' }), false);
    assert.strictEqual(a.setIsDone({ d: false, r: '8' }), false);
    assert.strictEqual(a.setIsDone(null), false);
  });
  test('sessionStats totals completed sets only', () => {
    const sess = { ex: { e1: { sets: [{ d: true, r: '10', w: '20' }, { d: true, r: '5', w: '40' }, { d: false, r: '9', w: '99' }] } } };
    assert.deepStrictEqual({ ...a.sessionStats(sess) }, { sets: 2, vol: 400, reps: 15 });
    assert.deepStrictEqual({ ...a.sessionStats(null) }, { sets: 0, vol: 0, reps: 0 });
  });
  test('restDone is true if any rest activity is on', () => {
    assert.strictEqual(a.restDone({ walk: { on: true } }), true);
    assert.strictEqual(a.restDone({ yoga: { on: false } }), false);
    assert.strictEqual(a.restDone(null), false);
  });
  test('monthStats counts finished sessions and sets', () => {
    const m = a.getMonths()[0];
    a.S.logs[m.id] = { [a.sessKey(0, 0)]: { done: true, ex: { e: { sets: [{ d: true, r: '10', w: '10' }] } } } };
    const st = a.monthStats(m);
    assert.strictEqual(st.sess, 1);
    assert.strictEqual(st.sets, 1);
    assert.strictEqual(st.vol, 100);
  });
  test('phOfDay maps cycle day to phase (1-7 M, 8-13 F, 14-20 O, 21+ L)', () => {
    assert.deepStrictEqual([1, 7, 8, 13, 14, 20, 21, 40].map(a.phOfDay), ['m', 'm', 'f', 'f', 'o', 'o', 'l', 'l']);
  });
  test('phaseFor counts forward from the last picked phase start', () => {
    a.S.meta.cycle = { '2026-12-01': 1 };
    assert.strictEqual(a.phaseFor('2026-12-08').k, 'f');
    assert.strictEqual(a.phaseFor('2026-12-14').k, 'o');
    assert.strictEqual(a.phaseFor('2026-12-20').day, 20);
    assert.strictEqual(a.phaseFor('2026-12-21').k, 'l');
    assert.strictEqual(a.phaseFor('2026-11-30'), null);
  });
});

describe('pages', () => {
  test('every tab has a page, a label and an icon', () => {
    assert.deepStrictEqual([...a.TABS], ['today', 'month', 'progress', 'settings']);
    a.TABS.forEach((id) => {
      assert.strictEqual(typeof a.PAGES[id].view, 'function', id);
      assert.ok(a.PAGES[id].label, id);
      assert.ok(a.ICON[id], id);
    });
  });
  test('the Data page is now Settings', () => {
    assert.strictEqual(a.PAGES.settings.label, 'Settings');
    assert.strictEqual(a.PAGES.data, undefined);
  });
});
