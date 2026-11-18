/* Driver Schedule closed-app alarm sender.
   One KV record, 1-minute cron, Urgency: high, TTL: 300.
   Payload is only {kind, at}. VAPID private key comes from a Worker secret. */
import { sendWebPush, b64url, pushNote } from './webpush.js';
import { cleanAlarms, cleanSub, payloadOf, upsertSchedule, readSched, writeSched, dueAlarms, markSentAndPrune } from './schedule.js';

const ALLOW = [
  'https://rexxnar89.github.io',
  'http://localhost',
  'http://127.0.0.1'
];

function cors(origin) {
  const ok = origin && (ALLOW.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));
  const o = ok ? origin : ALLOW[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...cors(origin) }
  });
}

function vapidBits(env) {
  const pub = env.VAPID_PUBLIC_KEY && env.VAPID_PUBLIC_KEY.trim();
  const privB64 = env.VAPID_PRIVATE_KEY && env.VAPID_PRIVATE_KEY.trim();
  if (!pub || !privB64) return null;
  return {
    pubRaw: b64url.dec(pub),
    priv: b64url.dec(privB64),
    sub: (env.VAPID_SUBJECT || 'mailto:rexxnar89@users.noreply.github.com').trim()
  };
}

export async function handleRequest(req, env) {
  const origin = req.headers.get('Origin') || '';
  const url = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    return json({ ok: true, service: 'driver-schedule-push' }, 200, origin);
  }
  if (req.method === 'POST' && url.pathname === '/schedule') {
    let body;
    try { body = await req.json(); } catch (e) { return json({ ok: false, error: 'bad json' }, 400, origin); }
    const sub = cleanSub(body && body.subscription);
    if (!sub) return json({ ok: false, error: 'bad subscription' }, 400, origin);
    const alarms = cleanAlarms(body && body.alarms);
    if (!env.SCHED) return json({ ok: false, error: 'kv not bound' }, 500, origin);
    await upsertSchedule(env.SCHED, sub, alarms);
    return json({ ok: true, n: alarms.length }, 200, origin);
  }
  return json({ ok: false, error: 'not found' }, 404, origin);
}

export async function handleScheduled(env, now = Date.now(), fetchImpl) {
  if (!env.SCHED) return { sent: 0, error: 'kv not bound' };
  const vapid = vapidBits(env);
  if (!vapid) return { sent: 0, error: 'missing vapid secrets' };
  const data = await readSched(env.SCHED);
  const due = dueAlarms(data, now, 300000);
  let sent = 0, failed = 0;
  for (const { sub, alarm } of due) {
    try {
      const payload = payloadOf(alarm);
      const res = await sendWebPush({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        payload,
        vapidPriv: vapid.priv,
        vapidPub: vapid.pubRaw,
        subject: vapid.sub,
        ttl: 300,
        urgency: 'high',
        fetchImpl: fetchImpl || fetch
      });
      if (res && res.status >= 200 && res.status < 300) {
        alarm.sent = now;
        sent++;
      } else if (res && (res.status === 404 || res.status === 410)) {
        // gone subscription
        sub.alarms = [];
        failed++;
      } else {
        failed++;
      }
    } catch (e) {
      failed++;
    }
  }
  markSentAndPrune(data, now, 300000);
  await writeSched(env.SCHED, data);
  return { sent, failed };
}

export { pushNote, cleanAlarms, cleanSub, payloadOf };

export default {
  async fetch(req, env) {
    return handleRequest(req, env);
  },
  async scheduled(_event, env, ctx) {
    const run = handleScheduled(env);
    if (ctx && ctx.waitUntil) ctx.waitUntil(run);
    await run;
  }
};
