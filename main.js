import { startApp } from './app.js';
import { createSupabaseStore } from './store-supabase.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const root = document.getElementById('app');

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

if (/YOUR-/.test(SUPABASE_URL + SUPABASE_KEY) || !window.supabase) {
  root.innerHTML = '<div class="gate"><h1>IronMate</h1><p class="lead">Setup is not finished.</p><div class="card"><p>Open <b>config.js</b> and fill in the Supabase URL and publishable key. The steps are in README.md.</p></div></div>';
} else {
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
  startApp(createSupabaseStore(sb), root);
}
