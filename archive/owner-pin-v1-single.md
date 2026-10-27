# Owner PIN v1 (single owner), archived 2026-10-26
Shipped in a18f866 and replaced the same night by the two-owner version (Jeffrey + BB). It stored one `localStorage.pinCfg` = {on,salt,hash,ts} and synced it to sheet key `ownerPin`. v2 migrates pinCfg to Jeffrey's slot. Original code:

```html
<style>
#pinov{position:fixed;inset:0;background:rgba(15,25,40,.82);z-index:99999;display:flex;align-items:center;justify-content:center}
#pinov .pbox{background:#fff;border-radius:16px;padding:18px 16px;width:min(320px,92vw);text-align:center;box-shadow:0 8px 30px #0006}
#pinov .pt{font-weight:800;font-size:1.1rem;margin-bottom:4px}#pinov .pm{min-height:1.3em;font-size:.85rem;color:#c62828}
#pinov .pd{font-size:1.8rem;letter-spacing:10px;min-height:1.4em;margin:6px 0}
#pinov .pk{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px}
#pinov .pk button{min-height:60px;font-size:1.5rem;font-weight:700;border-radius:12px;border:1px solid #b0bec5;background:#eceff1;color:#263238}
#pinov .pk .ok{background:#2e7d32;color:#fff;border-color:#2e7d32}#pinov .pl{margin-top:10px;display:flex;justify-content:space-between;font-size:.85rem}
#pinov .pl a{color:#1565c0;cursor:pointer;text-decoration:underline}
#pinov .shake{animation:pinshake .4s}@keyframes pinshake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-12px)}40%,80%{transform:translateX(12px)}}
#pinset .sw{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:48px;font-weight:700}
#pinset input[type=checkbox]{width:52px;height:30px;accent-color:#2e7d32}
</style>
<script>
(function(){
const K='ownerPin',TTL=30*60e3;
const cfg=()=>{try{return JSON.parse(LS.pinCfg||'{}')}catch(e){return{}}},put=c=>{LS.pinCfg=JSON.stringify(c)};
window.PINSYNC=LS.syncurl?'checking':'local';
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
const H=async(p,s)=>hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s+':'+p)));
const unlocked=()=>Date.now()-(+sessionStorage.ownerUnlock||0)<TTL;
async function push(c){if(!LS.syncurl){PINSYNC='local';return}try{const r=await fetch(LS.syncurl,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({secret:LS.syncsec,action:'savesetting',key:K,value:c})});const k=await r.json();if(k.ok){PINSYNC='sheet';if(k.stale&&k.value)put({...k.value,synced:1});else put({...c,synced:1})}else PINSYNC='redeploy'}catch(e){PINSYNC='offline'}}
async function pull(){if(!LS.syncurl){PINSYNC='local';return}try{const r=await fetch(LS.syncurl+'?action=getsettings&secret='+encodeURIComponent(LS.syncsec||''),{cache:'no-store'});const j=await r.json();if(!j.ok||!j.settings){PINSYNC='redeploy';return}PINSYNC='sheet';const s=j.settings[K],c=cfg();
 if(s&&(+s.ts||0)>=(+c.ts||0))put({...s,synced:1});else if(!s&&c.synced)put({});else if(c.ts)push(c)}catch(e){PINSYNC='offline'}}
async function save(c){const {synced,...v}=c;v.ts=Date.now();put(v);await push(v)}
window.pinPull=pull;
// number pad; check(d) -> true (accept) | string (error msg, shake)
function pad(title,check,forgot){return new Promise(res=>{let d='';const ov=document.createElement('div');ov.id='pinov';
 ov.innerHTML=`<div class="pbox"><div class="pt">${title}</div><div class="pd"></div><div class="pm"></div><div class="pk">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" data-k="${n}">${n}</button>`).join('')}<button type="button" data-k="b">⌫</button><button type="button" data-k="0">0</button><button type="button" class="ok" data-k="ok">OK</button></div><div class="pl"><a data-k="x">Cancel</a>${forgot?'<a data-k="f">Forgot PIN?</a>':''}</div></div>`;
 document.body.appendChild(ov);const box=ov.querySelector('.pbox'),dd=ov.querySelector('.pd'),mm=ov.querySelector('.pm'),draw=()=>dd.textContent='●'.repeat(d.length)||' ';draw();
 const done=v=>{ov.remove();res(v)};
 ov.addEventListener('click',async e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k)return;
  if(k=='x')return done(null);if(k=='f'){if(await forgot())done(null);return}
  if(k=='b'){d=d.slice(0,-1);draw();return}
  if(k=='ok'){const r=await check(d);if(r===true)return done(d);mm.textContent=r;d='';draw();box.classList.remove('shake');void box.offsetWidth;box.classList.add('shake');return}
  if(d.length<6){d+=k;draw();mm.textContent=''}})})}
