// node tests/browser/still67.js  (U=.../index.html  VERBOSE=1)
// v67 "screen stays still", pass 6: Owner tab (all sections, Settings popup, last-resort drivers, views), Drafts list with
// several made-up drafts, Test mode on/off. TEST-ONLY owner unlock: the harness marks this browser session as already
// unlocked (sessionStorage) and answers "Who are you?"; no PIN is typed, stored or shipped.
const L=require('./still-lib.js');const U=process.env.U||'http://127.0.0.1:8812/index.html';
let _b;const killer=setTimeout(()=>{console.log('STILL67 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},900000);
(async()=>{const H=await L.open(U);_b=H.b;const{pg,bad,R,errs,step,tapSel,place,W}=H;const V=process.env.VERBOSE;
  await pg.evaluate(()=>{document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&!/^(#|javascript:)/.test(a.getAttribute('href')||'#'))e.preventDefault()},true);window.open=()=>null;try{navigator.clipboard.writeText=async()=>{}}catch(e){}});
  await pg.waitForFunction('typeof LOADING=="undefined"||!LOADING',{timeout:60000}).catch(()=>{});await pg.evaluate(()=>{window.loadLive=async()=>{}});await W(800);
  const into=s=>pg.evaluate(s=>{const e=document.querySelector(s);if(!e||!e.offsetParent)return false;e.scrollIntoView({block:'center'});return true},s);
  const pstep=async(n,s,act,o={})=>{if(!(await into(s))){if(V)console.log('skip',n);return}await W(400);await step(n,s,act,{noPlace:1,wait:1800,...o})};
  const typeIn=async(s,t)=>{await tapSel(s);await pg.keyboard.type(t,{delay:50})};
  // ---- Drafts list with made-up drafts ----
  await pg.evaluate(()=>{const o={};for(let i=1;i<=6;i++){const id='dSTILL'+i,D={v:{nc:'Fake Draft '+i,npd:'2026-12-0'+i,npt:'09:00',ndt:'2026-12-0'+i+'T09:00',np:'1',nd:'Jeffrey',njnotes:'Made-up draft '+i},tt:'ow',pks:['1'+i+' Test St, Sampletown, OH'],dos:['2'+i+' Demo Ave, Sampletown, OH'],FW:[],RET_ED:0,RF:{},nrpt:'',t:Date.now()-i*36e5,XD:{},LV:{},DV:{}};o[id]={id,D,cr:'Jeffrey',by:i%2?'Jeffrey':'BB',dev:'Android probe',at:Date.now()-i*6e5,title:'Fake Draft '+i+' · 1'+i+' Test St, Sampletown, OH',when:'2026-12-0'+i+'T09:00'}}MS.setItem('drafts',JSON.stringify(o));try{window.kvDrCount&&kvDrCount()}catch(e){}});
  await pg.evaluate(()=>kvDrafts());await W(1500);
  if(V)console.log('drafts ui',await pg.evaluate(()=>{const m=document.getElementById('kvmod');return m?[...m.querySelectorAll('button,[onclick],summary,input,select')].map(b=>(b.getAttribute('onclick')||'').slice(0,40)+' |'+b.textContent.trim().slice(0,20)).join(' ; ').slice(0,900):'none'}));
  await step('drafts: idle with 6 drafts',null,null,{idle:1,wait:4000,pre:200});
  {const sels=await pg.evaluate(()=>{const m=document.getElementById('kvmod');if(!m)return[];const B=[...m.querySelectorAll('button,summary,[onclick]')].filter(b=>!/^(open|✕|delete|discard|remove)/i.test(b.textContent.trim())&&!/remove\(\)|Del|del\(/i.test(b.getAttribute('onclick')||''));return B.slice(0,6).map((b,i)=>{b.dataset.sti='d'+i;return['drafts: '+b.textContent.trim().slice(0,20),`#kvmod [data-sti="d${i}"]`]})});
   for(const [n,s] of sels)await pstep(n,s,()=>tapSel(s))}
  await pg.evaluate(()=>document.getElementById('kvmod')?.remove());await W(500);
  // ---- Owner (test-only unlock) ----
  await pg.evaluate(()=>{sessionStorage.ownerWho='Jeffrey';sessionStorage['ownerUnlock_Jeffrey']=String(Date.now());sessionStorage['ownerUnlock_BB']=String(Date.now());show('owner')});await W(1200);
  await pg.evaluate(()=>{const b=document.querySelector('#pinov [data-w="Jeffrey"]');b&&b.click()});await W(2000);
  const ok=await pg.evaluate(()=>!document.getElementById('owner').classList.contains('hide'));R.push(['owner: open (test unlock)',{moved:ok?0:-1,idle:0,rebuilt:[]}]);if(!ok){bad.push('owner did not open in the test');}
  if(ok){
    if(V)console.log('owner ui',await pg.evaluate(()=>[...document.querySelectorAll('#ownbar button,#ownbar [onclick]')].map(b=>(b.getAttribute('onclick')||'').slice(0,40)+' |'+b.textContent.trim().slice(0,20)).join(' ; ')));
    await step('owner: idle at top',null,null,{idle:1,wait:5000,pre:300});
    await pg.evaluate(()=>document.querySelectorAll('#owner summary').forEach((e,i)=>e.dataset.sti='s'+i));
    const n=await pg.evaluate(()=>document.querySelectorAll('#owner summary').length);
    for(let i=0;i<n;i++){const q=`#owner summary[data-sti="s${i}"]`;await pstep('owner: section '+i+' toggle',q,()=>tapSel(q),{wait:1500});await pstep('owner: section '+i+' toggle back',q,()=>tapSel(q),{wait:1500})}
    for(const [n2,s] of [['Show week','#owner [onclick="digest()"]'],['Trips & Math refresh','#owner [onclick="SROWS=null;earnings()"]'],['range Next',`#owner [onclick="setRng('step',1)"]`],['range Prev',`#owner [onclick="setRng('step',-1)"]`],['range Today',`#owner [onclick="setRng('today')"]`],['Import addresses',`#owner [onclick="clImpOpen()"]`],['Expand all','#owner [onclick="expAll(true)"]'],['Collapse all','#owner [onclick="expAll(false)"]'],['+ Add driver','#owner [onclick="addLink()"]']])await pstep('owner: '+n2,s,()=>tapSel(s),{wait:2000});
    for(const s of ['#wkdrv','#exdrv','#alldrv'])await pstep('owner: select '+s,'#owner '+s,()=>pg.evaluate(s=>{const e=document.querySelector(s);e.selectedIndex=Math.min(1,e.options.length-1);e.dispatchEvent(new Event('change',{bubbles:true}))},'#owner '+s),{wait:2000});
    for(const [n2,s,t] of [['type home address','#owner #homeb','1 Made Up Rd'],['type new pickup','#owner #newpk','2 Made Up Rd'],['type client search','#owner #clq','Sample']])await pstep('owner: '+n2,s,()=>typeIn(s,t),{wait:2000});
    // ownbar (All / Mine views, Settings)
    for(const [n2,f] of [['All drivers','ownView(1)'],['My jobs','ownView(0)'],['Settings','pinSettings()']]){const q=`#ownbar [onclick="${f}"]`;await pstep('owner bar: '+n2,q,()=>tapSel(q),{wait:2000});if(f=='pinSettings()'){await step('owner: idle in Settings popup',null,null,{idle:1,wait:2500,pre:100});await pg.evaluate(()=>document.getElementById('pinset')?.remove());await W(400)}}
    await step('owner: idle',null,null,{idle:1,wait:5000,pre:300});
  }
  // New / clear client deliberately scrolls to the client form (Name field): navigation, not checked as a jump
  // ---- Test mode on → idle → off (page reloads; made-up data only) ----
  await pg.evaluate(()=>{tmEnter()});await pg.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{});await pg.waitForFunction('typeof render==="function"',{timeout:20000}).catch(()=>{});await W(4000);
  const tm=await pg.evaluate(()=>!!(window.TESTMODE||localStorage.getItem('__testmode')||sessionStorage.getItem('__testmode')));R.push(['test mode on',{moved:tm?0:-1,idle:0,rebuilt:[]}]);if(!tm)bad.push('test mode did not turn on');
  await pg.waitForFunction('typeof LOADING=="undefined"||!LOADING',{timeout:60000}).catch(()=>{});await pg.evaluate(()=>{window.loadLive=async()=>{}});await W(800);
  await step('test mode: idle on Current jobs',null,null,{idle:1,wait:5000,pre:300});
  await pg.evaluate(()=>{const h=document.querySelectorAll('#dcards .jc > .jh');const x=h[Math.floor(h.length/2)];if(x)x.dataset.sti='tm';});
  if(await pg.$('[data-sti="tm"]')){await step('test mode: expand a card','[data-sti="tm"]',()=>tapSel('[data-sti="tm"]'),{wait:2500});await step('test mode: idle expanded','[data-sti="tm"]',null,{idle:1,wait:4000,noPlace:1})}
  await pg.evaluate(()=>{tmExit()});await pg.waitForNavigation({waitUntil:'domcontentloaded',timeout:20000}).catch(()=>{});await W(3000);
  const off=await pg.evaluate(()=>!window.TESTMODE);R.push(['test mode off',{moved:off?0:-1,idle:0,rebuilt:[]}]);if(!off)bad.push('test mode did not turn off');
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('STILL67',JSON.stringify(R.map(([n,r])=>[n,r.moved,r.idle,r.rebuilt.length])));
  console.log(bad.length?'STILL67 FAIL\n'+bad.join('\n'):'STILL67 PASS');await H.b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('STILL67 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
