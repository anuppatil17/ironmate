import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core.js';

test('every plan day has five meals with quantity and vitamin C pairing', () => {
  for (const diet of ['veg', 'nonveg']) {
    for (let d = 1; d <= 30; d++) {
      const p = C.planDay(d, diet);
      assert.equal(Object.keys(p).length, 5);
      for (const s of C.SLOTS) {
        for (const meal of [p[s.key].veg, p[s.key].nonveg].filter(Boolean)) {
          assert.ok(meal.n.length > 3, `name day ${d} ${s.key}`);
          assert.ok(meal.q.length > 3, `quantity day ${d} ${s.key}`);
          assert.ok(meal.c.length > 3, `vitamin C day ${d} ${s.key}`);
        }
      }
    }
  }
});

test('the 30 veg days are all different', () => {
  const seen = new Set();
  for (let d = 1; d <= 30; d++) {
    const p = C.planDay(d, 'veg');
    seen.add(C.SLOTS.map((s) => p[s.key].veg.n).join('|'));
  }
  assert.equal(seen.size, 30);
});

test('veg plan never has a non-veg meal', () => {
  for (let d = 1; d <= 30; d++) {
    const p = C.planDay(d, 'veg');
    for (const s of C.SLOTS) assert.equal(p[s.key].nonveg, null);
  }
});

test('non-veg plan: at most one non-veg meal a day, one veg day a week, veg option always there', () => {
  let nonvegDays = 0;
  for (let d = 1; d <= 30; d++) {
    const p = C.planDay(d, 'nonveg');
    const n = C.SLOTS.filter((s) => p[s.key].nonveg).length;
    assert.ok(n <= 1);
    if (n) nonvegDays++;
    for (const s of C.SLOTS) assert.ok(p[s.key].veg);
    if (d % 7 === 0) assert.equal(n, 0);
  }
  assert.equal(nonvegDays, 26);
});

test('swap gives the veg option', () => {
  const p = C.planDay(1, 'nonveg');
  assert.equal(C.chosenMeal(p.lunch, false).nonveg, true);
  assert.equal(C.chosenMeal(p.lunch, true).nonveg, false);
});

test('no meal text mentions medicine, tablets or doses', () => {
  const text = JSON.stringify([...Array(30)].map((_, i) => C.planDay(i + 1, 'nonveg'))).toLowerCase();
  for (const w of ['supplement', 'ferrous', ' mg', 'capsule', 'dose']) assert.ok(!text.includes(w), w);
});

test('plan repeats after day 30', () => {
  assert.equal(C.planDayNumber(31), 1);
  assert.equal(C.planDayNumber(60), 30);
  assert.deepEqual(C.planDay(31, 'veg'), C.planDay(1, 'veg'));
});

