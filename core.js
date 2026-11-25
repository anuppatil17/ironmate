// IronMate — plan data and pure logic.
// No DOM and no network here, so this file can be unit tested with Node.

/* ------------------------------------------------------------------ */
/* Meal slots and defaults                                             */
/* ------------------------------------------------------------------ */

export const SLOTS = [
  { key: 'breakfast', label: 'Breakfast', short: 'Breakfast' },
  { key: 'mid', label: 'Mid-morning snack', short: 'Mid-morning' },
  { key: 'lunch', label: 'Lunch', short: 'Lunch' },
  { key: 'snack', label: 'Evening snack', short: 'Snack' },
  { key: 'dinner', label: 'Dinner', short: 'Dinner' },
];

export const DEFAULTS = {
  diet: 'veg', // 'veg' | 'nonveg'
  waterGoal: 8, // glasses per day
  glassMl: 250,
  moveGoal: 30, // minutes of walking + exercise per day
  times: { breakfast: '08:00', mid: '10:30', lunch: '13:00', snack: '16:30', dinner: '19:30' },
  waterTimes: ['07:30', '09:30', '11:30', '14:30', '16:00', '18:00'],
};

export const PLAN_DAYS = 30;

export const STATUS = {
  eaten: { label: 'Eaten', score: 1 },
  partial: { label: 'Partly eaten', score: 0.5 },
  skipped: { label: 'Skipped', score: 0 },
};

export const SYMPTOMS = [
  { key: 'dizziness', label: 'Dizziness' },
  { key: 'fatigue', label: 'Fatigue (tired)' },
  { key: 'weakness', label: 'Weakness' },
  { key: 'headache', label: 'Headache' },
];
export const LEVELS = ['None', 'Mild', 'Medium', 'Strong'];

export const EXERCISES = ['Yoga', 'Stretching', 'Light strength', 'Cycling', 'Dance', 'Housework', 'Other'];

/* ------------------------------------------------------------------ */
/* Meal library                                                        */
/* n = dish, q = quantity, c = vitamin C pairing, fe = iron sources    */
/* 1 katori = one small bowl (about 150 ml). 1 glass = about 250 ml.   */
/* ------------------------------------------------------------------ */

