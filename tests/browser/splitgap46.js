// node tests/browser/splitgap46.js — 390px: split gap is free in Available Windows; Leg 2 miles prefill from Leg 1
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const DEAD=Number(process.env.V46_MS||120000);
let _b;
const killer=setTimeout(()=>{console.log('SPLITGAP46 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},DEAD);
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
 _b=b;
 const ctx=await b.createBrowserContext();
 const pg=await ctx.newPage();
 pg.setDefaultTimeout(20000);pg.setDefaultNavigationTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);
 pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
 await pg.waitForFunction('typeof jobs!=="undefined" && typeof render=="function" && typeof spans=="function"',{timeout:15000});
 await W(400);
 const info=await pg.evaluate(()=>{
  jobs.length=0;
  const t=new Date();t.setHours(9,0,0,0);
  const endT=new Date(+t+8*36e5); // 5:00 PM envelope — must not block the gap
  const t2=new Date(+t+5*36e5); // 2:00 PM
  jobs.push({uid:'SG1',evuid:'SG1',start:new Date(+t),endT,driver:'BB',client:'Split gap',title:'Split gap',raw:'Split gap',from:'1 A St',to:'2 B Ave',pax:1});
  try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
  drv.value='BB';
  setSt('SG1','eh',1);
  const loc=d=>{const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())};
  setSt('SG1','legs',[{pk:'2 B Ave',dz:'1 A St',t:loc(t2),drv:'BB',done:0,d:60}]);
  EXP.add('SG1');render();
  const j=jobs.find(x=>x.uid=='SG1');
  const S=spans(j).map(([a,b])=>[a.getHours()*60+a.getMinutes(),b.getHours()*60+b.getMinutes()]);
  const gapStart=new Date(+t+2.5*36e5),gapEnd=new Date(+t+3.5*36e5); // 11:30–12:30
  const B=15;
  const gapBusy=busyAt('BB',gapStart,gapEnd,0).map(x=>x.uid);
  const gapBuf=busyAt('BB',gapStart,gapEnd,B).map(x=>x.uid);
  const leg1Busy=busyAt('BB',t,new Date(+t+36e5),0).map(x=>x.uid);
  const leg2Busy=busyAt('BB',t2,new Date(+t2+36e5),0).map(x=>x.uid);
  return {S,gapBusy,gapBuf,leg1Busy,leg2Busy,nlegs:(SJ(j).legs||[]).length};
 });
 // Available Windows for a new job in the gap
 await pg.evaluate(()=>{
  show('newjob');
  const t=new Date();t.setHours(11,30,0,0);
  const pad=n=>String(n).padStart(2,'0');
  const loc=ymdL?ymdL(t):(t.getFullYear()+'-'+pad(t.getMonth()+1)+'-'+pad(t.getDate()));
  nd.value='BB';
  ndt.value=loc+'T11:30';
  if($('nbuf'))nbuf.value=15;
  try{avail()}catch(e){}
  try{paint()}catch(e){}
 });
 await W(800);
 await pg.evaluate(()=>{
  const el=$('awin')||document.querySelector('#awin,.aw');
  if(el)el.scrollIntoView({block:'start'});
 });
 await W(300);
 await pg.screenshot({path:'/workspace/v46_split_gap_avail.png'});
 const aw=await pg.evaluate(()=>{
  const txt=(($('awin')||document.body).innerText||'').replace(/\s+/g,' ');
  return {txt:txt.slice(0,700),fits:/✔ fits 11:30a/.test(txt),gapWin:/10:15/.test(txt)&&(/1:45|13:45/.test(txt)),notEnvelope:!/9 AM–5 PM/.test(txt)&&!/9 am–5 pm/i.test(txt)};
 });

 // Leg miles default on the card
 await pg.evaluate(()=>{
  try{show('driver')}catch(e){}
  EXP.add('SG1');render();
 });
 await W(400);
 await pg.evaluate(()=>{legMiSet('SG1',1,'30')});
 await W(400);
 await pg.evaluate(()=>{try{show('driver')}catch(e){}EXP.add('SG1');render()});
 await W(400);
 const legs=await pg.$('#dcards .legs');
 if(legs){
  await pg.evaluate(el=>{el.scrollIntoView({block:'start'});el.querySelectorAll('details').forEach(d=>d.open=true)},legs);
  await W(200);
  await legs.screenshot({path:'/workspace/v46_leg_miles_default.png'});
 }else{
  await pg.screenshot({path:'/workspace/v46_leg_miles_default.png'});
 }
 const miles=await pg.evaluate(()=>{
  const s=SJ(jobs.find(x=>x.uid=='SG1'));
  const P=projMi(s,'SG1');
  const inputs=[...document.querySelectorAll('#dcards .legs input[type=number]')].map(x=>x.value);
  const labels=[...document.querySelectorAll('#dcards .legs label')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
  const charge=calc(P.mi,jobs[0].start,'');
  const before=calc(30,jobs[0].start,'');
  return {l1:s.l1mi,leg2:s.legs&&s.legs[0]&&s.legs[0].mi,auto:s.legs&&s.legs[0]&&s.legs[0].miAuto,P,inputs,labels,exp:charge.total,exp30:before.total,same:false};
 });
 const add=(t,c)=>{console.log(t,c?'ok':'FAIL');if(!c)fail=true};let fail=false;
 add('gap not busy',info.gapBusy.length===0);
 add('gap not in buffer either (15 min, 4h hole)',info.gapBuf.length===0);
 add('leg 1 blocks',info.leg1Busy.includes('SG1'));
 add('leg 2 blocks',info.leg2Busy.includes('SG1'));
 add('two spans',info.S.length===2);
 add('AW shows BB fits 11:30 in the gap',aw.fits);
 add('AW lists the mid-day free window (~10:15–1:45)',aw.gapWin);
 add('AW does not treat 9AM–5PM as one block',aw.notEnvelope);
 add('Leg 1 saved 30',String(miles.l1)==='30');
 add('Leg 2 prefilled 30',String(miles.leg2)==='30');
 add('Leg 2 still auto',!!miles.auto);
 add('projected miles 60',miles.P.mi===60);
 add('charge uses 60 not 30',miles.exp!==miles.exp30&&miles.exp>0);
 add('Miles labels present',labelsHave(miles.labels));
 add('no page errors',errs.length===0);
 function labelsHave(L){return (L||[]).filter(t=>/^Miles/.test(t)).length>=2}
 console.log(JSON.stringify({info,aw,miles,errs},null,1));
 await b.close();clearTimeout(killer);
 process.exit(fail?1:0);
})().catch(e=>{console.log('SPLITGAP46 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
