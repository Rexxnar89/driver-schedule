#!/usr/bin/env node
/* Generate a VAPID key pair. Prints the PUBLIC key (safe for push.json) and
   instructions for storing the PRIVATE key as a Worker secret.
   Do not commit the private key. Do not paste it into chat. */
import { generateVapidKeys } from '../src/webpush.js';

const keys = await generateVapidKeys();
console.log('VAPID public key (safe to put in push.json vapidPublicKey, and as wrangler var/secret VAPID_PUBLIC_KEY):');
console.log(keys.publicKey);
console.log('');
console.log('VAPID private key — keep this off git, off Pages, and out of chat.');
console.log('Set it as a Worker secret (you will be prompted to paste; it is not echoed in wrangler after that):');
console.log('  cd worker && npx wrangler secret put VAPID_PRIVATE_KEY');
console.log('');
console.log('Private key (copy once into that prompt, then delete this terminal scroll if needed):');
console.log(keys.privateKey);
