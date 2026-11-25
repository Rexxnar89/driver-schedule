// node tests/browser/proj57.js   (U=.../index.html)
// v56: projections use each leg's entered miles; Halfway and Total each show the other live (comma decimals);
// v57: the v56 manual boxes are gone (saved values kept); one read-only 'Projection from typed miles' line beside the leg total; Proton location rule (all Pickup unless a
// drop-off is labelled); job navigation has no Home origin/stop; Navigate home bar between Projections and Actuals;
// readable unselected toggles. 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html',SH=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms)),R2=x=>Math.round((x+1e-9)*100)/100;
let _b;const killer=setTimeout(()=>{console.log('PROJ57 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[],dl=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dl.push(d.message());d.accept().catch(()=>{})});
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof legMiSet=="function"&&typeof jStops=="function"',{timeout:15000});await W(400);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d===undefined?'':d))},R={};
  await pg.evaluate(()=>{jobs.length=0;const d0=new Date();d0.setHours(23,0,0,0);const mk=(id,m,x)=>({uid:id,evuid:id,start:new Date(+d0+m*6e4),endT:new Date(+d0+(m+30)*6e4),driver:'Jeffrey',client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:'10 Test St, Sampletown, OH',to:'20 Demo Ave, Sampletown, OH',pax:1,...(x||{})});
    jobs.push(mk('M',0),mk('S',20));LS.st='{}';LS.navcur='0';drv.value='';EXP.clear();render();show('driver');
    setSt('M','legs',[{pk:'20 Demo Ave, Sampletown, OH',dz:'30 Fake Rd, Sampletown, OH',t:'',drv:'Jeffrey',done:0},{pk:'30 Fake Rd, Sampletown, OH',dz:'10 Test St, Sampletown, OH',t:'',drv:'Jeffrey',done:0}]);
    setSt('M','hm','30');legMiSet('M',1,'20');legMiSet('M',2,'5');legMiSet('M',3,'19,5');EXP.add('M');EXP.add('S');renderDriver()});
  await W(300);
  // 1 multi-leg: projections use the legs' entered miles, not halfway x2
  R.m=await pg.evaluate(()=>{const c=dtCard('M'),s=ST().M,t=trip(s,jobs[0].start,'M'),pr=c.querySelector('.secw[data-sec$="proj"]');return{proj:t.proj,exp:R2(t.exp),want:R2(calc(44.5,jobs[0].start,s.wh).total),txt:pr?pr.textContent.replace(/\s+/g,' '):''}});
  ok('legs drive the projection: 20+5+19.5 = 44.5',R.m.proj==44.5&&R.m.exp==R.m.want,R.m);ok('grid shows 44.5 mi (legs) and the leg fare',/44\.5 mi \(legs\)/.test(R.m.txt)&&R.m.txt.includes('$'+R.m.exp.toFixed(2))&&!/60 mi \(2×30\)/.test(R.m.txt),R.m.txt.slice(0,400));
  ok('halfway marked not used',/not used: the legs have miles/.test(R.m.txt));
  if(SH){await pg.evaluate(()=>{const x=dtCard('M').querySelector('.secw[data-sec$="proj"]');x.scrollIntoView({block:'start'});scrollBy(0,-8)});await W(400);await pg.screenshot({path:SH+'/1-multileg-projection-uses-leg-miles.png'})}
  // 2 single job: type Halfway 19,5 -> Total 39 live, then Done
  const fld=k=>`#dcards .jc .hmin[data-k="${k}"]`;
  const inS=async(sel)=>pg.evaluate(sel=>{const c=dtCard('S');const e=c.querySelector(sel);e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return[r.left+r.width/2-40,r.top+r.height/2]},sel);
  const typeIn=async(sel,v)=>{const xy=await inS(sel);await pg.touchscreen.tap(xy[0],xy[1]);await W(150);await pg.keyboard.down('Control');await pg.keyboard.press('A');await pg.keyboard.up('Control');await pg.keyboard.press('Backspace');await pg.keyboard.type(v,{delay:30});await W(150)};
  const done=async()=>{await pg.evaluate(()=>{const b=document.querySelector('.fdone');b&&b.click()});await W(300)};
  const vals=()=>pg.evaluate(()=>{const c=dtCard('S'),q=k=>c.querySelector('.hmin[data-k="'+k+'"]');return{h:q('half').value,t:q('total').value,src:[...c.querySelectorAll('.hmsrc')].map(x=>x.textContent).join('|'),note:(c.querySelector('.hmnote')||{}).textContent,s:ST().S||{}}});
  await typeIn('.hmin[data-k="half"]','19,5');R.live1=await vals();ok('typing Halfway 19,5 shows Total 39 live',R.live1.t=='39'&&/Total 39 mi/.test(R.live1.note),R.live1);
  await done();R.d1=await vals();ok('saved halfway 19.5 as source',R.d1.s.hm=='19.5'&&R.d1.s.hmMode=='half'&&R.d1.h=='19.5'&&R.d1.t=='39'&&R.d1.src=='(typed)|(calculated)',R.d1);
  await typeIn('.hmin[data-k="total"]','45');R.live2=await vals();ok('typing Total 45 shows Halfway 22.5 live',R.live2.h=='22.5',R.live2);
  await done();R.d2=await vals();ok('saved total 45 as source, hm 22.5 for the sheet',R.d2.s.hm=='22.5'&&R.d2.s.hmTot=='45'&&R.d2.s.hmMode=='total'&&R.d2.src=='(calculated)|(typed)',R.d2);
  // 3 v57: manual boxes removed (old saved values untouched); multi-leg card shows one read-only projection from the typed miles
  await pg.evaluate(()=>{const S=ST();S.S={...S.S,pmMan:'50',fMan:'55.5'};LS.st=JSON.stringify(S);renderDriver()});await W(200);
  R.c1=await pg.evaluate(()=>{const s=ST(),M=s.M,j=jobs[0],t=trip(M,j.start,'M'),cm=dtCard('M'),cs=dtCard('S'),tp=cm.querySelector('.typproj');return{boxes:document.querySelectorAll('input[onchange*="manSet"],.mancmp').length,kept:s.S.pmMan=='50'&&s.S.fMan=='55.5',typ:tp?tp.textContent.replace(/\s+/g,' ').trim():'',want:'$'+R2(calc(60,j.start,M.wh).total).toFixed(2),proj:t.proj,exp:R2(t.exp),legs:legMiList(M).join(),legsRaw:JSON.stringify(M.legs),sTyp:!!cs.querySelector('.typproj'),hm:M.hm}});
  ok('manual boxes and Calc/Yours lines gone',R.c1.boxes==0,R.c1);ok('saved manual values not deleted',R.c1.kept,R.c1);
  ok('Projection from typed miles: 60 mi · fare',R.c1.typ.replace(/\s/g,"")==`Projectionfromtypedmiles60mi·${R.c1.want}`,R.c1);
  ok('leg numbers and leg estimate unchanged',R.c1.proj==44.5&&R.c1.exp==R.m.exp&&R.c1.legs=='20,5,19.5'&&R.c1.hm=='30',R.c1);
  ok('no extra line on a job without legs',!R.c1.sTyp,R.c1);
  if(SH){await pg.evaluate(()=>{const x=dtCard('M').querySelector('.typproj');x.scrollIntoView({block:'center'})});await W(400);await pg.screenshot({path:SH+'/2-projection-from-typed-miles.png'})}
  R.c1b=await pg.evaluate(()=>{const m=ST().M;legMiSet('M',2,'6');const a=R2(trip(ST().M,jobs[0].start,'M').exp),tp=dtCard('M').querySelector('.typproj').textContent;legMiSet('M',2,'5');return{a,tp}});
  ok('typed-miles projection does not follow leg edits',R.c1b.tp.includes('60 mi · '+R.c1.want),R.c1b);
  // 4 toggle contrast (unselected = dark text on light grey)
  R.tg=await pg.evaluate(()=>{const c=dtCard('S'),bt=[...c.querySelectorAll('button')].filter(x=>/^(Halfway miles|Total miles|Miles|Odometer)$/.test(x.textContent.trim())),cs=bt.map(x=>getComputedStyle(x)),un=cs.filter(x=>/236, 239, 241/.test(x.backgroundColor));const cm=dtCard('M'),ob=[...cm.querySelectorAll('.legmi button')].map(x=>getComputedStyle(x)).filter(x=>/236, 239, 241/.test(x.backgroundColor));return{n:bt.length,un:un.map(x=>x.color),ob:ob.map(x=>x.color).slice(0,2)}});
  ok('unselected toggles: #37474f on #eceff1',R.tg.un.length>=1&&R.tg.un.every(c=>c=='rgb(55, 71, 79)')&&R.tg.ob.length&&R.tg.ob.every(c=>c=='rgb(55, 71, 79)'),R.tg);
  // 5 Navigate home bar between Projections and Actuals, full width, once per card
  R.hb=await pg.evaluate(()=>{const c=dtCard('S'),h=c.querySelectorAll('[aria-label="Navigate home"]'),x=h[0],cw=c.getBoundingClientRect().width;return{n:h.length,prev:x&&x.previousElementSibling&&x.previousElementSibling.dataset.sec,next:x&&x.nextElementSibling&&x.nextElementSibling.dataset.sec,w:x&&Math.round(x.getBoundingClientRect().width),cw:Math.round(cw),txt:x&&x.textContent.trim(),href:x&&x.href,bg:x&&getComputedStyle(x).backgroundColor,inActions:!!(x&&x.closest('.secw[data-sec$="actions"]')),cmpl:!!c.querySelector('.secw[data-sec$="actions"] .btn.ok')}});
  ok('home bar between proj and act, full width, purple, same link',R.hb.n==1&&/proj$/.test(R.hb.prev||'')&&/act$/.test(R.hb.next||'')&&R.hb.w>=R.hb.cw-60&&R.hb.txt=='🏠Navigate home'&&/destination=9082/.test(R.hb.href)&&R.hb.bg=='rgb(106, 27, 154)'&&!R.hb.inActions&&R.hb.cmpl,R.hb);
  if(SH){await pg.evaluate(()=>{const x=dtCard('S').querySelector('.homebar');x.scrollIntoView({block:'center'})});await W(400);await pg.screenshot({path:SH+'/3-navigate-home-bar.png'})}
  // 6 navigation: no Home origin/stop, pickups then drop-offs only (Owner setting = Home base)
  R.nav=await pg.evaluate(()=>{const H=encodeURIComponent(HOME()),c=dtCard('S'),go=c.querySelector('.navpill:not(.navdz)'),dz=c.querySelector('.navdz');const rt={...jobs[1],uid:'RT',tt:'rt'};return{L:jobStopsList(jobs[1]).join(' > '),go:go&&go.href,dz:dz&&dz.href,nu:navUrl('20 Demo Ave, Sampletown, OH'),H}});
  ok('route = pickup > drop-off, no Home',R.nav.L=='10 Test St, Sampletown, OH > 20 Demo Ave, Sampletown, OH',R.nav.L);
  ok('no Home origin in Go / drop-off / navUrl',[R.nav.go,R.nav.dz,R.nav.nu].every(h=>h&&!/origin=/.test(h)&&!h.includes(R.nav.H)),R.nav);
  // 7 Proton location rule
  R.pr=await pg.evaluate(()=>{const J=(loc,x)=>{const j={uid:'P'+Math.random(),start:new Date(),loc,from:'',to:'',...(x||{})};const r=jStops(j);return r.p.length+'p:'+r.d.length+'d'};
    return{one:J('123 Main St, Shreve, OH 44676'),many:J('123 Main St, Shreve, OH 44676; 456 Oak Ave, Wooster, OH 44691; 789 Elm St, Orrville, OH 44667'),lab:J('Pickup: 123 Main St, Shreve, OH 44676\nDrop-off: 456 Oak Ave, Wooster, OH 44691'),at:J('123 Main St, Shreve, OH 44676; 456 Oak Ave, Wooster, OH 44691; Drop off at 789 Elm St, Orrville, OH 44667'),dest:J('123 Main St, Shreve, OH 44676\n\nDestination: 789 Elm St, Orrville, OH 44667'),to:J('123 Main St, Shreve, OH 44676; To: 789 Elm St, Orrville, OH 44667')}});
  ok('Proton: one address -> Pickup only',R.pr.one=='1p:0d',R.pr);ok('Proton: 3 addresses, no label -> all Pickup',R.pr.many=='3p:0d',R.pr);
  ok('Proton: labelled Drop-off / Drop off at / Destination / To: -> Drop-off',R.pr.lab=='1p:1d'&&R.pr.at=='2p:1d'&&R.pr.dest=='1p:1d'&&R.pr.to=='1p:1d',R.pr);
  // 8 Create job: Passengers → Vehicles & equipment → Vehicle → Trailer / Equipment (same ids)
  await pg.evaluate(()=>show('newjob'));await pg.waitForFunction(()=>{const w=document.getElementById('vehsel');return w&&w.previousElementSibling&&w.previousElementSibling.id=='vesec'},{timeout:5000}).catch(()=>{});
  R.cf=await pg.evaluate(()=>{const D=i=>document.getElementById(i),y=i=>{const e=D(i);return e&&e.offsetParent?Math.round(e.getBoundingClientRect().top+scrollY):null},w=D('vehsel');return{pax:y('paxsec'),ve:y('vesec'),nv:y('nv'),neq:y('neq'),prev:w&&w.previousElementSibling&&w.previousElementSibling.id,ids:['nv','neq','np'].every(D),h:[D('nv').getAttribute('onchange'),D('neq').getAttribute('onchange')],next:w&&w.nextElementSibling&&(w.nextElementSibling.textContent||'').trim().slice(0,20)}});
  ok('create form order Passengers > Vehicles & equipment > Vehicle > Trailer',R.cf.prev=='vesec'&&R.cf.pax<R.cf.ve&&R.cf.ve<R.cf.nv&&R.cf.nv<R.cf.neq&&R.cf.ids&&R.cf.h.join()=='vehChg(),eqChg()',R.cf);
  if(SH){await pg.evaluate(()=>{document.getElementById('paxsec').scrollIntoView({block:'start'});scrollBy(0,-10)});await W(400);await pg.screenshot({path:SH+'/4-create-job-vehicle-order.png'})}
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('PROJ57',JSON.stringify({m:R.m.proj,c0:R.c0,typ:R.c1.typ,tg:R.tg,hb:R.hb,pr:R.pr}).slice(0,900));
  console.log(bad.length?'PROJ57 FAIL\n'+bad.join('\n'):'PROJ57 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('PROJ57 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
