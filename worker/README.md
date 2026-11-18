# Closed-app alarm sender (Cloudflare Worker)

Sends a **visible** Web Push at heat-up / prep / leave time so Android Chrome can wake the screen when Driver Schedule is closed. This is not a silent push.

- One KV record holds every phone’s subscription and due alarm times.
- A 1-minute cron sends any alarms that are due.
- Each request uses `Urgency: high` and `TTL: 300` (5 minutes).
- The encrypted payload is only `{ "kind": "leave"|"prep"|"heat", "at": <ms> }` — no rider names, addresses, or trip notes.
- The VAPID **private** key is a Worker secret. It must never go in this repo, in `push.json`, or in chat.

Do not touch `sheet-sync.gs`. This worker is separate from the Google Sheet sync.

## What Jeffrey does once (free Cloudflare account)

These steps are also in the report. Nothing is deployed until he has the account and says to deploy.

1. Create a free account at [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. On a computer with Node, in this `worker/` folder:
   - `npx wrangler login` (approve in the browser).
   - `npx wrangler kv namespace create SCHED`
   - Paste the printed id into `wrangler.toml` as `id = "..."` (replace `YOUR_KV_NAMESPACE_ID`).
   - `node scripts/gen-vapid.js` — copy the **public** key into repo root `push.json` (`vapidPublicKey`) and keep the **private** key only for the next command. Do not commit the private key. Do not paste it into chat.
   - `npx wrangler secret put VAPID_PRIVATE_KEY` (paste the private key at the prompt).
   - `npx wrangler secret put VAPID_PUBLIC_KEY` (paste the public key).
   - `npx wrangler deploy`
   - Put the printed Worker URL (like `https://driver-schedule-push.<account>.workers.dev`) into repo root `push.json` as `url`.
3. Commit only `push.json` (url + public key) and the real KV `id` in `wrangler.toml`. Never commit `.dev.vars` or the private key.
4. After `push.json` is live on GitHub Pages, each driver enables closed-app alarms in the app (see driver steps in the plan / report).

Local dev (optional): copy `.dev.vars.example` to `.dev.vars`, fill keys that you generated locally, and run `npx wrangler dev`. `.dev.vars` is gitignored.

## API

- `GET /health` — `{ ok: true }` (no secrets).
- `POST /schedule` — body `{ subscription, alarms: [{ id, kind, at }] }`. Replaces that subscription’s alarm list. Empty `alarms` clears it.
- Cron `* * * * *` — send due alarms, then prune.

Allowed browser origins: `https://rexxnar89.github.io` and localhost for testing.