test('journey day and date helpers', () => {
  assert.equal(C.journeyDay('2026-11-25', '2026-11-25'), 1);
  assert.equal(C.journeyDay('2026-11-25', '2026-12-24'), 30);
  assert.equal(C.journeyDay('2026-11-25', '2026-11-24'), 0);
  assert.equal(C.addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(C.addDays('2027-03-01', -1), '2027-02-28');
  assert.equal(C.fmtTime('13:05'), '1:05 PM');
  assert.equal(C.fmtTime('00:30'), '12:30 AM');
  assert.equal(C.isISO('2026-13-40'), true); // JS rolls over; shape check only
  assert.equal(C.isISO('nope'), false);
});

test('meal adherence: eaten 1, partial 0.5, skipped 0, not logged 0', () => {
  assert.equal(C.mealStats(undefined).pct, 0);
  const d = { meals: { breakfast: 'eaten', mid: 'partial', lunch: 'eaten', snack: 'skipped' } };
  const m = C.mealStats(d);
  assert.equal(m.pct, 50);
  assert.equal(m.logged, 4);
  assert.deepEqual([m.eaten, m.partial, m.skipped], [2, 1, 1]);
  assert.equal(C.mealStats({ meals: { breakfast: 'weird' } }).logged, 0);
});

test('water and movement stats cap at 100%', () => {
  assert.equal(C.waterStats({ water: 4 }, 8).pct, 50);
  assert.equal(C.waterStats({ water: 12 }, 8).pct, 100);
  assert.equal(C.waterStats({ water: 8 }, 8).litres, 2);
  const mv = C.moveStats({ walkMin: 20, exercise: [{ t: 'Yoga', m: 15 }] }, 30);
  assert.equal(mv.total, 35);
  assert.equal(mv.pct, 100);
});

test('week summary counts finished days only', () => {
  const full = { meals: { breakfast: 'eaten', mid: 'eaten', lunch: 'eaten', snack: 'eaten', dinner: 'eaten' }, water: 8 };
  const days = { '2026-11-23': full, '2026-11-24': full, '2026-11-25': { meals: { breakfast: 'eaten' } } };
  const w = C.weekSummary(days, '2026-11-25', '2026-11-23', { waterGoal: 8 });
  assert.equal(w.rows.length, 7);
  assert.equal(w.rows.filter((r) => r.inPlan).length, 3);
  assert.equal(w.counted, 2); // today is not finished
  assert.equal(w.avgMeals, 100);
  days['2026-11-25'] = { meals: { breakfast: 'skipped', mid: 'skipped', lunch: 'skipped', snack: 'skipped', dinner: 'skipped' } };
  const w2 = C.weekSummary(days, '2026-11-25', '2026-11-23', {});
  assert.equal(w2.counted, 3);
  assert.equal(w2.avgMeals, 67);
});

test('a past day with no log counts as 0%', () => {
  const w = C.weekSummary({}, '2026-11-25', '2026-11-20', {});
  assert.equal(w.counted, 5);
  assert.equal(w.avgMeals, 0);
});

test('streak', () => {
  const good = { meals: { breakfast: 'eaten', mid: 'eaten', lunch: 'eaten', snack: 'eaten', dinner: 'partial' } };
  const days = { '2026-11-22': good, '2026-11-23': good, '2026-11-24': good };
  assert.equal(C.streak(days, '2026-11-25', '2026-11-20'), 3);
  days['2026-11-25'] = good;
  assert.equal(C.streak(days, '2026-11-25', '2026-11-20'), 4);
  assert.equal(C.streak({}, '2026-11-25', '2026-11-20'), 0);
  assert.equal(C.streak(days, '2026-11-25', '2026-11-24'), 2); // does not run before the start
});

test('symptom summary', () => {
  const days = { '2026-11-24': { symptoms: { dizziness: 2, fatigue: 0 } }, '2026-11-25': { symptoms: { dizziness: 1 } } };
  const s = C.symptomSummary(days, '2026-11-25', 7);
  const diz = s.find((x) => x.key === 'dizziness');
  assert.equal(diz.daysWith, 2);
  assert.deepEqual(diz.levels.slice(-2), [2, 1]);
  assert.equal(s.find((x) => x.key === 'fatigue').daysWith, 0);
  assert.equal(s.find((x) => x.key === 'headache').levels[6], null);
});

test('next up', () => {
  assert.deepEqual(C.nextUp(null, {}, 7 * 60), { type: 'next', slot: 'breakfast', at: '08:00', inMin: 60 });
  assert.equal(C.nextUp(null, {}, 9 * 60).type, 'due');
  assert.equal(C.nextUp(null, { meals: { breakfast: 'eaten' } }, 9 * 60).slot, 'mid');
  const all = { meals: { breakfast: 'eaten', mid: 'eaten', lunch: 'eaten', snack: 'eaten', dinner: 'eaten' } };
  assert.equal(C.nextUp(null, all, 9 * 60).type, 'done');
});

test('lab entry is checked for typos only', () => {
  assert.equal(C.parseLab({ date: '2026-11-25', hb: '9.5', ferritin: '' }).ok, true);
  assert.equal(C.parseLab({ date: '2026-11-25', hb: '9.5', ferritin: '' }).value.ferritin, null);
  assert.equal(C.parseLab({ date: '2026-11-25', hb: '95' }).ok, false);
  assert.equal(C.parseLab({ date: '2026-11-25', hb: '', ferritin: '' }).ok, false);
  assert.equal(C.parseLab({ date: '', hb: '10' }).ok, false);
  assert.equal(C.parseLab({ date: '2026-11-25', hb: 'abc' }).ok, false);
  const v = C.parseLab({ date: '2026-11-25', hb: '11.2', ferritin: '18' }).value;
  assert.deepEqual(Object.keys(v).sort(), ['date', 'ferritin', 'hb', 'lab', 'note']); // no verdict field
});

test('calendar file has daily alarms for 5 meals and water', () => {
  const ics = C.buildICS({ startISO: '2026-11-25', appts: [{ id: 'a1', date: '2026-12-20', time: '10:30', kind: 'blood_test', title: 'Hb, ferritin; CBC' }], now: new Date('2026-11-25T08:00:00Z') });
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  assert.equal((ics.match(/BEGIN:VEVENT/g) || []).length, 5 + 6 + 1);
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 12);
  assert.equal((ics.match(/RRULE:FREQ=DAILY/g) || []).length, 11);
  assert.ok(ics.includes('DTSTART:20261125T080000'));
  assert.ok(ics.includes('DTSTART:20261220T103000'));
  assert.ok(ics.includes('SUMMARY:Hb\\, ferritin\\; CBC'));
  assert.ok(!/[^\r]\n/.test(ics));
});

test('config defaults', () => {
  const c = C.withDefaults({ waterGoal: 10, times: { lunch: '13:30' } });
  assert.equal(c.waterGoal, 10);
  assert.equal(c.times.lunch, '13:30');
  assert.equal(c.times.dinner, '19:30');
  assert.equal(c.diet, 'veg');
});

test('cleanDay keeps known fields and drops everything else', () => {
  const d = C.cleanDay({ meals: { breakfast: 'eaten', lunch: '"><img src=x>', bogus: 'eaten' }, swaps: { lunch: true, dinner: 'yes' }, water: '5', walkMin: -4, steps: 1e9, exercise: [{ t: '<b>', m: 20 }, null], symptoms: { fatigue: 2, headache: 9 }, period: 'yes', note: 'ok', extra: 1 });
  assert.deepEqual(d, { meals: { breakfast: 'eaten' }, swaps: { lunch: true }, water: 5, walkMin: 0, steps: 100000, exercise: [{ t: 'Other', m: 20 }], symptoms: { fatigue: 2 }, note: 'ok' });
  assert.deepEqual(C.cleanDay(null), {});
});

test('bad config values fall back to defaults', () => {
  const c = C.withDefaults({ startDate: 'x', times: { lunch: '25:99' }, waterTimes: ['<script>', '09:00'], waterGoal: -3 });
  assert.equal(C.isISO(c.startDate), true);
  assert.equal(c.times.lunch, '13:00');
  assert.deepEqual(c.waterTimes, ['09:00']);
  assert.equal(c.waterGoal, 8);
});
