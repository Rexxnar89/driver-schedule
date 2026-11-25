// node tests/browser/still64.js  (U=.../index.html  VERBOSE=1)
// v64 "screen stays still", pass 3: Upcoming jobs at 390px with made-up jobs (incl. a multi-leg job and a long list).
// Every control / card button near the bottom of the screen: the touched element stays put (≤2px) on every painted frame.
// Idle with all timers (incl. a minute tick): nothing visible moves or is rebuilt. Jumps that navigate to a job must land on it.
const L=require('./still-lib.js');const U=process.env.U||'http://127.0.0.1:8812/index.html';
let _b;const killer=setTimeout(()=>{console.log('STILL64 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},900000);
(async()=>{const H=await L.open(U);_b=H.b;const{pg,bad,R,errs,step,tapSel,place,W}=H;
  const X=[];for(let i=0;i<10;i++)X.push(['V'+i,L.at(1+(i%5),8+i,0),L.at(1+(i%5),9+i,0),['Jeffrey','Jared','Kaci','BB'][i%4],'Demo Upcoming '+i]);
  await pg.evaluate((X)=>{document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&!/^(#|javascript:)/.test(a.getAttribute('href')||'#'))e.preventDefault()},true);window.open=()=>null;
    X.forEach(([id,s,e,dr,cl])=>jobs.push({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:dr,client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1}));show('up');render()},X);await W(6000);
  const C=u=>`.card:has(> [onclick="tog('${u}')"])`,hd=u=>`[onclick="tog('${u}')"]`,B=(u,f)=>`${C(u)} [onclick*="${f}"]`;
  const typeIn=async(s,t)=>{await tapSel(s);await pg.keyboard.type(t,{delay:40})};
  const bar=m=>pg.evaluate(m=>{document.getElementById('livebar').innerHTML=m},m);
  const LOAD='Loading live Proton jobs… (first load can take up to a minute)',LIVE=n=>`✔ LIVE from Proton · ${n} jobs · Last updated 5:0${n%10} PM <button class="btn" style="padding:4px 10px" onclick="loadLive()">Refresh</button>`;
  await pg.waitForFunction('typeof LOADING=="undefined"||!LOADING',{timeout:60000}).catch(()=>{});// the start-up load (made-up mock) has finished: no app banner change will interrupt the checks
  await bar(LIVE(11));await W(500);
  const last=await pg.evaluate(()=>{const h=[...document.querySelectorAll('#dcards .jc > .jh')];return(h[h.length-1].getAttribute('onclick').match(/tog\('([^']+)'/)||[])[1]});
  const mid=await pg.evaluate(()=>{const h=[...document.querySelectorAll('#dcards .jc > .jh')];return(h[Math.floor(h.length/2)].getAttribute('onclick').match(/tog\('([^']+)'/)||[])[1]});
  await step('up: idle at top',null,null,{idle:1,wait:5000,pre:300});
  await step('up: Proton sync bar at top',null,async()=>{await bar(LOAD);await W(700);await bar(LIVE(12));await W(700)},{idle:1,wait:1000,pre:300,okRebuild:1});
  await step('up: idle mid',hd(mid),null,{idle:1,wait:5000});
  await step('up: Proton sync bar while scrolled',hd(mid),async()=>{await bar(LOAD);await W(700);await bar(LIVE(13));await W(700)},{idle:1,wait:1000,okRebuild:1});
  await step('up: idle near bottom',hd(last),null,{idle:1,wait:5000,frac:0.8});
  const sel='#caup select';
  if(await pg.$(sel)){await step('up: range Next 30 days',sel,()=>pg.evaluate(s=>{const e=document.querySelector(s);e.selectedIndex=1;e.dispatchEvent(new Event('change',{bubbles:true}))},sel),{frac:0.3,wait:2000});
    await step('up: range back to Next 7 days',sel,()=>pg.evaluate(s=>{const e=document.querySelector(s);e.selectedIndex=0;e.dispatchEvent(new Event('change',{bubbles:true}))},sel),{frac:0.3,wait:2000})}
  await step('up: Expand all','[onclick="expAll(true)"]',()=>tapSel('[onclick="expAll(true)"]'),{frac:0.3,wait:2500});
  await step('up: idle all expanded','[onclick="expAll(true)"]',null,{idle:1,wait:5000,frac:0.3});
  await step('up: Collapse all','[onclick="expAll(false)"]',()=>tapSel('[onclick="expAll(false)"]'),{frac:0.3,wait:2500});
  for(const u of [last,'U1']){
    const isOpen=()=>pg.evaluate(s=>document.querySelector(s).classList.contains('open'),C(u));
    if(!(await isOpen()))await step(`${u}: expand card`,hd(u),()=>tapSel(hd(u)),{frac:0.8,wait:2500});
    await step(`${u}: idle expanded`,hd(u),null,{idle:1,wait:4000,frac:0.5});
    for(const k of ['details','times','stops','proj','act','notes','actions'])
      if(await pg.$(B(u,`secTog('${u}:${k}')`))){await step(`${u}: section ${k} toggle`,B(u,`secTog('${u}:${k}')`),()=>tapSel(B(u,`secTog('${u}:${k}')`)),{frac:0.8,wait:1500});await step(`${u}: section ${k} back`,B(u,`secTog('${u}:${k}')`),()=>tapSel(B(u,`secTog('${u}:${k}')`)),{frac:0.8,wait:1500})}
    const one=[['Now (arrived)',`setTime('${u}','ap'`],['Halfway miles',`setHmMode('${u}','half')`],['Total miles',`setHmMode('${u}','total')`],['wait time open','wtxTog'],['wait timestamps',`wtEd('${u}',0,'mode','ts')`],['drop-offs toggle','doTog'],['danger zone','dzTog'],['Accept',`setSt('${u}','st','Accepted')`],['Drive alarm',`alarmOpen('${u}')`],['leg miles',`legModeSet('${u}',1,'mi')`],['leg odometer',`legModeSet('${u}',1,'odo')`]];
    for(const [n,f] of one){const s=B(u,f);if(!(await pg.$(s)))continue;await step(`${u}: ${n}`,s,()=>tapSel(s),{frac:0.8,wait:2000});
      await pg.evaluate(()=>{for(const id of ['alarmdlg','discpop','vrpop'])document.getElementById(id)?.remove()});await W(300)}
    for(const [n,s0,t] of [['type odometer','.odorin','12345'],['type halfway miles','.hmin','14']]){const s=`${C(u)} ${s0}`;if(await pg.$(s))await step(`${u}: ${n}`,s,()=>typeIn(s,t),{frac:0.8,wait:2500})}
    if(await pg.$(`${C(u)} textarea`))await step(`${u}: keyboard opens/closes`,`${C(u)} textarea`,async()=>{await tapSel(`${C(u)} textarea`);await pg.setViewport({width:390,height:480,isMobile:true,hasTouch:true,deviceScaleFactor:2});await W(800);await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});await pg.evaluate(()=>document.activeElement.blur())},{frac:0.6,wait:1500});
    await step(`${u}: collapse card`,hd(u),()=>tapSel(hd(u)),{frac:0.5,wait:2500})}
  // deliberate jumps: must land on the job they name
  const land=async(name,s,u)=>{await place(s,0.7);await W(600);await tapSel(s);await W(2500);const t=await pg.evaluate(s=>{const e=document.querySelector(s);return e?Math.round(e.getBoundingClientRect().top):null},hd(u));R.push([name+' (header top px)',{moved:t,idle:0,rebuilt:[]}]);if(t==null||t<-5||t>innerH*0.7)bad.push(name+' did not land on '+u+' (header at '+t+')');
    await step(name+': idle after landing',hd(u),null,{idle:1,wait:3000,noPlace:1})};
  const innerH=844;
  const nx=await pg.evaluate(()=>{const e=document.querySelector('#caup [onclick^="openNext("]');return e&&e.getAttribute('onclick').match(/openNext\('([^']+)'/)[1]});
  if(nx)await land('up: Next job pointer','#caup [onclick^="openNext("]',nx);
  if(await pg.$('#caup [onclick^="legGo("]'))await land('up: split leg chip','#caup [onclick^="legGo("]','U1');
  // other-day Complete job: no auto jump; next card stays put
  const two=await pg.evaluate(()=>[...document.querySelectorAll('#dcards .jc > .jh')].map(h=>h.getAttribute('onclick').match(/tog\('([^']+)'/)[1]).slice(-2));
  await pg.evaluate(u=>{EXP.add(u);render()},two[0]);await W(1200);
  if(await pg.evaluate(s=>{const e=document.querySelector(s);return !e||!e.offsetHeight},B(two[0],`completeJob('${two[0]}')`)))await pg.evaluate(u=>secTog(u+':actions'),two[0]);await W(800);
  if(await pg.$(B(two[0],`completeJob('${two[0]}')`)))await step(`${two[0]}: Complete job (other day)`,B(two[0],`completeJob('${two[0]}')`),()=>tapSel(B(two[0],`completeJob('${two[0]}')`)),{frac:0.6,wait:2500});
  // tabs: Upcoming → Current → Upcoming comes back to the same spot, no flicker
  await place(hd(mid),0.5);await W(500);const y0=await pg.evaluate(()=>scrollY);
  await pg.evaluate(()=>show('driver'));await W(1500);await pg.evaluate(()=>show('up'));await W(1500);
  const y1=await pg.evaluate(()=>scrollY);R.push(['tabs: back to Upcoming restores scroll (dy)',{moved:y1-y0,idle:0,rebuilt:[]}]);if(Math.abs(y1-y0)>2)bad.push('tab switch did not restore Upcoming scroll: '+y0+' → '+y1);
  await step('up: idle after tab switch',hd(mid),null,{idle:1,wait:4000,noPlace:1});
  await step('up: idle through a minute tick',hd(mid),null,{idle:1,wait:65000,noPlace:1});
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('STILL64',JSON.stringify(R.map(([n,r])=>[n,r.moved,r.idle,r.rebuilt.length])));
  console.log(bad.length?'STILL64 FAIL\n'+bad.join('\n'):'STILL64 PASS');await H.b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('STILL64 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
