// node tests/browser/tabs50.js — v50 four-tab driver screen at 390px (Android-like), multi-day list with a multi-leg job.
// Checks: tab order (Current, Upcoming, Find, Owner), Current holds only today (no future-day cards), Upcoming holds
// tomorrow onward in day boxes with hour totals + the Next-job-after-tomorrow pointer on top, badge = upcoming job count,
// per-tab scroll memory, pointer tap opens the job in the right tab, ghost scroll-click on the pointer is ignored,
// flashCard() of a tomorrow job from Current switches to Upcoming, closing a card after scrolling does not snap back
// (browser history scroll restore), and a slow scroll to the bottom of Current and of
// Upcoming never jumps (scrollY only moves by what we scrolled). SHOTS=dir saves screenshots.
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const SHOTS=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('TABS50 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},180000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const at=(day,h,m)=>{const d=new Date(t0);d.setDate(d.getDate()+day);d.setHours(h,m||0,0,0);return+d};
const iso=ms=>new Date(ms-new Date(ms).getTimezoneOffset()*6e4).toISOString().slice(0,16);
const FC=(()=>{const n=384,time=[],T=[],C=[],P=[],G=[],V=[];for(let i=0;i<n;i++){time.push(Math.round(+t0/1e3)+i*3600);T.push(48+(i%9));C.push(i%11===0?61:i%7===0?3:1);P.push(i%11===0?70:10);G.push(12);V.push(20000)}return{hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}}})();
// Fake sample data only (no real customers): [uid, dayOffset, startH, endH, driver, client]
const J=[['T1',0,7,8,'Jeffrey','Sample Rider A'],['T2',0,9,10.5,'Jared','Sample Rider B'],['T3',0,11,12,'Kaci','Sample Rider C'],['T4',0,13,14,'BB','Sample Rider D'],['T5',0,15,16.5,'Jeffrey','Sample Rider E'],['T6',0,17,18,'Jared','Sample Rider F'],
 ['M1',1,8,9,'Kaci','Demo Client G'],['M2',1,10,11.5,'Jeffrey','Demo Client H'],['M3',1,14,15,'BB','Demo Client I'],
 ['U1',2,8,15,'Jeffrey','Demo Multi-Leg J'],['U2',2,16,17,'Jared','Demo Client K'],['U3',3,9,10,'Kaci','Demo Client L'],['U4',4,7,9,'BB','Demo Client M'],['U5',5,12,13,'Jeffrey','Demo Client N'],['U6',6,10,11,'Jared','Demo Client O']];
