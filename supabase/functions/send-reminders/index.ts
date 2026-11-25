// IronMate — push reminders.
//
// Who may call this function (it checks the caller itself, so it is deployed with verify_jwt = false):
//   1. The database scheduler (pg_cron), with the cron secret from Supabase Vault.
//        {}                   -> send every reminder that is due now
//        { "selftest": true } -> check that push encryption and sending work in this runtime
//   2. A signed-in app user, with their own session token.
//        { "publicKey": true } -> the public push key the phone needs to subscribe
//        { "test": true }      -> send a test notification to that user's own devices
//
// Secrets: none to set by hand. The push key pair is created here on first use and kept in Vault.

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";
import { dueReminders, localParts } from "./reminders.js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function secretKey(): string {
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    if (keys.default) return keys.default;
  } catch { /* fall through to the legacy key */ }
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
}

function sameText(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

type Vapid = { publicKey: string; privateKey: string };
let vapidCache: Vapid | null = null;

async function readSecret(admin: SupabaseClient, name: string): Promise<string | null> {
  const { data, error } = await admin.rpc("ij_secret", { p_name: name });
  if (error) throw new Error(`vault read failed: ${error.message}`);
  return (data as string | null) ?? null;
}

// The push key pair identifies this app to Apple and Google. Made once, then reused.
async function getVapid(admin: SupabaseClient): Promise<Vapid> {
  if (vapidCache) return vapidCache;
  let raw = await readSecret(admin, "ij_vapid");
  if (!raw) {
    const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    const pub = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
    const jwk = await crypto.subtle.exportKey("jwk", pair.privateKey);
    const fresh: Vapid = { publicKey: b64url(pub), privateKey: jwk.d as string };
    const { error } = await admin.rpc("ij_put_secret", { p_name: "ij_vapid", p_value: JSON.stringify(fresh) });
    if (error) throw new Error(`vault write failed: ${error.message}`);
    raw = await readSecret(admin, "ij_vapid"); // read back: another run may have won the race
  }
  vapidCache = JSON.parse(raw!) as Vapid;
  return vapidCache;
}

type Sub = { id: string; user_id: string; endpoint: string; p256dh: string; auth: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(url, secretKey(), { auth: { persistSession: false, autoRefreshToken: false } });
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const body = await req.json().catch(() => ({}));
    if (!token) return json({ error: "not allowed" }, 401);

    const cronSecret = (await readSecret(admin, "ij_cron_secret")) ?? "";
    const isCron = sameText(token, cronSecret);

    let userId: string | null = null;
    if (!isCron) {
      const { data, error } = await admin.auth.getUser(token);
      if (error || !data.user) return json({ error: "not allowed" }, 401);
      userId = data.user.id;
    }

    const vapid = await getVapid(admin);
    webpush.setVapidDetails(Deno.env.get("VAPID_SUBJECT") ?? url, vapid.publicKey, vapid.privateKey);

    async function send(subs: Sub[], payload: { title: string; body: string; tag: string }) {
      let sent = 0;
      for (const s of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            JSON.stringify({ ...payload, url: "./#today" }),
            { TTL: 1800 },
          );
          sent++;
        } catch (e) {
          const code = (e as { statusCode?: number }).statusCode;
          // 404 / 410: the phone dropped this subscription. Remove it.
          if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
          else console.error("push failed", code, (e as Error).message);
        }
      }
      return sent;
    }

    // ---- signed-in user
    if (userId) {
      if (body.publicKey) return json({ publicKey: vapid.publicKey });
      if (body.test) {
        const { data: subs } = await admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").eq("user_id", userId);
        const sent = await send((subs ?? []) as Sub[], { title: "IronMate", body: "Notifications are working on this device.", tag: "test" });
        return json({ sent });
      }
      return json({ error: "unknown request" }, 400);
    }

    // ---- scheduler: self-test (no real phone needed)
    if (body.selftest) {
      const out: Record<string, unknown> = { vapid: vapid.publicKey.length === 87 && vapid.privateKey.length === 43 };
      const device = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
      const p256dh = b64url(new Uint8Array(await crypto.subtle.exportKey("raw", device.publicKey)));
      const auth = b64url(crypto.getRandomValues(new Uint8Array(16)));
      const fake = { endpoint: "https://fcm.googleapis.com/fcm/send/ironmate-selftest", keys: { p256dh, auth } };
      try {
        const d = webpush.generateRequestDetails(fake, JSON.stringify({ title: "self-test" }), { TTL: 60 });
        out.encrypt = d.body.length > 0 && /^vapid /.test(String(d.headers.Authorization));
      } catch (e) {
        out.encrypt = false;
        out.encryptError = (e as Error).message;
      }
      try {
        await webpush.sendNotification(fake, JSON.stringify({ title: "self-test" }), { TTL: 60 });
        out.send = "accepted";
      } catch (e) {
        // A made-up device must be refused by the push service. Getting an HTTP status back proves the call went out.
        out.send = (e as { statusCode?: number }).statusCode ?? `error: ${(e as Error).message}`;
      }
      return json(out);
    }

    // ---- scheduler: send what is due, for every family
    const now = new Date();
    let total = 0;
    const { data: families, error } = await admin.from("families").select("id, tz, config");
    if (error) return json({ error: error.message }, 500);

    for (const f of families ?? []) {
      const { date, minutes } = localParts(now, f.tz);
      const [{ data: dayRow }, { data: appts }] = await Promise.all([
        admin.from("days").select("data").eq("family_id", f.id).eq("day", date).maybeSingle(),
        admin.from("appointments").select("id, kind, on_date, at_time, title, place, done").eq("family_id", f.id).eq("done", false).gte("on_date", date),
      ]);
      const due = dueReminders({ config: f.config, day: dayRow?.data ?? {}, appts: appts ?? [], date, minutes, windowMin: 10 });
      if (!due.length) continue;

      const { data: members } = await admin.from("family_members").select("user_id, role").eq("family_id", f.id);
      const { data: subs } = await admin.from("push_subscriptions").select("id, user_id, endpoint, p256dh, auth").eq("family_id", f.id);

      for (const r of due) {
        // The primary key (family, day, key) makes sure each reminder goes out once.
        const { error: dup } = await admin.from("reminder_log").insert({ family_id: f.id, day: date, key: r.key });
        if (dup) continue;
        const ids = (members ?? []).filter((m) => r.to === "both" || m.role === "tracker").map((m) => m.user_id);
        total += await send(((subs ?? []) as Sub[]).filter((s) => ids.includes(s.user_id)), { title: r.title, body: r.body, tag: r.key });
      }
    }

    // Keep the log small.
    await admin.from("reminder_log").delete().lt("sent_at", new Date(now.getTime() - 7 * 86400000).toISOString());
    return json({ sent: total, families: (families ?? []).length });
  } catch (e) {
    console.error("send-reminders failed", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
