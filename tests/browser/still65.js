// node tests/browser/still65.js  (U=.../index.html  VERBOSE=1)
// v65 "screen stays still", pass 4: Find, Calendar and Compare tabs at 390px with made-up jobs.
// Every control: the touched element stays put (≤2px) on every painted frame (or, for controls that are rebuilt, the same
// control found again by its onclick). Idle with timers (incl. a minute tick): nothing visible moves or is rebuilt.
// Taps that open a job (calendar event) must land on that job.
const L=require('./still-lib.js');const U=process.env.U||'http://127.0.0.1:8812/index.html';
let _b;const killer=setTimeout(()=>{console.log('STILL65 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},900000);
(async()=>{const H=await L.open(U);_b=H.b;const{pg,bad,R,errs,step,tapSel,place,W}=H;
  const X=[];for(let i=0;i<10;i++)X.push(['V'+i,L.at(-3+(i%7),8+i,0),L.at(-3+(i%7),9+i,0),['Jeffrey','Jared','Kaci','BB'][i%4],'Demo Find '+i]);
  await pg.evaluate((X)=>{document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&!/^(#|javascript:)/.test(a.getAttribute('href')||'#'))e.preventDefault()},true);window.open=()=>null;
    X.forEach(([id,s,e,dr,cl])=>jobs.push({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:dr,client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1}));render()},X);
  await pg.waitForFunction('typeof LOADING=="undefined"||!LOADING',{timeout:60000}).catch(()=>{});await W(1500);
  await pg.evaluate(()=>{window.loadLive=async()=>{}});// made-up mock answers Proton with an error banner; the real sync bar is checked in still63/64
  const tab=t=>pg.evaluate(t=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.replace(/\s+/g,' ').trim().replace(/^\S+\s/,'').trim()==t||x.textContent.trim()==t);b.click()},t);
  const selV=(s,i)=>pg.evaluate((s,i)=>{const e=document.querySelector(s);e.selectedIndex=i;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))},s,i);
  const taps=async(pre,list,o={})=>{for(const [n,s] of list){if(!(await pg.$(s))){if(process.env.VERBOSE)console.log('skip',n);continue}await step(pre+': '+n,s,()=>tapSel(s),{frac:o.frac??0.6,wait:o.wait||1800})}};
  // ---- Find ----
  await tab('Find job');await W(2500);
  await step('find: idle',null,null,{idle:1,wait:5000,pre:300});
  await step('find: type search','#cafq',async()=>{await tapSel('#cafq');await pg.keyboard.type('Demo',{delay:60})},{frac:0.3,wait:2500});
  await step('find: clear search','#cafq',async()=>{for(let i=0;i<4;i++)await pg.keyboard.press('Backspace')},{frac:0.3,wait:2500});
  await pg.evaluate(()=>document.activeElement.blur());
  await taps('find',[['Newest','#cafnew'],['Upcoming',`[onclick="setDV('dir','up')"]`],['Previous',`[onclick="setDV('dir','prev')"]`],['Upcoming again',`[onclick="setDV('dir','up')"]`]],{frac:0.3});
  await step('find: sort select','#cafsort',()=>selV('#cafsort',1),{frac:0.3,wait:2000});
  await step('find: sort back','#cafsort',()=>selV('#cafsort',0),{frac:0.3,wait:2000});
  await step('find: created filter','#cafcr',()=>selV('#cafcr',2),{frac:0.3,wait:2000});
  await step('find: created filter back','#cafcr',()=>selV('#cafcr',0),{frac:0.3,wait:2000});
  await taps('find',[['Expand all','#cafind ~ * [onclick="expAll(true)"], [onclick="expAll(true)"]'],['Collapse all','[onclick="expAll(false)"]']],{frac:0.3,wait:2500});
  const fl=await pg.evaluate(()=>{const h=[...document.querySelectorAll('#dcards .jc > .jh')].filter(x=>x.offsetParent);const x=h[h.length-1];return x&&(x.getAttribute('onclick').match(/tog\('([^']+)'/)||[])[1]});
  if(fl){const hd=`[onclick="tog('${fl}')"]`;await step('find: expand last result',hd,()=>tapSel(hd),{frac:0.8,wait:2500});await step('find: idle expanded',hd,null,{idle:1,wait:4000,frac:0.4});await step('find: collapse last result',hd,()=>tapSel(hd),{frac:0.5,wait:2500})}
  await step('find: idle through a minute tick',null,null,{idle:1,wait:62000,pre:300});
  // ---- Calendar ----
  await tab('Calendar');await W(2500);
  await step('cal: idle',null,null,{idle:1,wait:5000,pre:300});
  await taps('cal',[['Week',`[onclick="calSet('mode','week')"]`],['›','[onclick="calStep(1)"]'],['‹','[onclick="calStep(-1)"]'],['Today',`[onclick="calSet('d',ymdL(new Date()))"]`],['Month',`[onclick="calSet('mode','month')"]`],['Day',`[onclick="calSet('mode','day')"]`],['Week again',`[onclick="calSet('mode','week')"]`]],{frac:0.3});
  for(const [n,i] of [['date picker',0],['Calendars list',1]]){const s=`#cal summary`;const all=await pg.$$(s);if(all[i]){const q=`#cal details:nth-of-type(${i+1}) > summary`;const sel=(await pg.$(q))?q:null;if(sel){await step('cal: open '+n,sel,()=>tapSel(sel),{frac:0.3,wait:1500});await step('cal: close '+n,sel,()=>tapSel(sel),{frac:0.3,wait:1500})}}}
  await step('cal: idle through a minute tick (now line redraws, scroll kept)',null,null,{idle:1,wait:62000,pre:300,okRebuild:1});
  // calendar event opens the job: a deliberate jump, must land on it
  {const s=`#cal [onclick="calOpen('U3')"]`;if(await pg.$(s)){await pg.evaluate(s=>{const e=document.querySelector(s),c=e.closest('#calscroll');if(c){c.scrollLeft+=e.getBoundingClientRect().left-40;c.scrollTop+=e.getBoundingClientRect().top-c.getBoundingClientRect().top-60}},s);await place(s,0.5);await W(500);await tapSel(s);await W(2500);
    const r=await pg.evaluate(()=>{const v=['driver','owner','newjob','cal','cmp'].filter(x=>{const e=document.getElementById(x);return e&&!e.classList.contains('hide')});const h=document.querySelector(`[onclick="tog('U3')"]`);const p=document.getElementById('calmod');return{v,h:h&&h.offsetParent?Math.round(h.getBoundingClientRect().top):null,pop:!!p}});
    R.push(['cal: event tap lands on its job',{moved:r.h,idle:0,rebuilt:[],info:r}]);if(process.env.VERBOSE)console.log('cal open',JSON.stringify(r));
    if(!r.pop&&(r.h==null||r.h<-5||r.h>700))bad.push('calendar event did not land on its job: '+JSON.stringify(r));
    await step('cal: idle with the job popup open',null,null,{idle:1,wait:3000,pre:0});
    const oj=`#calmod [onclick^="calJump("]`;if(r.pop&&await pg.$(oj)){await tapSel(oj);await W(2500);const t=await pg.evaluate(()=>{const h=document.querySelector(`[onclick="tog('U3')"]`);return h&&h.offsetParent?Math.round(h.getBoundingClientRect().top):null});R.push(['cal: Open in Current jobs lands on the job (header px)',{moved:t,idle:0,rebuilt:[]}]);if(t==null||t<-5||t>700)bad.push('Open in Current jobs did not land on the job: '+t);
      await step('after Open in Current jobs: idle',`[onclick="tog('U3')"]`,null,{idle:1,wait:3000,noPlace:1})}
    await pg.evaluate(()=>{document.getElementById('calmod')?.remove();window.CAL_POP=0})}}
  // ---- Compare ----
  await tab('Compare');await W(2500);
  await step('cmp: idle',null,null,{idle:1,wait:5000,pre:300});
  await taps('cmp',[['3 days',`[onclick="cmpSet('mode','3day')"]`],['Week',`[onclick="cmpSet('mode','week')"]`],['›','[onclick="cmpGo(1)"]'],['‹','[onclick="cmpGo(-1)"]'],['Today','[onclick="cmpGo(0)"]'],['Day',`[onclick="cmpSet('mode','day')"]`],['driver chip Jared',`[onclick="cmpTog('Jared')"]`],['driver chip Jared off',`[onclick="cmpTog('Jared')"]`],['Filters','#cmp summary'],['status Canceled',`[onclick="cmpSt('cx')"]`],['status Canceled off',`[onclick="cmpSt('cx')"]`],['Filters close','#cmp summary'],['pick 9a',`[onclick="cmpPick('t9')"]`],['pick 3p',`[onclick="cmpPick('t15')"]`]],{frac:0.4});
  const sels=await pg.$$('#cmp select');for(let i=0;i<sels.length;i++){const s=`#cmp select:nth-of-type(${i+1})`;if(await pg.$(s)){await step('cmp: A vs B select '+(i+1),s,()=>selV(s,2),{frac:0.4,wait:2000})}}
  await step('cmp: idle through a minute tick (redraws, scroll kept)',null,null,{idle:1,wait:62000,pre:300,okRebuild:1});
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('STILL65',JSON.stringify(R.map(([n,r])=>[n,r.moved,r.idle,r.rebuilt.length])));
  console.log(bad.length?'STILL65 FAIL\n'+bad.join('\n'):'STILL65 PASS');await H.b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('STILL65 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
