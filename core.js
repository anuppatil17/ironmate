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

/* ------------------------------------------------------------------ */
/* Nutrition estimates                                                 */
/*                                                                     */
/* FOODS: per 100 g of the raw, edible food.                           */
/*   fe = iron (mg), c = vitamin C (mg), p = protein (g), k = kcal     */
/* Values are from the Indian Food Composition Tables 2017 (ICMR-NIN)  */
/* where the food is listed there, and from USDA FoodData Central for  */
/* a few others (kiwi, pumpkin and sunflower seeds, dried figs and     */
/* apricots, soya chunks). Animal foods are typical lean-cut values.   */
/* They are estimates: real food changes with variety, recipe and      */
/* portion size.                                                       */
/* ------------------------------------------------------------------ */

export const FOODS = {
  // cereals and millets
  ragi: { fe: 4.62, c: 0, p: 7.2, k: 321 }, bajra: { fe: 6.42, c: 0, p: 11.0, k: 348 }, jowar: { fe: 3.95, c: 0, p: 10.0, k: 334 },
  rice: { fe: 0.65, c: 0, p: 7.9, k: 356 }, poha: { fe: 4.46, c: 0, p: 7.4, k: 353 }, atta: { fe: 4.1, c: 0, p: 10.6, k: 320 },
  dalia: { fe: 3.97, c: 0, p: 10.6, k: 322 }, rajgira: { fe: 8.02, c: 0, p: 13.3, k: 356 }, bread: { fe: 2.5, c: 0, p: 9.0, k: 250 },
  // pulses
  urad: { fe: 4.67, c: 0, p: 23.1, k: 325 }, moong_dal: { fe: 3.9, c: 0, p: 23.9, k: 326 }, moong_whole: { fe: 4.9, c: 0, p: 22.5, k: 294 },
  toor: { fe: 3.9, c: 0, p: 21.7, k: 331 }, masoor: { fe: 7.06, c: 0, p: 24.4, k: 322 }, chana_dal: { fe: 6.08, c: 0, p: 21.6, k: 329 },
  kala_chana: { fe: 6.78, c: 0, p: 18.8, k: 287 }, kabuli: { fe: 6.78, c: 0, p: 18.8, k: 287 }, rajma: { fe: 6.13, c: 0, p: 19.9, k: 299 },
  lobia: { fe: 5.0, c: 0, p: 21.2, k: 320 }, matki: { fe: 7.9, c: 0, p: 19.8, k: 291 }, soya_chunks: { fe: 9.0, c: 0, p: 52, k: 345 },
  besan: { fe: 5.3, c: 0, p: 21.6, k: 330 }, roasted_chana: { fe: 6.8, c: 0, p: 21, k: 355 }, peas: { fe: 1.5, c: 37, p: 7.2, k: 81 },
  // nuts, seeds, dried fruit, sweeteners, fat
  peanut: { fe: 3.4, c: 0, p: 23.7, k: 520 }, sesame: { fe: 15.04, c: 0, p: 21.7, k: 507 }, pumpkin_seed: { fe: 8.8, c: 0, p: 30, k: 559 },
  sunflower_seed: { fe: 5.2, c: 0, p: 20.8, k: 584 }, almond: { fe: 4.59, c: 0, p: 18.4, k: 609 }, walnut: { fe: 2.9, c: 0, p: 14.9, k: 671 },
  dates: { fe: 4.79, c: 0, p: 2.5, k: 320 }, raisin_black: { fe: 6.81, c: 0, p: 2.6, k: 300 }, fig_dried: { fe: 2.0, c: 0, p: 3.3, k: 249 },
  apricot_dried: { fe: 2.7, c: 0, p: 3.4, k: 241 }, jaggery: { fe: 4.63, c: 0, p: 1.9, k: 354 }, sugar: { fe: 0, c: 0, p: 0, k: 400 }, oil: { fe: 0, c: 0, p: 0, k: 900 },
  // vegetables
  spinach: { fe: 2.95, c: 30, p: 2.1, k: 24 }, methi: { fe: 5.69, c: 58, p: 3.7, k: 34 }, amaranth_leaves: { fe: 4.6, c: 84, p: 3.3, k: 30 },
  drumstick: { fe: 0.73, c: 72, p: 2.6, k: 30 }, beetroot: { fe: 0.76, c: 5, p: 1.9, k: 35 }, tomato: { fe: 0.22, c: 25, p: 0.9, k: 20 },
  capsicum: { fe: 0.4, c: 123, p: 1.1, k: 16 }, cabbage: { fe: 0.3, c: 33, p: 1.4, k: 22 }, onion: { fe: 0.5, c: 6, p: 1.5, k: 48 },
  carrot: { fe: 0.6, c: 6, p: 1.0, k: 33 }, cucumber: { fe: 0.4, c: 6, p: 0.8, k: 20 }, lauki: { fe: 0.3, c: 4, p: 0.5, k: 11 },
  bhindi: { fe: 0.84, c: 22, p: 2.1, k: 28 }, beans: { fe: 1.0, c: 11, p: 2.5, k: 26 }, mixed_veg: { fe: 0.6, c: 15, p: 1.5, k: 30 },
  green_chutney: { fe: 3.0, c: 20, p: 3.0, k: 45 }, lemon: { fe: 0.1, c: 48, p: 0.4, k: 25 },
  // fruit
  guava: { fe: 0.3, c: 214, p: 1.4, k: 44 }, amla: { fe: 1.0, c: 252, p: 0.4, k: 25 }, orange: { fe: 0.2, c: 43, p: 0.7, k: 37 },
  mosambi: { fe: 0.2, c: 47, p: 0.7, k: 30 }, papaya: { fe: 0.2, c: 43, p: 0.4, k: 24 }, kiwi: { fe: 0.3, c: 90, p: 1.1, k: 61 },
  pineapple: { fe: 0.3, c: 36, p: 0.5, k: 43 }, pomegranate: { fe: 0.3, c: 12, p: 1.3, k: 55 },
  // animal foods
  egg: { fe: 1.8, c: 0, p: 13.3, k: 135 }, chicken: { fe: 0.9, c: 0, p: 21.8, k: 150 }, fish: { fe: 1.0, c: 0, p: 19.7, k: 100 }, mutton: { fe: 2.5, c: 0, p: 21.0, k: 125 },
};