const VEG = {
  breakfast: [
    { n: 'Ragi dosa with peanut-sesame chutney', q: '2 medium dosa + 2 tbsp chutney', c: '1 orange', fe: 'ragi, sesame, peanuts' },
    { n: 'Poha with peanuts and green peas', q: '1½ katori', c: 'Squeeze ½ lemon on top + 1 guava', fe: 'poha, peanuts, peas' },
    { n: 'Moong dal chilla with methi leaves', q: '2 medium chilla + 2 tbsp mint-coriander chutney', c: '½ katori papaya + lemon in the chutney', fe: 'moong dal, methi' },
    { n: 'Bajra-methi thepla with tomato chutney', q: '2 thepla + 2 tbsp chutney', c: '1 glass nimbu pani (fresh lemon water)', fe: 'bajra, methi' },
    { n: 'Sprouted moong and kala chana chaat', q: '1½ katori with onion, tomato and coriander', c: 'Juice of ½ lemon in the chaat + 1 orange', fe: 'sprouts, kala chana' },
    { n: 'Rajgira (amaranth) porridge with dates', q: '1 katori, cooked in water, with 2 chopped dates and 1 tsp sesame seeds', c: '1 sweet lime (mosambi)', fe: 'rajgira, dates, sesame' },
    { n: 'Dalia upma with vegetables and peanuts', q: '1½ katori', c: '1 kiwi or 1 orange', fe: 'broken wheat, peanuts, peas' },
    { n: 'Besan chilla with spinach and tomato', q: '2 medium chilla + 2 tbsp green chutney', c: '1 fresh amla or 1 guava', fe: 'besan, spinach' },
    { n: 'Idli with drumstick sambar', q: '3 idli + 1 katori sambar + 2 tbsp tomato chutney', c: '1 guava', fe: 'dal, drumstick' },
    { n: 'Palak paratha with tomato-garlic chutney', q: '2 small paratha + 2 tbsp chutney', c: '1 glass nimbu pani (fresh lemon water)', fe: 'spinach, whole wheat' },
  ],
  mid: [
    { n: 'Guava with pumpkin seeds', q: '1 medium guava + 1 tbsp roasted pumpkin seeds', c: 'The guava is the vitamin C', fe: 'pumpkin seeds' },
    { n: 'Amla and dates', q: '1 fresh amla (or 30 ml amla juice in water) + 2 dates', c: 'The amla is the vitamin C', fe: 'dates' },
    { n: 'Orange with roasted chana', q: '1 orange + 1 handful (20 g) roasted chana', c: 'The orange is the vitamin C', fe: 'roasted chana' },
    { n: 'Pomegranate bowl with almonds', q: '1 katori pomegranate + 5 soaked almonds', c: 'Add a squeeze of lemon', fe: 'pomegranate, almonds' },
    { n: 'Nimbu pani with til-gud ladoo', q: '1 glass fresh lemon water + 1 small sesame-jaggery ladoo', c: 'The lemon water is the vitamin C', fe: 'sesame, jaggery' },
    { n: 'Kiwi with black raisins', q: '1 kiwi + 1 tbsp black raisins, soaked overnight', c: 'The kiwi is the vitamin C', fe: 'black raisins' },
    { n: 'Papaya with sunflower seeds', q: '1 katori papaya + 1 tbsp roasted sunflower seeds', c: 'The papaya is the vitamin C', fe: 'sunflower seeds' },
    { n: 'Beetroot-carrot-amla juice', q: '1 glass (200 ml), fresh, no sugar', c: 'The amla in the juice is the vitamin C', fe: 'beetroot' },
    { n: 'Sweet lime with peanut chikki', q: '1 mosambi + 1 small piece of chikki', c: 'The mosambi is the vitamin C', fe: 'peanuts, jaggery' },
    { n: 'Pineapple with roasted chana', q: '1 katori pineapple (or strawberries) + 1 handful (20 g) roasted chana', c: 'The fruit is the vitamin C', fe: 'roasted chana' },
  ],
  lunch: [
    { n: 'Palak dal, bajra roti and beetroot salad', q: '1 katori dal + 2 bajra roti + ½ katori rice + 1 katori beetroot-carrot salad', c: 'Lemon juice on the salad', fe: 'spinach, dal, bajra, beetroot' },
    { n: 'Rajma with rice', q: '1 katori rajma + 1 katori rice + 1 katori kachumber salad', c: 'Lemon on the salad + ½ katori sautéed capsicum', fe: 'rajma' },
    { n: 'Chole with roti', q: '1 katori chole + 2 whole wheat roti + onion-tomato salad', c: 'Lemon wedge on the chole and salad', fe: 'chickpeas' },
    { n: 'Lobia curry with jowar bhakri', q: '1 katori lobia + 2 jowar bhakri + ½ katori cabbage-capsicum sabzi', c: 'Lemon wedge + raw tomato slices', fe: 'lobia, jowar' },
    { n: 'Methi-moong dal with roti', q: '1 katori dal + 2 roti + ½ katori lauki sabzi + tomato-cucumber salad', c: 'Lemon on the salad', fe: 'moong dal, methi' },
    { n: 'Drumstick sambar with rice', q: '1½ katori sambar + 1 katori rice + ½ katori beans poriyal', c: 'Raw tomato salad with lemon', fe: 'toor dal, drumstick' },
    { n: 'Soya chunk curry with roti', q: '1 katori curry + 2 roti + 1 katori salad', c: 'Lemon on the salad + capsicum in the curry', fe: 'soya chunks' },
    { n: 'Kala chana curry with greens', q: '1 katori kala chana + 2 bajra roti + ½ katori sautéed amaranth leaves (chaulai / lal math)', c: 'Lemon wedge on the greens', fe: 'kala chana, amaranth leaves, bajra' },
    { n: 'Masoor dal with jeera rice', q: '1 katori dal + 1 katori rice + ½ katori bhindi sabzi + salad', c: 'Lemon in the dal + tomato salad', fe: 'masoor dal' },
    { n: 'Matki usal with bhakri', q: '1 katori sprouted matki usal + 2 jowar bhakri + tomato-onion koshimbir', c: 'Lemon on the usal and koshimbir', fe: 'sprouted matki, jowar' },
  ],
  snack: [
    { n: 'Roasted chana and peanuts', q: '1 handful (30 g) + 1 small piece of jaggery', c: '1 glass nimbu pani (fresh lemon water)', fe: 'chana, peanuts, jaggery' },
    { n: 'Sprouts bhel', q: '1 katori with tomato, onion and coriander', c: 'Juice of ½ lemon', fe: 'sprouts' },
    { n: 'Til-gud ladoo', q: '1 ladoo', c: '1 orange', fe: 'sesame, jaggery' },
    { n: 'Dates and walnuts', q: '3 dates + 2 walnuts', c: '1 guava', fe: 'dates' },
    { n: 'Beetroot tikki', q: '2 small tikki, shallow fried + 2 tbsp green chutney', c: 'Lemon in the chutney + tomato slices', fe: 'beetroot, besan' },
    { n: 'Peanut-chana chaat', q: '1 katori with onion, tomato and coriander', c: 'Juice of ½ lemon', fe: 'peanuts, chana' },
    { n: 'Ragi ladoo', q: '1 ladoo', c: '1 glass nimbu pani (fresh lemon water)', fe: 'ragi, jaggery' },
    { n: 'Boiled kala chana chaat', q: '1 katori', c: 'Juice of ½ lemon + chopped tomato', fe: 'kala chana' },
    { n: 'Tomato-beetroot soup', q: '1 bowl (200 ml) + 1 handful roasted chana', c: 'The tomato + a squeeze of lemon', fe: 'beetroot, chana' },
    { n: 'Dry fruit mix', q: '5 black raisins + 2 dried figs (anjeer) + 2 dried apricots', c: '1 sweet lime (mosambi)', fe: 'raisins, figs, apricots' },
  ],
  dinner: [
    { n: 'Moong dal khichdi with spinach', q: '1½ katori + tomato salad', c: 'Lemon on the khichdi and salad', fe: 'moong dal, spinach' },
    { n: 'Methi thepla with lauki-chana dal', q: '2 thepla + 1 katori sabzi', c: 'Lemon wedge + raw tomato', fe: 'methi, chana dal' },
    { n: 'Bajra khichdi with vegetables', q: '1½ katori + 1 katori kachumber', c: 'Lemon on the kachumber', fe: 'bajra, moong dal' },
    { n: 'Palak-chana with jowar roti', q: '1 katori spinach-chickpea sabzi + 2 jowar roti + salad', c: 'Lemon wedge on the sabzi', fe: 'spinach, chickpeas, jowar' },
    { n: 'Panchmel dal with roti', q: '1 katori mixed dal + 2 roti + ½ katori capsicum-tomato sabzi', c: 'The capsicum and tomato + lemon in the dal', fe: 'five dals' },
    { n: 'Ragi roti with moong dal', q: '2 ragi roti + 1 katori dal + salad', c: 'Lemon on the salad', fe: 'ragi, moong dal' },
    { n: 'Dal dhokli', q: '1½ katori + salad', c: 'Lemon on top + tomato salad', fe: 'toor dal, whole wheat' },
    { n: 'Tomato rasam, rice and lobia sundal', q: '1 katori rasam + 1 katori rice + ½ katori lobia sundal + ½ katori beetroot poriyal', c: 'The tomato rasam + lemon on the sundal', fe: 'lobia, beetroot' },
    { n: 'Masoor dal soup with roti', q: '1 bowl soup + 2 multigrain roti + ½ katori sautéed beans and capsicum', c: 'Lemon in the soup', fe: 'masoor dal' },
    { n: 'Soya-matar pulao', q: '1½ katori + tomato-onion salad', c: 'Lemon on the salad', fe: 'soya, peas' },
  ],
};

