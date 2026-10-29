/* Driver Schedule service worker: alarms + static asset cache (perf v1). */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
const opts=a=>({body:a.body,tag:a.tag,renotify:true,requireInteraction:true,vibrate:[1000,300,1000,300,1000,300,1000,300,1000,300,1000],icon:'icon-192.png',badge:'icon-192.png',data:{url:self.registration.scope},timestamp:a.at||Date.now()});
self.addEventListener('message',e=>{const m=e.data||{};
 if(m.type=='fire')e.waitUntil(self.registration.showNotification(m.title,opts(m)));
 if(m.type=='schedule'&&'showTrigger' in Notification.prototype&&typeof TimestampTrigger!='undefined'){
  e.waitUntil((async()=>{const old=await self.registration.getNotifications({includeTriggered:false});old.forEach(n=>n.data&&n.data.sched&&n.close());
   for(const a of m.list||[])if(a.at>Date.now())await self.registration.showNotification(a.title,{...opts(a),showTrigger:new TimestampTrigger(a.at),data:{url:self.registration.scope,sched:1}})})())}});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil((async()=>{const L=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const c of L){if('focus' in c){c.postMessage({type:'alarmclick',tag:e.notification.tag});return c.focus()}}return self.clients.openWindow(self.registration.scope)})())});
/* perf v1: icons/images/json cached stale-while-revalidate so they never reload per screen; HTML network-first; Apps Script never cached */
/* autoupdate v1: bump VER with each release (matches <meta name=ds-ver> in index.html); old caches are deleted on activate */
const VER='2026-10-29.16',SC='ds-static-'+VER;
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(K=>Promise.all(K.filter(k=>k.startsWith('ds-static-')&&k!=SC).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);if(r.method!='GET'||u.origin!=location.origin)return;
 if(r.mode=='navigate'||/\.html?$/.test(u.pathname)){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(SC).then(k=>k.put(r,c));return x}).catch(()=>caches.match(r)));return}
 if(/\.(png|ico|svg|jpg|webp|json)$/.test(u.pathname))e.respondWith(caches.open(SC).then(k=>k.match(r).then(hit=>{const f=fetch(r).then(x=>{if(x.ok)k.put(r,x.clone());return x}).catch(()=>hit);return hit||f})))});
