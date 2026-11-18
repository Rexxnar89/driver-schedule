// node tests/browser/chain47.js — v.47 alarm chain (heat-up -> prep -> departure, Settings offsets) + card weather/hazards + cold warning, 390px, multi-leg job. Weather and geocoding are mocked (no real addresses, no network).
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html',OUT=process.env.OUT||'/workspace/v47';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('CHAIN47 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
// synthetic hourly forecast from local midnight today: default mild; specific hours overridden
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const at=(day,h,m)=>{const d=new Date(t0);d.setDate(d.getDate()+day);d.setHours(h,m||0,0,0);return d};
const FC=(()=>{const n=384,time=[],T=[],C=[],P=[],G=[],V=[];for(let i=0;i<n;i++){time.push(Math.round(+t0/1e3)+i*3600);T.push(55);C.push(1);P.push(10);G.push(10);V.push(20000)}
 const set=(d,o)=>{const i=Math.round((+d-+t0)/36e5);for(const k in o)({T,C,P,G,V})[k][i]=o[k]};
 set(at(1,8),{T:36,C:3});set(at(1,9),{T:38,C:3});            // MULTI leg 1: departs ~8:30 -> cold (<=40), not freezing
 set(at(1,14),{T:47,C:61,P:70});set(at(1,13),{T:46,C:61,P:70}); // MULTI leg 2: rain
 set(at(1,6),{T:24,C:73});set(at(1,5),{T:23,C:73});           // FRZ: below freezing + snow
 set(at(2,15),{T:62,C:95,P:90,G:46});set(at(2,14),{T:63,C:95,P:90,G:46,V:600}); // HAZ: warm but storm, wind, fog, rain
 return{hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}}})();
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'],protocolTimeout:60000});_b=b;
 const pg=await (await b.createBrowserContext()).newPage();pg.setDefaultTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);const wxReq=[];
 pg.on('request',r=>{const u=r.url();if(/api\.open-meteo\.com/.test(u)){wxReq.push(u);return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify(FC)})}
  if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
  if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render=="function"&&typeof alarmSet=="function"&&typeof alChain=="function"',{timeout:15000});await W(500);
 const r={};
 r.defaults=await pg.evaluate(()=>({...alChain(),cold:alCold()}));
 await pg.evaluate((A)=>{window.geo=async()=>[-81.9,40.8];jobs.length=0;const D=s=>new Date(s);
  const mk=(id,s,e,cl)=>({uid:id,evuid:id,start:D(s),endT:D(e),driver:'BB',client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
  jobs.push(mk('MULTI',A.m1,A.m1e,'Test Rider'));setSt('MULTI','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:A.m2,drv:'BB',done:0}]);
  jobs.push(mk('FRZ',A.f,A.fe,'Freeze Demo'));jobs.push(mk('HAZ',A.h,A.he,'Storm Demo'));
  try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
  alarmSet('MULTI',1,30);alarmPrep('MULTI',1);alarmHeat('MULTI',1);alarmSet('MULTI',2,20);alarmPrep('MULTI',2);alarmHeat('MULTI',2);
  alarmSet('FRZ',1,15);alarmSet('HAZ',1,20);document.getElementById('alarmdlg')?.remove();drv.value='BB';render()},
  {m1:+at(1,9),m1e:+at(1,10),m2:new Date(+at(1,14)-at(1,14).getTimezoneOffset()*6e4).toISOString().slice(0,16),f:+at(1,6),fe:+at(1,7),h:+at(2,15),he:+at(2,16)});
 await W(1500);await pg.evaluate(()=>render());await W(800);
 const cards=()=>pg.evaluate(()=>[...document.querySelectorAll('.card')].filter(c=>/Test Rider|Freeze Demo|Storm Demo/.test(c.innerText)).map(c=>({t:c.innerText.replace(/\s+/g,' ').slice(0,400),al:[...c.querySelectorAll('button')].map(x=>x.textContent).filter(x=>/⏰/.test(x)),wx:[...c.querySelectorAll('.wxchip')].map(x=>x.innerText.replace(/\s+/g,' ')),sym:[...c.querySelectorAll('.wxsym')].map(x=>x.textContent+'|'+x.title)})));
 r.cards=await cards();
 const shot=async(rx,f)=>{await pg.evaluate(rx=>{const c=[...document.querySelectorAll('.card')].find(c=>new RegExp(rx).test(c.innerText));if(c){const b=[...c.querySelectorAll('button')].find(x=>/⏰/.test(x.textContent));(b||c).scrollIntoView({block:b?'end':'center'});if(b)window.scrollBy(0,180)}},rx);await W(300);await pg.screenshot({path:OUT+'/'+f})};
 await shot('Test Rider','v47_card_chain_weather.png');await shot('Freeze Demo','v47_card_freezing.png');
 await pg.evaluate(()=>{const s=[...document.querySelectorAll('.card')].find(c=>/Storm Demo/.test(c.innerText))?.querySelector('.wxsym');s&&s.click()});await shot('Storm Demo','v47_card_hazards.png');
 // offsets change -> chain shifts; reset
 r.custom=await pg.evaluate(async()=>{alChainSet('alHeat',15);alChainSet('alPrep',10);await new Promise(r=>setTimeout(r,300));const t=[...document.querySelectorAll('.card button')].map(x=>x.textContent).filter(x=>/Heat/.test(x));alChainSet('alHeat','');alChainSet('alPrep','');return{t,after:alChain()}});
 // alarm dialog with cold warning (MULTI leg 1) and hazards-only (HAZ)
 await pg.evaluate(()=>{alarmHeat('MULTI',1)});await W(800); // heat off -> warning offers one-tap
 r.dlgCold=await pg.evaluate(()=>{const e=document.getElementById('awx1');return e&&e.innerText.replace(/\s+/g,' ')});
 await pg.evaluate(()=>document.getElementById('awx1')?.scrollIntoView({block:'center'}));await W(200);await pg.screenshot({path:OUT+'/v47_alarm_cold_warning.png'});
 r.oneTap=await pg.evaluate(async()=>{const b=[...document.querySelectorAll('#awx1 button')].find(x=>/Turn on heat-up/.test(x.textContent));if(!b)return 'no button';b.click();await new Promise(r=>setTimeout(r,800));return{on:!!(_alAL('MULTI')['1h']&&_alAL('MULTI')['1h'].on),txt:document.getElementById('awx1')?.innerText.replace(/\s+/g,' ')}});
 await pg.evaluate(()=>{document.getElementById('alarmdlg')?.remove();alarmOpen('HAZ')});await W(800);
 r.dlgHaz=await pg.evaluate(()=>{const e=document.getElementById('awx1');return e&&e.innerText.replace(/\s+/g,' ')});
 await pg.evaluate(()=>document.getElementById('awx1')?.scrollIntoView({block:'center'}));await W(200);await pg.screenshot({path:OUT+'/v47_alarm_hazard_warning.png'});
 await pg.evaluate(()=>document.getElementById('alarmdlg')?.remove());
 // settings section
 await pg.evaluate(()=>show('owner'));await W(500);await pg.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&x.textContent.trim()=='Jeffrey');b&&b.click()});await W(700);
 await W(300);await pg.evaluate(()=>document.getElementById('oalH').scrollIntoView({block:'center'}));await W(200);await pg.screenshot({path:OUT+'/v47_settings_alarm_chain.png'});
 r.settings=await pg.evaluate(()=>[oalH.value,oalP.value,oalC.value,oalH.offsetParent!==null]);
 // ring test: heat due now, prep/departure later -> only HEAT rings; snooze lands on heat key
 r.ring=await pg.evaluate(async()=>{const t=new Date(Date.now()+25*6e4);jobs.push({uid:'RING',evuid:'RING',start:t,endT:new Date(+t+36e5),driver:'BB',client:'Ring Test',title:'Ring Test',raw:'Ring Test',from:'1 Test St',to:'2 Demo Ave',pax:1});
  alarmSet('RING',1,10);alarmPrep('RING',1);alarmHeat('RING',1);document.getElementById('alarmdlg')?.remove();_alTick();await new Promise(r=>setTimeout(r,400));const o=document.getElementById('alarmov'),why=o&&o.innerText.replace(/\s+/g,' ').slice(0,120),k=o&&o.dataset.k;alarmStop(1);const A=_alAL('RING');return{why,k,heatSnz:!!(A['1h']&&A['1h'].snz),depSnz:!!(A[1]&&A[1].snz),prepFired:!!(A['1p']&&A['1p'].fired)}});
 r.wxReq=wxReq.length;r.wxCoords=wxReq.map(u=>(u.match(/latitude=[^&]+&longitude=[^&]+/)||[''])[0]);r.errs=errs;
 console.log(JSON.stringify(r,null,1));
 const m=r.cards.find(c=>/Test Rider/.test(c.t))||{},f=r.cards.find(c=>/Freeze Demo/.test(c.t))||{},h=r.cards.find(c=>/Storm Demo/.test(c.t))||{};
 const al=(m.al||[]).join(' ');
 const ok=r.defaults.h==11&&r.defaults.p==8&&r.defaults.cold==40
  &&/Heat 8:11 AM · Prep 8:22 AM · Depart 8:30 AM/.test(al)&&/Heat 1:21 PM · Prep 1:32 PM · Depart 1:40 PM/.test(al)
  &&/Heat 8:05 AM · Prep 8:20 AM · Depart 8:30 AM/.test(r.custom.t.join(' '))&&r.custom.after.h==11&&r.custom.after.p==8
  &&/36°/.test((m.wx||[]).join(' '))&&!/Below freezing/.test((m.wx||[]).join(' '))&&/warm the car/.test((m.wx||[]).join(' '))
  &&/Below freezing/.test((f.wx||[]).join(' '))&&/🌨/.test((f.sym||[]).join(''))
  &&/Thunderstorm/.test((h.wx||[]).join(' '))&&/High wind/.test((h.wx||[]).join(' '))&&/Fog/.test((h.wx||[]).join(' '))&&!/warm the car/.test((h.wx||[]).join(' '))
  &&/40° or below/.test(r.dlgCold||'')&&/Turn on heat-up alarm/.test(r.dlgCold||'')&&r.oneTap.on&&/Heat-up alarm is on/.test(r.oneTap.txt||'')
  &&/Heads up: thunderstorm, high wind and fog \/ low visibility expected at departure/.test(r.dlgHaz||'')&&!/40° or below/.test(r.dlgHaz||'')
  &&r.settings[0]=='11'&&r.settings[1]=='8'&&r.settings[2]=='40'
  &&/HEAT-UP ALARM/.test(r.ring.why||'')&&/1h$/.test(r.ring.k||'')&&r.ring.heatSnz&&!r.ring.depSnz&&!r.ring.prepFired
  &&r.wxReq>=1&&r.wxReq<=3&&r.wxCoords.every(x=>/latitude=40\.8&longitude=-81\.9/.test(x))&&!errs.length;
 console.log(ok?'CHAIN47 PASS':'CHAIN47 FAIL');clearTimeout(killer);await b.close();process.exit(ok?0:1)})().catch(e=>{console.log('CHAIN47 ERROR',e&&e.message);process.exit(1)});
