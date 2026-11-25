// Pure logic for "which reminders are due now". No network here, so it can be unit tested.

const SLOTS = [
  ['breakfast', 'Breakfast', '08:00'],
  ['mid', 'Mid-morning snack', '10:30'],
  ['lunch', 'Lunch', '13:00'],
  ['snack', 'Evening snack', '16:30'],
  ['dinner', 'Dinner', '19:30'],
];
const WATER = ['07:30', '09:30', '11:30', '14:30', '16:00', '18:00'];
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const mins = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** Local date (yyyy-mm-dd) and minutes after midnight in a time zone. */
export function localParts(now, tz) {
  let zone = tz || 'UTC';
  try { new Intl.DateTimeFormat('en-CA', { timeZone: zone }); } catch { zone = 'UTC'; }
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

export function nextDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + 1));
  return x.toISOString().slice(0, 10);
}

/**
 * Reminders that fall in the window [minutes - windowMin, minutes].
 * Each item: { key, to: 'tracker' | 'both', title, body }.
 * `key` is unique per day, so the caller can make sure each one is sent once.
 */
export function dueReminders({ config, day, appts = [], date, minutes, windowMin = 10 }) {
  const out = [];
  const c = config || {};
  const inWindow = (t) => HHMM.test(t) && mins(t) <= minutes && minutes - mins(t) < windowMin;

  if (c.setupDone && typeof c.startDate === 'string' && date >= c.startDate) {
    const meals = (day && day.meals) || {};
    for (const [key, label, def] of SLOTS) {
      const t = (c.times && HHMM.test(c.times[key]) && c.times[key]) || def;
      if (inWindow(t) && !meals[key]) {
        out.push({ key: `meal-${key}`, to: 'tracker', title: `${label} time`, body: 'Open IronMate to see the meal and log it. Remember the vitamin C pairing.' });
      }
    }
    const goal = Number(c.waterGoal) > 0 ? Number(c.waterGoal) : 8;
    const have = Math.max(0, Number(day && day.water) || 0);
    const water = Array.isArray(c.waterTimes) && c.waterTimes.length ? c.waterTimes : WATER;
    water.slice(0, 12).forEach((t, i) => {
      if (inWindow(t) && have < goal) out.push({ key: `water-${i}`, to: 'tracker', title: 'Time for a glass of water', body: `${have} of ${goal} glasses so far today.` });
    });
  }

  const tomorrow = nextDate(date);
  for (const a of appts) {
    if (!a || a.done) continue;
    const title = a.title || (a.kind === 'blood_test' ? 'Follow-up blood test' : a.kind === 'doctor' ? 'Doctor appointment' : 'Appointment');
    const at = a.at_time ? ` at ${String(a.at_time).slice(0, 5)}` : '';
    const place = a.place ? ` · ${a.place}` : '';
    if (a.on_date === tomorrow && inWindow('18:00')) out.push({ key: `appt-${a.id}-eve`, to: 'both', title: `Tomorrow: ${title}`, body: `${a.on_date}${at}${place}` });
    if (a.on_date === date && inWindow('08:00')) out.push({ key: `appt-${a.id}-day`, to: 'both', title: `Today: ${title}`, body: `${at ? at.trim() : 'Today'}${place}` });
  }
  return out;
}
