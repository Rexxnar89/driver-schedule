/* One-KV-record schedule. Payloads may only contain alarm kind + clock time (+ a non-identifying id). */
export const KINDS = Object.freeze(['leave', 'prep', 'heat']);
const KEY = 'sched';
const MAX_SUBS = 40;
const MAX_ALARMS = 80;

export function cleanAlarms(arr) {
  if (!Array.isArray(arr)) return [];
  const out = [], seen = new Set();
  for (const a of arr.slice(0, MAX_ALARMS)) {
    if (!a || typeof a !== 'object') continue;
    const kind = a.kind;
    const at = Math.round(+a.at);
    const id = String(a.id || '').slice(0, 80);
    if (!KINDS.includes(kind) || !id || !Number.isFinite(at) || at < 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ id, kind, at });
  }
  return out;
}

export function cleanSub(s) {
  if (!s || typeof s !== 'object') return null;
  const endpoint = typeof s.endpoint === 'string' ? s.endpoint.trim() : '';
  if (!/^https:\/\//.test(endpoint) || endpoint.length > 2000) return null;
  const keys = s.keys || {};
  const p256dh = typeof keys.p256dh === 'string' ? keys.p256dh : '';
  const auth = typeof keys.auth === 'string' ? keys.auth : '';
  if (!p256dh || !auth || p256dh.length > 200 || auth.length > 200) return null;
  return { endpoint, keys: { p256dh, auth } };
}

export function payloadOf(alarm) {
  return JSON.stringify({ kind: alarm.kind, at: alarm.at });
}


export async function readSched(kv) {
  try {
    const v = await kv.get(KEY, { type: 'json' });
    if (v && typeof v === 'object' && Array.isArray(v.subs)) return v;
  } catch (e) {}
  return { updated: 0, subs: [] };
}

export async function writeSched(kv, data) {
  data.updated = Date.now();
  await kv.put(KEY, JSON.stringify(data));
}

export async function upsertSchedule(kv, sub, alarms) {
  const data = await readSched(kv);
  const next = { endpoint: sub.endpoint, keys: sub.keys, alarms };
  const i = data.subs.findIndex(s => s.endpoint === sub.endpoint);
  if (i >= 0) data.subs[i] = next;
  else {
    if (data.subs.length >= MAX_SUBS) data.subs.shift();
    data.subs.push(next);
  }
  if (!alarms.length) data.subs = data.subs.filter(s => s.endpoint !== sub.endpoint);
  await writeSched(kv, data);
  return data;
}

export function dueAlarms(data, now, ttlMs = 300000) {
  const out = [];
  for (const s of data.subs || []) {
    for (const a of s.alarms || []) {
      if (a.sent) continue;
      if (a.at <= now && now - a.at < ttlMs) out.push({ sub: s, alarm: a });
    }
  }
  return out;
}

export function markSentAndPrune(data, now, ttlMs = 300000) {
  for (const s of data.subs || []) {
    s.alarms = (s.alarms || []).filter(a => {
      if (a.sent) return a.at > now - ttlMs;
      if (now - a.at >= ttlMs && a.at <= now) return false;
      return a.at > now - 36e5 * 24; // drop anything over a day old/past
    });
  }
  data.subs = (data.subs || []).filter(s => s.alarms && s.alarms.length);
  return data;
}
