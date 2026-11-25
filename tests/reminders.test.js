import test from 'node:test';
import assert from 'node:assert/strict';
import { dueReminders, localParts, nextDate } from '../supabase/functions/send-reminders/reminders.js';

const config = { setupDone: true, startDate: '2026-11-25', waterGoal: 8 };

test('local time in the family time zone', () => {
  const p = localParts(new Date('2026-11-25T04:02:00Z'), 'Asia/Dubai');
  assert.deepEqual(p, { date: '2026-11-25', minutes: 8 * 60 + 2 });
  assert.equal(localParts(new Date('2026-11-25T21:30:00Z'), 'Asia/Dubai').date, '2026-11-26');
  assert.equal(localParts(new Date('2026-11-25T04:02:00Z'), 'Not/AZone').minutes, 4 * 60 + 2);
  assert.equal(nextDate('2026-12-31'), '2027-01-01');
});

test('meal reminder is due inside the window and only when not logged', () => {
  const at = (minutes, day = {}) => dueReminders({ config, day, date: '2026-11-25', minutes }).map((r) => r.key);
  assert.deepEqual(at(8 * 60 + 2), ['meal-breakfast']);
  assert.deepEqual(at(8 * 60 + 2, { meals: { breakfast: 'eaten' } }), []);
  assert.deepEqual(at(8 * 60 + 12), []);
  assert.deepEqual(at(7 * 60 + 59), []);
  assert.deepEqual(at(13 * 60), ['meal-lunch']);
});

test('custom meal time is used', () => {
  const r = dueReminders({ config: { ...config, times: { lunch: '13:30' } }, day: {}, date: '2026-11-25', minutes: 13 * 60 + 31 });
  assert.deepEqual(r.map((x) => x.key), ['meal-lunch']);
});

test('water reminder stops when the goal is reached', () => {
  const r = dueReminders({ config, day: { water: 3 }, date: '2026-11-25', minutes: 9 * 60 + 30 });
  assert.equal(r[0].key, 'water-1');
  assert.match(r[0].body, /3 of 8/);
  assert.deepEqual(dueReminders({ config, day: { water: 8 }, date: '2026-11-25', minutes: 9 * 60 + 30 }), []);
});

test('no meal or water reminders before setup or before day 1', () => {
  assert.deepEqual(dueReminders({ config: {}, day: {}, date: '2026-11-25', minutes: 8 * 60 }), []);
  assert.deepEqual(dueReminders({ config, day: {}, date: '2026-11-24', minutes: 8 * 60 }), []);
});

test('appointment reminders go to both, the evening before and on the morning', () => {
  const appts = [{ id: 'a1', kind: 'blood_test', on_date: '2026-11-26', at_time: '08:30:00', place: 'City Lab', done: false }, { id: 'a2', kind: 'doctor', on_date: '2026-11-26', done: true }];
  const eve = dueReminders({ config, day: { meals: {}, water: 8 }, appts, date: '2026-11-25', minutes: 18 * 60 + 1 });
  assert.deepEqual(eve.map((r) => [r.key, r.to]), [['appt-a1-eve', 'both']]);
  assert.equal(eve[0].title, 'Tomorrow: Follow-up blood test');
  const day = dueReminders({ config, day: { meals: { breakfast: 'eaten' } }, appts, date: '2026-11-26', minutes: 8 * 60 });
  assert.deepEqual(day.map((r) => r.key), ['appt-a1-day']);
  assert.match(day[0].body, /08:30/);
});

test('no reminder text mentions medicine', () => {
  const all = dueReminders({ config, day: {}, appts: [], date: '2026-11-25', minutes: 13 * 60 });
  assert.ok(!/tablet|supplement|dose/i.test(JSON.stringify(all)));
});