/** Daily need used for the percentages: ICMR-NIN 2020 values for an adult woman who is not pregnant. */
export const DAILY_NEED = { fe: 29, c: 65, p: 46 };
export const DAILY_NEED_NOTE = 'Daily need used here: iron 29 mg, vitamin C 65 mg, protein 46 g (ICMR-NIN 2020, adult woman). Your own need may differ.';

// One recipe per meal, in the same order as the meal lists above.
// "food:grams" is the raw weight in one serving. A star means the food is cooked,
// so only half of its vitamin C is counted. The vitamin C pairing is part of the recipe.
const RECIPES = {
  breakfast: {
    veg: [
      'ragi:50 urad:15 oil:5 peanut:15 sesame:8 orange:130',
      'poha:60 peanut:10 peas:20* onion:20* oil:5 lemon:10 guava:100',
      'moong_dal:60 methi:20* oil:5 green_chutney:30 lemon:5 papaya:70',
      'bajra:40 atta:20 methi:20* oil:6 tomato:40* lemon:25 sugar:10',
      'moong_whole:40 kala_chana:25 onion:20 tomato:40 lemon:10 orange:130',
      'rajgira:45 dates:16 sesame:5 mosambi:150',
      'dalia:55 peanut:10 peas:20* mixed_veg:40* oil:5 kiwi:70',
      'besan:60 spinach:40* tomato:30* oil:5 green_chutney:30 amla:30',
      'rice:50 urad:20 toor:20 drumstick:30* mixed_veg:30* oil:3 tomato:40* guava:100',
      'atta:60 spinach:50* oil:6 tomato:40* lemon:25 sugar:10',
    ],
    nonveg: [
      'egg:100 tomato:40* capsicum:30* onion:20* atta:50 oil:6 orange:130',
      'egg:100 spinach:40* bread:60 oil:5 tomato:60 lemon:5 guava:100',
      'egg:100 poha:40 peanut:8 oil:4 lemon:10 papaya:70',
    ],
  },
  mid: {
    veg: [
      'guava:100 pumpkin_seed:10',
      'amla:30 dates:16',
      'orange:130 roasted_chana:20',
      'pomegranate:150 almond:6 lemon:5',
      'lemon:25 sugar:10 sesame:10 jaggery:10',
      'kiwi:70 raisin_black:12',
      'papaya:140 sunflower_seed:9',
      'beetroot:80 carrot:80 amla:20',
      'mosambi:150 peanut:11 jaggery:9',
      'pineapple:150 roasted_chana:20',
    ],
    nonveg: [],
  },
  lunch: {
    veg: [
      'toor:30 spinach:50* oil:5 bajra:70 rice:25 beetroot:60 carrot:40 lemon:8',
      'rajma:40 tomato:40* onion:20* oil:6 rice:50 cucumber:50 tomato:40 onion:20 lemon:8 capsicum:60*',
      'kabuli:40 tomato:40* onion:20* oil:6 atta:60 onion:30 tomato:50 lemon:10',
      'lobia:40 tomato:30* oil:5 jowar:70 cabbage:40* capsicum:30* oil:3 lemon:8 tomato:50',
      'moong_dal:30 methi:30* oil:5 atta:60 lauki:80* oil:3 tomato:50 cucumber:50 lemon:8',
      'toor:30 drumstick:40* mixed_veg:50* oil:5 rice:50 beans:70* oil:3 tomato:80 lemon:8',
      'soya_chunks:25 tomato:40* capsicum:30* onion:20* oil:6 atta:60 cucumber:50 tomato:50 lemon:8',
      'kala_chana:40 tomato:30* oil:5 bajra:70 amaranth_leaves:70* oil:3 lemon:8',
      'masoor:30 tomato:20* oil:5 lemon:8 rice:50 bhindi:70* oil:3 tomato:60 cucumber:40',
      'matki:40 onion:20* tomato:20* oil:5 jowar:70 tomato:50 onion:30 lemon:10',
    ],
    nonveg: [
      'chicken:100 tomato:40* onion:30* oil:8 atta:60 cucumber:50 tomato:40 onion:20 lemon:8',
      'fish:100 tomato:50* oil:8 rice:50 spinach:70* oil:3 lemon:8',
      'egg:100 tomato:40* onion:30* oil:7 atta:60 cucumber:50 tomato:40 lemon:8',
      'mutton:80 tomato:30* onion:30* oil:6 bajra:70 onion:30 tomato:50 lemon:10',
      'mutton:80 peas:40* tomato:30* oil:6 atta:60 cucumber:50 tomato:40 lemon:10',
      'chicken:100 spinach:80* oil:7 rice:50 tomato:50 cucumber:50 lemon:8',
    ],
  },
  snack: {
    veg: [
      'roasted_chana:20 peanut:10 jaggery:8 lemon:25 sugar:10',
      'moong_whole:30 tomato:40 onion:20 lemon:10',
      'sesame:13 jaggery:12 orange:130',
      'dates:24 walnut:8 guava:100',
      'beetroot:80* besan:15 oil:5 green_chutney:30 lemon:5 tomato:50',
      'peanut:20 roasted_chana:20 onion:20 tomato:40 lemon:10',
      'ragi:15 jaggery:9 oil:5 lemon:25 sugar:10',
      'kala_chana:35 tomato:40 onion:15 lemon:10',
      'tomato:120* beetroot:50* oil:2 roasted_chana:20 lemon:5',
      'raisin_black:8 fig_dried:16 apricot_dried:14 mosambi:150',
    ],
    nonveg: [
      'egg:50 tomato:60 lemon:5',
      'chicken:40 mixed_veg:20* lemon:5',
    ],
  },
  dinner: {
    veg: [
      'rice:40 moong_dal:30 spinach:50* oil:5 tomato:60 lemon:8',
      'atta:50 besan:10 methi:20* oil:6 chana_dal:25 lauki:80* oil:4 lemon:8 tomato:50',
      'bajra:40 moong_dal:25 mixed_veg:50* oil:5 cucumber:50 tomato:50 onion:20 lemon:8',
      'kabuli:35 spinach:80* oil:6 jowar:70 tomato:40 cucumber:40 lemon:8',
      'moong_dal:8 toor:8 chana_dal:8 masoor:8 urad:6 oil:5 lemon:5 atta:60 capsicum:40* tomato:40* oil:3',
      'ragi:70 moong_dal:30 oil:5 tomato:50 cucumber:50 lemon:8',
      'toor:35 atta:40 peanut:5 oil:6 lemon:8 tomato:60',
      'tomato:80* toor:10 rice:50 lobia:25 beetroot:60* oil:5 lemon:8',
      'masoor:35 tomato:30* oil:4 lemon:8 atta:40 bajra:20 beans:40* capsicum:30* oil:3',
      'rice:55 soya_chunks:20 peas:30* oil:6 tomato:50 onion:30 lemon:8',
    ],
    nonveg: [
      'fish:100 oil:6 lemon:8 atta:30 mixed_veg:100* oil:3',
      'chicken:100 mixed_veg:80* tomato:30* oil:5 lemon:5 atta:60',
      'egg:100 tomato:30* onion:20* oil:6 atta:60 tomato:50 cucumber:50 lemon:8',
      'chicken:100 tomato:40* onion:30* oil:8 rice:50 cucumber:50 tomato:40 lemon:8',
    ],
  },
};

