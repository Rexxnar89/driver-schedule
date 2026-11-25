// node tests/browser/compare59.js   (U=.../index.html)   SHOTS=dir for screenshots
// v59 ⚖️ Compare tab: Proton-style grid, drivers side by side per day, Now coverage strip, filters, totals,
// hybrid grid (30-min lines, 15-min ticks, blocks at real times), clash stacking with ⚠ on the topmost,
// tap opens the job card, read-only. Also: created-at stamp on job cards; Calendar tab polish (look only).
// 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html',SH=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms)),R2=x=>Math.round((x+1e-9)*100)/100;
let _b;const killer=setTimeout(()=>{console.log('COMPARE59 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},150000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof calRender=="function"',{timeout:15000});await W(500);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d===undefined?'':d))},R={};
  R.ver=await pg.evaluate(()=>(document.querySelector('meta[name=ds-ver]')||{}).content||'');
  ok('version is 2026-11-25.63',R.ver==='2026-11-25.63',R.ver);
  R.fx=await pg.evaluate(()=>{LS.drivers=JSON.stringify(['Jeffrey','Jared','Kaci','BB']);jobs.length=0;const now=Date.now(),M=6e4,at=m=>new Date(now+m*M),cr=Date.now()-3*864e5;
    const mk=(id,drv,s,e,x)=>({uid:id,evuid:id,start:s,endT:e,driver:drv,client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,tt:'ow',vehicle:'Ford Van',...(x||{})});
    const o=new Date(now+150*M);o.setSeconds(0,0);o.setMinutes(7);const ov=m=>new Date(+o+m*M);
    jobs.push(mk('JR1','Jared',at(-40),at(20)),mk('JR2','Jared',at(90),at(150),{canceled:true}),
      mk('KC1','Kaci',at(40),at(100),{vehicle:'Sprinter',evuid:cr+'@blazerdrivers'}),
      mk('JF1','Jeffrey',ov(0),ov(90),{created:new Date(cr+3600e3)}),mk('JF2','Jeffrey',ov(45),ov(120)),mk('JF3','Jeffrey',ov(60),ov(100)),mk('JF0','Jeffrey',at(-300),at(-240)),
      {uid:'BB|off0',evuid:'off0',title:'x',raw:'x',start:at(-120),endT:at(180),driver:'BB',block:true,cal:'BB',loc:''});
    LS.st='{}';LS.saved='{}';drv.value='';EXP.clear();setSt('JF0','st','Done');setSt('KC1','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'3 Fake Rd, Sampletown, OH',t:'',drv:'Kaci',done:0}]);setSt('JF1','hm','10');
    sessionStorage.removeItem('cmpv');render();return{o:+o,day:ymdL(o)}});
  await W(1500);// let the app's own Done-sync (mocked) settle first
  const st0=await pg.evaluate(()=>LS.st+'|'+LS.saved);
  // 1 tab
  R.tab=await pg.evaluate(()=>{const b=[...document.querySelectorAll('nav.hnav button')].find(x=>/Compare/.test(x.textContent));b.click();return{btn:!!b,vis:['driver','owner','newjob','cal','cmp'].map(i=>document.getElementById(i).classList.contains('hide')?0:1).join('')}});await W(400);
  ok('Compare tab button opens only #cmp',R.tab.btn&&R.tab.vis=='00001',R.tab);
  await pg.evaluate(()=>{cmpAB(0,'Jeffrey');cmpAB(1,'Jared');cmpSet('d',ymdL(new Date()))});await W(200);
  // 2 top strip (v61: follows the comparison: selected drivers + visible range)
  R.now=await pg.evaluate(()=>({mode:document.querySelector('#cmp .cmpcov').dataset.mode,rows:Object.fromEntries([...document.querySelectorAll('#cmp .cmpcov .cmpnr[data-d]')].map(r=>[r.dataset.d,[...r.querySelectorAll('.cmpc')].map(c=>c.dataset.n).join('')])),slot:Math.floor(new Date().getHours()/3)}));
  ok('strip shows only the compared drivers (Jeffrey vs Jared)',Object.keys(R.now.rows).join()=='Jeffrey,Jared',R.now);
  ok('Day view strip: 8 three-hour slots, Jared busy in the slot holding now',R.now.mode=='day'&&R.now.rows.Jared.length==8&&+R.now.rows.Jared[R.now.slot]>=1,R.now);
  if(SH){await pg.evaluate(()=>scrollTo(0,document.getElementById('cmp').offsetTop-4));await W(300);await pg.screenshot({path:SH+'/1-compare-now-strip-and-controls.png'})}
  // 3 day grid on the overlap day, Jeffrey vs Jared side by side
  await pg.evaluate(d=>cmpSet('d',d),R.fx.day);await W(200);
  R.g=await pg.evaluate(()=>{const cols=[...document.querySelectorAll('#cmp .cmpcol')].map(c=>({d:c.dataset.d,w:Math.round(c.getBoundingClientRect().width),bs:getComputedStyle(c).backgroundSize})),sc=document.getElementById('cmpscroll');return{cols,sw:sc.clientWidth,ttl:document.querySelector('#cmp .cmpttl').textContent}});
  ok('day view: Jeffrey and Jared columns side by side, both visible at 390px',R.g.cols.length==2&&R.g.cols[0].d=='Jeffrey'&&R.g.cols[1].d=='Jared'&&R.g.cols[0].w+R.g.cols[1].w+44<=R.g.sw+2,R.g);
  ok('grid: 1-hour and 30-minute lines',/48px/.test(R.g.cols[0].bs)&&/24px/.test(R.g.cols[0].bs),R.g.cols[0]);
  R.ov=await pg.evaluate(()=>{const c=document.querySelector('#cmp .cmpcol[data-d="Jeffrey"]'),d0=new Date(c.dataset.day+'T00:00');return[...c.querySelectorAll('.cmpb')].map(x=>({u:x.dataset.u,top:parseFloat(x.style.top),want:R2((+x.dataset.s-d0)/36e5*48),left:x.style.left,z:+x.style.zIndex,clash:x.classList.contains('cmpclash'),warn:(x.querySelector('.cmpwarn')||{}).textContent||''}))});
  const J=R.ov.filter(x=>/^JF[123]$/.test(x.u));
  ok('blocks at real start times, not snapped (xx:07 start)',J.length==3&&J.every(x=>Math.abs(x.top-x.want)<0.5)&&J.some(x=>Math.abs(x.top/24-Math.round(x.top/24))>0.05),R.ov);
  ok('overlap stacks in start order, topmost has ⚠ 3, only it',J.map(x=>x.u).join()=='JF1,JF2,JF3'&&J.map(x=>x.left).join()=='2px,12px,22px'&&J[0].z<J[1].z&&J[1].z<J[2].z&&J.filter(x=>x.clash).length==1&&J[2].clash&&/⚠ 3/.test(J[2].warn),J);
  R.ax=await pg.evaluate(()=>{const a=document.querySelector('#cmp .cmpax');return{bg:getComputedStyle(a).backgroundImage,n:a.querySelectorAll('span').length,t1:a.querySelector('span').style.top}});
  ok('time axis: hour labels + 15-min ticks',R.ax.n==23&&R.ax.t1=='48px'&&(R.ax.bg.match(/repeating-linear-gradient/g)||[]).length==2,R.ax);
  R.tot=await pg.evaluate(()=>[...document.querySelectorAll('#cmp .cmptot tr')].map(r=>r.textContent.replace(/\s+/g,' ').trim()));
  ok('totals: per driver + A − B row, clash count',R.tot.length==4&&/^Jeffrey ?4/.test(R.tot[1])&&/⚠ 1/.test(R.tot[1])&&/^Jeffrey − Jared/.test(R.tot[3]),R.tot);
  if(SH){await pg.evaluate(()=>{const s=document.getElementById('cmpscroll');s.scrollIntoView({block:'start'});const b=s.querySelector('.cmpclash');s.scrollTop=Math.max(0,parseFloat(b.style.top)-140)});await W(300);await pg.screenshot({path:SH+'/2-compare-day-overlap-clash.png'})}
  // 4 filters
  const vis=()=>pg.evaluate(()=>[...new Set([...document.querySelectorAll('#cmp .cmpcol .cmpb')].map(x=>x.dataset.u))].sort().join(','));
  await pg.evaluate(()=>{cmpSet('mode','3day');cmpSet('d',ymdL(new Date(Date.now()-864e5)));cmpAB(0,'Jeffrey');cmpAB(1,'Jared');cmpTog('Kaci');cmpTog('BB')});await W(200);
  R.f0=await vis();
  await pg.evaluate(()=>cmpSt('done'));R.f1=await vis();await pg.evaluate(()=>cmpSt('done'));
  await pg.evaluate(()=>cmpSt('cx'));R.f2=await vis();await pg.evaluate(()=>cmpSt('cx'));
  await pg.evaluate(()=>cmpSet('ml','multi'));R.f3=await vis();await pg.evaluate(()=>cmpSet('ml','all'));
  await pg.evaluate(()=>cmpSet('veh','Sprinter'));R.f4=await vis();await pg.evaluate(()=>cmpSet('veh',''));
  await pg.evaluate(()=>cmpSet('q','rider jf2'));R.f5=await vis();await pg.evaluate(()=>cmpSet('q',''));
  await pg.evaluate(()=>cmpSet('blk',0));R.f6=await vis();await pg.evaluate(()=>cmpSet('blk',1));
  await pg.evaluate(()=>cmpSet('tr','*'));R.f7=await vis();await pg.evaluate(()=>cmpSet('tr',''));
  R.fc=await pg.evaluate(()=>({cols:document.querySelectorAll('#cmp .cmpcol').length,days:document.querySelectorAll('#cmp .cmpday').length}));
  ok('3 days × 4 drivers',R.fc.cols==12&&R.fc.days==3,R.fc);
  ok('default status = upcoming + done, canceled hidden',R.f0=='BB|off0,JF0,JF1,JF2,JF3,JR1,KC1',R.f0);
  ok('status: Done off hides the done job',R.f1=='BB|off0,JF1,JF2,JF3,JR1,KC1',R.f1);ok('status: Canceled on shows it',R.f2.includes('JR2'),R.f2);
  ok('legs: Split / multi-leg only',R.f3=='BB|off0,KC1',R.f3);ok('vehicle filter',R.f4=='BB|off0,KC1',R.f4);ok('client search',R.f5=='BB|off0,JF2',R.f5);
  ok('hide time off / blocks',!R.f6.includes('off0'),R.f6);ok('trailer: with a trailer (none in data)',R.f7=='BB|off0',R.f7);
  await pg.evaluate(()=>{window._cmpFO=1;cmpSet('mode','week')});await W(200);R.wk=await pg.evaluate(()=>document.querySelectorAll('#cmp .cmpday').length);ok('week = 7 days',R.wk==7,R.wk);
  if(SH){await pg.evaluate(()=>{cmpSet('mode','3day');cmpSet('d',ymdL(new Date()));document.querySelector('#cmp .cmpf').scrollIntoView({block:'start'})});await W(300);await pg.screenshot({path:SH+'/3-compare-filters-and-totals.png'});await pg.evaluate(()=>{window._cmpFO=0;cmpRender();document.getElementById('cmpscroll').scrollIntoView({block:'start'})});await W(300);await pg.screenshot({path:SH+'/4-compare-3day-4-drivers.png'})}
  // 5 tap a block -> the job card (with created stamp)
  await pg.evaluate(d=>{cmpSet('mode','day');cmpSet('d',d);cmpAB(0,'Jeffrey');cmpAB(1,'Jared')},R.fx.day);await W(200);
  R.tap=await pg.evaluate(async()=>{const x=document.querySelector('#cmp .cmpb[data-u="JF1"]');if(!x)return{none:[...document.querySelectorAll("#cmp .cmpb")].map(b=>b.dataset.u).join()};x.click();await new Promise(r=>setTimeout(r,300));const m=document.getElementById('calmod');return{m:!!m,card:!!(m&&m.querySelector('.jc')),cr:m&&m.querySelector('.jcr')?m.querySelector('.jcr').textContent:''}});
  ok('tap opens the job card, with its created stamp',R.tap.m&&R.tap.card&&/^Created [A-Z][a-z]{2} \d{1,2} \d{1,2}:\d{2}[ap]$/.test(R.tap.cr),R.tap);
  if(SH){await W(200);await pg.screenshot({path:SH+'/5-compare-tap-opens-card-created-stamp.png'})}
  await pg.evaluate(()=>{const m=document.getElementById('calmod');m&&m.remove()});
  // 6 read-only
  R.ro=await pg.evaluate(()=>LS.st+'|'+LS.saved);ok('read-only: job state and saved jobs unchanged',R.ro==st0,[st0.slice(0,400),R.ro.slice(0,400)]);
  // 7 created stamp on Current / Upcoming cards
  await pg.evaluate(()=>{show('driver');EXP.clear();renderDriver()});await W(300);
  R.cr=await pg.evaluate(()=>{const g=u=>{const c=dtCard(u);return c?((c.querySelector('.jcr')||{}).textContent||'none'):'nocard'};return{KC1:g('KC1'),JR1:g('JR1'),JF1:g('JF1'),JF2:g('JF2'),bb:g('BB|off0')}});
  ok('created stamp: app-made (UID time) and Proton CREATED shown, unknown none',/^Created /.test(R.cr.KC1)&&(R.cr.JF1=='nocard'||/^Created /.test(R.cr.JF1))&&['none','nocard'].includes(R.cr.JR1)&&!/^Created/.test(R.cr.bb),R.cr);
  if(SH){await pg.evaluate(()=>{const c=dtCard('KC1');c&&c.scrollIntoView({block:'center'})});await W(300);await pg.screenshot({path:SH+'/6-current-card-created-stamp.png'})}
  // 7b Find: created sort / filter / Newest, stamp on rows
  R.fd=await pg.evaluate(async()=>{sessionStorage.removeItem('cafs');show('find');await new Promise(r=>setTimeout(r,300));const ids=()=>[...document.querySelectorAll('#cafres div[onclick^="jlOpen"]')].map(d=>(d.getAttribute('onclick').match(/jlOpen\('([^']+)/)||[])[1]);const o={ctl:!!document.getElementById('cafctl')};
    cafNewest();o.nw=ids().slice(0,3).join();o.st=(document.querySelector('#cafres .jcr')||{}).textContent||'';
    cafSet('cr','7');o.c7=ids().join();cafSet('cr','today');o.ct=ids().join();cafSet('cr','any');cafSet('so','old');o.old=ids().slice(0,2).join();
    cafSet('so','date');const q=document.getElementById('cafq');q.value='fake rider';caFind();o.dflt=/Today &amp; upcoming|Today & upcoming/.test(document.getElementById('cafres').innerHTML);cafSet('so','new');o.qnew=ids().slice(0,2).join();return o});
  ok('Find: controls, 🆕 Newest lists newest created first, stamp on rows',R.fd.ctl&&R.fd.nw.startsWith('JF1,KC1')&&/^· Created /.test(R.fd.st),R.fd);
  ok('Find: created filter (7 days / today) and oldest-first, date sort unchanged',R.fd.c7=='JF1,KC1'&&R.fd.ct==''&&R.fd.old=='KC1,JF1'&&R.fd.dflt&&R.fd.qnew=='JF1,KC1',R.fd);
  if(SH){await pg.evaluate(()=>{document.getElementById('cafq').value='';sessionStorage.removeItem('cafs');const c=document.getElementById('cafctl');c&&c.remove();cafNewest();document.getElementById('cafind').scrollIntoView({block:'start'})});await W(300);await pg.screenshot({path:SH+'/8-find-newest-created.png'})}
  await pg.evaluate(()=>{sessionStorage.removeItem('cafs');document.getElementById('cafq').value=''});
  // 8 Calendar tab polish (look only)
  await pg.evaluate(()=>{show('cal');calSet('mode','day');calSet('d',ymdL(new Date()))});await W(400);
  R.cal=await pg.evaluate(()=>{const ev=document.querySelector('#calscroll div[onclick^="calOpen"]'),sc=document.getElementById('calscroll');return{ev:!!ev,rad:ev?getComputedStyle(ev).borderTopLeftRadius:'',sr:getComputedStyle(sc).borderTopLeftRadius}});
  ok('calendar: rounded blocks and frame',R.cal.ev&&R.cal.rad=='8px'&&R.cal.sr=='12px',R.cal);
  if(SH){await pg.evaluate(()=>{const s=document.getElementById('calscroll');s.scrollIntoView({block:'start'});scrollBy(0,-110);const e=s.querySelector('div[onclick^="calOpen"]');if(e)s.scrollTop=Math.max(0,parseFloat(e.style.top)*16-60)});await W(300);await pg.screenshot({path:SH+'/7-calendar-after.png'})}
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('COMPARE59',JSON.stringify({now:R.now,tot:R.tot,ov:J,cr:R.cr}).slice(0,1500));
  console.log(bad.length?'COMPARE59 FAIL\n'+bad.join('\n'):'COMPARE59 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('COMPARE59 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