const NONVEG = {
  breakfast: [
    { n: 'Egg bhurji with tomato and capsicum', q: '2 eggs + 2 small whole wheat roti', c: '1 orange', fe: 'eggs' },
    { n: 'Spinach masala omelette', q: '2 eggs + 2 slices whole wheat toast', c: 'Tomato slices with lemon + 1 guava', fe: 'eggs, spinach' },
    { n: 'Boiled eggs with poha', q: '2 eggs + 1 katori poha with peanuts', c: 'Squeeze ½ lemon on the poha + ½ katori papaya', fe: 'eggs, poha, peanuts' },
  ],
  lunch: [
    { n: 'Chicken curry with roti', q: '1 katori (about 100 g chicken) + 2 roti + kachumber salad', c: 'Lemon on the salad', fe: 'chicken' },
    { n: 'Fish curry with rice', q: '1 katori (about 100 g fish) + 1 katori rice + ½ katori sautéed greens', c: 'Lemon wedge + tomato in the curry', fe: 'fish, greens' },
    { n: 'Egg curry with roti', q: '2 eggs + 2 roti + salad', c: 'Lemon on the salad', fe: 'eggs' },
    { n: 'Mutton curry with bajra roti', q: '1 katori (about 80 g lean mutton) + 2 bajra roti + onion-tomato salad', c: 'Lemon on the salad', fe: 'mutton, bajra' },
    { n: 'Keema matar with roti', q: '1 katori (about 80 g mince with peas) + 2 roti + salad', c: 'Lemon on the keema and salad', fe: 'mince, peas' },
    { n: 'Chicken palak with rice', q: '1 katori (about 100 g chicken with spinach) + 1 katori rice + salad', c: 'Lemon wedge on the curry', fe: 'chicken, spinach' },
  ],
  snack: [
    { n: 'Boiled egg with tomato', q: '1 egg + tomato slices', c: 'Lemon and pepper on the tomato', fe: 'egg' },
    { n: 'Chicken clear soup', q: '1 bowl (200 ml)', c: 'A squeeze of lemon in the soup', fe: 'chicken' },
  ],
  dinner: [
    { n: 'Tawa fish with roti', q: 'About 100 g fish + 1 roti + 1 katori sautéed vegetables', c: 'Lemon on the fish', fe: 'fish' },
    { n: 'Chicken and vegetable stew', q: '1 bowl (about 100 g chicken) + 2 roti', c: 'A squeeze of lemon + tomato in the stew', fe: 'chicken' },
    { n: 'Egg bhurji with roti', q: '2 eggs + 2 roti + salad', c: 'Lemon on the salad', fe: 'eggs' },
    { n: 'Chicken curry with jeera rice', q: '1 katori (about 100 g chicken) + 1 katori rice + salad', c: 'Lemon on the salad', fe: 'chicken' },
  ],
};

