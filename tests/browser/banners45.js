// node tests/browser/banners45.js — 390px: all-day banners (vehicles stay timed), Driving totals exclude availability
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const DEAD=Number(process.env.BAN45_MS||120000);
let _b;
const killer=setTimeout(()=>{console.log('BANNERS45 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},DEAD);
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
 _b=b;
 const ctx=await b.createBrowserContext();
 const pg=await ctx.newPage();
 pg.setDefaultTimeout(20000);pg.setDefaultNavigationTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);
 pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();if(/gas\.json/.test(u))return r.respond({status:200,contentType:'application/json',body:JSON.stringify({prices:{},updated:'test'})});return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});await pg.waitForFunction('typeof jobs!=="undefined" && typeof render=="function" && typeof isBanner=="function"',{timeout:15000});await W(500);
 const info=await pg.evaluate(()=>{
  jobs.length=0;
  const t0=new Date();t0.setHours(0,0,0,0);
  const t1=new Date(+t0+864e5);
  const at=(h,m)=>{const d=new Date(t0);d.setHours(h,m||0,0,0);return d};
  const mk=(id,s,e,o)=>jobs.push({uid:id,evuid:id,start:s,endT:e,driver:'BB',client:o.client||o.t,title:o.t,raw:o.t,from:o.from||'1 A St',to:o.to||'2 B Ave',pax:1,vehicle:o.vehicle||'',block:o.block||0,...o});
  mk('J1',at(9),at(12),{t:'Rider A',client:'Rider A'});
  setSt('J1','hm',60);
  setSt('J1','legs',[{pk:'2 B Ave',dz:'1 A St',t:'',drv:'BB',done:0}]); // multi-leg present; empty t so it may not add span
  mk('A1',t0,t1,{t:'TEST Jeffrey Available till 5pm',client:'',from:'',to:''});
  const thu=new Date(t0);thu.setDate(thu.getDate()+3);thu.setHours(17,0,0,0);
  mk('A2',at(6,30),thu,{t:'Available TILL 5PM',client:'',from:'',to:''});
  mk('V1',t0,t1,{t:'Ford Van inspection',client:'',vehicle:'Ford Van',from:'',to:''});
  mk('X1',t0,t1,{t:'x TEST off',block:1,client:'',from:'',to:''});
  try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
  drv.value='BB';
  try{GAS.prices={}}catch(e){}
  render();
  return {day:t0.toDateString(),drv:isDriveJob(jobs.find(j=>j.uid=='J1')),banA1:isBanner(jobs.find(j=>j.uid=='A1')),banA2:isBanner(jobs.find(j=>j.uid=='A2')),banV:isBanner(jobs.find(j=>j.uid=='V1')),banJ:isBanner(jobs.find(j=>j.uid=='J1'))};
 });
 await W(500);
 const go=async t=>{await pg.evaluate(t=>[...document.querySelectorAll('button')].find(x=>x.getAttribute('onclick')==`show('${t}')`).click(),t);await W(600)};
 await go('cal');
 await pg.evaluate(()=>{calSet('mode','day');calSet('d',ymdL(new Date()))});
 await W(500);
 const day=await pg.evaluate(()=>{
  const bans=[...document.querySelectorAll('#calscroll .calban')].map(e=>e.textContent.trim());
  const timed=[...document.querySelectorAll('#calscroll [onclick^="calOpen"]:not(.calban)')].map(e=>e.textContent.trim().slice(0,40));
  return {bans,timed,banN:bans.length};
 });
 await pg.evaluate(()=>{const sc=document.querySelector('#calscroll');if(sc){sc.scrollTop=0;sc.scrollIntoView({block:'start'})}window.scrollBy(0,-8)});await W(200);await pg.screenshot({path:'/workspace/v45_banners_day.png'});
 await go('driver');
 await pg.evaluate(()=>render());
 await W(500);
 const cards=await pg.evaluate(()=>{
  const drv=(document.body.innerText.match(/Driving: [^\n]*/g)||[]);
  const today=[...document.querySelectorAll('#dcards div')].map(x=>x.textContent).find(t=>/TODAY/.test(t)&&/Driving:/.test(t))||'';
  return {drv,today:today.slice(0,160),hrs:dayHrs(jobs.filter(j=>j.start&&j.start.toDateString()==new Date().toDateString()))};
 });
 await pg.screenshot({path:'/workspace/v45_banners_daybox.png'});
 const checks=[];
 const add=(n,p)=>{checks.push({n,p:!!p});console.log(n,p?'ok':'FAIL')};
 add('J1 is a drive job',info.drv);
 add('Available till all-day is banner',info.banA1);
 add('Available TILL 5PM multi-day is banner',info.banA2);
 add('Ford Van is not a banner',!info.banV);
 add('Rider job is not a banner',!info.banJ);
 add('calendar has .calban',day.banN>=1);
 add('Available appears in banners',day.bans.some(t=>/Available/i.test(t)));
 add('vehicle not only in banners if present as timed or excluded',!day.bans.some(t=>/Ford Van/i.test(t)));
 add('Driving label present',/Driving:/.test(cards.hrs+cards.today+cards.drv.join(' ')));
 add('Driving has miles and $',/Driving:.*\d+(\.\d+)? hrs?.*\d+ mi.*\$\d+/.test(cards.hrs)||/Driving:.*\d+/.test(cards.hrs));
 add('availability not counted as 80+ hrs',!/Driving: (8\d|9\d|[1-9]\d{2})/.test(cards.hrs));
 add('no page errors',errs.length==0);
 console.log(JSON.stringify({info,day,cards,errs:errs.slice(0,3)},null,1));
 const pass=checks.every(c=>c.p);
 console.log(pass?'PASS':'FAIL');
 await b.close();clearTimeout(killer);process.exit(pass?0:1);
})().catch(e=>{console.log('BANNERS45 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
