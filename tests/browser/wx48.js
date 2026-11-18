// node tests/browser/wx48.js — weather layout: collapsed milder warnings, visible urgent words, temp strip (3–4 points), overall + per-leg lines. 390px. Weather and geocoding are mocked (no real addresses, no network).
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html',OUT=process.env.OUT||'/workspace/v48wx';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const fs=require('fs');fs.mkdirSync(OUT,{recursive:true});
let _b;const killer=setTimeout(()=>{console.log('WX48 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const at=(day,h,m)=>{const d=new Date(t0);d.setDate(d.getDate()+day);d.setHours(h,m||0,0,0);return d};
const FC=(()=>{const n=384,time=[],T=[],C=[],P=[],G=[],V=[];for(let i=0;i<n;i++){time.push(Math.round(+t0/1e3)+i*3600);T.push(55);C.push(1);P.push(10);G.push(10);V.push(20000)}
 const set=(d,o)=>{const i=Math.round((+d-+t0)/36e5);if(i>=0&&i<n)for(const k in o)({T,C,P,G,V})[k][i]=o[k]};
 // MULTI: leg 1 departs ~8:30 (cold 36, not freezing, cloudy); mid morning milder; leg 2 14:00 rain + wind
 set(at(1,8),{T:36,C:3});set(at(1,9),{T:38,C:3});
 set(at(1,10),{T:42,C:2});set(at(1,11),{T:44,C:2});set(at(1,12),{T:46,C:3});
 set(at(1,13),{T:46,C:61,P:70,G:40});set(at(1,14),{T:47,C:61,P:70,G:40});
 // LONG haul 8:00–3:00 (7h) mild climb, no hazards — 4-point strip
 set(at(2,8),{T:58,C:1});set(at(2,9),{T:60,C:1});set(at(2,10),{T:63,C:2});set(at(2,11),{T:66,C:2});
 set(at(2,12),{T:68,C:2});set(at(2,13),{T:70,C:1});set(at(2,14),{T:71,C:1});set(at(2,15),{T:72,C:1});
 // MILD single-leg ~1h, 55° partly cloudy, no warnings
 set(at(3,10),{T:55,C:1});set(at(3,11),{T:56,C:1});
 // STORM single-leg: warm thunderstorm + wind + fog (urgent stays prominent; wind/fog collapse)
 set(at(1,16),{T:62,C:95,P:90,G:46,V:600});set(at(1,15),{T:63,C:95,P:90,G:46,V:600});
 // ICE: below freezing + freezing rain
 set(at(1,6),{T:24,C:66,P:80});set(at(1,5),{T:23,C:66,P:80});
 return{hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}}})();
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
 const pg=await (await b.createBrowserContext()).newPage();pg.setDefaultTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);const wxReq=[];
 pg.on('request',r=>{const u=r.url();if(/api\.open-meteo\.com/.test(u)){wxReq.push(u);return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify(FC)})}
  if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
  if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render=="function"&&typeof alarmSet=="function"',{timeout:15000});await W(500);
 const r={};
 await pg.evaluate((A)=>{window.geo=async()=>[-81.9,40.8];jobs.length=0;const D=s=>new Date(s);
  const mk=(id,s,e,cl)=>({uid:id,evuid:id,start:D(s),endT:D(e),driver:'BB',client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
  jobs.push(mk('MULTI',A.m1,A.m1e,'Test Rider'));setSt('MULTI','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:A.m2,drv:'BB',done:0}]);
  jobs.push(mk('LONG',A.l,A.le,'Long Haul'));
  jobs.push(mk('MILD',A.d,A.de,'Mild Day'));
  jobs.push(mk('STORM',A.h,A.he,'Storm Demo'));
  jobs.push(mk('ICE',A.f,A.fe,'Ice Demo'));
  try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
  alarmSet('MULTI',1,30);alarmSet('MULTI',2,20);alarmSet('LONG',1,0);alarmSet('MILD',1,0);alarmSet('STORM',1,20);alarmSet('ICE',1,15);
  document.getElementById('alarmdlg')?.remove();drv.value='BB';render()},
  {m1:+at(1,9),m1e:+at(1,10),m2:new Date(+at(1,14)-at(1,14).getTimezoneOffset()*6e4).toISOString().slice(0,16),
   l:+at(2,8),le:+at(2,15),d:+at(3,10),de:+at(3,11),h:+at(1,16),he:+at(1,17),f:+at(1,6),fe:+at(1,7)});
 await W(1500);await pg.evaluate(()=>render());await W(800);
 // cards must stay closed — weather is visible without tapping the job open
 r.opened=await pg.evaluate(()=>[...document.querySelectorAll('.card.jc.open')].some(c=>/Test Rider|Long Haul|Mild Day|Storm Demo|Ice Demo/.test(c.innerText)));
 const grab=()=>pg.evaluate(()=>[...document.querySelectorAll('.card')].filter(c=>/Test Rider|Long Haul|Mild Day|Storm Demo|Ice Demo/.test(c.innerText)).map(c=>{
  const wx=c.querySelector('.wxchip');
  const words=[...c.querySelectorAll('.wxwords')].map(x=>({t:x.innerText,disp:getComputedStyle(x).display}));
  return{
   who:(c.innerText.match(/Test Rider|Long Haul|Mild Day|Storm Demo|Ice Demo/)||[''])[0],
   t:c.innerText.replace(/\s+/g,' ').slice(0,500),
   wx:wx?wx.innerText.replace(/\s+/g,' '):'',
   pts:[...c.querySelectorAll('.wxpt')].map(x=>x.innerText.replace(/\s+/g,' ')),
   all:c.querySelector('.wxall')&&c.querySelector('.wxall').innerText.replace(/\s+/g,' '),
   urg:c.querySelector('.wxurgent')&&c.querySelector('.wxurgent').innerText.replace(/\s+/g,' '),
   also:c.querySelector('.wxalso')&&c.querySelector('.wxalso').innerText.replace(/\s+/g,' '),
   legs:[...c.querySelectorAll('.wxleg')].map(x=>x.innerText.replace(/\s+/g,' ')),
   cold:c.querySelector('.wxcold')&&c.querySelector('.wxcold').innerText.replace(/\s+/g,' '),
   words,
   hiddenWords:words.filter(w=>w.disp=='none').map(w=>w.t)
  }}));
 r.cards=await grab();
 const shot=async(rx,f)=>{await pg.evaluate(rx=>{['fsPill','jlbtn'].forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none'});const c=[...document.querySelectorAll('.card')].find(c=>new RegExp(rx).test(c.innerText));if(c)c.scrollIntoView({block:'center'})},rx);await W(300);await pg.screenshot({path:OUT+'/'+f})};
 await shot('Test Rider','v48wx_multi_mixed.png');
 await shot('Long Haul','v48wx_long_strip.png');
 await shot('Mild Day','v48wx_mild_single.png');
 r.wxReq=wxReq.length;r.wxCoords=wxReq.map(u=>(u.match(/latitude=[^&]+&longitude=[^&]+/)||[''])[0]);r.errs=errs;
 const by=n=>(r.cards.find(c=>c.who==n)||{});
 const M=by('Test Rider'),L=by('Long Haul'),D=by('Mild Day'),S=by('Storm Demo'),I=by('Ice Demo');
 r.summary={M,L,D,S,I,opened:r.opened,wxReq:r.wxReq,wxCoords:r.wxCoords,errs};
 console.log(JSON.stringify(r.summary,null,1));
 const ok=!r.opened
  && M.pts.length>=3 && /L1/.test(M.legs.join(' ')) && /L2/.test(M.legs.join(' '))
  && /36°/.test(M.wx) && /warm the car/.test(M.cold||'') && !/Below freezing/.test(M.wx)
  && /Rain/.test(M.also||M.wx) && !/Thunderstorm/.test(M.wx)
  && (M.hiddenWords||[]).length==0
  && L.pts.length==4 && !L.urg && !L.also && !L.cold && !L.legs.length
  && /58°|60°/.test(L.pts.join(' ')) && /72°|71°|70°/.test(L.pts.join(' '))
  && D.pts.length>=1 && D.pts.length<=3 && !D.urg && !D.also && !D.cold && !D.legs.length
  && /55°/.test(D.wx) && /Partly cloudy/.test(D.wx||D.all||'')
  && /Thunderstorm/.test(S.urg||S.wx) && /High wind/.test(S.also||'') && /Fog/.test(S.also||'')
  && !(S.urg||'').includes('High wind') && (S.hiddenWords||[]).length==0 && !/warm the car/.test(S.wx)
  && /Below freezing/.test(I.cold||'') && /Freezing rain/.test(I.urg||I.wx) && (I.hiddenWords||[]).length==0
  && r.wxReq>=1 && r.wxReq<=3 && r.wxCoords.every(x=>/latitude=40\.8&longitude=-81\.9/.test(x)) && !errs.length;
 console.log(ok?'WX48 PASS':'WX48 FAIL');
 clearTimeout(killer);await b.close();process.exit(ok?0:1)})().catch(e=>{console.log('WX48 ERROR',e&&e.message);process.exit(1)});
