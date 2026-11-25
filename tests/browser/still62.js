// node tests/browser/still62.js  (U=.../index.html  VERBOSE=1)
// v62 "screen stays still", pass 1: Create job and Edit job form at 390px. Each tap/typing action: the touched element
// stays put (≤2px) on every painted frame; idle with all timers running: nothing visible moves or is rebuilt (no flicker).
const L=require('./still-lib.js');const U=process.env.U||'http://127.0.0.1:8812/index.html';
let _b;const killer=setTimeout(()=>{console.log('STILL62 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},600000);
(async()=>{const H=await L.open(U);_b=H.b;const{pg,bad,R,errs,step,tapSel,W}=H;
  const typeIn=async(s,t)=>{await tapSel(s);await pg.keyboard.type(t,{delay:40})};
  const setV=(id,v)=>pg.evaluate((id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))},id,v);
  await pg.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/^\s*Create job\s*$/.test(x.textContent));b.click()});await W(2500);
  for(const s of ['#npd','#nc','#pks','#njnotes'])await step('create: idle near '+s,s,null,{idle:1,wait:6000});
  await step('create: type organizer','#nc',()=>typeIn('#nc','Fake Org'));
  await step('create: quick-day chip','#qdays',()=>tapSel('#qdays button:nth-of-type(2)'),{wait:2500});
  await step('create: pickup time','#npt',()=>setV('npt','10:30'),{wait:3000});
  await step('create: pickup date','#npd',()=>{const d=new Date();d.setDate(d.getDate()+2);return setV('npd',d.toISOString().slice(0,10))},{wait:3000});
  await step('create: type pickup','#pks input',()=>typeIn('#pks input','12 Fake Ln, Sampletown'),{wait:2500});
  await step('create: type drop-off','#dos input',()=>typeIn('#dos input','34 Demo Rd, Sampletown'),{wait:2500});
  await step('create: passengers','#np',async()=>{await tapSel('#np');await pg.keyboard.press('Backspace');await pg.keyboard.type('3')},{wait:2000});
  for(const v of ['ow','split','rt']){const s=`input[name=ntt][value=${v}]`;if(await pg.$(s))await step('create: trip type '+v,s,()=>tapSel(s),{wait:2000})}
  await step('create: pick driver','#nd',()=>pg.evaluate(()=>{const e=document.getElementById('nd');const o=[...e.options].find(o=>o.value&&o.value!=e.value);if(o){e.value=o.value;e.dispatchEvent(new Event('change',{bubbles:true}))}}),{wait:2000});
  if(await pg.$('#nsplit'))await step('create: split job on','#nsplit',()=>tapSel('#nsplit'),{wait:2000});
  await step('create: idle after split on','#nsplit',null,{idle:1,wait:5000});
  if(await pg.$('#nl2pk'))await step('create: type leg 2 pickup','#nl2pk',()=>typeIn('#nl2pk','56 Sample Ct, Sampletown'),{wait:2500});
  if(await pg.$('#nlegadd'))await step('create: + Add leg','#nlegadd',()=>tapSel('#nlegadd'),{wait:2500});
  await step('create: idle with 3 legs','#nlegadd',null,{idle:1,wait:5000});
  if(await pg.$('[onclick*="mlDel"]'))await step('create: remove leg 3','[onclick*="mlDel"]',()=>tapSel('[onclick*="mlDel"]'),{wait:2500,anchor:'#nl2pk'});
  if(await pg.$('#awin .dr[data-d]'))await step('create: tap an available-window bar','#awin .dr[data-d]',()=>tapSel('#awin .dr[data-d]'),{wait:2500});
  if(await pg.$('#salt .sech'))await step('create: open Same as last time','#salt .sech',()=>tapSel('#salt .sech'),{wait:1500});
  await step('create: keyboard opens and closes on passengers','#np',async()=>{await tapSel('#np');await pg.setViewport({width:390,height:480,isMobile:true,hasTouch:true,deviceScaleFactor:2});await W(800);await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});await pg.evaluate(()=>document.activeElement.blur())},{wait:1500});
  await step('create: type job notes','#njnotes',()=>typeIn('#njnotes','Made-up note'));
  await step('create: idle at bottom','#njnotes',null,{idle:1,wait:5000});
  // Edit job: same form, opened from a job
  await pg.evaluate(()=>{try{formReset&&formReset()}catch(e){}editJob('U1')});await W(2500);
  for(const s of ['#npd','#pks','#njnotes'])if(await pg.$(s))await step('edit: idle near '+s,s,null,{idle:1,wait:5000});
  await step('edit: type organizer','#nc',()=>typeIn('#nc',' X'));
  await step('edit: pickup time','#npt',()=>setV('npt','11:15'),{wait:3000});
  await step('edit: passengers','#np',async()=>{await tapSel('#np');await pg.keyboard.press('Backspace');await pg.keyboard.type('2')},{wait:2000});
  await step('edit: type job notes','#njnotes',()=>typeIn('#njnotes',' more'));
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('STILL62',JSON.stringify(R.map(([n,r])=>[n,r.moved,r.idle,r.rebuilt.length])));
  console.log(bad.length?'STILL62 FAIL\n'+bad.join('\n'):'STILL62 PASS');await H.b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('STILL62 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
