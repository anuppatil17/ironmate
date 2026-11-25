// Store for the standalone PWA. Data lives in your own Supabase project (see README).
import { cleanDay, iso, addDays } from './core.js';

const b64ToBytes = (s) => {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const raw = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};
const userError = (msg, cause) => Object.assign(new Error(cause && cause.message ? cause.message : msg), { userMessage: msg });
const SAVE_ERR = 'Could not save. Please check your connection and try again.';
const LOAD_ERR = 'Could not load the data. Please check your connection.';

export function createSupabaseStore(sb) {
  const listeners = new Set();
  const state = { status: 'loading', me: {}, role: null, canWrite: true, stale: false, config: null, days: {}, labs: [], appts: [], cheers: [], inviteCode: '' };
  const emit = () => listeners.forEach((fn) => fn());
  const overrides = new Map();
  const chains = new Map();
  const latest = new Map();
  let uid = null, fid = null, channel = null, serverDays = {}, serverConfig = null, authHooked = false;
  const timers = {};
  let writeSeq = 0; // changes whenever a local write starts or lands; a fetch that overlaps one is thrown away

  const check = (res, msg = SAVE_ERR) => { if (res.error) throw userError(msg, res.error); return res.data; };

  function project() {
    const days = { ...serverDays };
    for (const [k, v] of overrides) if (k.startsWith('day:')) days[k.slice(4)] = v;
    state.days = days;
    state.config = overrides.get('config') || serverConfig;
  }

  // One write at a time per row; a newer write replaces an older one still waiting.
  function queued(key, data, send) {
    const token = {};
    writeSeq++;
    latest.set(key, token);
    overrides.set(key, data);
    const prev = chains.get(key) || Promise.resolve();
    const next = prev.catch(() => {}).then(async () => {
      if (latest.get(key) !== token) return true;
      try {
        check(await send());
        if (key === 'config') serverConfig = data; else serverDays = { ...serverDays, [key.slice(4)]: data };
        writeSeq++;
        return true;
      } finally {
        if (latest.get(key) === token) { overrides.delete(key); project(); emit(); }
      }
    });
    chains.set(key, next);
    project();
    emit();
    return next;
  }

  /* ---------------- loading ---------------- */
  const loaders = {
    async families() {
      const seq = writeSeq;
      const f = check(await sb.from('families').select('id, config, invite_code, tz').eq('id', fid).maybeSingle(), LOAD_ERR);
      if (seq !== writeSeq) return refresh('families');
      if (f) { serverConfig = f.config && Object.keys(f.config).length ? f.config : null; state.inviteCode = f.invite_code; state.tz = f.tz; }
      project();
    },
    async days() {
      const since = addDays(iso(new Date()), -200);
      const seq = writeSeq;
      const rows = check(await sb.from('days').select('day, data').eq('family_id', fid).gte('day', since), LOAD_ERR);
      if (seq !== writeSeq) return refresh('days');
      const d = {};
      for (const r of rows) d[r.day] = cleanDay(r.data);
      serverDays = d;
      project();
    },
    async labs() {
      const rows = check(await sb.from('labs').select('id, test_date, hb, ferritin, lab, note').eq('family_id', fid).order('test_date'), LOAD_ERR);
      state.labs = rows.map((r) => ({ id: r.id, date: r.test_date, hb: r.hb == null ? null : Number(r.hb), ferritin: r.ferritin == null ? null : Number(r.ferritin), lab: r.lab || '', note: r.note || '' }));
    },
    async appointments() {
      const rows = check(await sb.from('appointments').select('id, kind, on_date, at_time, title, place, note, done').eq('family_id', fid).order('on_date'), LOAD_ERR);
      state.appts = rows.map((r) => ({ id: r.id, kind: r.kind, date: r.on_date, time: r.at_time ? String(r.at_time).slice(0, 5) : '', title: r.title || '', place: r.place || '', note: r.note || '', done: !!r.done }));
    },
    async cheers() {
      const rows = check(await sb.from('cheers').select('id, body, created_at').eq('family_id', fid).order('created_at', { ascending: false }).limit(10), LOAD_ERR);
      state.cheers = rows.map((r) => ({ id: r.id, text: r.body, at: r.created_at }));
    },
  };
  function refresh(table) {
    clearTimeout(timers[table]);
    timers[table] = setTimeout(async () => {
      try { await loaders[table](); state.stale = false; } catch { state.stale = true; }
      emit();
    }, 250);
  }

  async function loadFamily() {
    const m = check(await sb.from('family_members').select('family_id, role').eq('user_id', uid).maybeSingle(), LOAD_ERR);
    if (channel) { sb.removeChannel(channel); channel = null; }
    serverDays = {}; serverConfig = null; overrides.clear();
    state.labs = []; state.appts = []; state.cheers = []; state.inviteCode = '';
    if (!m) { fid = null; state.role = null; project(); state.status = 'ready'; emit(); return; }
    fid = m.family_id;
    state.role = m.role;
    await Promise.all(Object.values(loaders).map((fn) => fn()));
    // Keep the reminder time zone right if she travels.
    if (m.role === 'tracker') {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && tz !== state.tz) sb.from('families').update({ tz }).eq('id', fid).then(() => {});
    }
    channel = sb.channel('family-' + fid);
    for (const t of Object.keys(loaders)) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: t === 'families' ? `id=eq.${fid}` : `family_id=eq.${fid}` }, () => refresh(t));
    }
    channel.subscribe();
    state.status = 'ready';
    state.stale = false;
    emit();
  }

  let starting = null;
  function start() {
    if (!starting) starting = doStart().finally(() => { starting = null; });
    return starting;
  }

  async function doStart() {
    state.status = 'loading';
    emit();
    try {
      const { data } = await sb.auth.getSession();
      if (!authHooked) {
        authHooked = true;
        sb.auth.onAuthStateChange((event, session) => {
          if (event !== 'SIGNED_IN' && event !== 'SIGNED_OUT') return;
          const next = session && session.user ? session.user.id : null;
          // Wait a moment: our own sign-in / sign-out calls reload by themselves.
          setTimeout(() => { if (next !== uid && !starting) start(); }, 300);
        });
        document.addEventListener('visibilitychange', () => { if (!document.hidden && fid) Object.keys(loaders).forEach(refresh); });
      }
      const user = data.session && data.session.user;
      if (!user) { uid = null; fid = null; state.role = null; state.me = {}; state.status = 'signedOut'; emit(); return; }
      uid = user.id;
      state.me = { email: user.email || '' };
      await loadFamily();
    } catch (e) {
      state.status = 'error';
      state.message = 'The data could not be loaded. Check your connection and try again.';
      emit();
    }
  }

  /* ---------------- push ---------------- */
  const push = {
    async state() {
      const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      if (!ok) {
        const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
        const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
        return ios && !standalone ? 'needs-install' : 'unsupported';
      }
      if (Notification.permission === 'denied') return 'denied';
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      return sub && Notification.permission === 'granted' ? 'on' : 'off';
    },
    async enable() {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') throw userError('Notifications were not allowed. You can turn them on in the phone settings.');
      // The public push key is made and kept on the server; ask the function for it.
      const { data: key, error } = await sb.functions.invoke('send-reminders', { body: { publicKey: true } });
      if (error || !key || !key.publicKey) throw userError('Could not reach the reminder service. Please try again in a minute.', error);
      const reg = await navigator.serviceWorker.ready;
      const old = await reg.pushManager.getSubscription();
      if (old) await old.unsubscribe(); // a subscription made with an older key cannot be reused
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(key.publicKey) });
      const j = sub.toJSON();
      check(await sb.from('push_subscriptions').upsert({ user_id: uid, family_id: fid, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' }), 'Could not turn on notifications. Please try again.');
      return true;
    },
    async disable() {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sb.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      return true;
    },
    async test() {
      const { error } = await sb.functions.invoke('send-reminders', { body: { test: true } });
      if (error) throw userError('The test could not be sent. Check that the send-reminders function is deployed.', error);
      return true;
    },
  };

  return {
    mode: 'supabase',
    state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    start,
    push,
    auth: {
      async signIn(email, password) {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) {
          if (/confirm/i.test(error.message)) throw userError('Please confirm your email first. Tap the link we sent you.', error);
          if (error.status === 400 || error.status === 401) throw userError('The email or password is not right.', error);
          if (error.status === 429) throw userError('Too many tries. Please wait a minute and try again.', error);
          throw userError('Cannot reach the server. Check your connection and try again.', error);
        }
        await start();
      },
      async signUp(email, password) {
        const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
        if (error) {
          if (/registered/i.test(error.message)) throw userError('This email already has an account. Sign in instead.', error);
          if (error.status === 429) throw userError('Too many sign-ups right now. Please wait a few minutes and try again.', error);
          if (!error.status) throw userError('Cannot reach the server. Check your connection and try again.', error);
          throw userError('Could not create the account. ' + error.message, error);
        }
        if (!data.session) throw userError('Account created. Check your email and tap the link to confirm, then sign in here.');
        await start();
      },
      async signOut() {
        try { await push.disable(); } catch { /* not subscribed */ }
        await sb.auth.signOut();
        await start();
      },
    },
    async chooseRole(role, { code, name } = {}) {
      if (role === 'tracker') {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        check(await sb.rpc('create_family', { p_name: name || null, p_tz: tz }), 'Could not create the family space. Please try again.');
      } else {
        const id = check(await sb.rpc('join_family', { p_code: code || '', p_name: name || null }), 'Could not join. Please try again.');
        if (!id) throw userError('That invite code did not work. Check it with your partner. A code works for one partner only.');
      }
      await loadFamily();
    },
    saveConfig(patch) {
      const next = { ...(state.config || {}), ...patch };
      return queued('config', next, () => sb.from('families').update({ config: next }).eq('id', fid).select('id'));
    },
    saveDay(date, doc) {
      const data = cleanDay(doc);
      return queued('day:' + date, data, () => sb.from('days').upsert({ family_id: fid, day: date, data }, { onConflict: 'family_id,day' }).select('day'));
    },
    async addLab(v) {
      check(await sb.from('labs').insert({ family_id: fid, test_date: v.date, hb: v.hb, ferritin: v.ferritin, lab: v.lab || null, note: v.note || null }));
      await loaders.labs(); emit(); return true;
    },
    async deleteLab(id) { check(await sb.from('labs').delete().eq('id', id)); await loaders.labs(); emit(); return true; },
    async addAppt(v) {
      check(await sb.from('appointments').insert({ family_id: fid, kind: v.kind, on_date: v.date, at_time: v.time || null, title: v.title || null, place: v.place || null, note: v.note || null }));
      await loaders.appointments(); emit(); return true;
    },
    async updateAppt(id, patch) {
      const row = {};
      if ('done' in patch) row.done = !!patch.done;
      check(await sb.from('appointments').update(row).eq('id', id));
      await loaders.appointments(); emit(); return true;
    },
    async deleteAppt(id) { check(await sb.from('appointments').delete().eq('id', id)); await loaders.appointments(); emit(); return true; },
    async addCheer(text) {
      check(await sb.from('cheers').insert({ family_id: fid, body: String(text).slice(0, 200) }));
      await loaders.cheers(); emit(); return true;
    },
    async saveFile(filename, text, mime) {
      const url = URL.createObjectURL(new Blob([text], { type: mime || 'text/plain' }));
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return true;
    },
  };
}
