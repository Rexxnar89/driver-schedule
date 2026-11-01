const p=require('puppeteer-core');const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
async function phone(b){const ctx=await b.createBrowserContext();const pg=await ctx.newPage();await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);const posts=[];pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u)){posts.push(r.postData()||'');return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'})}r.continue()});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept());await pg.goto(U+'?x='+Date.now());await W(6000);return{pg,errs,posts}}
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const A=await phone(b),B=await phone(b);const J=()=>{const t=new Date(Date.now()+10*6e4);jobs.push({uid:'AL41',evuid:'AL41',start:t,endT:new Date(+t+36e5),driver:'BB',client:'Test Rider',title:'Test Rider',raw:'Test Rider',from:'1 A St',to:'2 B Ave',pax:1})};
await A.pg.evaluate(J);await B.pg.evaluate(J);
const r={};
r.devs=[await A.pg.evaluate(()=>DSDEV()),await B.pg.evaluate(()=>DSDEV())];
// Phone A sets a drive alarm (15 min lead -> already due) + prep alarm, then ticks
r.A=await A.pg.evaluate(async()=>{alarmSet('AL41',1,15);document.getElementById('alarmdlg')?.remove();alarmPrep('AL41',1);document.getElementById('alarmdlg')?.remove();const st=JSON.parse(MS.getItem('st')||'{}');_alTick();await new Promise(r=>setTimeout(r,500));const rang=!!document.getElementById('alarmov');const why=document.getElementById('alarmov')?.innerText.slice(0,80);alarmStop(1);const snz=_alAL('AL41')[1]&&_alAL('AL41')[1].snz;return{rang,why,AL:_alAL('AL41'),stHasAlarms:!!(st.AL41&&st.AL41.alarms),myalTracked:(()=>{let t=null;try{const d0=MS.getItem('__kvdirty');MS.setItem('myal',MS.getItem('myal'));syncDirty&&syncDirty('myal');t=(MS.getItem('__kvdirty')||'').includes('myal')}catch(e){t='err '+e}return t})(),snoozed:!!snz,st:MS.getItem('st')}});
// What phone B gets over sync: A's whole shared record, plus worst-case legacy alarms (untagged, and tagged with A's device id)
r.B=await B.pg.evaluate(async(stA,devA)=>{const S=JSON.parse(stA||'{}');S.AL41={...(S.AL41||{}),alarms:{1:{lead:15,fired:''},'1p':{on:1}}};S.AL41b=null;LS.st=JSON.stringify(S);let rang1=false,rang2=false,rang3=false;_alTick();await new Promise(r=>setTimeout(r,400));rang1=!!document.getElementById('alarmov');
 const S2=JSON.parse(MS.getItem('st'));S2.AL41.alarms={1:{lead:15,fired:''},'1p':{on:1},_dev:devA};LS.st=JSON.stringify(S2);_alTick();await new Promise(r=>setTimeout(r,400));rang2=!!document.getElementById('alarmov');
 try{setSt('AL41','legs',[{pk:'2 B Ave',dz:'1 A St',t:new Date(Date.now()+3*36e5).toISOString().slice(0,16),drv:'BB',done:0}]);legDone('AL41',1)}catch(e){}await new Promise(r=>setTimeout(r,400));rang3=!!document.getElementById('alarmov');
 return{untaggedRang:rang1,otherPhoneTaggedRang:rang2,legDoneRang:rang3,AL:_alAL('AL41')}},r.A.st,r.devs[0]);
delete r.A.st;
await A.pg.screenshot({path:'/tmp/pt/al41_A.png'});await B.pg.screenshot({path:'/tmp/pt/al41_B.png'});
r.posts=[A.posts.filter(x=>/myal|"alarms"/.test(x)).length,B.posts.filter(x=>/myal/.test(x)).length];
r.errs=[A.errs,B.errs];console.log(JSON.stringify(r,null,1));
const ok=r.A.rang&&!r.A.stHasAlarms&&r.A.myalTracked===false&&r.A.snoozed&&!r.B.untaggedRang&&!r.B.otherPhoneTaggedRang&&!r.B.legDoneRang&&!Object.keys(r.B.AL).length&&r.posts[0]==0;
console.log(ok?'AL41 PASS':'AL41 FAIL');await b.close()})();
