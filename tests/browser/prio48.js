// node tests/browser/prio48.js — 390px: Any-driver checkbox + Priority dropdown, multi-leg, last-resort exclusion
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const OUT=process.env.OUT||'/workspace/v48prio';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const fs=require('fs');
fs.mkdirSync(OUT,{recursive:true});
const DEAD=Number(process.env.PRIO48_MS||120000);
let _b;
const killer=setTimeout(()=>{console.log('PRIO48 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},DEAD);
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
 _b=b;
 const ctx=await b.createBrowserContext();
 const pg=await ctx.newPage();
 pg.setDefaultTimeout(20000);pg.setDefaultNavigationTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'});
 await pg.setRequestInterception(true);
 pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u)||/^blob:/.test(u))return r.continue();return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
 await pg.waitForFunction('typeof jobs!=="undefined" && typeof show=="function" && typeof formJob=="function"',{timeout:15000});
 await W(800);

 const shot=async(name,sel)=>{
  if(sel){const el=await pg.$(sel);if(el){await el.screenshot({path:OUT+'/'+name});return}}
  await pg.screenshot({path:OUT+'/'+name,fullPage:false});
 };

 await pg.evaluate(()=>{
  try{show('newjob')}catch(e){}
  const nj=document.getElementById('newjob');
  if(nj){nj.classList.remove('hide');['driver','owner','cal'].forEach(id=>{const x=document.getElementById(id);if(x)x.classList.add('hide')})}
  try{if(typeof fillDrv==='function')fillDrv();if(typeof priFill==='function')priFill();if(typeof priMount==='function'){const w=document.getElementById('drvsec');if(w)priMount(w)}}catch(e){}
 });
 await W(600);

 // Ensure date so AW can paint; set a two-leg split job
 await pg.evaluate(()=>{
  const pad=n=>String(n).padStart(2,'0');
  const d=new Date();d.setDate(d.getDate()+1);d.setHours(10,0,0,0);
  const v=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
  const ndt=document.getElementById('ndt'),npd=document.getElementById('npd');
  if(ndt)ndt.value=v;if(npd)npd.value=v.slice(0,10);
  const nc=document.getElementById('nc');if(nc)nc.value='Priority Demo';
  try{setStops('pks','100 Main St, Shreve, OH')}catch(e){}
  try{setStops('dos','200 Oak St, Wooster, OH')}catch(e){}
  const sp=document.getElementById('nsplit');
  if(sp&&!sp.checked){sp.checked=true;sp.dispatchEvent(new Event('input',{bubbles:true}));sp.dispatchEvent(new Event('change',{bubbles:true}))}
  try{if(typeof mlAdd==='function'||true){/* split checkbox already makes leg 2 */} }catch(e){}
  const t2=new Date(+d+2*36e5);
  const nl2t=document.getElementById('nl2t');
  if(nl2t)nl2t.value=t2.getFullYear()+'-'+pad(t2.getMonth()+1)+'-'+pad(t2.getDate())+'T'+pad(t2.getHours())+':'+pad(t2.getMinutes());
  const pk2=document.getElementById('nl2pk');if(pk2)pk2.value='200 Oak St, Wooster, OH';
  const dz2=document.getElementById('nl2dz');if(dz2)dz2.value='100 Main St, Shreve, OH';
  try{window.priReset&&priReset()}catch(e){}
  try{window.awinPaint&&awinPaint()}catch(e){}
 });
 await W(800);

 const st1=await pg.evaluate(()=>{
  const a=document.getElementById('priany'),s=document.getElementById('pri'),h=document.getElementById('prihint'),btn=document.getElementById('drvany');
  const box=document.getElementById('pribox');
  if(box)box.scrollIntoView({block:'center'});
  const opts=s?[...s.options].map(o=>o.value):[];
  return{
    hasBox:!!box,hasAny:!!a,hasSel:!!s,noBtn:!btn,
    checked:!!(a&&a.checked),val:s?s.value:'?',
    hint:(h&&getComputedStyle(h).display!=='none')?(h.textContent||''):'',
    name:typeof priName==='function'?priName():'nofn',
    pd:(typeof formJob==='function'&&formJob().pd)||'',
    opts,
    kaciLast:opts.length?opts[opts.length-1]==='Kaci':false,
    split:!!(document.getElementById('nsplit')||{}).checked,
    leg2:!!document.getElementById('nl2d')
  };
 });
 await shot('pri_any_checked.png','#pribox');
 await shot('pri_any_checked_form.png');

 // Pick Jeffrey in the dropdown — checkbox should uncheck
 await pg.evaluate(()=>{
  const s=document.getElementById('pri');
  s.value='Jeffrey';
  s.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await W(400);
 const st2=await pg.evaluate(()=>{
  const a=document.getElementById('priany'),s=document.getElementById('pri'),h=document.getElementById('prihint');
  const box=document.getElementById('pribox');if(box)box.scrollIntoView({block:'center'});
  let aw=[];
  try{aw=[...document.querySelectorAll('#awin .dr[data-d]')].map(x=>x.dataset.d)}catch(e){}
  return{
    checked:!!(a&&a.checked),val:s?s.value:'?',
    hintHidden:h?getComputedStyle(h).display==='none':false,
    name:priName(),pd:formJob().pd,
    awFirst:aw[0]||'',awHasJeff:aw.includes('Jeffrey')
  };
 });
 await shot('pri_jeffrey_unchecked.png','#pribox');
 await shot('pri_jeffrey_unchecked_form.png');

 // Re-check Any — dropdown clears
 await pg.evaluate(()=>{
  const a=document.getElementById('priany');
  a.checked=true;
  a.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await W(300);
 const st3=await pg.evaluate(()=>{
  const a=document.getElementById('priany'),s=document.getElementById('pri');
  return{checked:!!(a&&a.checked),val:s?s.value:'?',name:priName(),pd:formJob().pd};
 });

 // Explicit last-resort as priority (override)
 await pg.evaluate(()=>{
  const s=document.getElementById('pri');
  s.value='Kaci';
  s.dispatchEvent(new Event('change',{bubbles:true}));
 });
 await W(400);
 const st4=await pg.evaluate(()=>{
  const a=document.getElementById('priany');
  let aw=[];
  try{aw=[...document.querySelectorAll('#awin .dr[data-d]')].map(x=>x.dataset.d)}catch(e){}
  const sort=priSort(['BB','Jeffrey','Jared','Kaci'],Date.now(),'Kaci');
  const any=priSort(['BB','Jeffrey','Jared','Kaci'],Date.now(),'');
  return{checked:!!(a&&a.checked),name:priName(),pd:formJob().pd,awFirst:aw[0]||'',sortFirst:sort[0],anyLast:any[any.length-1],aw};
 });
 await shot('pri_kaci_explicit.png','#pribox');

 // Job card shows Priority when set
 await pg.evaluate(()=>{
  jobs.length=0;
  const t=new Date();t.setHours(10,0,0,0);
  const j={uid:'PRIO1',evuid:'PRIO1',start:t,endT:new Date(+t+2*36e5),driver:'BB',pd:'Jeffrey',client:'Priority Demo',title:'BB, Ford Van, Priority Demo',from:'100 Main St, Shreve, OH',to:'2 B Ave',pax:2,vehicle:'Ford Van'};
  jobs.push(j);
  try{show('driver')}catch(e){}
  const dv=document.getElementById('driver');if(dv)dv.classList.remove('hide');
  const nj=document.getElementById('newjob');if(nj)nj.classList.add('hide');
  try{renderDriver()}catch(e){try{render()}catch(x){}}
 });
 await W(600);
 const card=await pg.evaluate(()=>{
  const el=document.querySelector('#dcards .jc')||document.querySelector('.jc');
  const tag=document.querySelector('.pritag');
  if(el)el.scrollIntoView({block:'center'});
  return{html:el?el.innerText.slice(0,500):'',tag:tag?tag.textContent:'',color:tag?getComputedStyle(tag).color:''};
 });
 await shot('pri_card.png');

 const r={st1,st2,st3,st4,card,errs};
 console.log(JSON.stringify(r,null,1));
 const ok=st1.hasBox&&st1.hasAny&&st1.hasSel&&st1.noBtn
  &&st1.checked&&st1.val===''&&st1.name===''&&st1.pd===''&&/last-resort/.test(st1.hint)
  &&st1.kaciLast&&st1.split&&st1.leg2
  &&!st2.checked&&st2.val==='Jeffrey'&&st2.name==='Jeffrey'&&st2.pd==='Jeffrey'&&st2.hintHidden
  &&st3.checked&&st3.val===''&&st3.name===''&&st3.pd===''
  &&!st4.checked&&st4.name==='Kaci'&&st4.pd==='Kaci'&&st4.sortFirst==='Kaci'&&st4.anyLast==='Kaci'
  &&/Priority:\s*Jeffrey/.test(card.tag||card.html)
  &&!errs.length;
 console.log(ok?'PRIO48 BROWSER PASS':'PRIO48 BROWSER FAIL');
 clearTimeout(killer);await b.close();process.exit(ok?0:1);
})().catch(e=>{console.log('PRIO48 ERROR',e&&e.message);process.exit(1)});
