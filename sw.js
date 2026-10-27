/* Driver Schedule alarm service worker: notifications only, no caching. */
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
const opts=a=>({body:a.body,tag:a.tag,renotify:true,requireInteraction:true,vibrate:[1000,300,1000,300,1000,300,1000,300,1000,300,1000],icon:'icon-192.png',badge:'icon-192.png',data:{url:self.registration.scope},timestamp:a.at||Date.now()});
self.addEventListener('message',e=>{const m=e.data||{};
 if(m.type=='fire')e.waitUntil(self.registration.showNotification(m.title,opts(m)));
 if(m.type=='schedule'&&'showTrigger' in Notification.prototype&&typeof TimestampTrigger!='undefined'){
  e.waitUntil((async()=>{const old=await self.registration.getNotifications({includeTriggered:false});old.forEach(n=>n.data&&n.data.sched&&n.close());
   for(const a of m.list||[])if(a.at>Date.now())await self.registration.showNotification(a.title,{...opts(a),showTrigger:new TimestampTrigger(a.at),data:{url:self.registration.scope,sched:1}})})())}});
self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil((async()=>{const L=await self.clients.matchAll({type:'window',includeUncontrolled:true});for(const c of L){if('focus' in c){c.postMessage({type:'alarmclick',tag:e.notification.tag});return c.focus()}}return self.clients.openWindow(self.registration.scope)})())});
