// node tests/browser/compare61.js   (U=.../index.html)  SHOTS=dir
// v61: the Compare tab's top strip and day highlight follow the ACTIVE comparison (visible range in Day / 3-day / Week,
// after ‹ › navigation, the selected drivers / A vs B, and the picked day), not the current time. 'now' is only a thin
// grid line when today is in view. 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html',SH=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('COMPARE61 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1|rexxnar89\.github\.io)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof show=="function"',{timeout:15000});await W(500);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d===undefined?'':d))},R={};
  await pg.evaluate(()=>{LS.drivers=JSON.stringify(['Jeffrey','Jared','Kaci','BB']);jobs.length=0;const T=new Date();T.setHours(0,0,0,0);
    const at=(dd,h,m)=>{const d=new Date(T);d.setDate(d.getDate()+dd);d.setHours(h,m||0,0,0);return d};
    const mk=(id,drv,dd,h,len)=>({uid:id,evuid:id,start:at(dd,h),endT:new Date(+at(dd,h)+len*36e5),driver:drv,client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,tt:'ow'});
    window._F=[mk('J0','Jeffrey',0,10,1),mk('J1a','Jeffrey',1,9,1),mk('J1b','Jeffrey',1,13,2),mk('J2','Jeffrey',2,8,1),mk('J8','Jeffrey',8,10,1),mk('R1','Jared',1,12,1),mk('R3','Jared',3,14,2),mk('K0','Kaci',0,14,1),mk('K2','Kaci',2,9,1)];
    jobs.push(..._F);LS.st='{}';LS.saved='{}';drv.value='';sessionStorage.removeItem('cmpv');render();show('cmp');cmpAB(0,'Jeffrey');cmpAB(1,'Jared');cmpSet('mode','day');cmpGo(0)});await W(300);
  const snap=()=>pg.evaluate(()=>{const c=document.querySelector('#cmp .cmpcov'),rows={},exp={};const ks=[...c.querySelectorAll('.cmpnr[data-d]')];
    ks.forEach(r=>{const d=r.dataset.d,cs=[...r.querySelectorAll('.cmpc')];rows[d]=cs.map(x=>x.dataset.n).join('');exp[d]=cs.map(x=>{const k=x.dataset.k;if(/^t/.test(k)){const h=+k.slice(1),day=c.dataset.sel;return _F.filter(j=>j.driver==d&&ymdL(j.start)==day&&j.start.getHours()<h+3&&j.endT.getHours()+j.endT.getMinutes()/60>h).length}return _F.filter(j=>j.driver==d&&ymdL(j.start)==k).length}).join('')});
    const sc=document.getElementById('cmpscroll'),nl=document.querySelector('#cmp .cmpnl');
    return{mode:c.dataset.mode,sel:c.dataset.sel,head:c.querySelector('.cmpnowh').textContent,rows,exp,selCells:[...c.querySelectorAll('.cmpnrh small')].map((s,i)=>s.classList.contains('sel')?i:-1).filter(i=>i>=0),
      selDay:[...document.querySelectorAll('#cmp .cmpday.cmpsel')].map(d=>d.dataset.day).join(),days:[...document.querySelectorAll('#cmp .cmpday')].map(d=>d.dataset.day),
      nl:nl?getComputedStyle(nl).borderTopWidth:'',sl:sc.scrollLeft,st:sc.scrollTop,cw:document.querySelector('#cmp .cmpcol').getBoundingClientRect().width,ttl:document.querySelector('#cmp .cmpttl').textContent,today:ymdL(new Date())}});
  const same=s=>JSON.stringify(s.rows)==JSON.stringify(s.exp);
  // Day today
  R.d0=await snap();ok('Day/today: strip = Jeffrey vs Jared for today, thin now line',R.d0.mode=='day'&&R.d0.sel==R.d0.today&&Object.keys(R.d0.rows).join()=='Jeffrey,Jared'&&same(R.d0)&&R.d0.nl=='1px'&&/now /.test(R.d0.head),R.d0);
  // Day › › : strip follows the viewed day, not today
  await pg.evaluate(()=>{cmpGo(1);cmpGo(1)});await W(200);R.d2=await snap();
  ok('Day › ›: strip and highlight follow the viewed day',R.d2.sel!=R.d2.today&&R.d2.selDay==R.d2.sel&&same(R.d2)&&R.d2.rows.Jeffrey.replace(/0/g,'')=='1'&&R.d2.nl==''&&!/now /.test(R.d2.head),R.d2);
  ok('Day: grid opens at that day\'s first job (8a)',Math.abs(R.d2.st-7.5*48)<2,R.d2.st);
  if(SH){await pg.evaluate(()=>scrollTo(0,document.getElementById('cmp').offsetTop-4));await W(250);await pg.screenshot({path:SH+'/1-day-view-after-next-next.png'})}
  await pg.evaluate(()=>cmpPick('t12'));await W(200);R.t12=(await snap()).st;ok('Day: tapping the 12p slot jumps the grid to 12p',Math.abs(R.t12-12*48)<2,R.t12);
  // 3-day
  await pg.evaluate(()=>{cmpSet('mode','3day');cmpGo(0)});await W(200);R.t0=await snap();
  ok('3-day: 3 day cells, today picked by default, counts match',R.t0.mode=='3day'&&R.t0.rows.Jeffrey.length==3&&R.t0.sel==R.t0.today&&R.t0.selCells.join()=='0'&&same(R.t0)&&R.t0.rows.Jeffrey=='121'&&R.t0.rows.Jared=='010',R.t0);
  await pg.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+1);cmpPick(ymdL(d))});await W(200);R.t1=await snap();
  ok('3-day: picking day 2 moves the highlight (strip + grid) and scrolls to it',R.t1.selCells.join()=='1'&&R.t1.selDay==R.t1.days[1]&&R.t1.sel==R.t1.days[1]&&Math.abs(R.t1.sl-2*R.t1.cw)<4,R.t1);
  if(SH){await pg.evaluate(()=>scrollTo(0,document.getElementById('cmp').offsetTop-4));await W(250);await pg.screenshot({path:SH+'/2-3day-picked-day2.png'})}
  await pg.evaluate(()=>cmpGo(1));await W(200);R.t2=await snap();
  ok('3-day ›: next 3 days, highlight moves to the first visible day, counts follow',R.t2.days[0]!=R.t0.days[0]&&R.t2.sel==R.t2.days[0]&&R.t2.selDay==R.t2.days[0]&&same(R.t2)&&R.t2.rows.Jared=='100'&&R.t2.nl=='',R.t2);
  // A vs B -> Kaci
  await pg.evaluate(()=>{cmpGo(0);cmpAB(1,'Kaci')});await W(200);R.ab=await snap();
  ok('A vs B: strip rows follow the pick (Jeffrey vs Kaci)',Object.keys(R.ab.rows).join()=='Jeffrey,Kaci'&&same(R.ab)&&R.ab.rows.Kaci=='101'&&/Jeffrey vs Kaci/.test(R.ab.head),R.ab);
  await pg.evaluate(()=>cmpTog('Jared'));await W(200);R.chip=await snap();ok('chips: adding Jared adds his row',Object.keys(R.chip.rows).join()=='Jeffrey,Jared,Kaci'&&same(R.chip),R.chip);
  // Week
  await pg.evaluate(()=>{cmpTog('Kaci');cmpSet('mode','week');cmpGo(0)});await W(200);R.w0=await snap();
  ok('Week: 7 day cells, counts per day match, today highlighted',R.w0.rows.Jeffrey.length==7&&same(R.w0)&&R.w0.sel==R.w0.today&&R.w0.selDay==R.w0.today,R.w0);
  if(SH){await pg.evaluate(()=>scrollTo(0,document.getElementById('cmp').offsetTop-4));await W(250);await pg.screenshot({path:SH+'/3-week-view.png'})}
  await pg.evaluate(()=>cmpGo(1));await W(200);R.w1=await snap();
  ok('Week ›: next week, highlight on its first day',R.w1.days[0]!=R.w0.days[0]&&R.w1.sel==R.w1.days[0]&&same(R.w1),R.w1);
  ok('Week ›: strip counts are for the visible week',same(R.w1)&&R.w1.nl=='',R.w1);
  if(SH){await pg.evaluate(()=>scrollTo(0,document.getElementById('cmp').offsetTop-4));await W(250);await pg.screenshot({path:SH+'/4-week-after-next.png'})}
  await pg.evaluate(()=>cmpGo(-2));await W(200);R.wp=await snap();ok('Week ‹ ‹: previous week, counts follow (none)',same(R.wp)&&!/[1-9]/.test(R.wp.rows.Jeffrey+R.wp.rows.Jared),R.wp);
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('COMPARE61',JSON.stringify({d2:R.d2.rows,t0:R.t0.rows,w0:R.w0.rows}));
  console.log(bad.length?'COMPARE61 FAIL\n'+bad.join('\n'):'COMPARE61 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('COMPARE61 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
