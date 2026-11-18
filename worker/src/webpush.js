/* Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) using Web Crypto only. */
const enc = new TextEncoder();

export const b64url = {
  enc(buf) {
    const b = buf instanceof ArrayBuffer ? new Uint8Array(buf) : buf;
    let s = '';
    for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  },
  dec(str) {
    const s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    const pad = s + '===='.slice((s.length % 4) || 4);
    const bin = atob(pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
};

export function pushNote(kind, at) {
  const t = new Date(+at || Date.now()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  if (kind === 'heat') return { title: 'Warm the car', body: 'Heat-up at ' + t };
  if (kind === 'prep') return { title: 'Get ready', body: 'Prep at ' + t };
  return { title: 'Time to leave', body: 'Leave at ' + t };
}

function concat(...parts) {
  const arr = parts.map(p => (typeof p === 'string' ? enc.encode(p) : p instanceof ArrayBuffer ? new Uint8Array(p) : p));
  const out = new Uint8Array(arr.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of arr) { out.set(p, o); o += p.length; }
  return out;
}

async function hmac(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}

async function hkdf(salt, ikm, info, len) {
  const prk = await hmac(salt, ikm);
  const okm = await hmac(prk, concat(info, new Uint8Array([1])));
  return okm.slice(0, len);
}

export async function importVapidPrivate(b64) {
  const raw = b64url.dec(b64);
  // 32-byte raw scalar, or PKCS8, or JWK-as-base64 — we store a 32-byte scalar or a 64-char hex.
  // Preferred: base64url of 32-byte d, plus we also accept JWK JSON in the secret? Keep it simple:
  // secret is base64url(32-byte private scalar). Public key is provided separately.
  if (raw.length !== 32) throw new Error('VAPID_PRIVATE_KEY must be 32-byte base64url');
  return raw;
}

export async function vapidKeyPairFromScalar(dBytes, pubRaw) {
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    d: b64url.enc(dBytes),
    x: b64url.enc(pubRaw.slice(1, 33)),
    y: b64url.enc(pubRaw.slice(33, 65)),
    ext: true
  };
  const priv = await crypto.subtle.importKey('jwk', { ...jwk, key_ops: ['sign'] }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  return { priv, pubRaw };
}

export async function generateVapidKeys() {
  const pair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  const pub = new Uint8Array(65);
  pub[0] = 4;
  pub.set(b64url.dec(jwk.x), 1);
  pub.set(b64url.dec(jwk.y), 33);
  return { publicKey: b64url.enc(pub), privateKey: jwk.d, pubRaw: pub };
}

export async function vapidHeader(endpoint, privScalar, pubRaw, subject, exp = Math.floor(Date.now() / 1000) + 12 * 3600) {
  const aud = new URL(endpoint).origin;
  const { priv } = await vapidKeyPairFromScalar(privScalar, pubRaw);
  const head = b64url.enc(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const body = b64url.enc(enc.encode(JSON.stringify({ aud, exp, sub: subject })));
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, priv, enc.encode(head + '.' + body));
  const jwt = head + '.' + body + '.' + b64url.enc(sig);
  return 'vapid t=' + jwt + ', k=' + b64url.enc(pubRaw);
}

export async function encryptWebPush(payload, p256dh, auth) {
  const uaPubRaw = b64url.dec(p256dh);
  const authSecret = b64url.dec(auth);
  if (uaPubRaw.length !== 65 || uaPubRaw[0] !== 4) throw new Error('bad p256dh');
  if (authSecret.length < 16) throw new Error('bad auth');

  const as = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asJwk = await crypto.subtle.exportKey('jwk', as.privateKey);
  const asPubRaw = new Uint8Array(65);
  asPubRaw[0] = 4;
  asPubRaw.set(b64url.dec(asJwk.x), 1);
  asPubRaw.set(b64url.dec(asJwk.y), 33);

  const uaKey = await crypto.subtle.importKey('raw', uaPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, as.privateKey, 256));

  const info = concat('WebPush: info\0', uaPubRaw, asPubRaw);
  const ikm = await hkdf(authSecret, shared, info, 32);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  const plain = typeof payload === 'string' ? enc.encode(payload) : payload;
  const record = concat(plain, new Uint8Array([2]));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, record));

  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + 65);
  header.set(salt, 0);
  header[16] = (rs >>> 24) & 255;
  header[17] = (rs >>> 16) & 255;
  header[18] = (rs >>> 8) & 255;
  header[19] = rs & 255;
  header[20] = 65;
  header.set(asPubRaw, 21);
  return concat(header, sealed);
}

export async function decryptWebPush(body, uaPriv, auth) {
  // Test helper: decrypt a body produced by encryptWebPush, given the subscriber's ECDH private key (CryptoKey) and auth secret bytes.
  const u8 = body instanceof Uint8Array ? body : new Uint8Array(body);
  const salt = u8.slice(0, 16);
  const idlen = u8[20];
  const asPubRaw = u8.slice(21, 21 + idlen);
  const sealed = u8.slice(21 + idlen);
  const uaJwk = await crypto.subtle.exportKey('jwk', uaPriv);
  const uaPubRaw = new Uint8Array(65);
  uaPubRaw[0] = 4;
  uaPubRaw.set(b64url.dec(uaJwk.x), 1);
  uaPubRaw.set(b64url.dec(uaJwk.y), 33);
  const asKey = await crypto.subtle.importKey('raw', asPubRaw, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: 'ECDH', public: asKey }, uaPriv, 256));
  const info = concat('WebPush: info\0', uaPubRaw, asPubRaw);
  const ikm = await hkdf(auth, shared, info, 32);
  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['decrypt']);
  const rec = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, key, sealed));
  if (rec[rec.length - 1] !== 2) throw new Error('bad padding delimiter');
  return new TextDecoder().decode(rec.slice(0, -1));
}

export async function sendWebPush({ endpoint, p256dh, auth, payload, vapidPriv, vapidPub, subject, ttl = 300, urgency = 'high', fetchImpl = fetch }) {
  const body = await encryptWebPush(payload, p256dh, auth);
  const authorization = await vapidHeader(endpoint, vapidPriv, vapidPub, subject);
  const res = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      Authorization: authorization,
      TTL: String(ttl),
      Urgency: urgency,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream'
    },
    body
  });
  return res;
}
