// node tests/push-payload.mjs — payload privacy + Web Push encryption (local mock, no Cloudflare, no real endpoints)
import { cleanAlarms, cleanSub, payloadOf, handleRequest, handleScheduled } from '../worker/src/index.js';
import { readSched } from '../worker/src/schedule.js';
import { generateVapidKeys, encryptWebPush, decryptWebPush, b64url, pushNote, sendWebPush } from '../worker/src/webpush.js';

const enc = new TextEncoder();
let ok = true;
const check = (name, cond, detail) => {
  if (!cond) { ok = false; console.log('FAIL', name, detail || ''); }
  else console.log('ok', name, detail || '');
};

// Client-side builder (mirrors index.html pushKind/pushAlarms). Must never copy rider/address fields.
const pushKind = (k, why) => /h$/.test(k) || /HEAT/.test(why || '') ? 'heat' : /p$/.test(k) || /PREP/.test(why || '') ? 'prep' : 'leave';
const pushAlarmsOf = (due) => due.filter(d => d.at > Date.now() && d.a.fired != d.key).map(d => ({
  id: String(d.j.uid) + '|' + d.k,
  kind: pushKind(d.k, d.a.why),
  at: Math.round(+d.at)
}));

const at = Date.now() + 10 * 60e3;
const due = [{
  j: { uid: 'JOB1', client: 'Test Rider', raw: 'Test Rider', from: '1 Secret St', to: '2 Hidden Ave' },
  x: { n: 1, pk: '1 Secret St', dz: '2 Hidden Ave', t: new Date(at + 19 * 60e3) },
  a: { lead: 19, why: 'HEAT-UP ALARM — start the vehicle, leave in 19 min', fired: '' },
  at, key: 'k1', k: '1h'
}, {
  j: { uid: 'JOB1', client: 'Test Rider' },
  x: { n: 1 },
  a: { lead: 8, why: 'PREP ALARM — get ready, leave in 8 min', fired: '' },
  at: at + 11 * 60e3, key: 'k2', k: '1p'
}, {
  j: { uid: 'JOB1', client: 'Test Rider' },
  x: { n: 1 },
  a: { lead: 0, why: '', fired: '' },
  at: at + 19 * 60e3, key: 'k3', k: 1
}];
const alarms = pushAlarmsOf(due);
check('three kinds', alarms.map(a => a.kind).join(',') === 'heat,prep,leave', JSON.stringify(alarms));
const blob = JSON.stringify(alarms);
check('no rider/address in client alarms', !/Test Rider|Secret St|Hidden Ave|client|from|to|pk|dz/.test(blob), blob);
check('only id,kind,at keys', alarms.every(a => Object.keys(a).sort().join(',') === 'at,id,kind'));

const dirty = cleanAlarms([
  { id: 'JOB1|1h', kind: 'heat', at, client: 'Test Rider', address: '1 Secret St' },
  { id: 'bad', kind: 'explode', at },
  { id: 'JOB1|1', kind: 'leave', at: at + 1, name: 'Levi' }
]);
check('sanitizer drops extra fields and bad kinds', dirty.length === 2 && dirty.every(a => Object.keys(a).sort().join(',') === 'at,id,kind') && !JSON.stringify(dirty).includes('Rider') && !JSON.stringify(dirty).includes('Levi'));
check('payloadOf only kind+at', (() => { const p = JSON.parse(payloadOf(dirty[0])); return Object.keys(p).sort().join(',') === 'at,kind' && p.kind === 'heat'; })());

check('cleanSub requires https endpoint + keys', !cleanSub({ endpoint: 'http://evil', keys: { p256dh: 'x', auth: 'y' } }) && !!cleanSub({ endpoint: 'https://fcm.googleapis.com/x', keys: { p256dh: 'aaa', auth: 'bbb' } }));

check('pushNote titles', pushNote('leave', Date.parse('2026-11-18T07:42:00')).title === 'Time to leave' && pushNote('prep', 0).title === 'Get ready' && pushNote('heat', 0).title === 'Warm the car');