const TODAY=J.filter(x=>x[1]==0).map(x=>x[0]),FUT=J.filter(x=>x[1]>0).map(x=>x[0]);
(async()=>{
  const b=_b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
  const pg=await (await b.createBrowserContext()).newPage();pg.setDefaultTimeout(20000);
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});if(/open-meteo/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify(FC)});if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render==="function"&&typeof window.dsTabSwitched==="function"',{timeout:15000});
  await pg.evaluate((J,leg)=>{window.geo=async()=>[-81.9,40.8];jobs.length=0;
    J.forEach(([id,s,e,dr,cl])=>jobs.push({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:dr,client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1}));
    setSt('U1','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:leg,drv:'Jeffrey',done:0}]);
    drv.value='';try{EXPALL=false;sessionStorage.expall='';EXP.clear();sessionStorage.exp='[]'}catch(e){}render();show('driver');scrollTo(0,0)},J.map(x=>[x[0],at(x[1],Math.floor(x[2]),(x[2]%1)*60),at(x[1],Math.floor(x[3]),(x[3]%1)*60),x[4],x[5]]),iso(at(2,12)));
  await W(1500);
  const bad=[];const S=async f=>pg.evaluate(f);
  const state=()=>S(()=>{const uids=[...document.querySelectorAll('#dcards .jh')].map(h=>((h.getAttribute('onclick')||'').match(/tog\('([^']+)'\)/)||[])[1]).filter(Boolean);return{uids,caday:!!document.querySelector('#dcards #caday'),caup:!!document.querySelector('#dcards #caup'),cafind:!!document.querySelector('#dcards #cafind'),nxttop:(document.getElementById('nxttop').innerText||'').trim(),on:[...document.querySelectorAll('.hnav>button.tabon')].map(b=>b.innerText.trim()),sy:Math.round(scrollY),max:document.documentElement.scrollHeight-innerHeight}});
  // tab buttons are clicked in place (no scroll-into-view) so the test sees exactly what the tab switch does to scrollY
const tap=async label=>{await pg.evaluate(l=>[...document.querySelectorAll('.hnav>button')].find(b=>b.innerText.trim().startsWith(l)).click(),label);await W(350)};
  // 1 nav order
  const order=await S(()=>[...document.querySelectorAll('.hnav>button')].map(b=>b.innerText.replace(/\d+$/,'').trim()));
  const ix=['Current jobs','Upcoming jobs','🔍 Find job','⚖️ Compare','Owner'] /* v59: Compare sits between Find and Owner */.map(l=>order.indexOf(l));
  if(ix.some(i=>i<0)||ix.some((v,i)=>i&&v!=ix[i-1]+1))bad.push('tab order wrong: '+JSON.stringify(order));
  // 2 Current
  let c=await state();console.log('CURRENT',JSON.stringify(c));
  if(!c.caday||c.caup||c.cafind)bad.push('Current tab sections wrong');
  const fut=c.uids.filter(u=>FUT.includes(u));if(fut.length)bad.push('Current shows future-day cards: '+fut);
  if(TODAY.some(u=>!c.uids.includes(u)))bad.push('Current missing a today card');
  if(!/Next job/.test(c.nxttop))bad.push('Next-job banner missing on Current');
  if(!c.on.length||!c.on[0].startsWith('Current'))bad.push('Current tab not highlighted');
  if(!(await S(()=>!!document.getElementById('cadaybtn'))))bad.push('Complete day button missing');
  // 3 badge
  const badge=await S(()=>{const e=document.querySelector('.upbadge');return{t:e.textContent,d:e.style.display}});
  if(badge.t!==String(FUT.length)||badge.d=='none')bad.push('badge '+JSON.stringify(badge)+' expected '+FUT.length+' (the multi-leg job counts once)');
  if(SHOTS){await pg.evaluate(()=>{const l=document.getElementById('livebar');if(l)l.style.display='none'});await pg.screenshot({path:SHOTS+'/tabs50_current.png'});await pg.evaluate(()=>{document.getElementById('nxttop').scrollIntoView({block:'start'});scrollBy(0,-60)});await W(300);await pg.screenshot({path:SHOTS+'/tabs50_current_today.png'});await pg.evaluate(()=>scrollTo(0,0));await W(200);const nb=await pg.$('nav.hnav');await nb.screenshot({path:SHOTS+'/tabs50_tabbar.png'})}
  // 4 Upcoming
  await tap('Upcoming');let u=await state();console.log('UPCOMING',JSON.stringify(u));
  if(u.caday||!u.caup||u.cafind)bad.push('Upcoming tab sections wrong');
  if(u.uids.some(x=>TODAY.includes(x)))bad.push('Upcoming shows today cards');
  if(FUT.some(x=>!u.uids.includes(x)))bad.push('Upcoming missing a future card: '+FUT.filter(x=>!u.uids.includes(x)));
  if(u.nxttop)bad.push('Next-job banner should be hidden on Upcoming');
  if(!u.on[0]||!u.on[0].startsWith('Upcoming'))bad.push('Upcoming tab not highlighted');
  const up=await S(()=>{const b=document.querySelector('#caup .caupb');const first=b&&b.firstElementChild;const boxes=[...document.querySelectorAll('#caup .daybox')].map(d=>d.firstElementChild.innerText);return{first:first&&first.className,ptxt:first&&first.innerText,boxes}});
  console.log('UPBOXES',JSON.stringify(up));
  if(up.first!='nxtjob'||!/after tomorrow/i.test(up.ptxt||''))bad.push('pointer not at top of Upcoming');
  if(up.boxes.length<6||!/^Tomorrow/.test(up.boxes[0]))bad.push('day boxes wrong');
  if(!up.boxes.every(t=>/\d+(\.\d+)?\s*h|hr|min/i.test(t)))bad.push('day hour totals missing: '+JSON.stringify(up.boxes));
  if(SHOTS){await pg.evaluate(()=>{const b=document.querySelector('#caup');b&&b.scrollIntoView({block:'start'});scrollBy(0,-170)});await W(300);await pg.screenshot({path:SHOTS+'/tabs50_upcoming.png'});await pg.evaluate(()=>scrollTo(0,0));await W(200)}
  // 5 scroll memory
  await S(()=>scrollTo(0,900));await W(250);const upY=(await state()).sy;
  await tap('Current');c=await state();if(c.sy!==0)bad.push('Current did not restore its own scroll (0), got '+c.sy);
  await S(()=>scrollTo(0,350));await W(250);const curY=(await state()).sy;
  await tap('🔍 Find');let f=await state();if(!f.cafind||f.caday||f.caup)bad.push('Find tab sections wrong');if(f.sy!==0)bad.push('Find first visit not at top: '+f.sy);
  if(SHOTS){await pg.evaluate(()=>{const b=document.querySelector('#cafind');b&&b.scrollIntoView({block:'start'});scrollBy(0,-140)});await W(300);await pg.screenshot({path:SHOTS+'/tabs50_find.png'});await pg.evaluate(()=>scrollTo(0,0));await W(250)}
  await S(()=>scrollTo(0,Math.min(500,document.documentElement.scrollHeight-innerHeight)));await W(250);const findY=(await state()).sy;
  await tap('Upcoming');u=await state();if(Math.abs(u.sy-upY)>2)bad.push('Upcoming scroll not restored '+upY+' → '+u.sy);
  await tap('Current');c=await state();if(Math.abs(c.sy-curY)>2)bad.push('Current scroll not restored '+curY+' → '+c.sy);
  await tap('🔍 Find');f=await state();if(Math.abs(f.sy-findY)>2)bad.push('Find scroll not restored '+findY+' → '+f.sy);
  // 5b Android Back: Current -> Upcoming, then Back returns to Current at its own spot
  await tap('Current');await tap('Upcoming');await pg.evaluate(()=>history.back());await W(600);const bk=await state();
  if(!bk.caday||Math.abs(bk.sy-curY)>2)bad.push('Back did not return to Current at its spot: '+JSON.stringify({caday:bk.caday,sy:bk.sy,curY}));
  await tap('🔍 Find');
  console.log('SCROLLMEM',JSON.stringify({upY,curY,findY,up:u.sy,cur:c.sy,find:f.sy}));
  // 6 ghost scroll-click on the Upcoming pointer is ignored
  await tap('Upcoming');await S(()=>scrollTo(0,0));await W(200);
  const g=await S(async()=>{const el=document.querySelector('#caup .nxtjob');const r=el.getBoundingClientRect(),x=r.left+30,y=r.top+15;const exp0=[...EXP].join();const fire=(t,cx,cy)=>el.dispatchEvent(new PointerEvent(t,{bubbles:true,cancelable:true,clientX:cx,clientY:cy,pointerId:1,pointerType:'touch',isPrimary:true,buttons:1}));fire('pointerdown',x,y);fire('pointermove',x,y-60);scrollTo(0,200);const sy1=scrollY;el.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x,clientY:y-60,pointerId:1,pointerType:'touch',isPrimary:true}));el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y}));await new Promise(r=>setTimeout(r,250));return{sy1,sy2:scrollY,exp:[...EXP].join()!==exp0}});
  if(g.exp||Math.abs(g.sy2-g.sy1)>2)bad.push('ghost scroll-click on pointer acted: '+JSON.stringify(g));
  // 7 real tap on the pointer opens the after-tomorrow job (U1) in Upcoming and brings it into view
  await S(()=>scrollTo(0,0));await W(150);
  const ph=await pg.$('#caup .nxtjob');await ph.tap();await W(400);
  const t7=await S(()=>{const c=dtCard('U1');const r=c&&c.getBoundingClientRect();return{open:EXP.has('U1'),top:r&&Math.round(r.top),tab:DTAB}});
  console.log('POINTER',JSON.stringify(t7));if(!t7.open||t7.tab!='up'||t7.top==null||t7.top<-5||t7.top>422)bad.push('pointer tap did not show U1 in Upcoming: '+JSON.stringify(t7));
  // 8 flashCard of a tomorrow job from Current switches to Upcoming
  await tap('Current');const f8=await S(()=>{const ok=flashCard('M2');return{ok,tab:DTAB,on:document.querySelector('.hnav>button.tabon').innerText}});
  if(!f8.ok||f8.tab!='up'||!/^Upcoming/.test(f8.on))bad.push('flashCard did not switch to Upcoming: '+JSON.stringify(f8));
  // 9 slow wheel scroll to the bottom of Current and Upcoming: log scrollY jumps
  const slow=async(label)=>{await S(()=>{EXP.clear();sessionStorage.exp='[]';renderDriver();scrollTo(0,0)});await W(300);await pg.mouse.move(195,600);const L=[];let y=0;for(let i=0;i<120;i++){await pg.mouse.wheel({deltaY:40});await W(70);const n=await S(()=>({y:scrollY,m:document.documentElement.scrollHeight-innerHeight}));const d=n.y-y;if(Math.abs(d-40)>30&&!(n.y>=n.m-1&&d>=0&&d<=40))L.push({i,from:y,to:n.y,d});y=n.y;if(n.y>=n.m-1)break}await W(1200);const end=await S(()=>scrollY);if(Math.abs(end-y)>2)L.push({settle:true,from:y,to:end});console.log('SLOW',label,'bottom',y,'jumps',JSON.stringify(L));return L};
  await tap('Current');const j1=await slow('Current');await tap('Upcoming');const j2=await slow('Upcoming');
  if(j1.length)bad.push('Current scroll jumps '+JSON.stringify(j1));if(j2.length)bad.push('Upcoming scroll jumps '+JSON.stringify(j2));
  // 10 history snap: open a card, scroll a bit, tap its header to close it. The in-app Back stack rewinds with history.go();
  // with the browser's auto scroll restore that put scrollY back to where the card was opened (a snap up). Must stay put.
  await tap('Upcoming');await S(()=>{EXP.clear();sessionStorage.exp='[]';renderDriver()});await W(200);
  const h0=await S(async()=>{const c=[...document.querySelectorAll('#dcards .jc')][3];c.scrollIntoView({block:'start'});await new Promise(r=>setTimeout(r,200));const u=c.querySelector('.jh').getAttribute('onclick').match(/tog\('([^']+)'\)/)[1];tog(u);await new Promise(r=>setTimeout(r,300));const y0=scrollY;scrollBy(0,120);await new Promise(r=>setTimeout(r,300));const h=dtCard(u).querySelector('.jh .jt')||dtCard(u).querySelector('.jh');const rr=h.getBoundingClientRect();return{u,y0,y1:scrollY,x:rr.left+20,y:rr.top+10}});
  await pg.touchscreen.tap(h0.x,Math.max(5,Math.min(830,h0.y)));await W(900);
  const h1=await S(u=>({y:scrollY,open:EXP.has(u),sr:history.scrollRestoration}),h0.u);console.log('HISTSNAP',JSON.stringify({...h0,...h1}));
  if(h1.open)bad.push('card did not close on tap');if(Math.abs(h1.y-h0.y1)>40)bad.push('closing a card snapped the view '+h0.y1+' → '+h1.y);
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log(bad.length?'TABS50 FAIL\n'+bad.join('\n'):'TABS50 PASS');
  await b.close();clearTimeout(killer);process.exit(bad.length?1:0);
})().catch(e=>{console.log('TABS50 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
