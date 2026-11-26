// node tests/browser/advance48.js — complete-advance: today-only collapse+advance, last job -> .donesec, Complete day, section split. 390px. Network mocked. Skip testmode.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8848/index.html';
const OUT=process.env.OUT||'/workspace/advance48';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const fs=require('fs');
fs.mkdirSync(OUT,{recursive:true});
const DEAD=Number(process.env.ADVANCE48_MS||180000);
let _b;
const killer=setTimeout(()=>{console.log('ADVANCE48 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},DEAD);
const results=[];
const ok=(name,cond,extra)=>{results.push({name,pass:!!cond,extra});console.log((cond?'PASS':'FAIL')+' '+name+(extra?' '+JSON.stringify(extra):''));return!!cond};
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
 _b=b;
 const ctx=await b.createBrowserContext();
 const pg=await ctx.newPage();
 pg.setDefaultTimeout(20000);pg.setDefaultNavigationTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);
 pg.on('request',r=>{const u=r.url();
  if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
  if(/api\.open-meteo\.com|nominatim|photon|openstreetmap/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{}'});
  if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u)||/^blob:/.test(u))return r.continue();
  return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(String(e.message||e)));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
 await pg.waitForFunction('typeof jobs!=="undefined" && typeof show==="function" && typeof completeJob==="function" && typeof completeDay==="function" && typeof caTodayOpen==="function"',{timeout:20000});
 await W(600);

 const seed=async(resetSt)=>{
  return pg.evaluate((resetSt)=>{
    try{document.getElementById('alarmdlg')&&document.getElementById('alarmdlg').remove();document.getElementById('alarmov')&&document.getElementById('alarmov').remove()}catch(e){}
    const pad=n=>String(n).padStart(2,'0');
    const at=(day,h,m)=>{const d=new Date();d.setDate(d.getDate()+day);d.setHours(h,m||0,0,0);return d};
    const mk=(id,start,cl)=>({uid:id,evuid:id,start,end:new Date(+start+90*6e4),endT:new Date(+start+90*6e4),hrs:1.5,driver:'BB',client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
    jobs.length=0;
    jobs.push(mk('T1',at(0,9,0),'Alpha Ride'));
    jobs.push(mk('T2',at(0,12,0),'Bravo Ride'));
    jobs.push(mk('T3',at(0,15,0),'Charlie Ride'));
    jobs.push(mk('TM',at(1,10,0),'Delta Tomorrow'));
    jobs.push(mk('YS',at(-1,11,0),'Echo Yesterday'));
    if(resetSt){
      const s=ST();
      ['T1','T2','T3','TM','YS'].forEach(u=>{if(s[u]){const n={...s[u]};delete n.st;s[u]=n}});
      LS.st=JSON.stringify(s);
    }
    try{EXPALL=false;EXP.clear();caExpSave&&caExpSave()}catch(e){try{EXPALL=false;EXP.clear()}catch(x){}}
    try{if(typeof caReset==='function')caReset()}catch(e){}
    try{show('driver')}catch(e){}
    const drv=document.getElementById('drv');
    if(drv){if(![...drv.options].some(o=>o.value==='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>');drv.value='BB';LS.drv='BB'}
    render();
    return {n:jobs.length,open:typeof caTodayOpen==='function'?caTodayOpen().map(j=>j.uid):[],ver:document.querySelector('meta[name="ds-ver"]')?.content};
  },resetSt);
 };

 const hideAlarms=()=>pg.evaluate(()=>{['alarmdlg','alarmov'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove()})});
 const shot=async(name,sel,full)=>{
  await hideAlarms();
  if(sel){const el=await pg.$(sel);if(el){await el.screenshot({path:OUT+'/'+name});return name}}
  await pg.screenshot({path:OUT+'/'+name,fullPage:!!full});
  return name;
 };
 const hookScroll=()=>pg.evaluate(()=>{
   if(window._svHooked){window._sv=[];return}
   window._sv=[];window._svHooked=1;
   const orig=Element.prototype.scrollIntoView;
   Element.prototype.scrollIntoView=function(o){window._sv.push({id:this.id||'',cls:String(this.className||''),tag:this.tagName,beh:o&&o.behavior,block:o&&o.block});return orig.call(this,o)};/* v63: Complete job glides with its own re-aiming smooth scroll (caScroll) and reports it here */window.dsOnGlide=el=>window._sv.push({id:el.id||'',cls:String(el.className||''),tag:el.tagName,beh:'smooth',block:'start',glide:1});
 });
 const state=()=>pg.evaluate(()=>{
   const openOf=u=>{const c=[...document.querySelectorAll('#caday .jc,#dcards .jc')].find(el=>{const h=el.querySelector('.jh');return h&&(h.getAttribute('onclick')||'').includes("'"+u+"'")});if(!c)return{found:false};const btn=[...c.querySelectorAll('button')].find(b=>/Complete job/.test(b.textContent||''));return{found:true,open:!!btn,txt:(c.innerText||'').slice(0,80)}};
   const note=document.getElementById('canote');
   const done=document.querySelector('#caday .donesec');
   const caday=document.getElementById('caday'),cafind=document.getElementById('cafind');
   const st=ST();
   return{
     st:{T1:st.T1&&st.T1.st,T2:st.T2&&st.T2.st,T3:st.T3&&st.T3.st,TM:st.TM&&st.TM.st,YS:st.YS&&st.YS.st},
     exp:[...((typeof EXP!=='undefined'&&EXP)||[])],
     expall:!!(typeof EXPALL!=='undefined'&&EXPALL),
     cards:{T1:openOf('T1'),T2:openOf('T2'),T3:openOf('T3'),TM:openOf('TM')},
     noteOn:!!(note&&note.style.display!=='none'&&note.innerHTML),
     note:(note&&note.innerText||'').replace(/\s+/g,' ').trim(),
     hasAnyway:!!(note&&note.querySelector('#caanyway')),
     hasUndo:!!(note&&/Undo/.test(note.innerText||'')),
     donesec:!!done,doneTxt:(done&&done.innerText||'').replace(/\s+/g,' ').slice(0,80),
     hasCaday:!!caday,hasCafind:!!cafind,
     cadayH:((caday&&(caday.querySelector('b, .cadayh, [style*="1f3a5f"]')?.textContent||caday.innerText||''))||'').slice(0,80),
     cafindH:((cafind&&(cafind.querySelector('.cafindh')?.textContent||''))||'').trim(),
     hasCafq:!!document.getElementById('cafq'),
     hasDayBtn:!!document.getElementById('cadaybtn'),
     caov:!!document.getElementById('caov'),
     openToday:(typeof caTodayOpen==='function'?caTodayOpen().map(j=>j.uid):[]),
     sv:window._sv||[],
     scrollY:Math.round(window.scrollY||document.documentElement.scrollTop||0)
   };
 });

 const s0=await seed(true);
 ok('helpers and version present', s0.ver==='2026-11-25.66' && s0.open.join(',')==='T1,T2,T3', s0);
 await hookScroll();
 await pg.evaluate(()=>{window.scrollTo(0,0)});
 await W(300);
 await hideAlarms();

 // --- sections exist and are distinct ---
 let st=await state();
 ok('today section #caday present', st.hasCaday && st.hasDayBtn && /TODAY/.test(st.cadayH||''), {h:st.cadayH});
 // v50 tabs: Today lives on the Current tab, Find on its own Find tab (only the open tab is rendered)
 await shot('sections_page.png');
 await shot('sections_page_full.png',null,true);
 await shot('section_today.png','#caday');
 await pg.evaluate(()=>show('find'));await W(300);
 const stF=await state();
 ok('find section #cafind present (Find tab)', stF.hasCafind && stF.hasCafq && /Find job/.test(stF.cafindH||''), {h:stF.cafindH});
 ok('sections are distinct (Current: Today only, Find: Find only)', st.hasCaday && !st.hasCafind && st.hasDayBtn && stF.hasCafind && !stF.hasCaday && stF.hasCafq, {cur:[st.hasCaday,st.hasCafind],find:[stF.hasCaday,stF.hasCafind]});
 await shot('section_find.png','#cafind');
 await pg.evaluate(()=>{show('driver');scrollTo(0,0)});await W(300);
 await pg.evaluate(()=>{const el=document.getElementById('caday');if(el)el.scrollIntoView({block:'start'})});
 await W(400);
 await hideAlarms();
 await shot('sections_today_top.png');

 // --- complete mid today: collapse T1, jump to T2, still-open note ---
 await pg.evaluate(()=>{window._sv=[];EXP.add('T1');render()});
 await W(400);
 await pg.evaluate(()=>completeJob('T1'));
 await W(800);
 st=await state();
 ok('today mid complete marks T1 Done', st.st.T1==='Done' && st.st.T2!=='Done' && st.st.T3!=='Done', st.st);
 ok('today mid complete collapses T1 and opens next T2', st.cards.T1.found && !st.cards.T1.open && st.cards.T2.open && !st.exp.includes('T1') && st.exp.includes('T2'), st.cards);
 ok('today mid complete shows still-open note with Complete all anyway', st.noteOn && /2 jobs still open today/.test(st.note) && st.hasAnyway && !st.caov, {note:st.note});
 ok('today mid complete smooth-scrolls to next job', st.sv.some(x=>x.beh==='smooth' && (x.block==='start'||!x.block)), st.sv);
 await shot('after_mid_complete.png');
 await shot('after_mid_complete_today.png','#caday');
 await shot('note_still_open.png','#canote');

 // --- other-day complete: unchanged (stays Done, no EXP/scroll jump, no note overwrite if we reset first) ---
 // Use a fresh seed so yesterday/tomorrow isolation is clean; keep T1 done? Better full reset then complete only TM.
 await seed(true);
 await hookScroll();
 await pg.evaluate(()=>{
   window._sv=[];
   try{setDV('jump', ymd(jobs.find(j=>j.uid==='TM').start))}catch(e){}
   EXP.clear();EXP.add('TM');render();
 });
 await W(500);
 const beforeOther=await state();
 await pg.evaluate(()=>completeJob('TM'));
 await W(700);
 st=await state();
 ok('other-day complete marks TM Done only', st.st.TM==='Done' && st.st.T1!=='Done' && st.st.T2!=='Done' && st.st.T3!=='Done', st.st);
 ok('other-day complete does not change EXP (card stays as original completeJob)', st.exp.includes('TM') && !st.exp.includes('T1'), {exp:st.exp, before:beforeOther.exp});
 ok('other-day complete does not smooth-jump (no new auto-scroll)', !st.sv.some(x=>x.beh==='smooth'), st.sv);
 ok('other-day complete does not show today still-open note', !st.noteOn, {note:st.note});

 // --- last job today lands on .donesec ---
 await seed(true);
 await hookScroll();
 await pg.evaluate(()=>{
   const s=ST();s.T1={...s.T1,st:'Done'};s.T2={...s.T2,st:'Done'};LS.st=JSON.stringify(s);
   EXP.clear();EXP.add('T3');window._sv=[];render();
 });
 await W(500);
 await pg.evaluate(()=>completeJob('T3'));
 await W(800);
 st=await state();
 ok('last today job is marked Done', st.st.T3==='Done' && st.openToday.length===0, {st:st.st,open:st.openToday});
 ok('last today job collapses and lands on #caday .donesec', st.donesec && !st.cards.T3.open && st.sv.some(x=>/donesec/.test(x.cls) && x.beh==='smooth'), {sv:st.sv,done:st.doneTxt,card:st.cards.T3});
 ok('last today job does not show still-open note', !st.noteOn, {note:st.note});
 await shot('last_job_donesec.png');
 if(st.donesec) await shot('donesec.png','#caday .donesec');

 // --- Complete day with open jobs: go to first open, expand, banner, no confirm yet ---
 await seed(true);
 await hookScroll();
 await pg.evaluate(()=>{EXP.clear();window._sv=[];render()});
 await W(400);
 await pg.evaluate(()=>completeDay());
 await W(800);
 st=await state();
 ok('Complete day with opens does not bulk-complete', st.st.T1!=='Done' && st.st.T2!=='Done' && st.st.T3!=='Done' && st.openToday.join(',')==='T1,T2,T3', st.st);
 ok('Complete day with opens expands first open job T1', st.cards.T1.open && st.exp.includes('T1') && !st.exp.includes('T2'), st.cards);
 ok('Complete day with opens shows N still-open banner, no confirm yet', st.noteOn && /3 jobs still open today/.test(st.note) && st.hasAnyway && !st.caov, {note:st.note,caov:st.caov});
 ok('Complete day with opens smooth-scrolls to first open job', st.sv.some(x=>x.beh==='smooth'), st.sv);
 await shot('complete_day_first_open.png');

 // --- Complete all anyway -> confirm, then bulk + undo ---
 await pg.evaluate(()=>caBulkAsk());
 await W(300);
 st=await state();
 ok('Complete all anyway opens confirm modal', st.caov && st.st.T1!=='Done', {caov:st.caov});
 await shot('bulk_confirm.png');
 await pg.evaluate(()=>caBulkDo());
 await W(800);
 st=await state();
 ok('bulk confirm marks all today jobs Done', st.st.T1==='Done' && st.st.T2==='Done' && st.st.T3==='Done' && st.st.TM!=='Done', st.st);
 ok('bulk confirm lands on donesec and offers Undo', st.donesec && st.hasUndo && /3 jobs marked done/.test(st.note) && !st.caov, {note:st.note,sv:st.sv});
 await shot('bulk_done_undo.png');

 await pg.evaluate(()=>caUndo());
 await W(700);
 st=await state();
 ok('undo restores today jobs to open', st.st.T1!=='Done' && st.st.T2!=='Done' && st.st.T3!=='Done' && st.openToday.join(',')==='T1,T2,T3', {st:st.st,open:st.openToday,note:st.note});
 await shot('after_undo.png');

 // --- Complete day with no open jobs -> collapse + donesec ---
 await pg.evaluate(()=>{
   ['T1','T2','T3'].forEach(u=>setSt(u,'st','Done'));
 });
 await W(400);
 await hookScroll();
 await pg.evaluate(()=>{window._sv=[];EXP.add('T1');completeDay()});
 await W(800);
 st=await state();
 ok('Complete day with no opens keeps jobs Done and lands on donesec', st.st.T1==='Done' && st.donesec && st.sv.some(x=>/donesec/.test(x.cls)&&x.beh==='smooth') && !st.noteOn, {sv:st.sv,note:st.note});
 await shot('complete_day_no_open.png');

 // page errors that aren't known noise
 const fatal=errs.filter(e=>!/Failed to load|AbortError|Failed to fetch/i.test(e));
 ok('no page errors', fatal.length===0, fatal.slice(0,5));

 const fail=results.filter(r=>!r.pass);
 console.log('RESULT', fail.length?'FAIL':'PASS', results.filter(r=>r.pass).length+'/'+results.length);
 fs.writeFileSync(OUT+'/test-results.json',JSON.stringify({pass:!fail.length,results,errs},null,2));
 await b.close();
 clearTimeout(killer);
 process.exit(fail.length?1:0);
})().catch(e=>{console.error('ADVANCE48 CRASH', e);try{_b&&_b.close()}catch(x){}process.exit(2)});
