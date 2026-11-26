import test from 'node:test';
import assert from 'node:assert/strict';
import * as C from '../core.js';

test('every meal has an id, a slot and a recipe made of known foods', () => {
  const ids = new Set();
  for (const s of C.SLOTS) {
    for (const m of C.optionsFor(s.key, 'nonveg')) {
      assert.ok(m.id.startsWith(s.key + '-'), m.id);
      assert.equal(m.slot, s.key);
      assert.ok(!ids.has(m.id), 'duplicate id ' + m.id);
      ids.add(m.id);
      const parts = C.parseRecipe(m.r);
      assert.ok(parts.length >= 2, m.id);
      for (const part of parts) {
        assert.ok(C.FOODS[part.food], `${m.id}: unknown food ${part.food}`);
        assert.ok(part.grams > 0 && part.grams <= 200, `${m.id}: ${part.food} ${part.grams} g`);
      }
      assert.equal(C.mealById(m.id), m);
    }
  }
  assert.equal(ids.size, 65);
});

test('each meal time offers at least 10 options; non-veg only on the non-veg plan', () => {
  for (const s of C.SLOTS) {
    const veg = C.optionsFor(s.key, 'veg');
    assert.ok(veg.length >= 10, s.key);
    assert.ok(veg.every((m) => !m.nonveg));
    assert.ok(C.optionsFor(s.key, 'nonveg').length >= veg.length);
  }
  assert.ok(C.optionsFor('lunch', 'nonveg').some((m) => m.nonveg));
});

test('nutrition estimates add up from the food table', () => {
  // Guava 100 g + pumpkin seeds 10 g
  const n = C.nutrition(C.mealById('mid-v1'));
  assert.equal(n.fe, 1.2);   // 0.3 + 0.88
  assert.equal(n.c, 214);
  assert.equal(n.p, 4);      // 1.4 + 3.0
  assert.equal(n.kcal, 100); // 44 + 56, rounded to 10
  assert.deepEqual(C.needPct(n), { fe: 4, c: 329, p: 9 });
});

test('cooked foods count half of their vitamin C', () => {
  assert.deepEqual(C.parseRecipe('spinach:50* lemon:8'), [{ food: 'spinach', grams: 50, cooked: true }, { food: 'lemon', grams: 8, cooked: false }]);
  const raw = C.nutrition({ r: 'capsicum:100' }).c;
  const cooked = C.nutrition({ r: 'capsicum:100*' }).c;
  assert.equal(raw, 123);
  assert.equal(cooked, 62);
});

test('all estimates stay in a believable range', () => {
  for (const s of C.SLOTS) {
    for (const m of C.optionsFor(s.key, 'nonveg')) {
      const n = C.nutrition(m);
      assert.ok(n.fe >= 0.4 && n.fe <= 12, `${m.id} iron ${n.fe}`);
      assert.ok(n.kcal >= 50 && n.kcal <= 600, `${m.id} kcal ${n.kcal}`);
      assert.ok(n.p >= 1 && n.p <= 35, `${m.id} protein ${n.p}`);
      assert.ok(n.c >= 4, `${m.id} vitamin C ${n.c}`);
    }
  }
  for (let d = 1; d <= 30; d++) {
    const t = C.dayNutrition({}, d, 'veg').planned;
    assert.ok(t.fe >= 10 && t.fe <= 29, `day ${d} iron ${t.fe}`);
    assert.ok(t.kcal >= 1100 && t.kcal <= 1800, `day ${d} kcal ${t.kcal}`);
  }
});

test('her own pick replaces the planned meal, and bad picks are ignored', () => {
  const planned = C.dayMeal({}, 1, 'veg', 'lunch');
  assert.equal(planned.id, 'lunch-v1');
  assert.equal(planned.picked, false);
  const picked = C.dayMeal({ picks: { lunch: 'lunch-v8' } }, 1, 'veg', 'lunch');
  assert.equal(picked.id, 'lunch-v8');
  assert.equal(picked.picked, true);
  assert.equal(C.dayMeal({ picks: { lunch: 'dinner-v2' } }, 1, 'veg', 'lunch').id, 'lunch-v1'); // wrong slot
  assert.equal(C.dayMeal({ picks: { lunch: 'lunch-n4' } }, 1, 'veg', 'lunch').id, 'lunch-v1');  // non-veg on the veg plan
  assert.equal(C.dayMeal({ picks: { lunch: 'lunch-n4' } }, 1, 'nonveg', 'lunch').id, 'lunch-n4');
  assert.deepEqual(C.cleanDay({ picks: { lunch: 'lunch-v8', dinner: 'lunch-v2', snack: '<x>' } }).picks, { lunch: 'lunch-v8' });
  assert.equal(C.cleanDay({ picks: { lunch: 'nope' } }).picks, undefined);
});

test('day totals: eaten is full, partly eaten is half, skipped is none', () => {
  const full = C.dayNutrition({ meals: { breakfast: 'eaten', mid: 'eaten', lunch: 'eaten', snack: 'eaten', dinner: 'eaten' } }, 1, 'veg');
  assert.deepEqual(full.eaten, full.planned);
  const none = C.dayNutrition({ meals: { breakfast: 'skipped' } }, 1, 'veg');
  assert.deepEqual(none.eaten, { fe: 0, c: 0, p: 0, kcal: 0 });
  const half = C.dayNutrition({ meals: { mid: 'partial' } }, 1, 'veg').eaten; // mid-v1: 1.2 mg, 214 mg
  assert.equal(half.fe, 0.6);
  assert.equal(half.c, 107);
  const withPick = C.dayNutrition({ picks: { lunch: 'lunch-v8' } }, 1, 'veg').planned.fe;
  assert.ok(withPick > C.dayNutrition({}, 1, 'veg').planned.fe);
});