// Give every meal a stable id (for example "lunch-v3" or "dinner-n1"), its slot and its recipe.
// Do not reorder the meal lists: saved choices point to these ids.
const MEALS = {};
for (const s of SLOTS) {
  VEG[s.key].forEach((m, i) => { m.id = `${s.key}-v${i + 1}`; m.slot = s.key; m.nonveg = false; m.r = RECIPES[s.key].veg[i]; MEALS[m.id] = m; });
  (NONVEG[s.key] || []).forEach((m, i) => { m.id = `${s.key}-n${i + 1}`; m.slot = s.key; m.nonveg = true; m.r = RECIPES[s.key].nonveg[i]; MEALS[m.id] = m; });
}

export function mealById(id) { return MEALS[id] || null; }

/** Every meal a person may pick for a slot. Non-veg meals are offered only on the veg + non-veg plan. */
export function optionsFor(slot, diet = 'veg') {
  const veg = VEG[slot] || [];
  return diet === 'nonveg' ? veg.concat(NONVEG[slot] || []) : veg.slice();
}

export function parseRecipe(r) {
  return String(r || '').split(/\s+/).filter(Boolean).map((part) => {
    const cooked = part.endsWith('*');
    const [food, grams] = (cooked ? part.slice(0, -1) : part).split(':');
    return { food, grams: Number(grams), cooked };
  });
}

