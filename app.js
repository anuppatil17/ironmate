// IronMate — screens. Works with any store that follows the contract in README (store-*.js).
import * as C from './core.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
const ICON = {
  today: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/></svg>',
  plan: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/></svg>',
  progress: '<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-6"/></svg>',
  health: '<svg viewBox="0 0 24 24"><path d="M12 3.500s6 6.2 6 10.500a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.500z"/></svg>',
  more: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/></svg>',
};
const TABS = ['today', 'plan', 'progress', 'health', 'more'];
const ST_GLYPH = { eaten: '✓', partial: '½', skipped: '✕' };
const ST_SHORT = { eaten: 'Eaten', partial: 'Partly', skipped: 'Skipped' };
const AGE_BANDS = ['Under 20', '20–29', '30–40', '41–50', 'Over 50'];
const PERIODS = ['Regular', 'Irregular', 'Not applicable'];
const SUPPS = ['Not prescribed', 'Prescribed by my doctor', 'Not sure'];
const APPT_KIND = { doctor: 'Doctor appointment', blood_test: 'Follow-up blood test', other: 'Other' };
const QUICK_CHEERS = ['Proud of you ❤️', 'You are doing great today', 'Did you have your lunch?', 'Time for a glass of water'];

export function startApp(store, root) {
  const ui = { tab: 'today', date: C.iso(new Date()), planDay: null, authMode: 'in', busy: false, err: '', tip: {}, pushState: null };
  let pending = false;
  let sheetEl = null;
  let toastTimer = null;

  const S = () => store.state;
  const cfg = () => C.withDefaults(S().config);
  const today = () => C.iso(new Date());
  const isTracker = () => S().role === 'tracker';
  const canLog = () => isTracker() && S().canWrite !== false;
  const canWrite = () => S().canWrite !== false;
  const herName = () => (S().config && S().config.trackerName) || '';
  const her = () => herName() || 'your partner';

  /* ---------------- helpers ---------------- */
  function readHash() {
    const h = (location.hash || '').replace('#', '');
    return TABS.includes(h) ? h : 'today';
  }
  function go(tab) {
    ui.tab = tab;
    try { if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab); } catch { /* hash is a nicety */ }
    render(true);
    const sc = root.querySelector('.scroll');
    if (sc) sc.scrollTop = 0;
  }
  function toast(msg) {
    clearTimeout(toastTimer);
    document.querySelectorAll('.toast').forEach((t) => t.remove());
    const t = document.createElement('div');
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.textContent = msg;
    document.body.appendChild(t);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }
  function guard(p, okMsg) {
    return Promise.resolve(p).then((r) => { if (okMsg) toast(okMsg); return r; }, (e) => {
      toast((e && e.userMessage) || 'Could not save. Please check your connection and try again.');
      render();
      return null;
    });
  }
  function editDay(date, fn) {
    if (!canLog()) return;
    const draft = JSON.parse(JSON.stringify(S().days[date] || {}));
    fn(draft);
    guard(store.saveDay(date, draft));
  }
  function typing() {
    const a = document.activeElement;
    return !!(a && root.contains(a) && a.matches('input:not([type=checkbox]):not([type=radio]), textarea, select'));
  }

  /* ---------------- render ---------------- */
  function viewKind() {
    const s = S();
    if (s.status !== 'ready') return s.status;
    if (!s.role) return 'role';
    if (!s.config || !s.config.setupDone) return isTracker() ? 'setup' : 'waiting';
    return 'app';
  }
  let lastKind = '';
  function render(force) {
    const kind = viewKind();
    if (!force) {
      // Do not wipe a form someone is filling in when fresh data arrives.
      if (kind === lastKind && ['setup', 'signedOut', 'role'].includes(kind)) return;
      const draft = root.querySelector('#cheer-text');
      if (sheetEl || typing() || (draft && draft.value)) { pending = true; return; }
    }
    lastKind = kind;
    pending = false;
    const sc = root.querySelector('.scroll');
    const top = sc ? sc.scrollTop : 0;
    root.innerHTML = view();
    const sc2 = root.querySelector('.scroll');
    if (sc2) sc2.scrollTop = top;
  }

  function view() {
    const s = S();
    if (s.status === 'loading') return gate(`<p class="lead">Opening your journey…</p><div class="skeleton"></div><div class="skeleton"></div>`);
    if (s.status === 'error') return gate(`<p class="lead">${esc(s.message || 'Something went wrong while loading.')}</p><button class="btn primary" data-act="reload-data">Try again</button>`);
    if (s.status === 'noAccess') return gate(`<p class="lead">You can open this page, but you do not have permission to see or save the family data.</p><div class="card"><p>Ask the person who shared it to give you <b>Editor</b> access (or Contributor, if you are in the same Claude team). Then open the link again.</p></div>`);
    if (s.status === 'signedOut') return authView();
    if (!s.role) return roleView();
    if (!s.config || !s.config.setupDone) return isTracker() ? setupView() : waitingView();
    return shell();
  }

  function gate(inner) {
    return `<div class="gate"><h1>IronMate ${HEART}</h1>${inner}${S().preview ? previewNote() : ''}</div>`;
  }
  function previewNote() {
    return `<div class="banner"><span class="ico">i</span><div><b>Preview mode with sample data.</b> Nothing is saved here. Open the shared link while signed in to Claude to use your own data.</div></div>`;
  }

  /* ---------------- gates ---------------- */
  function authView() {
    const up = ui.authMode === 'up';
    return gate(`
      <p class="lead">A 30-day iron-rich food plan and daily tracker for the two of you.</p>
      <form class="card" data-form="auth" novalidate>
        <h2>${up ? 'Create your account' : 'Sign in'}</h2>
        <label class="field" for="au-email">Email<input id="au-email" name="email" type="email" autocomplete="email" required></label>
        <label class="field" for="au-pw">Password<span class="hint">${up ? 'At least 8 characters.' : ''}</span><input id="au-pw" name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" minlength="8" required></label>
        <p class="err" role="alert">${esc(ui.err)}</p>
        <button class="btn primary block" ${ui.busy ? 'disabled' : ''}>${ui.busy ? 'Please wait…' : up ? 'Create account' : 'Sign in'}</button>
        <button type="button" class="link" data-act="auth-mode">${up ? 'I already have an account. Sign in.' : 'New here? Create an account.'}</button>
      </form>`);
  }

  function roleView() {
    const supa = store.mode === 'supabase';
    return gate(`
      <p class="lead">Who is using this ${supa ? 'account' : 'device'}?</p>
      <button class="bigchoice" data-act="role" data-role="tracker" ${ui.busy ? 'disabled' : ''}>
        <b>I am tracking my meals and health</b>
        <span>See the daily plan, log meals, water, movement, symptoms and blood tests.</span>
      </button>
      ${supa ? `
      <form class="card" data-form="join" novalidate>
        <h2>I am the partner</h2>
        <p class="muted small">Ask your partner for the invite code. It is in her app under More.</p>
        <label class="field" for="jn-code">Invite code<input id="jn-code" name="code" autocapitalize="characters" autocomplete="off" maxlength="12" required></label>
        <label class="field" for="jn-name">Your first name <span class="hint">Optional</span><input id="jn-name" name="name" maxlength="40" autocomplete="given-name"></label>
        <p class="err" role="alert"></p>
        <button class="btn primary block" ${ui.busy ? 'disabled' : ''}>Join family space</button>
      </form>` : `
      <button class="bigchoice" data-act="role" data-role="partner" ${ui.busy ? 'disabled' : ''}>
        <b>I am the partner</b>
        <span>See shared progress, add doctor visits and send a kind note. You cannot change her log.</span>
      </button>`}
      <p class="err" role="alert">${esc(ui.err)}</p>
      ${store.auth ? `<button class="link" data-act="signout">Sign out</button>` : ''}`);
  }

  function setupView() {
    const b = (S().config && S().config.baseline) || {};
    const opt = (list, cur) => list.map((v) => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
    return gate(`
      <p class="lead">Let us set up your 30 days. This takes one minute.</p>
      <form class="card" data-form="setup" novalidate>
        <h2>Your plan</h2>
        <label class="field" for="su-name">Your first name <span class="hint">Optional. Your partner sees it.</span><input id="su-name" name="name" maxlength="40" autocomplete="given-name"></label>
        <label class="field" for="su-start">Day 1 of your plan<input id="su-start" name="start" type="date" value="${today()}" required></label>
        <label class="field" for="su-diet">Food choice
          <select id="su-diet" name="diet"><option value="veg">Vegetarian</option><option value="nonveg">Vegetarian + non-veg (egg, chicken, fish, mutton)</option></select>
        </label>
        <h2>Starting health information</h2>
        <p class="muted small">This is kept for you and your doctor. The app does not judge these numbers.</p>
        <div class="grid2">
          <label class="field" for="su-hb">Latest Hb (g/dL)<input id="su-hb" name="hb" inputmode="decimal" value="${esc(b.hb ?? '')}"></label>
          <label class="field" for="su-hbdate">Test date <span class="hint">Optional</span><input id="su-hbdate" name="hbDate" type="date" max="${today()}" value="${esc(b.hbDate ?? '')}"></label>
        </div>
        <label class="field" for="su-fer">Ferritin (ng/mL) <span class="hint">Leave empty if not tested.</span><input id="su-fer" name="ferritin" inputmode="decimal" value="${esc(b.ferritin ?? '')}"></label>
        <div class="grid2">
          <label class="field" for="su-age">Age group<select id="su-age" name="ageBand">${opt(AGE_BANDS, b.ageBand || '30–40')}</select></label>
          <label class="field" for="su-per">Periods<select id="su-per" name="periods">${opt(PERIODS, b.periods || 'Regular')}</select></label>
        </div>
        <label class="field" for="su-sup">Iron supplements<select id="su-sup" name="supplements">${opt(SUPPS, b.supplements || 'Not sure')}</select></label>
        <label class="check" for="su-ok"><input id="su-ok" name="ok" type="checkbox"><span>I understand this app gives food guidance and tracking only. It does not replace my doctor and does not suggest any medicine.</span></label>
        <p class="err" role="alert">${esc(ui.err)}</p>
        <button class="btn primary block" ${ui.busy ? 'disabled' : ''}>Start my 30 days</button>
      </form>
      ${store.resetRole ? `<button class="link" data-act="reset-role">I picked the wrong role</button>` : ''}`);
  }

  function waitingView() {
    return gate(`
      <p class="lead">Waiting for your partner to finish the first setup on her phone.</p>
      <div class="card"><p>When she starts her 30 days, her progress will show here. You do not need to do anything.</p></div>
      ${store.resetRole ? `<button class="link" data-act="reset-role">I picked the wrong role</button>` : ''}
      ${store.auth ? `<button class="link" data-act="signout">Sign out</button>` : ''}`);
  }

  /* ---------------- shell ---------------- */
  function journeyInfo(dateISO) {
    const start = cfg().startDate;
    const jd = C.journeyDay(start, dateISO);
    const round = Math.floor((Math.max(jd, 1) - 1) / C.PLAN_DAYS);
    return { start, jd, round, planDay: C.planDayNumber(jd), roundStart: C.addDays(start, round * C.PLAN_DAYS) };
  }

  function beads() {
    const t = today();
    const j = journeyInfo(t);
    let out = '';
    for (let i = 0; i < C.PLAN_DAYS; i++) {
      const date = C.addDays(j.roundStart, i);
      const diff = C.diffDays(date, t);
      const m = C.mealStats(S().days[date]);
      let cls = 'b-future', label = 'not yet';
      if (diff >= 0 && j.jd >= 1) {
        if (m.pct >= 80) cls = 'b-full'; else if (m.pct >= 40) cls = 'b-half'; else if (m.logged) cls = 'b-low'; else cls = 'b-none';
        label = m.logged ? `${m.pct}% of meals` : 'not logged';
      }
      out += `<button class="bead ${cls}${diff === 0 ? ' b-today' : ''}" data-act="bead" data-date="${date}" ${diff < 0 ? 'disabled' : ''} aria-label="Day ${i + 1}, ${C.fmtDate(date)}: ${label}"></button>`;
    }
    return `<div class="beads" role="group" aria-label="30 day journey">${out}</div>`;
  }

  function shell() {
    const t = today();
    const j = journeyInfo(t);
    const dayText = j.jd < 1 ? `Starts ${C.fmtDate(j.start)}` : `Day ${j.planDay} of ${C.PLAN_DAYS}${j.round ? ` · round ${j.round + 1}` : ''}`;
    const tabLabel = { today: isTracker() ? 'Today' : 'Family', plan: 'Plan', progress: 'Progress', health: 'Health', more: 'More' };
    const body = { today: isTracker() ? todayView : familyView, plan: planView, progress: progressView, health: healthView, more: moreView }[ui.tab]();
    return `<div class="app">
      <header class="top">
        <div class="top-row"><div class="brand">IronMate ${HEART}</div><span class="who">${isTracker() ? 'My tracker' : 'Partner view'}</span></div>
        <div class="dayline"><strong>${isTracker() ? '' : esc(herName() ? herName() + ' · ' : '')}${dayText}</strong><span>${C.fmtDate(t)}</span></div>
        ${beads()}
      </header>
      <main class="scroll" id="main">${S().preview ? previewNote() : ''}${S().stale ? `<div class="banner"><span class="ico">!</span><div>Cannot reach the server right now. What you see may be out of date.</div></div>` : ''}${!canWrite() ? `<div class="banner care"><span class="ico">!</span><div><b>View only.</b> You do not have permission to save. Ask the owner for Editor access.</div></div>` : ''}${body}</main>
      <nav class="tabs" aria-label="Sections">${TABS.map((k) => `<button class="tab" data-act="tab" data-tab="${k}" ${ui.tab === k ? 'aria-current="page"' : ''}>${ICON[k]}<span>${tabLabel[k]}</span></button>`).join('')}</nav>
    </div>`;
  }

  /* ---------------- shared bits ---------------- */
  function dateNav() {
    const t = today();
    const start = cfg().startDate;
    const label = ui.date === t ? 'Today' : ui.date === C.addDays(t, -1) ? 'Yesterday' : C.fmtDate(ui.date);
    return `<div class="datenav">
      <button class="iconbtn" data-act="date" data-d="-1" aria-label="Previous day" ${C.diffDays(start, ui.date) <= 0 ? 'disabled' : ''}>‹</button>
      <div class="row"><strong>${label}</strong>${ui.date !== t ? `<button class="btn sm" data-act="date" data-d="0">Back to today</button>` : `<span class="muted small">${C.fmtDate(t)}</span>`}</div>
      <button class="iconbtn" data-act="date" data-d="1" aria-label="Next day" ${ui.date >= t ? 'disabled' : ''}>›</button>
    </div>`;
  }

  function upcomingAppts(withinDays) {
    const t = today();
    return S().appts.filter((a) => !a.done && C.isISO(a.date) && a.date >= t && (withinDays == null || C.diffDays(t, a.date) <= withinDays))
      .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
  }
  function apptTitle(a) { return a.title || APPT_KIND[a.kind] || 'Appointment'; }
  function apptWhen(a) {
    const d = C.diffDays(today(), a.date);
    const rel = d === 0 ? 'today' : d === 1 ? 'tomorrow' : d > 1 ? `in ${d} days` : `${-d} day${d === -1 ? '' : 's'} ago`;
    return `${C.fmtDate(a.date)}${a.time ? ', ' + C.fmtTime(a.time) : ''} · ${rel}`;
  }
  function apptBanner() {
    const up = upcomingAppts(7);
    if (up.length) {
      const a = up[0];
      return `<div class="banner care"><span class="ico">+</span><div><b>${esc(apptTitle(a))}</b><br>${esc(apptWhen(a))}${a.place ? ' · ' + esc(a.place) : ''}</div></div>`;
    }
    if (!upcomingAppts().length) {
      return `<div class="banner"><span class="ico">+</span><div><b>No doctor visit or follow-up blood test is planned.</b> Ask your doctor when to test again, then add the date under Health.</div></div>`;
    }
    return '';
  }

  function latestCheer() {
    const c = S().cheers.slice().sort((a, b) => String(b.at).localeCompare(String(a.at)))[0];
    if (!c) return null;
    const ageH = (Date.now() - new Date(c.at).getTime()) / 3600000;
    return ageH <= 72 ? c : null;
  }

  function mealCard(date, slot, editable) {
    const c = cfg();
    const j = journeyInfo(date);
    const day = S().days[date] || {};
    const p = C.planDay(j.planDay, c.diet)[slot.key];
    const swapped = !!(day.swaps && day.swaps[slot.key]);
    const meal = C.chosenMeal(p, swapped);
    const st = day.meals && day.meals[slot.key];
    const seg = Object.keys(C.STATUS).map((k) => `<button data-act="meal" data-slot="${slot.key}" data-st="${k}" aria-pressed="${st === k}" ${editable ? '' : 'disabled'}><span class="g" aria-hidden="true">${ST_GLYPH[k]}</span>${ST_SHORT[k]}</button>`).join('');
    return `<article class="card meal ${st ? 'st-' + st : ''}">
      <div class="meal-head"><span class="slot">${slot.label}</span><span>${C.fmtTime(c.times[slot.key])}</span>${meal.nonveg ? '<span class="tag">Non-veg</span>' : ''}${swapped ? '<span class="tag">Veg option</span>' : ''}</div>
      <h3>${esc(meal.n)}</h3>
      <div class="kv"><span class="k" aria-hidden="true">Qty</span><div><small>How much</small>${esc(meal.q)}</div></div>
      <div class="kv vitc"><span class="k" aria-hidden="true">C</span><div><small>Vitamin C pairing</small>${esc(meal.c)}</div></div>
      <p class="fe">Iron from: ${esc(meal.fe)}</p>
      <div class="seg" role="group" aria-label="${slot.label} status">${seg}</div>
      ${p.nonveg && editable ? `<button class="link" data-act="swap" data-slot="${slot.key}">${swapped ? 'Show the non-veg meal again' : 'Use the vegetarian option today'}</button>` : ''}
    </article>`;
  }

  /* ---------------- Today (tracker) ---------------- */
  function todayView() {
    const c = cfg();
    const t = today();
    const date = ui.date;
    const j = journeyInfo(date);
    if (j.jd < 1) {
      return `<div class="card"><h2>Your plan starts ${C.fmtDate(j.start)}</h2><p class="muted">You can look at the meals under Plan and shop for what you need.</p><button class="btn" data-act="tab" data-tab="plan">See the plan</button></div>${apptBanner()}`;
    }
    const day = S().days[date] || {};
    const edit = canLog();
    let top = '';
    const cheer = latestCheer();
    if (cheer && date === t) top += `<div class="banner cheer"><span class="ico">${HEART}</span><div><b>A note from your partner</b><br>${esc(cheer.text)}</div></div>`;
    if (date === t) {
      const now = new Date();
      const nu = C.nextUp(c.times, day, now.getHours() * 60 + now.getMinutes());
      const lbl = (k) => C.SLOTS.find((s) => s.key === k).label;
      if (nu.type === 'due') top += `<div class="banner due"><span class="ico">!</span><div><b>${lbl(nu.slot)} was planned for ${C.fmtTime(nu.at)}.</b> Mark it below when you have eaten.</div></div>`;
      else if (nu.type === 'next') top += `<div class="banner"><span class="ico">›</span><div><b>Next: ${lbl(nu.slot)} at ${C.fmtTime(nu.at)}.</b> Keep tea and coffee one hour away from meals.</div></div>`;
      else top += `<div class="banner"><span class="ico">✓</span><div><b>All five meals are logged for today.</b> Well done.</div></div>`;
      top += apptBanner();
    }
    const ms = C.mealStats(day);
    const ws = C.waterStats(day, c.waterGoal);
    const mv = C.moveStats(day, c.moveGoal);
    const nGlass = Math.max(ws.goal, ws.glasses);
    let glasses = '';
    for (let i = 1; i <= nGlass; i++) glasses += `<span class="glass ${i <= ws.glasses ? 'on' : ''} ${i > ws.goal ? 'extra' : ''}"></span>`;
    const ex = (day.exercise || []).map((e, i) => `<div class="li"><div><span class="t">${esc(e.t)}</span> <span class="s num">${Number(e.m) || 0} min</span></div>${edit ? `<button class="btn sm ghost" data-act="ex-del" data-i="${i}" aria-label="Remove ${esc(e.t)}">Remove</button>` : ''}</div>`).join('');
    const sym = C.SYMPTOMS.map((s) => {
      const v = day.symptoms ? day.symptoms[s.key] : undefined;
      return `<div class="sym"><span class="sym-name">${s.label}</span><div class="levels" role="group" aria-label="${s.label}">${C.LEVELS.map((l, i) => `<button data-act="sym" data-k="${s.key}" data-v="${i}" aria-pressed="${v === i}" ${edit ? '' : 'disabled'}>${l}</button>`).join('')}</div></div>`;
    }).join('');

    return `${dateNav()}${top}
      <div class="sec-title">Meals · day ${j.planDay} · <span class="num">${ms.logged}/5</span> logged</div>
      ${C.SLOTS.map((s) => mealCard(date, s, edit)).join('')}

      <div class="sec-title">Water</div>
      <section class="card">
        <div class="card-head"><h2><span class="num">${ws.glasses}</span> of ${ws.goal} glasses</h2><span class="meta num">${ws.litres} L</span></div>
        <div class="glasses" aria-hidden="true">${glasses}</div>
        <div class="row">
          <button class="btn primary grow" data-act="water" data-d="1" ${edit ? '' : 'disabled'}>+ 1 glass</button>
          <button class="btn" data-act="water" data-d="-1" ${edit && ws.glasses > 0 ? '' : 'disabled'} aria-label="Remove one glass">− 1</button>
        </div>
        <p class="muted small">One glass is about 250 ml.</p>
      </section>

      <div class="sec-title">Walking and exercise</div>
      <section class="card">
        <div class="card-head"><h2><span class="num">${mv.total}</span> of ${mv.goal} minutes</h2><span class="meta">${mv.steps ? `<span class="num">${mv.steps.toLocaleString('en-IN')}</span> steps` : ''}</span></div>
        <div class="grid2">
          <label class="field" for="walk-min">Walking (minutes)<input id="walk-min" type="number" inputmode="numeric" min="0" max="600" data-change="walk" value="${mv.walk || ''}" placeholder="0" ${edit ? '' : 'disabled'}></label>
          <label class="field" for="steps">Steps <span class="hint">Optional</span><input id="steps" type="number" inputmode="numeric" min="0" max="100000" data-change="steps" value="${mv.steps || ''}" placeholder="0" ${edit ? '' : 'disabled'}></label>
        </div>
        <div class="row">
          <button class="btn sm" data-act="walk-add" data-d="10" ${edit ? '' : 'disabled'}>+ 10 min walk</button>
          <button class="btn sm" data-act="walk-add" data-d="15" ${edit ? '' : 'disabled'}>+ 15 min walk</button>
          <button class="btn sm" data-act="ex-add" ${edit ? '' : 'disabled'}>+ Other exercise</button>
        </div>
        ${ex ? `<div class="list">${ex}</div>` : ''}
        <p class="muted small">Keep it gentle. Stop and rest if you feel dizzy or short of breath. Ask your doctor how much exercise is right for you.</p>
      </section>

      <div class="sec-title">How do you feel?</div>
      <section class="card">
        ${sym}
        <button class="toggle" data-act="period" aria-pressed="${!!day.period}" ${edit ? '' : 'disabled'}><span><b>Period today</b><br><span class="muted small">Helps your doctor see the pattern.</span></span><span class="sw" aria-hidden="true"></span></button>
        <label class="field" for="day-note">Note for today <span class="hint">Optional. Your partner can read it.</span><textarea id="day-note" maxlength="400" data-change="note" ${edit ? '' : 'disabled'}>${esc(day.note || '')}</textarea></label>
        <p class="muted small">Get medical help quickly if you have chest pain, trouble breathing, fainting, a very fast heartbeat or very heavy bleeding.</p>
      </section>
      <p class="foot">This log shows how well the food plan was followed. It does not show medical recovery.</p>`;
  }

  /* ---------------- Family (partner) ---------------- */
  function familyView() {
    const c = cfg();
    const t = today();
    const date = ui.date;
    const j = journeyInfo(date);
    const name = herName();
    if (j.jd < 1) return `<div class="card"><h2>The plan starts ${C.fmtDate(j.start)}</h2><p class="muted">You will see ${esc(her())}'s progress here from that day.</p></div>${cheerCard()}`;
    const day = S().days[date] || {};
    const ms = C.mealStats(day);
    const ws = C.waterStats(day, c.waterGoal);
    const mv = C.moveStats(day, c.moveGoal);
    const plan = C.planDay(j.planDay, c.diet);
    const meals = C.SLOTS.map((s) => {
      const st = day.meals && day.meals[s.key];
      const meal = C.chosenMeal(plan[s.key], !!(day.swaps && day.swaps[s.key]));
      return `<div class="li"><div class="grow"><div class="t">${s.short} <span class="s num">${C.fmtTime(c.times[s.key])}</span></div><div class="s">${esc(meal.n)}</div></div><span class="pill ${st || ''}">${st ? ST_GLYPH[st] + ' ' + ST_SHORT[st] : 'Not logged'}</span></div>`;
    }).join('');
    const symptoms = C.SYMPTOMS.map((s) => {
      const v = day.symptoms ? day.symptoms[s.key] : undefined;
      return `<div class="li"><span>${s.label}</span><span class="pill">${Number.isInteger(v) ? C.LEVELS[v] : 'Not recorded'}</span></div>`;
    }).join('');
    const wk = C.weekSummary(S().days, t, c.startDate, c);
    return `${dateNav()}${date === t ? apptBanner() : ''}
      <section class="card">
        <div class="card-head"><h2>${name ? esc(name) + "'s meals" : 'Meals'}</h2><span class="meta num">${ms.logged}/5 logged</span></div>
        <div class="list">${meals}</div>
      </section>
      <div class="meters">
        ${meter('Meals followed', ms.pct + '%', ms.pct, `${ms.eaten} eaten · ${ms.partial} partly`)}
        ${meter('Water', `${ws.glasses}<small>/${ws.goal}</small>`, ws.pct, `${ws.litres} L`)}
        ${meter('Movement', `${mv.total}<small> min</small>`, mv.pct, `goal ${mv.goal} min`)}
      </div>
      <section class="card">
        <h2>How she feels</h2>
        <div class="list">${symptoms}${day.period ? `<div class="li"><span>Period</span><span class="pill">Yes</span></div>` : ''}</div>
        ${day.note ? `<div class="banner"><span class="ico">“</span><div><b>Her note</b><br>${esc(day.note)}</div></div>` : ''}
      </section>
      ${cheerCard()}
      <section class="card">
        <div class="card-head"><h2>Last 7 days</h2><span class="meta">${wk.avgMeals == null ? 'No finished days yet' : `Meals followed: <b class="num">${wk.avgMeals}%</b>`}</span></div>
        ${weekTable(wk)}
        <button class="btn" data-act="tab" data-tab="progress">Open full progress</button>
      </section>
      <p class="foot">You can read ${esc(her())}'s log. Only she can change it.</p>`;
  }

  function cheerCard() {
    if (!canWrite() || isTracker()) return '';
    const last = latestCheer();
    return `<form class="card" data-form="cheer" novalidate>
      <h2>Send a kind note</h2>
      <p class="muted small">It shows at the top of her Today screen for three days.</p>
      <div class="row">${QUICK_CHEERS.map((q) => `<button type="button" class="btn sm" data-act="cheer-quick" data-text="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      <label class="field" for="cheer-text">Your note<textarea id="cheer-text" name="text" maxlength="200" required></textarea></label>
      <button class="btn primary">Send note</button>
      ${last ? `<p class="muted small">Last note: “${esc(last.text)}”</p>` : ''}
    </form>`;
  }

  function meter(label, val, pct, sub) {
    return `<div class="meter"><span class="lbl">${label}</span><span class="val num">${val}</span><div class="bar" role="img" aria-label="${label} ${pct}%"><i style="width:${Math.max(0, Math.min(100, pct))}%"></i></div><span class="sub num">${sub}</span></div>`;
  }

  /* ---------------- Plan ---------------- */
  function planView() {
    const c = cfg();
    const t = today();
    const j = journeyInfo(t);
    const sel = ui.planDay || (j.jd >= 1 ? j.planDay : 1);
    const b = c.baseline || {};
    const plan = C.planDay(sel, c.diet);
    let grid = '';
    for (let d = 1; d <= C.PLAN_DAYS; d++) grid += `<button data-act="planday" data-d="${d}" aria-pressed="${d === sel}" class="${j.jd >= 1 && d === j.planDay ? 'is-today' : ''}" aria-label="Day ${d}${j.jd >= 1 && d === j.planDay ? ' (today)' : ''}">${d}</button>`;
    const meals = C.SLOTS.map((s) => {
      const p = plan[s.key];
      const one = (m, tag) => `<h3>${esc(m.n)}</h3>${tag ? `<div><span class="tag">${tag}</span></div>` : ''}
        <div class="kv"><span class="k" aria-hidden="true">Qty</span><div><small>How much</small>${esc(m.q)}</div></div>
        <div class="kv vitc"><span class="k" aria-hidden="true">C</span><div><small>Vitamin C pairing</small>${esc(m.c)}</div></div>
        <p class="fe">Iron from: ${esc(m.fe)}</p>`;
      return `<article class="card meal"><div class="meal-head"><span class="slot">${s.label}</span><span>${C.fmtTime(c.times[s.key])}</span></div>
        ${p.nonveg ? one(p.nonveg, 'Non-veg') + `<details><summary class="link">Vegetarian option</summary><div class="stack" style="padding-top:10px">${one(p.veg, '')}</div></details>` : one(p.veg, '')}
      </article>`;
    }).join('');
    const notes = [];
    if (b.periods === 'Irregular') notes.push('Periods are irregular. Mark period days on the Today screen so your doctor can see the pattern.');
    if (b.ferritin == null || b.ferritin === '') notes.push('Ferritin has not been tested. You can ask your doctor if this test would help.');
    if (b.supplements === 'Not prescribed') notes.push('No iron tablets are prescribed. Do not start any on your own. Only a doctor should decide this.');
    return `
      <section class="card">
        <h2>Made for ${isTracker() ? 'you' : esc(her())}</h2>
        <div class="facts">
          <div><small>Food choice</small><b>${c.diet === 'nonveg' ? 'Veg + non-veg' : 'Vegetarian'}</b></div>
          <div><small>Age group</small><b>${esc(b.ageBand || 'Not given')}</b></div>
          <div><small>Hb at start</small><b class="num">${b.hb != null && b.hb !== '' ? esc(b.hb) + ' g/dL' : 'Not given'}</b></div>
          <div><small>Iron supplements</small><b>${esc(b.supplements || 'Not given')}</b></div>
        </div>
        ${canLog() ? `<div class="choice" role="group" aria-label="Food choice"><button data-act="diet" data-v="veg" aria-pressed="${c.diet === 'veg'}">Vegetarian</button><button data-act="diet" data-v="nonveg" aria-pressed="${c.diet === 'nonveg'}">Veg + non-veg</button></div>` : ''}
        ${notes.length ? `<ul class="stack small muted" style="margin:0;padding-left:18px">${notes.map((n) => `<li>${n}</li>`).join('')}</ul>` : ''}
        <p class="muted small">Five iron-rich meals a day for 30 days, each with a vitamin C food. ${c.diet === 'nonveg' ? 'One meal a day is non-veg, and one day a week is fully vegetarian. ' : ''}After day 30 the plan starts again from day 1.</p>
      </section>
      <div class="sec-title">Pick a day</div>
      <div class="daygrid">${grid}</div>
      <div class="sec-title">Day ${sel}${j.jd >= 1 ? ' · ' + C.fmtDate(C.addDays(j.roundStart, sel - 1)) : ''}</div>
      ${meals}
      <div class="sec-title">Six daily rules</div>
      <section class="card"><ol class="rules">${C.RULES.map((r) => `<li><div><b>${r.t}</b><span>${r.d}</span></div></li>`).join('')}</ol></section>
      <p class="foot">1 katori is a small bowl, about 150 ml. This is a general food plan. It is not medical treatment. If you have another health condition or a food allergy, check the plan with your doctor or dietitian.</p>`;
  }

  /* ---------------- Progress ---------------- */
  function weekChart(wk) {
    const W = 328, H = 150, L = 30, B = 22, T = 8;
    const ph = H - B - T, slot = (W - L) / 7, bw = 20;
    const y = (v) => T + ph - (v / 100) * ph;
    let g = '';
    for (const v of [0, 50, 100]) g += `<line class="grid" x1="${L}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}%</text>`;
    wk.rows.forEach((r, i) => {
      const cx = L + slot * i + slot / 2;
      const v = r.meals.pct;
      g += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${C.weekday(r.date)}</text>`;
      if (r.inPlan && v > 0) {
        const h = Math.max(4, (v / 100) * ph);
        const rr = Math.min(4, h / 2);
        const x = cx - bw / 2, y0 = T + ph - h;
        g += `<path class="bar ${r.finished ? '' : 'sofar'}" d="M${x},${T + ph}V${y0 + rr}a${rr},${rr} 0 0 1 ${rr},-${rr}h${bw - 2 * rr}a${rr},${rr} 0 0 1 ${rr},${rr}V${T + ph}z"/>`;
      }
      const tip = !r.inPlan ? `${C.fmtDate(r.date)}: before the plan started` : `${C.fmtDate(r.date)}: ${r.meals.logged ? `${v}% of meals followed${r.finished ? '' : ' so far'}` : 'not logged'}`;
      g += `<rect class="hit" data-act="tip" data-k="week" data-tip="${esc(tip)}" x="${L + slot * i}" y="${T}" width="${slot}" height="${ph + B}" tabindex="0" role="img" aria-label="${esc(tip)}"><title>${esc(tip)}</title></rect>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="Meals followed, last 7 days">${g}</svg><p class="tip" aria-live="polite">${esc(ui.tip.week || 'Tap a bar to see the day.')}</p>`;
  }

  function weekTable(wk) {
    const rows = wk.rows.filter((r) => r.inPlan).map((r) => {
      const m = (S().days[r.date] && S().days[r.date].meals) || {};
      const dots = C.SLOTS.map((s) => `<span class="dot ${m[s.key] || ''}" title="${s.short}: ${m[s.key] ? ST_SHORT[m[s.key]] : 'not logged'}"></span>`).join('');
      return `<tr><td>${C.fmtDate(r.date).slice(0, -4)}${r.isEnd ? ' <span class="muted">(today)</span>' : ''}</td><td><span class="dots" role="img" aria-label="${r.meals.eaten} eaten, ${r.meals.partial} partly, ${r.meals.skipped} skipped">${dots}</span></td><td class="num">${r.meals.logged ? r.meals.pct + '%' : '–'}</td><td class="num">${r.water.glasses}/${r.water.goal}</td><td class="num">${r.move.total}m</td></tr>`;
    }).join('');
    if (!rows) return `<p class="muted">No days in the plan yet.</p>`;
    return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Day</th><th>Meals</th><th>%</th><th>Water</th><th>Move</th></tr></thead><tbody>${rows}</tbody></table></div>
      <div class="bead-key"><span><i class="dot eaten"></i>Eaten</span><span><i class="dot partial"></i>Partly</span><span><i class="dot skipped"></i>Skipped</span><span><i class="dot"></i>Not logged</span></div>`;
  }

  function progressView() {
    const c = cfg();
    const t = today();
    const j = journeyInfo(t);
    if (j.jd < 1) return `<div class="card"><h2>Nothing to show yet</h2><p class="muted">Progress starts on ${C.fmtDate(j.start)}.</p></div>`;
    const day = S().days[t] || {};
    const ms = C.mealStats(day), ws = C.waterStats(day, c.waterGoal), mv = C.moveStats(day, c.moveGoal);
    const wk = C.weekSummary(S().days, t, c.startDate, c);
    const st = C.streak(S().days, t, c.startDate);
    const all = C.sinceStart(S().days, c.startDate, t);
    const sy = C.symptomSummary(S().days, t, 7);
    const hd = wk.rows.map((r) => `<span class="hd">${C.weekday(r.date).slice(0, 2)}</span>`).join('');
    const symRows = sy.map((s) => `<span>${s.label}</span>${s.levels.map((l, i) => `<span class="lv ${l == null ? 'na' : 'l' + l}" title="${C.fmtDate(wk.rows[i].date)}: ${l == null ? 'not recorded' : C.LEVELS[l]}"></span>`).join('')}`).join('');
    return `
      <div class="banner care"><span class="ico">i</span><div><b>Following the plan is not the same as getting better.</b> These numbers show food, water and movement habits only. Only a blood test and your doctor can tell how your Hb and iron are doing.</div></div>
      <div class="sec-title">Today</div>
      <div class="meters">
        ${meter('Meals followed', ms.pct + '%', ms.pct, `${ms.logged}/5 logged`)}
        ${meter('Water', `${ws.glasses}<small>/${ws.goal}</small>`, ws.pct, `${ws.litres} L`)}
        ${meter('Movement', `${mv.total}<small> min</small>`, mv.pct, `goal ${mv.goal} min`)}
      </div>
      <div class="sec-title">Last 7 days</div>
      <section class="card">
        <div class="card-head"><h2>Meals followed</h2><span class="meta">${wk.avgMeals == null ? 'No finished days yet' : `Average <b class="num">${wk.avgMeals}%</b> over ${wk.counted} day${wk.counted === 1 ? '' : 's'}`}</span></div>
        ${weekChart(wk)}
        ${weekTable(wk)}
        <p class="muted small">Eaten counts as 1, partly eaten as ½, skipped or not logged as 0. The average uses finished days. Today is added when all five meals are logged.</p>
      </section>
      <div class="meters">
        ${meter('Water, 7 days', wk.avgWater == null ? '–' : wk.avgWater + '%', wk.avgWater || 0, 'of daily goal')}
        ${meter('Movement, 7 days', wk.avgMove == null ? '–' : wk.avgMove + '%', wk.avgMove || 0, 'of daily goal')}
        ${meter('Good days in a row', String(st), Math.min(100, (st / 7) * 100), '80% or more of meals')}
      </div>
      <div class="sec-title">Whole journey</div>
      <section class="card">
        <div class="card-head"><h2>Since day 1</h2><span class="meta">${all.avg == null ? 'No finished days yet' : `Meals followed: <b class="num">${all.avg}%</b> over ${all.counted} day${all.counted === 1 ? '' : 's'}`}</span></div>
        <div class="bead-key"><span><i class="bead b-full"></i>80% or more</span><span><i class="bead b-half"></i>40 to 79%</span><span><i class="bead b-low"></i>Under 40%</span><span><i class="bead b-none"></i>Not logged</span></div>
        <p class="muted small">The beads at the top show each of the 30 days. Tap a bead to open that day.</p>
      </section>
      <div class="sec-title">Symptoms, last 7 days</div>
      <section class="card">
        <div class="symgrid"><span></span>${hd}${symRows}</div>
        <div class="bead-key"><span><i class="lv l0" style="width:14px"></i>None</span><span><i class="lv l1" style="width:14px"></i>Mild</span><span><i class="lv l2" style="width:14px"></i>Medium</span><span><i class="lv l3" style="width:14px"></i>Strong</span><span><i class="lv na" style="width:14px"></i>Not recorded</span></div>
        <p class="muted small">Symptoms can have many causes. Show this log to your doctor. The app does not explain or diagnose symptoms.</p>
      </section>`;
  }

  /* ---------------- Health ---------------- */
  function labPoints() {
    const b = cfg().baseline || {};
    const pts = [];
    if (b.hb != null && b.hb !== '' || (b.ferritin != null && b.ferritin !== '')) {
      pts.push({ id: null, base: true, date: b.hbDate || null, hb: b.hb === '' ? null : b.hb ?? null, ferritin: b.ferritin === '' ? null : b.ferritin ?? null, lab: '', note: '' });
    }
    const labs = S().labs.slice().sort((a, b2) => String(a.date).localeCompare(String(b2.date)));
    return pts.concat(labs);
  }

  function hbChart(points) {
    const pts = points.filter((p) => p.hb != null && !Number.isNaN(Number(p.hb)));
    if (pts.length < 2) return `<p class="muted small">Add a second Hb result to see a line here.</p>`;
    const W = 328, H = 160, L = 34, R = 16, T = 22, B = 26;
    const vals = pts.map((p) => Number(p.hb));
    let lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
    if (hi - lo < 2) hi = lo + 2;
    const x = (i) => L + (i * (W - L - R)) / (pts.length - 1);
    const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
    let g = '';
    for (const v of [lo, (lo + hi) / 2, hi]) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    g += `<path class="ln" d="${pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Number(p.hb)).toFixed(1)}`).join('')}"/>`;
    const labelAll = pts.length <= 6;
    pts.forEach((p, i) => {
      const when = p.date ? C.fmtDate(p.date, true) : 'Start';
      const tip = `${when}: Hb ${Number(p.hb)} g/dL`;
      const last = i === pts.length - 1;
      g += `<circle class="pt" cx="${x(i)}" cy="${y(Number(p.hb))}" r="${last ? 6 : 4.5}"/>`;
      if (labelAll || i === 0 || last) g += `<text class="val" x="${x(i)}" y="${y(Number(p.hb)) - 10}" text-anchor="${i === 0 ? 'start' : last ? 'end' : 'middle'}">${Number(p.hb)}</text>`;
      if (labelAll || i === 0 || last) g += `<text x="${x(i)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : last ? 'end' : 'middle'}">${p.date ? esc(C.fmtDate(p.date).slice(4)) : 'Start'}</text>`;
      g += `<circle class="hit" data-act="tip" data-k="hb" data-tip="${esc(tip)}" cx="${x(i)}" cy="${y(Number(p.hb))}" r="18" tabindex="0" role="img" aria-label="${esc(tip)}"><title>${esc(tip)}</title></circle>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="group" aria-label="Hb results over time, in g/dL">${g}</svg><p class="tip" aria-live="polite">${esc(ui.tip.hb || 'Hb in g/dL. Tap a point to see the date.')}</p>`;
  }

  function healthView() {
    const c = cfg();
    const b = c.baseline || {};
    const t = today();
    const pts = labPoints();
    const rows = pts.slice().reverse().map((p) => `<tr>
      <td>${p.date ? C.fmtDate(p.date, true) : 'Start'}${p.base ? ' <span class="muted">(starting value)</span>' : ''}${p.lab ? `<br><span class="muted small">${esc(p.lab)}</span>` : ''}${p.note ? `<br><span class="muted small">${esc(p.note)}</span>` : ''}</td>
      <td class="num">${p.hb != null ? esc(p.hb) : '–'}</td>
      <td class="num">${p.ferritin != null ? esc(p.ferritin) : 'Not tested'}</td>
      <td>${!p.base && canLog() ? `<button class="btn sm ghost" data-act="lab-del" data-id="${esc(p.id)}" aria-label="Delete result">Delete</button>` : ''}</td></tr>`).join('');
    const up = upcomingAppts();
    const past = S().appts.filter((a) => a.done || (C.isISO(a.date) && a.date < t)).sort((a, b2) => String(b2.date).localeCompare(String(a.date))).slice(0, 6);
    const apptRow = (a, isPast) => `<div class="li"><div class="grow"><div class="t">${esc(apptTitle(a))} ${a.done ? '<span class="pill eaten">✓ Done</span>' : ''}</div><div class="s">${esc(apptWhen(a))}${a.place ? ' · ' + esc(a.place) : ''}</div>${a.note ? `<div class="s">${esc(a.note)}</div>` : ''}</div>
      ${canWrite() ? `<div class="row">${!a.done ? `<button class="btn sm" data-act="appt-done" data-id="${esc(a.id)}">${isPast ? 'Mark done' : 'Done'}</button>` : ''}<button class="btn sm ghost" data-act="appt-del" data-id="${esc(a.id)}">Delete</button></div>` : ''}</div>`;
    return `
      <div class="banner care"><span class="ico">+</span><div><b>Food helps, and your doctor decides the treatment.</b> A food plan may not be enough on its own. Please talk to your doctor about the Hb result and the next steps. This app never suggests iron tablets or a dose.</div></div>
      <div class="sec-title">Doctor visits and blood tests</div>
      <section class="card">
        <div class="card-head"><h2>Coming up</h2>${canWrite() ? `<button class="btn sm primary" data-act="appt-add">+ Add</button>` : ''}</div>
        ${up.length ? `<div class="list">${up.map((a) => apptRow(a, false)).join('')}</div>` : `<p class="muted">Nothing is planned. Ask your doctor when the follow-up blood test should be, then add it here so you both get a reminder.</p>`}
        ${past.length ? `<details><summary class="link">Past visits (${past.length})</summary><div class="list" style="padding-top:10px">${past.map((a) => apptRow(a, true)).join('')}</div></details>` : ''}
      </section>
      <div class="sec-title">Blood test results</div>
      <section class="card">
        <div class="card-head"><h2>Hb and ferritin</h2>${canLog() ? `<button class="btn sm primary" data-act="lab-add">+ Add result</button>` : ''}</div>
        ${hbChart(pts)}
        ${rows ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Test date</th><th>Hb<br>g/dL</th><th>Ferritin<br>ng/mL</th><th><span class="sr">Actions</span></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="muted">No results yet.</p>`}
        <p class="muted small">The app stores these numbers. It does not judge them or give a diagnosis. Each lab has its own normal range, so ask your doctor what your results mean.</p>
      </section>
      <div class="sec-title">Starting information</div>
      <section class="card">
        <div class="facts">
          <div><small>Hb at start</small><b class="num">${b.hb != null && b.hb !== '' ? esc(b.hb) + ' g/dL' : 'Not given'}</b></div>
          <div><small>Ferritin</small><b class="num">${b.ferritin != null && b.ferritin !== '' ? esc(b.ferritin) + ' ng/mL' : 'Not tested'}</b></div>
          <div><small>Age group</small><b>${esc(b.ageBand || 'Not given')}</b></div>
          <div><small>Periods</small><b>${esc(b.periods || 'Not given')}</b></div>
          <div><small>Iron supplements</small><b>${esc(b.supplements || 'Not given')}</b></div>
          <div><small>Plan started</small><b>${C.fmtDate(c.startDate, true)}</b></div>
        </div>
        ${canLog() ? `<button class="btn sm" data-act="base-edit">Change this information</button>` : ''}
      </section>
      <p class="foot">Get medical help quickly if there is chest pain, trouble breathing, fainting, a very fast heartbeat or very heavy bleeding.</p>`;
  }

  /* ---------------- More ---------------- */
  function moreView() {
    const c = cfg();
    const edit = canLog();
    const times = C.SLOTS.map((s) => `<label class="field" for="tm-${s.key}">${s.short}<input id="tm-${s.key}" type="time" data-change="time" data-slot="${s.key}" value="${esc(c.times[s.key])}" ${edit ? '' : 'disabled'}></label>`).join('');
    const water = c.waterTimes.map((w, i) => `<label class="field" for="wt-${i}">Water ${i + 1}<input id="wt-${i}" type="time" data-change="wtime" data-i="${i}" value="${esc(w)}" ${edit ? '' : 'disabled'}></label>`).join('');
    let notify = '';
    if (store.push) {
      const ps = ui.pushState;
      const txt = { unsupported: 'This browser cannot show push notifications.', 'needs-install': 'On iPhone, first add this app to the Home Screen: tap Share, then “Add to Home Screen”. Open it from the new icon and come back here.', denied: 'Notifications are blocked for this app. Turn them on in the phone settings.', off: 'Notifications are off on this device.', on: 'Notifications are on for this device.' }[ps] || 'Checking…';
      notify = `<p>${txt}</p><div class="row">${ps === 'off' ? `<button class="btn primary" data-act="push-on">Turn on notifications</button>` : ''}${ps === 'on' ? `<button class="btn" data-act="push-off">Turn off on this device</button><button class="btn" data-act="push-test">Send a test</button>` : ''}</div>
        <p class="muted small">${isTracker() ? 'You get meal and water reminders, and reminders for doctor visits.' : 'You get reminders for doctor visits and blood tests.'} A meal reminder is skipped when that meal is already logged.</p>`;
    } else {
      notify = `<p>This version shows reminders while it is open. It cannot send an alert when it is closed.</p>
        <p class="muted small">For alerts on the lock screen, add the <b>IronMate calendar file</b> to iPhone Calendar. It came with the setup steps and has a daily alarm for each meal and water time. If you change a time below, change it in Calendar too.</p>`;
    }
    if (store.saveFile) notify += `<button class="btn" data-act="ics">Download calendar file (.ics)</button>`;
    return `
      <div class="sec-title">Reminders</div>
      <section class="card">
        <h2>Notifications</h2>
        ${notify}
      </section>
      <section class="card">
        <h2>Meal times</h2>
        <div class="grid2">${times}</div>
        <h2>Water times</h2>
        <div class="grid2">${water}</div>
        ${edit ? '' : '<p class="muted small">Only the person tracking can change these.</p>'}
      </section>
      <div class="sec-title">Daily goals</div>
      <section class="card">
        <div class="row between"><div><b>Water</b><br><span class="muted small">Glasses a day (250 ml each)</span></div><div class="stepper"><button class="iconbtn" data-act="goal" data-k="waterGoal" data-d="-1" ${edit ? '' : 'disabled'} aria-label="Fewer glasses">−</button><output class="num">${c.waterGoal}</output><button class="iconbtn" data-act="goal" data-k="waterGoal" data-d="1" ${edit ? '' : 'disabled'} aria-label="More glasses">+</button></div></div>
        <div class="row between"><div><b>Walking and exercise</b><br><span class="muted small">Minutes a day</span></div><div class="stepper"><button class="iconbtn" data-act="goal" data-k="moveGoal" data-d="-5" ${edit ? '' : 'disabled'} aria-label="Fewer minutes">−</button><output class="num">${c.moveGoal}</output><button class="iconbtn" data-act="goal" data-k="moveGoal" data-d="5" ${edit ? '' : 'disabled'} aria-label="More minutes">+</button></div></div>
        <p class="muted small">If your doctor gave you a limit for water or exercise, use the doctor's number.</p>
      </section>
      <div class="sec-title">Plan</div>
      <section class="card">
        <div class="facts"><div><small>Day 1</small><b>${C.fmtDate(c.startDate, true)}</b></div><div><small>Food choice</small><b>${c.diet === 'nonveg' ? 'Veg + non-veg' : 'Vegetarian'}</b></div></div>
        ${edit ? `<button class="btn" data-act="restart">Start a new 30 days from today</button>` : ''}
      </section>
      <div class="sec-title">Family</div>
      <section class="card">
        <div class="facts"><div><small>You are</small><b>${isTracker() ? 'Tracking' : 'The partner'}</b></div>${S().me && S().me.email ? `<div><small>Signed in as</small><b style="overflow-wrap:anywhere">${esc(S().me.email)}</b></div>` : ''}</div>
        ${S().inviteCode && isTracker() ? `<div class="banner"><span class="ico">#</span><div><b>Partner invite code: <span class="num">${esc(S().inviteCode)}</span></b><br>Your partner creates an account, taps “I am the partner” and types this code. It works for one partner only.</div></div>` : ''}
        ${store.mode !== 'supabase' ? `<p class="muted small">Only people you invite to this page can open it. The partner view does not offer editing of the log.</p>` : `<p class="muted small">Only the two of you can read this data. The partner can read the log but cannot change it.</p>`}
        <div class="row">${store.resetRole ? `<button class="btn sm" data-act="reset-role">Change my role on this device</button>` : ''}${store.auth ? `<button class="btn sm" data-act="signout">Sign out</button>` : ''}</div>
      </section>
      <div class="sec-title">About and safety</div>
      <section class="card">
        <ul class="stack small" style="margin:0;padding-left:18px">
          <li>IronMate is a food plan and a habit tracker. It is not a medical device.</li>
          <li>It never suggests iron tablets, injections or doses. Only a doctor can prescribe these.</li>
          <li>Adherence numbers show habits. They do not show medical recovery.</li>
          <li>Blood test numbers are stored as you type them. The app does not interpret them.</li>
          <li>Keep your doctor appointments and follow-up blood tests, even when you feel better.</li>
        </ul>
      </section>`;
  }

  /* ---------------- sheets ---------------- */
  function openSheet(html, onSubmit) {
    closeSheet(true);
    sheetEl = document.createElement('div');
    sheetEl.className = 'sheet-back';
    sheetEl.innerHTML = `<form class="sheet" novalidate role="dialog" aria-modal="true">${html}</form>`;
    document.body.appendChild(sheetEl);
    const form = sheetEl.querySelector('form');
    sheetEl.addEventListener('click', (e) => { if (e.target === sheetEl || e.target.closest('[data-close]')) closeSheet(); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      const err = await onSubmit(data);
      const box = form.querySelector('.err');
      if (err) { if (box) box.textContent = err; } else closeSheet();
    });
    const first = form.querySelector('input, select, textarea');
    if (first) setTimeout(() => first.focus(), 50);
  }
  function closeSheet(silent) {
    if (sheetEl) { sheetEl.remove(); sheetEl = null; }
    if (!silent) render(true);
  }
  const sheetActions = (label) => `<p class="err" role="alert"></p><div class="actions"><button type="button" class="btn" data-close>Cancel</button><button class="btn primary">${label}</button></div>`;

  function labSheet() {
    openSheet(`<h2>Add a blood test result</h2>
      <p class="muted small">Copy the numbers from the lab report. Fill in what was tested.</p>
      <label class="field" for="lb-date">Test date<input id="lb-date" name="date" type="date" value="${today()}" max="${today()}" required></label>
      <div class="grid2">
        <label class="field" for="lb-hb">Hb (g/dL)<input id="lb-hb" name="hb" inputmode="decimal" placeholder="e.g. 10.4"></label>
        <label class="field" for="lb-fer">Ferritin (ng/mL)<input id="lb-fer" name="ferritin" inputmode="decimal" placeholder="If tested"></label>
      </div>
      <label class="field" for="lb-lab">Lab or clinic <span class="hint">Optional</span><input id="lb-lab" name="lab" maxlength="80"></label>
      <label class="field" for="lb-note">Note <span class="hint">Optional. For example, what the doctor said.</span><textarea id="lb-note" name="note" maxlength="300"></textarea></label>
      ${sheetActions('Save result')}`, async (d) => {
      const r = C.parseLab(d);
      if (!r.ok) return r.errors[0];
      const ok = await guard(store.addLab(r.value), 'Result saved');
      return ok === null ? 'Could not save. Try again.' : '';
    });
  }

  function apptSheet() {
    openSheet(`<h2>Add a visit or blood test</h2>
      <label class="field" for="ap-kind">What is it?<select id="ap-kind" name="kind"><option value="doctor">Doctor appointment</option><option value="blood_test">Follow-up blood test</option><option value="other">Other</option></select></label>
      <div class="grid2">
        <label class="field" for="ap-date">Date<input id="ap-date" name="date" type="date" min="${C.addDays(today(), -365)}" value="${C.addDays(today(), 7)}" required></label>
        <label class="field" for="ap-time">Time <span class="hint">Optional</span><input id="ap-time" name="time" type="time"></label>
      </div>
      <label class="field" for="ap-title">Title <span class="hint">Optional</span><input id="ap-title" name="title" maxlength="80" placeholder="e.g. Dr. name, Hb + ferritin test"></label>
      <label class="field" for="ap-place">Place <span class="hint">Optional</span><input id="ap-place" name="place" maxlength="80"></label>
      <label class="field" for="ap-note">Note <span class="hint">Optional. For example, questions to ask.</span><textarea id="ap-note" name="note" maxlength="300"></textarea></label>
      ${sheetActions('Save')}`, async (d) => {
      if (!C.isISO(d.date)) return 'Choose a date.';
      const v = { kind: APPT_KIND[d.kind] ? d.kind : 'other', date: d.date, time: /^\d{2}:\d{2}$/.test(d.time || '') ? d.time : '', title: String(d.title || '').trim().slice(0, 80), place: String(d.place || '').trim().slice(0, 80), note: String(d.note || '').trim().slice(0, 300), done: false };
      const ok = await guard(store.addAppt(v), 'Saved');
      return ok === null ? 'Could not save. Try again.' : '';
    });
  }

  function exerciseSheet() {
    openSheet(`<h2>Add exercise</h2>
      <label class="field" for="ex-t">Type<select id="ex-t" name="t">${C.EXERCISES.map((x) => `<option>${x}</option>`).join('')}</select></label>
      <label class="field" for="ex-m">Minutes<input id="ex-m" name="m" type="number" inputmode="numeric" min="1" max="300" value="15" required></label>
      ${sheetActions('Add')}`, async (d) => {
      const m = Math.round(Number(d.m));
      if (!(m >= 1 && m <= 300)) return 'Enter minutes between 1 and 300.';
      editDay(ui.date, (day) => { day.exercise = (day.exercise || []).concat([{ t: C.EXERCISES.includes(d.t) ? d.t : 'Other', m }]); });
      return '';
    });
  }

  function baselineSheet() {
    const b = cfg().baseline || {};
    const opt = (list, cur) => list.map((v) => `<option ${v === cur ? 'selected' : ''}>${esc(v)}</option>`).join('');
    openSheet(`<h2>Starting information</h2>
      <div class="grid2">
        <label class="field" for="be-hb">Hb at start (g/dL)<input id="be-hb" name="hb" inputmode="decimal" value="${esc(b.hb ?? '')}"></label>
        <label class="field" for="be-date">Test date<input id="be-date" name="hbDate" type="date" max="${today()}" value="${esc(b.hbDate ?? '')}"></label>
      </div>
      <label class="field" for="be-fer">Ferritin (ng/mL) <span class="hint">Leave empty if not tested.</span><input id="be-fer" name="ferritin" inputmode="decimal" value="${esc(b.ferritin ?? '')}"></label>
      <div class="grid2">
        <label class="field" for="be-age">Age group<select id="be-age" name="ageBand">${opt(AGE_BANDS, b.ageBand)}</select></label>
        <label class="field" for="be-per">Periods<select id="be-per" name="periods">${opt(PERIODS, b.periods)}</select></label>
      </div>
      <label class="field" for="be-sup">Iron supplements <span class="hint">This only records what your doctor decided.</span><select id="be-sup" name="supplements">${opt(SUPPS, b.supplements)}</select></label>
      ${sheetActions('Save')}`, async (d) => {
      const r = readBaseline(d);
      if (r.err) return r.err;
      const ok = await guard(store.saveConfig({ baseline: r.value }), 'Saved');
      return ok === null ? 'Could not save. Try again.' : '';
    });
  }

  function confirmSheet(title, text, label, fn) {
    openSheet(`<h2>${title}</h2><p>${text}</p>${sheetActions(label)}`, async () => { await fn(); return ''; });
  }

  function readBaseline(d) {
    const num = (v) => (String(v ?? '').trim() === '' ? null : Number(String(v).trim()));
    const hb = num(d.hb), fer = num(d.ferritin);
    if (hb !== null && !(hb >= 1 && hb <= 25)) return { err: 'Hb should be a number between 1 and 25 g/dL. Please check the report.' };
    if (fer !== null && !(fer >= 0 && fer <= 5000)) return { err: 'Ferritin should be a number between 0 and 5000 ng/mL. Please check the report.' };
    return { value: { hb, hbDate: C.isISO(d.hbDate) ? d.hbDate : null, ferritin: fer, ageBand: AGE_BANDS.includes(d.ageBand) ? d.ageBand : null, periods: PERIODS.includes(d.periods) ? d.periods : null, supplements: SUPPS.includes(d.supplements) ? d.supplements : null } };
  }

  /* ---------------- events ---------------- */
  async function busy(fn) {
    ui.busy = true; ui.err = ''; render(true);
    try { await fn(); } catch (e) { ui.err = (e && e.userMessage) || (e && e.message) || 'Something went wrong. Please try again.'; }
    ui.busy = false; render(true);
  }

  async function runForm(form, fn) {
    const btn = form.querySelector('button:not([type=button])');
    const box = form.querySelector('.err');
    if (btn) btn.disabled = true;
    if (box) box.textContent = '';
    try {
      await fn();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      ui.err = '';
      render(true);
    } catch (e) {
      if (box) box.textContent = (e && e.userMessage) || 'Something went wrong. Please try again.';
      if (btn) btn.disabled = false;
    }
  }
  const formErr = (form, msg) => { const box = form.querySelector('.err'); if (box) box.textContent = msg; };

  async function refreshPush() {
    if (!store.push) return;
    try { ui.pushState = await store.push.state(); } catch { ui.pushState = 'unsupported'; }
    render();
  }

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || !root.contains(el) || el.disabled) return;
    const a = el.dataset.act;
    const date = ui.date;
    switch (a) {
      case 'tab': go(el.dataset.tab); if (el.dataset.tab === 'more') refreshPush(); return;
      case 'bead': ui.date = el.dataset.date; go('today'); return;
      case 'date': {
        const d = Number(el.dataset.d);
        ui.date = d === 0 ? today() : C.addDays(ui.date, d);
        if (ui.date > today()) ui.date = today();
        return render(true);
      }
      case 'meal': editDay(date, (day) => { day.meals = day.meals || {}; if (day.meals[el.dataset.slot] === el.dataset.st) delete day.meals[el.dataset.slot]; else day.meals[el.dataset.slot] = el.dataset.st; }); return render(true);
      case 'swap': editDay(date, (day) => { day.swaps = day.swaps || {}; if (day.swaps[el.dataset.slot]) delete day.swaps[el.dataset.slot]; else day.swaps[el.dataset.slot] = true; }); return render(true);
      case 'water': editDay(date, (day) => { day.water = Math.max(0, Math.min(30, (Number(day.water) || 0) + Number(el.dataset.d))); }); return render(true);
      case 'walk-add': editDay(date, (day) => { day.walkMin = Math.min(600, (Number(day.walkMin) || 0) + Number(el.dataset.d)); }); return render(true);
      case 'ex-add': return exerciseSheet();
      case 'ex-del': editDay(date, (day) => { (day.exercise || []).splice(Number(el.dataset.i), 1); }); return render(true);
      case 'sym': editDay(date, (day) => { day.symptoms = day.symptoms || {}; const v = Number(el.dataset.v); if (day.symptoms[el.dataset.k] === v) delete day.symptoms[el.dataset.k]; else day.symptoms[el.dataset.k] = v; }); return render(true);
      case 'period': editDay(date, (day) => { day.period = !day.period; }); return render(true);
      case 'planday': ui.planDay = Number(el.dataset.d); return render(true);
      case 'diet': guard(store.saveConfig({ diet: el.dataset.v })); return render(true);
      case 'tip': ui.tip[el.dataset.k] = el.dataset.tip; return render(true);
      case 'goal': {
        const k = el.dataset.k, c = cfg();
        const lim = k === 'waterGoal' ? [4, 16] : [5, 120];
        const v = Math.max(lim[0], Math.min(lim[1], c[k] + Number(el.dataset.d)));
        guard(store.saveConfig({ [k]: v }));
        return render(true);
      }
      case 'lab-add': return labSheet();
      case 'lab-del': return confirmSheet('Delete this result?', 'The result will be removed for both of you.', 'Delete', () => guard(store.deleteLab(el.dataset.id), 'Deleted'));
      case 'appt-add': return apptSheet();
      case 'appt-done': guard(store.updateAppt(el.dataset.id, { done: true })); return render(true);
      case 'appt-del': return confirmSheet('Delete this entry?', 'It will be removed for both of you.', 'Delete', () => guard(store.deleteAppt(el.dataset.id), 'Deleted'));
      case 'base-edit': return baselineSheet();
      case 'restart': return confirmSheet('Start a new 30 days?', 'Day 1 becomes today. Your old logs, blood tests and visits stay saved.', 'Start again', () => guard(store.saveConfig({ startDate: today() }), 'New 30 days started'));
      case 'cheer-quick': { const ta = root.querySelector('#cheer-text'); if (ta) { ta.value = el.dataset.text; ta.focus(); } return; }
      case 'role': return void busy(() => store.chooseRole(el.dataset.role, {}));
      case 'reset-role': return void busy(() => store.resetRole());
      case 'auth-mode': ui.authMode = ui.authMode === 'up' ? 'in' : 'up'; ui.err = ''; return render(true);
      case 'signout': ui.authMode = 'in'; ui.tab = 'today'; ui.date = today(); try { history.replaceState(null, '', '#today'); } catch { /* fine */ } return void busy(() => store.auth.signOut());
      case 'reload-data': return void store.start();
      case 'push-on': return void guard(store.push.enable(), 'Notifications are on').then(refreshPush);
      case 'push-off': return void guard(store.push.disable(), 'Notifications are off').then(refreshPush);
      case 'push-test': return void guard(store.push.test(), 'Test sent. It should arrive in a few seconds.');
      case 'ics': {
        const c = cfg();
        const text = C.buildICS({ startISO: today(), times: c.times, waterTimes: c.waterTimes, appts: upcomingAppts() });
        return void guard(store.saveFile('ironmate-reminders.ics', text, 'text/calendar'));
      }
      default:
    }
  });

  root.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('.hit')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); }
  });

  root.addEventListener('change', (e) => {
    const el = e.target;
    const k = el.dataset && el.dataset.change;
    if (!k) return;
    const n = (max) => Math.max(0, Math.min(max, Math.round(Number(el.value) || 0)));
    if (k === 'walk') editDay(ui.date, (day) => { day.walkMin = n(600); });
    else if (k === 'steps') editDay(ui.date, (day) => { day.steps = n(100000); });
    else if (k === 'note') editDay(ui.date, (day) => { day.note = String(el.value).slice(0, 400); });
    else if (k === 'time' && /^\d{2}:\d{2}$/.test(el.value)) guard(store.saveConfig({ times: { ...cfg().times, [el.dataset.slot]: el.value } }));
    else if (k === 'wtime' && /^\d{2}:\d{2}$/.test(el.value)) { const w = cfg().waterTimes.slice(); w[Number(el.dataset.i)] = el.value; guard(store.saveConfig({ waterTimes: w })); }
    pending = true;
  });

  root.addEventListener('focusout', () => { setTimeout(() => { if (pending && !typing() && !sheetEl) render(); }, 60); });

  root.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-form]');
    if (!form) return;
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    const kind = form.dataset.form;
    if (kind === 'auth') {
      const email = String(d.email || '').trim(), pw = String(d.password || '');
      if (!/^\S+@\S+\.\S+$/.test(email)) return formErr(form, 'Enter a valid email address.');
      if (pw.length < 8) return formErr(form, 'The password needs at least 8 characters.');
      return void runForm(form, () => (ui.authMode === 'up' ? store.auth.signUp(email, pw) : store.auth.signIn(email, pw)));
    }
    if (kind === 'join') {
      const code = String(d.code || '').trim().toUpperCase();
      if (!code) return formErr(form, 'Type the invite code.');
      return void runForm(form, () => store.chooseRole('partner', { code, name: String(d.name || '').trim().slice(0, 40) }));
    }
    if (kind === 'setup') {
      if (!C.isISO(d.start)) return formErr(form, 'Choose the first day of your plan.');
      const b = readBaseline(d);
      if (b.err) return formErr(form, b.err);
      if (!d.ok) return formErr(form, 'Please tick the box to say you understand.');
      return void runForm(form, () => store.saveConfig({ setupDone: true, startDate: d.start, diet: d.diet === 'nonveg' ? 'nonveg' : 'veg', trackerName: String(d.name || '').trim().slice(0, 40), baseline: b.value, waterGoal: C.DEFAULTS.waterGoal, moveGoal: C.DEFAULTS.moveGoal, times: C.DEFAULTS.times, waterTimes: C.DEFAULTS.waterTimes }));
    }
    if (kind === 'cheer') {
      const text = String(d.text || '').trim().slice(0, 200);
      if (!text) return;
      form.reset();
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      return void guard(store.addCheer(text), 'Note sent').then(() => render(true));
    }
  });

  window.addEventListener('hashchange', () => { const h = readHash(); if (h !== ui.tab) { ui.tab = h; render(true); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  setInterval(() => { if (!document.hidden && ui.tab === 'today') render(); }, 60000);

  ui.tab = readHash();
  store.subscribe(() => render());
  render(true);
  store.start();
  return { render };
}