// In the non-veg plan, one meal a day is non-veg. One day a week stays fully veg.
const NONVEG_WEEK = ['lunch', 'breakfast', 'dinner', 'lunch', 'snack', 'dinner', null];

export const RULES = [
  { t: 'Add vitamin C to every iron-rich meal', d: 'Lemon, amla, guava, orange, tomato and capsicum help the body take in more iron from plant foods.' },
  { t: 'Keep tea and coffee 1 hour away from meals', d: 'Tea and coffee make it harder for the body to take in iron. Drink them between meals.' },
  { t: 'Have milk, curd and paneer between meals', d: 'Calcium can lower iron uptake. Keep dairy and calcium tablets away from the main iron-rich meals.' },
  { t: 'Soak, sprout or ferment', d: 'Soaked dals, sprouts, idli and dosa batter let the body use more of the iron in grains and pulses.' },
  { t: 'Cook in an iron kadhai or tawa when you can', d: 'Food cooked in iron pots picks up a little extra iron.' },
  { t: 'Non-veg iron is easier to absorb', d: 'On fully vegetarian days, take extra care with the vitamin C pairing.' },
];

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

function vegIndex(slot, d0) {
  const dec = Math.floor(d0 / 10);
  switch (slot) {
    case 'breakfast': return d0 % 10;
    case 'mid': return (d0 * 3 + dec) % 10;
    case 'lunch': return (d0 * 7 + dec * 2) % 10;
    case 'snack': return (d0 * 9 + dec * 3 + 5) % 10;
    case 'dinner': return (d0 * 3 + dec * 4 + 2) % 10;
    default: return 0;
  }
}

/** Plan day number (1..30) for any journey day number (1, 2, 3 ... 31 = 1 again). */
export function planDayNumber(journeyDay) {
  return ((Math.max(1, journeyDay) - 1) % PLAN_DAYS) + 1;
}

/**
 * The five meals for one plan day.
 * Each slot gives { slot, veg, nonveg } where nonveg is null on veg meals.
 */