const nutritionCache = new Map();
/** Estimated nutrients in one serving of a meal: iron (mg), vitamin C (mg), protein (g), energy (kcal). */
export function nutrition(meal) {
  const id = meal && meal.id;
  if (id && nutritionCache.has(id)) return nutritionCache.get(id);
  const t = { fe: 0, c: 0, p: 0, kcal: 0 };
  for (const { food, grams, cooked } of parseRecipe(meal && meal.r)) {
    const f = FOODS[food];
    if (!f || !(grams > 0)) continue;
    const x = grams / 100;
    t.fe += f.fe * x;
    t.c += f.c * x * (cooked ? 0.5 : 1);
    t.p += f.p * x;
    t.kcal += f.k * x;
  }
  const out = { fe: Math.round(t.fe * 10) / 10, c: Math.round(t.c), p: Math.round(t.p), kcal: Math.round(t.kcal / 10) * 10 };
  if (id) nutritionCache.set(id, out);
  return out;
}

/** Share of the daily need, in percent. Can be above 100. */
export function needPct(n) {
  return { fe: Math.round((n.fe / DAILY_NEED.fe) * 100), c: Math.round((n.c / DAILY_NEED.c) * 100), p: Math.round((n.p / DAILY_NEED.p) * 100) };
}

/** The meal for one slot on one day: her own pick if she made one, else the plan. */
export function dayMeal(day, journeyDayNum, diet, slot) {
  const pick = day && day.picks ? mealById(day.picks[slot]) : null;
  if (pick && pick.slot === slot && (diet === 'nonveg' || !pick.nonveg)) return { ...pick, picked: true };
  const p = planDay(journeyDayNum, diet)[slot];
  return { ...chosenMeal(p, !!(day && day.swaps && day.swaps[slot])), picked: false };
}

/**
 * Nutrient totals for a day.
 *   planned: if all five meals are eaten in full
 *   eaten:   from the log (eaten = full serving, partly eaten = half, skipped or not logged = none)
 */
export function dayNutrition(day, journeyDayNum, diet) {
  const zero = () => ({ fe: 0, c: 0, p: 0, kcal: 0 });
  const planned = zero(), eaten = zero();
  for (const s of SLOTS) {
    const n = nutrition(dayMeal(day, journeyDayNum, diet, s.key));
    const st = day && day.meals ? day.meals[s.key] : undefined;
    const w = STATUS[st] ? STATUS[st].score : 0;
    for (const k of ['fe', 'c', 'p', 'kcal']) { planned[k] += n[k]; eaten[k] += n[k] * w; }
  }
  const tidy = (t) => ({ fe: Math.round(t.fe * 10) / 10, c: Math.round(t.c), p: Math.round(t.p), kcal: Math.round(t.kcal / 10) * 10 });
  return { planned: tidy(planned), eaten: tidy(eaten) };
}

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
  if (d.picks && typeof d.picks === 'object') {
    out.picks = {};
    for (const s of SLOTS) { const m = mealById(d.picks[s.key]); if (m && m.slot === s.key) out.picks[s.key] = m.id; }
    if (!Object.keys(out.picks).length) delete out.picks;
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