const fmt=d=>/^\d{4,6}$/.test(d)?true:'PIN must be 4–6 digits';
async function verify(title){const c=cfg();return (await pad(title,async d=>{const until=+LS.pinLock||0;if(until>Date.now())return 'Too many tries. Wait '+Math.ceil((until-Date.now())/1000)+'s.';
 if(await H(d,c.salt)===c.hash){LS.pinMiss=0;return true}const m=(+LS.pinMiss||0)+1;if(m>=5){LS.pinMiss=0;LS.pinLock=Date.now()+60e3;return 'Wrong PIN. Locked for 1 minute.'}LS.pinMiss=m;return 'Wrong PIN ('+(5-m)+' left)'},forgot))!=null}
async function newPin(){const a=await pad('New PIN (4–6 digits)',async d=>fmt(d));if(a==null)return false;const b=await pad('Type the new PIN again',async d=>d===a?true:'PINs don\'t match');if(b==null)return false;
 const salt=hex(crypto.getRandomValues(new Uint8Array(16)));await save({on:true,salt,hash:await H(a,salt)});sessionStorage.ownerUnlock=Date.now();return true}
async function forgot(){const s=prompt(LS.syncsec?'Reset the Owner PIN: paste the sync secret (the one in Owner → sync setup on this phone).':'This phone has no sync secret, so the PIN is local only. Type RESET to turn the PIN off on this phone.');if(s==null)return false;
 if(LS.syncsec?s.trim()===LS.syncsec:s.trim().toUpperCase()=='RESET'){await save({on:false});LS.pinMiss=0;LS.pinLock=0;alert('Owner PIN turned off.');return true}alert('That doesn\'t match.');return false}
const _show=window.show;window.show=function(s){if(s=='owner'&&cfg().on&&!unlocked()){verify('🔒 Enter Owner PIN').then(ok=>{if(ok){sessionStorage.ownerUnlock=Date.now();_show('owner')}});return}return _show.apply(this,arguments)};
setInterval(()=>{if(cfg().on&&!unlocked()&&!$('owner').classList.contains('hide'))_show('driver')},15000);
function note(){return {sheet:'Synced to the Google Sheet (works on every phone).',local:'Saved on this phone only (no sync URL set).',redeploy:'Saved on this phone only: the Apps Script needs a redeploy before the PIN syncs to other phones.',offline:'Saved on this phone only (sheet unreachable right now).',checking:'Checking the sheet…'}[PINSYNC]||''}
window.pinSettings=function(){const c=cfg();let m=$('pinset');if(m)m.remove();m=document.createElement('div');m.id='pinset';m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center';
 m.innerHTML=`<div style="background:#fff;border-radius:14px;padding:16px;width:min(360px,92vw)"><div style="font-weight:800;font-size:1.15rem;margin-bottom:8px">⚙ Owner settings</div><label class="sw">Require PIN for Owner view<input type="checkbox" id="pinsw" ${c.on?'checked':''}></label>${c.on?'<button type="button" class="btn" id="pinchg" style="width:100%;min-height:44px;margin:6px 0">Change PIN</button>':''}<div style="font-size:.8rem;color:#555;margin:6px 0">${note()}</div><div style="font-size:.75rem;color:#777">Unlocks for 30 minutes or until the app is closed. 5 wrong tries lock the pad for 1 minute.</div><div style="text-align:right;margin-top:10px"><button type="button" class="btn" id="pinx" style="min-height:44px">Close</button></div></div>`;
 document.body.appendChild(m);$('pinx').onclick=()=>m.remove();
 $('pinsw').onchange=async e=>{e.target.checked=!e.target.checked;const ok=cfg().on?(await verify('Enter current PIN to turn it off')&&(await save({on:false}),true)):await newPin();pinSettings();if(ok)alert(cfg().on?'Owner PIN is on.':'Owner PIN is off.')};
 if($('pinchg'))$('pinchg').onclick=async()=>{if(await verify('Enter current PIN')&&await newPin())alert('PIN changed.');pinSettings()}};
const g=document.createElement('button');g.type='button';g.className='btn';g.textContent='⚙ Settings';g.title='Owner settings';g.style.cssText='float:right;min-height:44px;margin:4px 0 4px 8px';g.onclick=()=>pinSettings();$('owner').prepend(g);
pull();
})();
</script>
```
