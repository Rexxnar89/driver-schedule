// node tests/browser/upsnap49.js — Upcoming-section snap: a touch-scroll that starts on an upcoming job
// (or the Next-job pointer) must not be treated as a tap and must not snap the view back toward the top job.
// 390px, includes a multi-leg upcoming job. FAILS on unpatched v.48 / main; PASSES with the nosnap fix.
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('UPSNAP49 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},120000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const at=(day,h)=>{const d=new Date(t0);d.setDate(d.getDate()+day);d.setHours(h,0,0,0);return d};

async function boot(b){
  const pg=await (await b.createBrowserContext()).newPage();
  pg.setDefaultTimeout(20000);
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{
    const u=r.url();
    if(/script\.google/.test(u)||/api\.open-meteo/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:u.includes('open-meteo')?'{"hourly":{"time":[],"temperature_2m":[],"weather_code":[]}}':'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();
    return r.respond({status:200,body:''});
  });
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render==="function"',{timeout:15000});
  await pg.evaluate((A)=>{
    window.geo=async()=>[-81.9,40.8];
    jobs.length=0;
    const mk=(id,s,e,cl)=>({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:'BB',client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
    // Today: two jobs so the list is long enough to scroll
    jobs.push(mk('TODAY1',A.t9,A.t10,'Today Alpha'));
    jobs.push(mk('TODAY2',A.t13,A.t14,'Today Bravo'));
    // Tomorrow
    jobs.push(mk('TOM1',A.tm9,A.tm10,'Tomorrow Rider'));
    // Upcoming (day+2) multi-leg — this is the "particular upcoming job"
    jobs.push(mk('UP1',A.u8,A.u15,'Upcoming Multi'));
    setSt('UP1','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:A.u12iso,drv:'BB',done:0}]);
    jobs.push(mk('UP2',A.u16,A.u17,'Upcoming Later'));
    try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
    drv.value='BB';
    try{if(typeof EXPALL!='undefined'){EXPALL=false;sessionStorage.expall=''}EXP.clear();sessionStorage.exp='[]'}catch(e){}
    render();
  },{
    t9:+at(0,9),t10:+at(0,10),t13:+at(0,13),t14:+at(0,14),
    tm9:+at(1,9),tm10:+at(1,10),
    u8:+at(2,8),u15:+at(2,15),u16:+at(2,16),u17:+at(2,17),
    u12iso:new Date(+at(2,12)-at(2,12).getTimezoneOffset()*6e4).toISOString().slice(0,16)
  });
  await W(400);
  return {pg,errs};
}

// Simulate the mobile ghost-click: pointerdown on the target, move far enough to be a scroll, scroll the page, then fire click at the start point.
async function ghostScrollClick(pg, selectorFind){
  return pg.evaluate(async (finder)=>{
    const el=eval(finder);
    if(!el)return {ok:false,why:'no-target'};
    const r=el.getBoundingClientRect();
    const x=r.left+Math.min(40,r.width/2), y=r.top+Math.min(20,r.height/2);
    const sy0=scrollY;
    const exp0=(typeof EXP!='undefined')?[...EXP]:[];
    const into=[];
    const siv=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(){into.push((this.id||this.className||'')+':'+(this.textContent||'').replace(/\s+/g,' ').slice(0,40));return siv.apply(this,arguments)};
    const fire=(type,cx,cy,proto,init)=>{
      const Ev=proto||PointerEvent;
      el.dispatchEvent(new Ev(type,Object.assign({bubbles:true,cancelable:true,clientX:cx,clientY:cy,pointerId:1,pointerType:'touch',isPrimary:true,buttons:type==='pointerup'||type==='click'?0:1,view:window},init||{})));
    };
    fire('pointerdown',x,y);
    fire('touchstart',x,y,TouchEvent?null:PointerEvent); // may fail if TouchEvent ctor is picky
    try{
      const t=new Touch({identifier:1,target:el,clientX:x,clientY:y});
      el.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:[t],changedTouches:[t]}));
    }catch(e){}
    // move 80px — past the 10px threshold
    fire('pointermove',x,y-80);
    try{
      const t=new Touch({identifier:1,target:el,clientX:x,clientY:y-80});
      el.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:[t],changedTouches:[t]}));
    }catch(e){}
    const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    scrollTo(0, Math.min(max, sy0+220));
    const sy1=scrollY;
    fire('pointerup',x,y-80);
    try{
      const t=new Touch({identifier:1,target:el,clientX:x,clientY:y-80});
      el.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[t]}));
    }catch(e){}
    // Ghost click at the ORIGINAL point, as mobile browsers do
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:x,clientY:y,view:window}));
    await new Promise(r=>setTimeout(r,200));
    const exp1=(typeof EXP!='undefined')?[...EXP]:[];
    const sy2=scrollY;
    const topJob=document.querySelector('#caday .jc, #driver .jc');
    const topRect=topJob&&topJob.getBoundingClientRect();
    Element.prototype.scrollIntoView=siv;
    return {
      ok:true,sy0,sy1,sy2,
      jumpedBack: sy2<sy1-40, // snapped back toward the top
      expChanged: JSON.stringify(exp0)!==JSON.stringify(exp1),
      exp1,into,
      topJobVisible: !!(topRect&&topRect.top>=-20&&topRect.top<200&&sy2<sy1-40),
      nxt:!!document.querySelector('.nxtjob'),
      text:(el.innerText||'').replace(/\s+/g,' ').slice(0,80)
    };
  }, selectorFind);
}

