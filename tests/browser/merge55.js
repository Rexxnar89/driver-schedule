// node tests/browser/merge55.js   (U=.../index.html)
// v55: multi-leg jobs show in the merge picker and use one slot per leg (8-leg cap); ones that won't fit are greyed
// with the slots they need. The earliest job is the host; an absorbed multi-leg job brings all its legs (miles,
// odometer, done) and gets mergedInto. Removing any of its legs sends the whole job back with all its legs.
// Merged-in, canceled, block and availability jobs stay out. 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('MERGE55 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[],dl=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dl.push(d.message());d.accept().catch(()=>{})});
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof mergeDo=="function"&&typeof legMiOf=="function"',{timeout:15000});await W(400);
  // P 22:50 (host-to-be), A 23:00 + legs B 23:06, C 23:12; F 23:30 + G 23:36, H 23:42; K 23:46 + 23:48, 23:50; I 23:54; excluded Q canceled, R block, S availability
  await pg.evaluate(()=>{jobs.length=0;const d0=new Date();d0.setHours(22,50,0,0);const at=m=>new Date(+d0+m*6e4),mk=(id,m,x)=>({uid:id,evuid:id,start:at(m),endT:at(m+4),driver:'Jeffrey',client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:id+' Test St, Sampletown, OH',to:id+' Demo Ave, Sampletown, OH',pax:1,...(x||{})});
    jobs.push(mk('P',0),mk('A',10),mk('B',16),mk('C',22),mk('F',40),mk('G',46),mk('H',52),mk('K',56),mk('K2',58),mk('K3',60),mk('I',64),mk('Q',20,{canceled:1}),mk('R',24,{block:1}),mk('S',26,{client:'Kaci available',title:'Available',raw:'Available'}));
    LS.st='{}';drv.value='';EXP.clear();render();show('driver');
    mergeDo(['A','B','C']);mergeDo(['F','G','H']);mergeDo(['K','K2','K3']);
    legMiSet('P',1,'10');legMiSet('A',1,'20');legModeSet('A',2,'odo');legOdoSet('A',2,'a','100');legOdoSet('A',2,'b','105.5');legSet('A',0,'done',1764000000000);legMiSet('F',1,'7');legMiSet('F',2,'3');render()});
  const G=u=>pg.evaluate(u=>{const C=x=>{const c=dtCard(x);return c&&c.offsetParent?c:null},s=ST()[u]||{},L=s.legs||[],j=jobs.find(x=>x.uid==u);
    return{n:L.length+1,src:L.map(l=>(l.via?l.via[0]+':':'')+(l.fromUid||'')).join(' '),mi:legMiList(s),tot:R2(legMiList(s).reduce((a,b)=>a+b,0)),exp:R2(trip(s,j.start,u).exp),want:R2(calc(trip(s,j.start,u).proj,j.start,s.wh).total),into:s.mergedInto||'',odo2:legMiOf(s,2),done:L.map(l=>l.done?1:0).join(''),l1mi:s.l1mi,
      merge:!!(C(u)&&[...C(u).querySelectorAll('button')].some(x=>/Merge jobs/.test(x.textContent))),shown:!!C(u)}},u);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d||''))},R={};
  const openOn=async u=>{await pg.evaluate(u=>{EXP.add(u);renderDriver()},u);await W(150);const r=await pg.evaluate(u=>{const c=dtCard(u),b=c&&[...c.querySelectorAll('button')].find(x=>/Merge jobs/.test(x.textContent));if(!b)return null;b.scrollIntoView({block:'center'});const q=b.getBoundingClientRect();return[q.left+q.width/2,q.top+q.height/2]},u);if(!r)return false;await W(200);await pg.touchscreen.tap(r[0],r[1]);await W(250);return pg.evaluate(()=>!!document.getElementById('mergedlg'))};
  const pk=()=>pg.evaluate(()=>{const d=document.getElementById('mergedlg');if(!d)return{txt:'no picker',rows:{}};const rows={};d.querySelectorAll('.mgc').forEach(x=>rows[x.dataset.u]={txt:x.textContent.replace(/\s+/g,' '),grey:x.style.opacity=='0.45',btns:[...x.querySelectorAll('button')].map(b=>b.textContent),small:[...x.querySelectorAll('small')].map(e=>e.textContent).join('|')});return{txt:d.textContent.replace(/\s+/g,' '),rows}});
  const tap=u=>pg.evaluate(u=>{const x=document.querySelector(`#mergedlg .mgc[data-u="${u}"] > div`);x&&x.click()},u).then(()=>W(80));
  const btn=t=>pg.evaluate(t=>{const x=[...document.querySelectorAll('#mergedlg button')].find(b=>b.textContent==t);x&&x.click();return!!x},t).then(r=>W(250).then(()=>r));
  R.a0=await G('A');ok('setup: A is a 3-leg host',R.a0.n==3&&R.a0.mi.join()=='20,5.5,20',R.a0);
  // 1 picker on P lists multi-leg A/F/K with their leg counts; excludes merged, canceled, block, availability
  ok('picker opens on P',await openOn('P'));R.p1=await pk();const ks=Object.keys(R.p1.rows).join(',');
  ok('candidates = A,F,K,I only',ks=='A,F,K,I',ks);ok('A shows 3 legs, fits',/3 legs/.test((R.p1.rows.A||{}).txt)&&!(R.p1.rows.A||{}).grey,R.p1.rows.A);ok('header 7 left',/7 left/.test(R.p1.txt),R.p1.txt.slice(0,200));
  await tap('A');ok('Merge A into P',await btn('Merge'));R.m1=await G('P');R.a1=await G('A');
  ok('P host: 4 legs, A group via A',R.m1.n==4&&R.m1.src=='A:A A:B A:C',R.m1);ok('A absorbed (mergedInto P, legs cleared, card hidden)',R.a1.into=='P'&&R.a1.n==1&&!R.a1.shown,R.a1);
  ok('A miles/odo/done kept on P',R.m1.mi.join()=='10,20,5.5,20'&&R.m1.done=='010',R.m1);
  // 2 picker on P: 4 left; F (3) Select more -> 1 left; K (3) greyed "needs 3 slots"; I last slot
  await openOn('P');R.p2=await pk();ok('4 left, F fits, K fits',/4 left/.test(R.p2.txt)&&!R.p2.rows.F.grey&&!R.p2.rows.K.grey&&!R.p2.rows.A,R.p2.rows);
  await tap('F');ok('F select more',await btn('Select more'));R.p3=await pk();
  ok('K greyed, needs 3 slots, 1 left',R.p3.rows.K.grey&&/needs 3 slots · 1 left/.test(R.p3.rows.K.small),R.p3.rows.K);
  await tap('K');R.p3k=await pk();ok('tapping greyed K does nothing',R.p3k.rows.K.btns.length==0,R.p3k.rows.K);
  await tap('I');R.p4=await pk();ok('I: last leg slot, Merge only',R.p4.rows.I.btns.join()=='Merge'&&/last leg slot/.test(R.p4.rows.I.small),R.p4.rows.I);
  await pg.screenshot({path:process.env.SHOT||'/tmp/merge55_picker.png'});
  await btn('Merge');R.m2=await G('P');R.f2=await G('F');
  ok('P: 8 legs in time order',R.m2.n==8&&R.m2.src=='A:A A:B A:C F:F F:G F:H I',R.m2);ok('F absorbed',R.f2.into=='P'&&R.f2.n==1,R.f2);
  ok('8-leg miles 10+20+5.5+20+7+3+7+10 = 82.5, charge recalculated',R.m2.mi.join()=='10,20,5.5,20,7,3,7,10'&&R.m2.tot==82.5&&R.m2.exp==R.m2.want&&R.m2.exp>0,R.m2);ok('P full: no Merge',!R.m2.merge,R.m2);
  R.over=await pg.evaluate(()=>{const n=ST().P.legs.length;mergeDo(['P','K']);return ST().P.legs.length==n&&!(ST().K||{}).mergedInto});ok('over cap refused',R.over&&dl.some(m=>/Up to 8 legs/.test(m)),dl);
  // 3 edit F's leg G on P, then remove C (A's leg) -> A back with all 3 legs; P keeps F group
  await pg.evaluate(()=>legMiSet('P',7-1,'4'));R.m3=await G('P');ok('edit on P (G leg = 4)',R.m3.mi[5]==4,R.m3);
  await pg.evaluate(()=>{const i=ST().P.legs.findIndex(l=>l.fromUid=='C');legDel('P',i);EXP.add('A');renderDriver()});await W(200);
  R.a3=await G('A');R.p5=await G('P');ok('A restored with B,C, miles/odo/done intact',R.a3.into==''&&R.a3.n==3&&R.a3.src=='B C'&&R.a3.mi.join()=='20,5.5,20'&&R.a3.odo2.odo==1&&R.a3.done=='10'&&R.a3.l1mi=='20',R.a3);
  ok('A card back with Merge',R.a3.shown&&R.a3.merge,R.a3);ok('P keeps F group + I (5 legs)',R.p5.n==5&&R.p5.src=='F:F F:G F:H I'&&R.p5.merge,R.p5);
  ok('confirm names the whole job',dl.some(m=>/all 3 of its legs go back/.test(m)),dl);
  await pg.evaluate(()=>{const i=ST().P.legs.findIndex(l=>l.fromUid=='H');legDel('P',i)});await W(150);R.f4=await G('F');
  ok('F restored with edited G=4 and auto H',R.f4.into==''&&R.f4.n==3&&R.f4.mi.join()=='7,4,7'&&R.f4.src=='G H',R.f4);
  // 4 re-merge A and F (3+3) into P (2) = 8
  await openOn('P');await tap('A');await btn('Select more');await tap('F');R.p6=await pk();ok('F uses the last 3 slots',/uses the last 3 leg slots/.test(R.p6.rows.F.small),R.p6.rows.F);await btn('Merge');
  R.m4=await G('P');ok('re-merge: 8 legs in order, values kept',R.m4.n==8&&R.m4.src=='A:A A:B A:C F:F F:G F:H I'&&R.m4.mi.join()=='10,20,5.5,20,7,4,7,10',R.m4);
  // 5 an earlier job takes over: Z (22:40) merges with host P -> Z is host, P (8 legs) won't fit; with a 2-leg host Kx it does
  R.e=await pg.evaluate(()=>{const s=new Date();s.setHours(22,40,0,0);jobs.push({uid:'Z',evuid:'Z',start:s,endT:new Date(+s+24e4),driver:'Jeffrey',client:'Fake Rider Z',raw:'Fake',from:'Z St',to:'Z Ave',pax:1});mergeDo(['K','Z']);const z=ST().Z||{},k=ST().K||{};return{n:(z.legs||[]).length+1,src:(z.legs||[]).map(l=>(l.via?l.via[0]+':':'')+l.fromUid).join(' '),k:k.mergedInto}});
  ok('earliest job is host; K absorbed with its legs',R.e.n==4&&R.e.src=='K:K K:K2 K:K3'&&R.e.k=='Z',R.e);
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('MERGE55',JSON.stringify({m2:R.m2,a3:R.a3,m4:R.m4}));
  console.log(bad.length?'MERGE55 FAIL\n'+bad.join('\n'):'MERGE55 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('MERGE55 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
