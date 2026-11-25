// node tests/browser/odo58.js   (U=.../index.html)
// v58: "Please reset odometer" with ONE "Odometer reading (mi)" box at the top of the open job card, first thing under the
// card's header bar (above it, it shifted the tapped header on open/close and broke tabs50's no-snap check).
// Saved per job (odoReset), comma decimals, off the sheet, record only: leg miles/odometer, leg total, charge and
// the typed-miles projection line don't change. 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html',SH=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms));let LSst;
let _b;const killer=setTimeout(()=>{console.log('ODO58 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},120000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof legMiSet=="function"',{timeout:15000});await W(400);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d===undefined?'':d))},R={};
  await pg.evaluate(()=>{jobs.length=0;const d0=new Date();d0.setHours(23,0,0,0);const mk=(id,m)=>({uid:id,evuid:id,start:new Date(+d0+m*6e4),endT:new Date(+d0+(m+30)*6e4),driver:'Jeffrey',client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:'10 Test St, Sampletown, OH',to:'20 Demo Ave, Sampletown, OH',pax:1});
    jobs.push(mk('M',0),mk('S',20));LS.st='{}';drv.value='';EXP.clear();render();show('driver');
    setSt('M','legs',[{pk:'20 Demo Ave, Sampletown, OH',dz:'30 Fake Rd, Sampletown, OH',t:'',drv:'Jeffrey',done:0},{pk:'30 Fake Rd, Sampletown, OH',dz:'10 Test St, Sampletown, OH',t:'',drv:'Jeffrey',done:0}]);
    setSt('M','hm','30');legMiSet('M',1,'20');legModeSet('M',2,'odo');legOdoSet('M',2,'a','1000');legOdoSet('M',2,'b','1005');legMiSet('M',3,'19,5');EXP.add('M');renderDriver()});
  await W(300);
  const snap=()=>pg.evaluate(()=>{const s=ST().M,j=jobs[0],t=trip(s,j.start,'M'),c=dtCard('M'),tp=c&&c.querySelector('.typproj'),x={...s};delete x.odoReset;let ex='';try{ex=JSON.stringify(exLine(j))}catch(e){ex='err '+e.message}return{legs:legMiList(s).join(),tot:t.proj,exp:R2(t.exp),typ:tp?tp.textContent.replace(/\s+/g,' ').trim():'',st:JSON.stringify(x),ex,odo:s.odoReset}});
  const top=u=>pg.evaluate(u=>{const c=dtCard(u);if(!c)return{};const f=c.firstElementChild,o=c.querySelector('.odor');const h=c.querySelector('.jh');return{first:f&&f.className,next:h&&h.nextElementSibling&&h.nextElementSibling.className,ins:o?o.querySelectorAll('input').length:0,txt:o?o.textContent.replace(/\s+/g,' ').trim():'',val:o&&o.querySelector('input')?o.querySelector('input').value:null,aboveHd:!!(o&&c.querySelector('.jh')&&(o.compareDocumentPosition(c.querySelector('.jh'))&Node.DOCUMENT_POSITION_FOLLOWING))}},u);
  R.t0=await top('M');R.b0=await snap();
  ok('top of open card: Please reset odometer + one box',/jh/.test(R.t0.first)&&R.t0.next=='odor'&&R.t0.ins==1&&R.t0.txt.replace(/\s/g,'')=='PleaseresetodometerOdometerreading(mi)',R.t0);
  ok('setup: legs 20 + 5 (odo) + 19.5 = 44.5, typed-miles line 60 mi',R.b0.legs=='20,5,19.5'&&R.b0.tot==44.5&&/60 mi/.test(R.b0.typ),R.b0);
  R.cl=await pg.evaluate(()=>{const c=dtCard('S');return c?!!c.querySelector('.odor'):'no card'});ok('closed card has no odometer box',R.cl===false,R.cl);
  if(SH){await pg.evaluate(()=>{dtCard('M').scrollIntoView({block:'start'});scrollBy(0,-8)});await W(300)}
  // type 48213,5 then ✓ Done
  const xy=await pg.evaluate(()=>{const e=dtCard('M').querySelector('.odorin');e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return[r.left+40,r.top+r.height/2]});
  await pg.touchscreen.tap(xy[0],xy[1]);await W(150);await pg.keyboard.type('48213,5',{delay:30});await W(100);
  await pg.evaluate(()=>{const b=document.querySelector('.fdone');b&&b.click()});await W(400);
  R.t1=await top('M');R.b1=await snap();
  ok('saved 48213.5 with the job and shown',R.b1.odo=='48213.5'&&R.t1.val=='48213.5'&&/"odoReset":"48213.5"/.test(LSst=await pg.evaluate(()=>LS.st)),{t1:R.t1,odo:R.b1.odo});
  ok('record only: legs, odometer leg, total, charge, typed-miles line, other state unchanged',R.b1.legs==R.b0.legs&&R.b1.tot==R.b0.tot&&R.b1.exp==R.b0.exp&&R.b1.typ==R.b0.typ&&R.b1.st==R.b0.st,{b0:R.b0,b1:R.b1});
  ok('sheet row unchanged',R.b1.ex==R.b0.ex&&!/48213/.test(R.b1.ex),R.b1.ex.slice(0,200));
  R.sync=await pg.evaluate(()=>!/'odoReset'/.test(String(setSt)));ok('odoReset not in the sync list',R.sync);
  if(SH){await pg.evaluate(()=>{dtCard('M').scrollIntoView({block:'start'});scrollBy(0,-8)});await W(400);await pg.screenshot({path:SH+'/1-please-reset-odometer-top-of-card.png'})}
  // comma-free decimal, clearing, bad input ignored
  await pg.evaluate(()=>{odoRSet('M','abc')});await W(100);R.bad=await pg.evaluate(()=>ST().M.odoReset);ok('bad input ignored',R.bad=='48213.5',R.bad);
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('ODO58',JSON.stringify({t0:R.t0,b1:{legs:R.b1.legs,exp:R.b1.exp,typ:R.b1.typ,odo:R.b1.odo}}));
  console.log(bad.length?'ODO58 FAIL\n'+bad.join('\n'):'ODO58 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('ODO58 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