// Encryption round-trip with a local mock subscriber (no network)
const ua = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
const uaJwk = await crypto.subtle.exportKey('jwk', ua.privateKey);
const uaPub = new Uint8Array(65);
uaPub[0] = 4;
uaPub.set(b64url.dec(uaJwk.x), 1);
uaPub.set(b64url.dec(uaJwk.y), 33);
const auth = crypto.getRandomValues(new Uint8Array(16));
const payload = payloadOf({ kind: 'leave', at: 1731927720000 });
const body = await encryptWebPush(payload, b64url.enc(uaPub), b64url.enc(auth));
const plain = await decryptWebPush(body, ua.privateKey, auth);
check('decrypt matches payload', plain === payload, plain);
const parsed = JSON.parse(plain);
check('decrypted keys only kind+at', Object.keys(parsed).sort().join(',') === 'at,kind' && parsed.kind === 'leave');
check('decrypted has no PII', !/Rider|Secret|address|client/i.test(plain));

// Mock KV + /schedule + cron send
function memKV() {
  const m = new Map();
  return {
    async get(k, opts) { const v = m.get(k); if (v == null) return null; return opts && opts.type === 'json' ? JSON.parse(v) : v; },
    async put(k, v) { m.set(k, typeof v === 'string' ? v : JSON.stringify(v)); m._raw = m; }
  };
}
const kv = memKV();
const vapid = await generateVapidKeys();
const env = { SCHED: kv, VAPID_PUBLIC_KEY: vapid.publicKey, VAPID_PRIVATE_KEY: vapid.privateKey, VAPID_SUBJECT: 'mailto:test@example.com' };

const posted = [];
const fetchImpl = async (url, init) => {
  posted.push({ url, headers: init.headers, body: init.body });
  return { status: 201 };
};

const sub = { endpoint: 'https://fcm.googleapis.com/wp/test-endpoint', keys: { p256dh: b64url.enc(uaPub), auth: b64url.enc(auth) } };
const schedReq = new Request('https://worker.test/schedule', {
  method: 'POST',
  headers: { origin: 'http://127.0.0.1:8813', 'content-type': 'application/json' },
  body: JSON.stringify({
    subscription: { ...sub, client: 'Test Rider', extra: true },
    alarms: [{ id: 'JOB1|1', kind: 'leave', at: Date.now() - 1000, client: 'Test Rider', addr: '1 Secret St' }]
  })
});
const res = await handleRequest(schedReq, env);
const rj = await res.json();
check('schedule ok', res.status === 200 && rj.ok && rj.n === 1, JSON.stringify(rj));
const stored = await readSched(kv);
const storedBlob = JSON.stringify(stored);
check('kv has no rider/address', !/Test Rider|Secret St|client|addr/.test(storedBlob.replace(/"keys":\{[^}]+\}/g, '')), storedBlob.slice(0, 400));
check('kv alarms sanitized', stored.subs[0].alarms[0].kind === 'leave' && !('client' in stored.subs[0].alarms[0]));

const cron = await handleScheduled(env, Date.now(), fetchImpl);
check('cron sent one', cron.sent === 1 && posted.length === 1, JSON.stringify(cron));
check('urgency high and TTL 300', posted[0].headers.Urgency === 'high' && String(posted[0].headers.TTL) === '300');
const sentPlain = await decryptWebPush(posted[0].body, ua.privateKey, auth);
check('sent payload only kind+at', (() => { const o = JSON.parse(sentPlain); return Object.keys(o).sort().join(',') === 'at,kind' && o.kind === 'leave'; })(), sentPlain);
check('sent payload no PII', !/Rider|Secret|client|addr/i.test(sentPlain));

const health = await handleRequest(new Request('https://worker.test/health'), env);
const healthTxt = await health.text();
check('health no secrets', health.status===200 && /"ok":true/.test(healthTxt) && !/VAPID|private/i.test(healthTxt));

console.log(ok ? 'PUSH-PAYLOAD PASS' : 'PUSH-PAYLOAD FAIL');
process.exit(ok ? 0 : 1);
