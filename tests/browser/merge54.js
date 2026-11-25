// node tests/browser/merge54.js   (U=.../index.html)
// v54: a merged job keeps its 🔗 Merge jobs button and can take more jobs up to the cap (8 legs);
// existing legs keep their miles/odometer; at the cap Merge is gone with a note; removing a merged-in
// leg brings that job back with its own Merge button; re-merge works. 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('MERGE54 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[],dl=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dl.push(d.message());d.accept().catch(()=>{})});
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof mergeDo=="function"&&typeof legMiOf=="function"',{timeout:15000});await W(400);
  await pg.evaluate(()=>{jobs.length=0;const d0=new Date();d0.setHours(22,50,0,0);const mk=(id,k)=>{const s=new Date(+d0+k*6*6e4);return{uid:id,evuid:id,start:s,endT:new Date(+s+5*6e4),driver:'Jeffrey',client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:k+' Test St, Sampletown, OH',to:k+' Demo Ave, Sampletown, OH',pax:1}};
    ['Z','A','B','C','D','E','F','G','H','I'].forEach((id,k)=>jobs.push(mk(id,k)));LS.st='{}';drv.value='';EXP.clear();render();show('driver')});
  const G=()=>pg.evaluate(()=>{const C=u=>{const c=dtCard(u);return c&&c.offsetParent?c:null},mb=u=>{const c=C(u);return!!(c&&[...c.querySelectorAll('button')].some(x=>/Merge jobs/.test(x.textContent)))},s=ST().A||{},L=s.legs||[];
    return{n:L.length+1,from:L.map(l=>l.fromUid).join(''),t:L.map(l=>l.t.slice(11)).join(' '),mi:legMiList(s),tot:R2(legMiList(s).reduce((a,b)=>a+b,0)),exp:R2(trip(s,jobs.find(j=>j.uid=='A').start,'A').exp),want:R2(calc(trip(s,jobs.find(j=>j.uid=='A').start,'A').proj,jobs.find(j=>j.uid=='A').start,s.wh).total),
      mA:mb('A'),addA:!!(C('A')&&[...C('A').querySelectorAll('button')].some(x=>/Add leg/.test(x.textContent))),note:!!(C('A')&&/8 legs — the most/.test(C('A').textContent)),shown:jobs.map(j=>j.uid).filter(u=>C(u)).join(''),mC:mb('C'),mi2:legMiOf(s,2)}});
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d||''))},R={};
  const pick=async(u,act)=>{await pg.evaluate(u=>mergeTap(u),u);await W(80);return pg.evaluate((u,act)=>{const d=document.getElementById('mergedlg');if(!d)return{err:'no picker',btns:[],small:'',txt:''};const row=[...d.querySelectorAll('div[onclick^="mergeTap"]')].find(x=>x.getAttribute('onclick').includes("'"+u+"'"));const box=row&&row.parentElement;const r={txt:d.textContent.replace(/\s+/g,' ').slice(0,260),btns:box?[...box.querySelectorAll('button')].map(x=>x.textContent):[],small:box?(box.querySelector('small')||{}).textContent||'':''};const bt=box&&[...box.querySelectorAll('button')].find(x=>x.textContent==act);if(bt)bt.click();return r},u,act)};
  const openA=async()=>{await pg.evaluate(()=>{EXP.add('A');renderDriver()});await W(150);const r=await pg.evaluate(()=>{const c=dtCard('A'),b=c&&[...c.querySelectorAll('button')].find(x=>/Merge jobs/.test(x.textContent));if(!b)return null;b.scrollIntoView({block:'center'});const q=b.getBoundingClientRect();return[q.left+q.width/2,q.top+q.height/2]});if(!r)return false;await W(200);await pg.touchscreen.tap(r[0],r[1]);await W(250);return pg.evaluate(()=>!!document.getElementById('mergedlg'))};
  // 1 A+B; Merge stays on the merged card
  await pg.evaluate(()=>{mergeDo(['A','B']);EXP.add('A');renderDriver()});await W(200);R.ab=await G();
  ok('A+B merged, B hidden',R.ab.n==2&&R.ab.from=='B'&&!/B/.test(R.ab.shown),R.ab);ok('Merge still on merged A',R.ab.mA&&R.ab.addA,R.ab);
  // leg miles: Leg 1 typed 20, Leg 2 odometer 100 -> 105.5
  await pg.evaluate(()=>{legMiSet('A',1,'20');legModeSet('A',2,'odo');legOdoSet('A',2,'a','100');legOdoSet('A',2,'b','105.5')});await W(100);
  // 2 tap Merge on A at 390px, picker shows slots left, excludes B, Z (before Leg 1) and A
  ok('picker opens from merged card',await openA());
  R.p=await pg.evaluate(()=>{const d=document.getElementById('mergedlg');if(!d)return{txt:'no picker',rows:''};return{txt:d.textContent.replace(/\s+/g,' '),rows:[...d.querySelectorAll('div[onclick^="mergeTap"]')].map(x=>x.getAttribute('onclick').match(/'([^']+)'/)[1]).join('')}});
  ok('picker: 6 left, lists C..I only',/6 left/.test(R.p.txt)&&R.p.rows=='CDEFGHI'&&/already on this job/.test(R.p.txt),R.p);
  await pick('C','Merge');await W(200);R.c=await G();
  ok('C merged on top: 3 legs, order B C',R.c.n==3&&R.c.from=='BC',R.c);ok('leg 2 odometer kept 5.5, leg 3 default 20',R.c.mi.join()=='20,5.5,20'&&R.c.mi2.odo==1,R.c);ok('Merge still there at 3',R.c.mA,R.c);
  // 3 D..H with Select more up to the cap; last slot has no Select more
  await openA();for(const u of ['D','E','F','G']){const r=await pick(u,'Select more');ok('select more '+u,r.btns.includes('Select more'),r)}
  R.last=await pick('H','');ok('last slot: Merge only',R.last.btns.join()=='Merge'&&/last leg slot/.test(R.last.small)&&/1 left/.test(R.last.txt),R.last);
  await pg.evaluate(()=>{const d=document.getElementById('mergedlg');[...d.querySelectorAll('button')].find(x=>x.textContent=='Merge').click()});await W(250);R.full=await G();
  ok('8 legs in time order',R.full.n==8&&R.full.from=='BCDEFGH',R.full);ok('at 8: no Merge, no Add leg, note shown',!R.full.mA&&!R.full.addA&&R.full.note,R.full);
  ok('8-leg total 20+5.5+20x6 = 145.5, charge = rate x total',R.full.tot==145.5&&R.full.exp==R.full.want&&R.full.exp>0,R.full);
  R.over=await pg.evaluate(()=>{const n0=(ST().A.legs||[]).length;mergeDo(['A','I']);return(ST().A.legs||[]).length==n0&&!(ST().I||{}).mergedInto});ok('9th leg refused',R.over&&dl.some(m=>/Up to 8 legs/.test(m)),dl);
  // 4 remove merged leg C -> C back with Merge; A gets Merge back
  await pg.evaluate(()=>{const i=ST().A.legs.findIndex(l=>l.fromUid=='C');legDel('A',i);EXP.add('C');renderDriver()});await W(200);R.del=await G();
  ok('C restored with Merge, A has 7 legs and Merge again',R.del.n==7&&/C/.test(R.del.shown)&&R.del.mC&&R.del.mA,R.del);ok('leg 2 still odometer 5.5',R.del.mi[1]==5.5,R.del);
  // 5 re-merge C into A -> back in its time slot
  await openA();await pick('C','Merge');await W(200);R.re=await G();ok('re-merge C in time order',R.re.n==8&&R.re.from=='BCDEFGH'&&R.re.mi[1]==5.5,R.re);
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('MERGE54',JSON.stringify({ab:R.ab,full:R.full,re:R.re}));
  console.log(bad.length?'MERGE54 FAIL\n'+bad.join('\n'):'MERGE54 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('MERGE54 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