(async()=>{
  const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
  _b=b;
  const {pg,errs}=await boot(b);
  // scroll the Upcoming section into view (green Find / Upcoming box)
  await pg.evaluate(()=>{
    const up=document.querySelector('#cafind, [onclick*="setDV(\'dir\',\'up\')"]')||[...document.querySelectorAll('b,div,button')].find(x=>/Upcoming/i.test(x.textContent||'')&&x.offsetParent);
    const card=[...document.querySelectorAll('#driver .jc')].find(c=>/Upcoming Multi/.test(c.innerText||''));
    if(card)card.scrollIntoView({block:'center'});
    else if(up&&up.scrollIntoView)up.scrollIntoView({block:'start'});
  });
  await W(200);
  const info=await pg.evaluate(()=>{
    const cards=[...document.querySelectorAll('#driver .jc')].map(c=>(c.innerText||'').replace(/\s+/g,' ').slice(0,60));
    const nxt=[...document.querySelectorAll('.nxtjob')].map(n=>({t:n.innerText.replace(/\s+/g,' ').slice(0,80),y:n.getBoundingClientRect().top}));
    const upCard=[...document.querySelectorAll('#driver .jc')].find(c=>/Upcoming Multi/.test(c.innerText||''));
    return {sy:scrollY,cards:cards.slice(0,8),nxt,hasUp:!!upCard,upTop:upCard&&upCard.getBoundingClientRect().top,caday:!!document.getElementById('caday'),cafind:!!document.getElementById('cafind')};
  });
  console.log('BOOT',JSON.stringify(info));

  const findUp="[...document.querySelectorAll('#driver .jc')].find(c=>/Upcoming Multi/.test(c.innerText||'')).querySelector('.jh') || [...document.querySelectorAll('#driver .jc')].find(c=>/Upcoming Multi/.test(c.innerText||''))";
  const r1=await ghostScrollClick(pg, findUp);
  console.log('CARD',JSON.stringify(r1));

  // Also try the Next-job pointer in the Upcoming area if present
  let r2={skipped:true};
  await pg.evaluate(()=>{
    const n=[...document.querySelectorAll('#cafind .nxtjob, #driver .nxtjob')].find(x=>/after tomorrow/i.test(x.innerText||''))||[...document.querySelectorAll('#cafind .nxtjob, #driver .nxtjob')].find(x=>{const r=x.getBoundingClientRect();return r.height>0});
    if(n)n.scrollIntoView({block:'center'});
  });
  await W(200);
  const hasNxt=await pg.evaluate(()=>[...document.querySelectorAll('#cafind .nxtjob, #driver .nxtjob')].some(n=>/after tomorrow/i.test(n.innerText||'')||n.getBoundingClientRect().bottom>0));
  if(hasNxt){
    const findNxt="[...document.querySelectorAll('#cafind .nxtjob, #driver .nxtjob')].find(n=>/after tomorrow/i.test(n.innerText||''))||[...document.querySelectorAll('#cafind .nxtjob, #driver .nxtjob')].find(n=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight})";
    r2=await ghostScrollClick(pg, findNxt);
    console.log('NXT',JSON.stringify(r2));
  }

  const bad=[];
  if(!info.hasUp)bad.push('upcoming multi-leg card not in the driver list');
  if(!r1.ok)bad.push('card target missing: '+(r1.why||''));
  if(r1.ok&&r1.expChanged)bad.push('upcoming job was toggled open/closed by a scroll-end click (ghost tap)');
  if(r1.ok&&r1.jumpedBack)bad.push('view snapped back toward the top after scroll-end on the upcoming job (sy '+r1.sy1+' → '+r1.sy2+')');
  if(r1.ok&&r1.into&&r1.into.length)bad.push('unprompted scrollIntoView after scroll-end on the upcoming job: '+JSON.stringify(r1.into));
  if(r2.ok&&r2.expChanged)bad.push('Next-job pointer ghost click expanded a job');
  if(r2.ok&&r2.jumpedBack)bad.push('Next-job pointer ghost click snapped the view (sy '+r2.sy1+' → '+r2.sy2+')');
  if(r2.ok&&r2.into&&r2.into.length)bad.push('unprompted scrollIntoView from Next-job pointer: '+JSON.stringify(r2.into));
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));

  console.log(bad.length?'UPSNAP49 FAIL\n'+bad.join('\n'):'UPSNAP49 PASS');
  await b.close();clearTimeout(killer);
  process.exit(bad.length?1:0);
})().catch(e=>{console.log('UPSNAP49 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