export function planDay(dayNum, diet = 'veg') {
  const d0 = planDayNumber(dayNum) - 1;
  const out = {};
  for (const s of SLOTS) {
    const veg = VEG[s.key][vegIndex(s.key, d0)];
    let nonveg = null;
    if (diet === 'nonveg' && NONVEG_WEEK[d0 % 7] === s.key) {
      let seen = 0;
      for (let i = 0; i < d0; i++) if (NONVEG_WEEK[i % 7] === s.key) seen++;
      const list = NONVEG[s.key];
      nonveg = list[seen % list.length];
    }
    out[s.key] = { slot: s.key, veg, nonveg };
  }
  return out;
}

/** The meal to show for a slot. `swapped` = she chose the veg option for today. */
export function chosenMeal(planSlot, swapped) {
  if (planSlot.nonveg && !swapped) return { ...planSlot.nonveg, nonveg: true };
  return { ...planSlot.veg, nonveg: false };
}

/* ------------------------------------------------------------------ */
/* Dates (local time, ISO yyyy-mm-dd strings)                          */
/* ------------------------------------------------------------------ */

export function iso(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function parseISO(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}
export function isISO(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parseISO(s).getTime());
}
export function addDays(s, n) {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}
export function diffDays(a, b) {
  return Math.round((parseISO(b) - parseISO(a)) / 86400000);
}
/** Journey day number for a date. Day 1 is the start date. 0 or less = before the start. */
export function journeyDay(startISO, dateISO) {
  return diffDays(startISO, dateISO) + 1;
}
export function toMinutes(hhmm) {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}
export function fmtTime(hhmm) {
  const t = toMinutes(hhmm);
  const h = Math.floor(t / 60), m = t % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
}
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function fmtDate(s, withYear = false) {
  const d = parseISO(s);
  return `${WD[d.getDay()]} ${d.getDate()} ${MO[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
}
export function weekday(s) { return WD[parseISO(s).getDay()]; }

/* ------------------------------------------------------------------ */
/* Adherence (how well the plan was followed — not medical recovery)   */
/* ------------------------------------------------------------------ */

export function mealStats(day) {
  const m = (day && day.meals) || {};
  let score = 0, logged = 0, eaten = 0, partial = 0, skipped = 0;
  for (const s of SLOTS) {
    const st = m[s.key];
    if (!STATUS[st]) continue;
    logged++;
    score += STATUS[st].score;
    if (st === 'eaten') eaten++; else if (st === 'partial') partial++; else skipped++;
  }
  return { score, logged, eaten, partial, skipped, total: SLOTS.length, pct: Math.round((score / SLOTS.length) * 100) };
}

export function waterStats(day, goal = DEFAULTS.waterGoal, glassMl = DEFAULTS.glassMl) {
  const n = Math.max(0, Number(day && day.water) || 0);
  const g = Math.max(1, Number(goal) || DEFAULTS.waterGoal);
  return { glasses: n, goal: g, litres: Math.round((n * glassMl) / 10) / 100, pct: Math.min(100, Math.round((n / g) * 100)) };
}

export function moveStats(day, goal = DEFAULTS.moveGoal) {
  const walk = Math.max(0, Number(day && day.walkMin) || 0);
  const ex = ((day && day.exercise) || []).reduce((a, e) => a + (Math.max(0, Number(e && e.m)) || 0), 0);
  const g = Math.max(1, Number(goal) || DEFAULTS.moveGoal);
  const total = walk + ex;
  return { walk, exercise: ex, total, goal: g, steps: Math.max(0, Number(day && day.steps) || 0), pct: Math.min(100, Math.round((total / g) * 100)) };
}

/**
 * Seven days ending at endISO.
 * Days before the start date are marked inPlan: false.
 * The average uses finished days only: past days, plus today when all five meals are logged.
 */
export function weekSummary(days, endISO, startISO, cfg = {}) {
  const rows = [];
  let sumMeals = 0, sumWater = 0, sumMove = 0, counted = 0;
  for (let i = 6; i >= 0; i--) {
    const date = addDays(endISO, -i);
    const inPlan = !startISO || diffDays(startISO, date) >= 0;
    const day = days[date];
    const meals = mealStats(day);
    const water = waterStats(day, cfg.waterGoal);
    const move = moveStats(day, cfg.moveGoal);
    const isEnd = i === 0;
    const finished = inPlan && (!isEnd || meals.logged === meals.total);
    if (finished) { sumMeals += meals.pct; sumWater += water.pct; sumMove += move.pct; counted++; }
    rows.push({ date, inPlan, isEnd, finished, meals, water, move, hasLog: !!day });
  }
  return {
    rows,
    counted,
    avgMeals: counted ? Math.round(sumMeals / counted) : null,
    avgWater: counted ? Math.round(sumWater / counted) : null,
    avgMove: counted ? Math.round(sumMove / counted) : null,
  };
}

/** Days in a row with meal adherence of 80% or more. Today counts only if it already reaches 80%. */
export function streak(days, todayISO, startISO) {
  let n = 0;
  let d = todayISO;
  if (mealStats(days[d]).pct < 80) d = addDays(d, -1);
  while ((!startISO || diffDays(startISO, d) >= 0) && mealStats(days[d]).pct >= 80) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

/** Average meal adherence over finished days since the start. */
export function sinceStart(days, startISO, todayISO) {
  if (!startISO) return { avg: null, counted: 0 };
  let sum = 0, counted = 0;
  const last = diffDays(startISO, todayISO);
  for (let i = 0; i <= last; i++) {
    const date = addDays(startISO, i);
    const m = mealStats(days[date]);
    if (date === todayISO && m.logged < m.total) continue;
    sum += m.pct; counted++;
  }
  return { avg: counted ? Math.round(sum / counted) : null, counted };
}

/** For each symptom: the level on each of the last n days (null = not recorded). */
export function symptomSummary(days, endISO, n = 7) {
  return SYMPTOMS.map((s) => {
    const levels = [];
    let daysWith = 0;
    for (let i = n - 1; i >= 0; i--) {
      const day = days[addDays(endISO, -i)];
      const v = day && day.symptoms ? day.symptoms[s.key] : undefined;
      const lv = Number.isInteger(v) && v >= 0 && v <= 3 ? v : null;
      if (lv > 0) daysWith++;
      levels.push(lv);
    }
    return { key: s.key, label: s.label, levels, daysWith };
  });
}

/** What the Today screen should nudge: the first meal whose time has passed and is not logged, else the next one. */
export function nextUp(times, day, nowMin) {
  const m = (day && day.meals) || {};
  const t = { ...DEFAULTS.times, ...(times || {}) };
  for (const s of SLOTS) {
    if (!m[s.key] && toMinutes(t[s.key]) <= nowMin) return { type: 'due', slot: s.key, at: t[s.key] };
  }
  for (const s of SLOTS) {
    if (!m[s.key] && toMinutes(t[s.key]) > nowMin) return { type: 'next', slot: s.key, at: t[s.key], inMin: toMinutes(t[s.key]) - nowMin };
  }
  return { type: 'done' };
}

/* ------------------------------------------------------------------ */
/* Lab values: typo checks only. The app never judges a result.        */
/* ------------------------------------------------------------------ */

export function parseLab(input) {
  const errors = [];
  const out = { date: input.date, lab: String(input.lab || '').trim().slice(0, 80), note: String(input.note || '').trim().slice(0, 300) };
  if (!isISO(input.date)) errors.push('Choose the date of the test.');
  const hbRaw = String(input.hb ?? '').trim();
  const ferRaw = String(input.ferritin ?? '').trim();
  out.hb = hbRaw === '' ? null : Number(hbRaw);
  out.ferritin = ferRaw === '' ? null : Number(ferRaw);
  if (out.hb === null && out.ferritin === null) errors.push('Enter Hb or ferritin (or both).');
  if (out.hb !== null && !(out.hb >= 1 && out.hb <= 25)) errors.push('Hb should be a number between 1 and 25 g/dL. Please check the report.');
  if (out.ferritin !== null && !(out.ferritin >= 0 && out.ferritin <= 5000)) errors.push('Ferritin should be a number between 0 and 5000 ng/mL. Please check the report.');
  return { ok: errors.length === 0, errors, value: out };
}

/* ------------------------------------------------------------------ */
/* Calendar file (.ics) with daily alarms, for iPhone Calendar         */
/* ------------------------------------------------------------------ */

function icsEscape(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
function icsLocal(dateISO, hhmm) {
  return dateISO.replace(/-/g, '') + 'T' + String(hhmm).replace(':', '').padEnd(4, '0') + '00';
}

export function buildICS({ startISO, times, waterTimes, appts = [], now = new Date() } = {}) {
  const t = { ...DEFAULTS.times, ...(times || {}) };
  const w = waterTimes && waterTimes.length ? waterTimes : DEFAULTS.waterTimes;
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IronMate//Reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:IronMate'];
  const ev = (uid, dt, summary, desc, rrule) => {
    L.push('BEGIN:VEVENT', `UID:${uid}@ironmate`, `DTSTAMP:${stamp}`, `DTSTART:${dt}`, 'DURATION:PT10M', `SUMMARY:${icsEscape(summary)}`, `DESCRIPTION:${icsEscape(desc)}`);
    if (rrule) L.push(`RRULE:${rrule}`);
    L.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEscape(summary)}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
  };
  for (const s of SLOTS) {
    ev(`meal-${s.key}`, icsLocal(startISO, t[s.key]), `${s.short} time`, 'Open IronMate to see the meal and log it. Add the vitamin C pairing.', 'FREQ=DAILY');
  }
  w.forEach((time, i) => ev(`water-${i + 1}`, icsLocal(startISO, time), 'Drink a glass of water', 'Log it in IronMate.', 'FREQ=DAILY'));
  for (const a of appts) {
    if (!isISO(a.date)) continue;
    const title = a.title || (a.kind === 'blood_test' ? 'Follow-up blood test' : 'Doctor appointment');
    ev(`appt-${a.id || a.date}`, icsLocal(a.date, a.time || '09:00'), title, a.place ? `Place: ${a.place}` : 'Added from IronMate.', null);
  }
  L.push('END:VCALENDAR');
  return L.join('\r\n') + '\r\n';
}

/* ------------------------------------------------------------------ */
/* Config helper                                                       */
/* ------------------------------------------------------------------ */

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export function withDefaults(config) {
  const c = config || {};
  const times = { ...DEFAULTS.times };
  for (const s of SLOTS) if (c.times && HHMM.test(c.times[s.key])) times[s.key] = c.times[s.key];
  const water = Array.isArray(c.waterTimes) ? c.waterTimes.filter((t) => HHMM.test(t)).slice(0, 12) : [];
  const num = (v, lo, hi, d) => (Number(v) >= lo && Number(v) <= hi ? Number(v) : d);
  return {
    ...c,
    startDate: isISO(c.startDate) ? c.startDate : iso(new Date()),
    diet: c.diet === 'nonveg' ? 'nonveg' : 'veg',
    waterGoal: num(c.waterGoal, 1, 30, DEFAULTS.waterGoal),
    moveGoal: num(c.moveGoal, 1, 600, DEFAULTS.moveGoal),
    times,
    waterTimes: water.length ? water : DEFAULTS.waterTimes,
    trackerName: typeof c.trackerName === 'string' ? c.trackerName.slice(0, 40) : '',
    baseline: c.baseline && typeof c.baseline === 'object' ? c.baseline : {},
  };
}

/** Keep only known, well-formed fields of a day log. Data from the server is never trusted as-is. */
export function cleanDay(doc) {
  const d = doc && typeof doc === 'object' ? doc : {};
  const out = {};
  const int = (v, hi) => Math.max(0, Math.min(hi, Math.round(Number(v) || 0)));
  if (d.meals && typeof d.meals === 'object') {
    out.meals = {};
    for (const s of SLOTS) if (STATUS[d.meals[s.key]]) out.meals[s.key] = d.meals[s.key];
  }
  if (d.swaps && typeof d.swaps === 'object') {
    out.swaps = {};
    for (const s of SLOTS) if (d.swaps[s.key] === true) out.swaps[s.key] = true;
  }
  if (d.water != null) out.water = int(d.water, 30);
  if (d.walkMin != null) out.walkMin = int(d.walkMin, 600);
  if (d.steps != null) out.steps = int(d.steps, 100000);
  if (Array.isArray(d.exercise)) {
    out.exercise = d.exercise.slice(0, 12).filter((e) => e && typeof e === 'object').map((e) => ({ t: EXERCISES.includes(e.t) ? e.t : 'Other', m: int(e.m, 300) }));
  }
  if (d.symptoms && typeof d.symptoms === 'object') {
    out.symptoms = {};
    for (const s of SYMPTOMS) { const v = d.symptoms[s.key]; if (Number.isInteger(v) && v >= 0 && v <= 3) out.symptoms[s.key] = v; }
  }
  if (d.period === true) out.period = true;
  if (typeof d.note === 'string' && d.note) out.note = d.note.slice(0, 400);
  return out;
}
