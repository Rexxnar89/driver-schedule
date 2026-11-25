// node tests/browser/still63.js  (U=.../index.html  VERBOSE=1)
// v63 "screen stays still", pass 2: Current jobs (driver screen) at 390px with made-up jobs, one of them multi-leg.
// Every card button / toggle / input near the bottom of the screen: the touched element stays put (≤2px) on every
// painted frame. Idle with all timers (incl. a full minute tick, weather, sync): nothing visible moves or is rebuilt.
const L=require('./still-lib.js');const U=process.env.U||'http://127.0.0.1:8812/index.html';
let _b;const killer=setTimeout(()=>{console.log('STILL63 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},900000);
(async()=>{const H=await L.open(U);_b=H.b;const{pg,bad,R,errs,step,tapSel,W}=H;
  await pg.evaluate(leg=>{document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&!/^(#|javascript:)/.test(a.getAttribute('href')||'#'))e.preventDefault()},true);window.open=()=>null;
    setSt('T5','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'3 Mock Rd, Sampletown, OH',t:leg,drv:'Jeffrey',done:0}]);render()},L.iso(L.at(0,16)));await W(1500);
  const C=u=>`.card:has(> [onclick="tog('${u}')"])`,hd=u=>`[onclick="tog('${u}')"]`,B=(u,f)=>`${C(u)} [onclick*="${f}"]`;
  const typeIn=async(s,t)=>{await tapSel(s);await pg.keyboard.type(t,{delay:40})};
  await W(6000);// let the start-up Proton load finish (made-up mock answers with an error banner)
  const bar=m=>pg.evaluate(m=>{document.getElementById('livebar').innerHTML=m},m);
  const LOAD='Loading live Proton jobs… (first load can take up to a minute)',LIVE=n=>`✔ LIVE from Proton · ${n} jobs · Last updated 5:0${n%10} PM <button class="btn" style="padding:4px 10px" onclick="loadLive()">Refresh</button>`;
  await bar(LIVE(11));await W(500);
  await step('current: idle at top',null,null,{idle:1,wait:6000,pre:300});
  await step('current: Proton sync bar at top (loading → live)',null,async()=>{await bar(LOAD);await W(700);await bar(LIVE(12));await W(700);await bar(LOAD);await W(700);await bar(LIVE(112))},{idle:1,wait:1000,pre:300,okRebuild:1});
  await step('current: idle mid',hd('T4'),null,{idle:1,wait:5000});
  await step('current: idle near bottom',hd('T7'),null,{idle:1,wait:5000,frac:0.8});
  for(const u of ['T7','T5']){
    const isOpen=()=>pg.evaluate(s=>document.querySelector(s).classList.contains('open'),C(u));
    if(!(await isOpen()))await step(`${u}: expand card`,hd(u),()=>tapSel(hd(u)),{frac:0.8,wait:2500});
    await step(`${u}: idle expanded`,hd(u),null,{idle:1,wait:5000,frac:0.5});
    for(const k of ['details','times','stops','proj','act','notes','actions'])
      if(await pg.$(B(u,`secTog('${u}:${k}')`))){await step(`${u}: section ${k} toggle`,B(u,`secTog('${u}:${k}')`),()=>tapSel(B(u,`secTog('${u}:${k}')`)),{frac:0.8,wait:1500});await step(`${u}: section ${k} back`,B(u,`secTog('${u}:${k}')`),()=>tapSel(B(u,`secTog('${u}:${k}')`)),{frac:0.8,wait:1500})}
    const one=[['Now (arrived)',`setTime('${u}','ap'`],['Halfway miles',`setHmMode('${u}','half')`],['Total miles',`setHmMode('${u}','total')`],['wait time open','wtxTog'],['wait timestamps',`wtEd('${u}',0,'mode','ts')`],['wait type total',`wtEd('${u}',0,'mode','tot')`],['actual wait open','awxTog'],['drop-offs toggle','doTog'],['danger zone','dzTog'],['Accept',`setSt('${u}','st','Accepted')`],['Drive alarm',`alarmOpen('${u}')`],['Go',null],['Navigate home',null],['leg miles',`legModeSet('${u}',1,'mi')`],['leg odometer',`legModeSet('${u}',1,'odo')`],['Go leg 1','LEGGO'],['Complete leg 1',`legDone('${u}',1)`,`${C(u)} .legs`]];
    for(const [n,f,an] of one){let s=f?B(u,f):n=='Go'?`${C(u)} a.navpill`:f=='LEGGO'?`${C(u)} a.leggo`:`${C(u)} a.homebar`;if(f=='LEGGO')s=`${C(u)} a.leggo`;if(!(await pg.$(s)))continue;
      await step(`${u}: ${n}`,s,()=>tapSel(s),{frac:0.8,wait:2000,anchor:an});
      await pg.evaluate(()=>{for(const id of ['alarmdlg','alarmpop','discpop','vrpop'])document.getElementById(id)?.remove();document.querySelectorAll('.modal,.pop,[id$="pop"]').forEach(e=>{if(getComputedStyle(e).position=='fixed')e.remove()})});await W(400)}
    if(await pg.$(`${C(u)} .odorin`))await step(`${u}: type odometer`,`${C(u)} .odorin`,()=>typeIn(`${C(u)} .odorin`,'12345'),{frac:0.8,wait:2500});
    if(await pg.$(`${C(u)} .hmin`))await step(`${u}: type halfway miles`,`${C(u)} .hmin`,()=>typeIn(`${C(u)} .hmin`,'14'),{frac:0.8,wait:2500});
    await step(`${u}: keyboard opens/closes`,`${C(u)} textarea`,async()=>{await tapSel(`${C(u)} textarea`);await pg.setViewport({width:390,height:480,isMobile:true,hasTouch:true,deviceScaleFactor:2});await W(800);await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});await pg.evaluate(()=>document.activeElement.blur())},{frac:0.6,wait:1500});
    await step(`${u}: collapse card`,hd(u),()=>tapSel(hd(u)),{frac:0.5,wait:2500})}
  if(!(await pg.evaluate(s=>document.querySelector(s).classList.contains('open'),C('T6'))))await step('T6: expand again',hd('T6'),()=>tapSel(hd('T6')),{frac:0.8,wait:2000});
  if(!(await pg.$(B('T6',"completeJob('T6')")))||await pg.evaluate(s=>!document.querySelector(s).offsetHeight,B('T6',"completeJob('T6')")))await pg.evaluate(()=>secTog('T6:actions'));await W(800);
  await step('current: idle through a minute tick (weather, sync, clock)',hd('T6'),null,{idle:1,wait:65000,frac:0.4});
  // Complete job is a deliberate jump: the app glides to the next open job. It must land on that card's header and then stay still.
  await pg.evaluate(s=>{const h=document.querySelector(s);scrollTo(0,scrollY+h.getBoundingClientRect().top-300)},B('T6',"completeJob('T6')"));await W(500);
  await pg.evaluate(()=>{_scl.length=0;window._ys=[];addEventListener('scroll',()=>{const h=document.querySelector(`[onclick="tog('T7')"]`);_ys.push(Math.round(scrollY)+'/'+(h?Math.round(h.getBoundingClientRect().top):'x'))});const o=Element.prototype.scrollIntoView;Element.prototype.scrollIntoView=function(){window._svt=(this.closest('[id]')||{}).id+' '+this.className+' '+(this.querySelector('.jh')||{}).outerHTML?.slice(0,80);return o.apply(this,arguments)}});await tapSel(B('T6',"completeJob('T6')"));await W(2500);if(process.env.VERBOSE)console.log('complete trace',JSON.stringify(await pg.evaluate(()=>({ys:_ys.filter((x,i)=>i%4==0),svt:window._svt,t7:Math.round(document.querySelector(`[onclick="tog('T7')"]`).getBoundingClientRect().top),ex:[...document.querySelectorAll('#caday > *')].map(e=>e.id+'.'+e.className+':'+Math.round(e.getBoundingClientRect().top)).slice(0,20),sc:_scl.map(x=>x.k+'@'+x.t+' y'+x.y+' '+x.s.slice(0,200))}))));
  const land=await pg.evaluate(s=>Math.round(document.querySelector(s).getBoundingClientRect().top),hd('T7'));R.push(['T6: Complete job lands on next job header (top px)',{moved:land,idle:0,rebuilt:[]}]);if(!(land>=-5&&land<=160))bad.push('Complete job did not land on the next job (T7 header at '+land+'px)');
  await step('after Complete job: idle on next job',hd('T7'),null,{idle:1,wait:4000,pre:0,frac:null,noPlace:1});
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('STILL63',JSON.stringify(R.map(([n,r])=>[n,r.moved,r.idle,r.rebuilt.length])));
  console.log(bad.length?'STILL63 FAIL\n'+bad.join('\n'):'STILL63 PASS');await H.b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('STILL63 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
