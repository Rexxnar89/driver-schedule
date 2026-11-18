// node tests/browser/push49.js — closed-app alarm enable UI at 390px + screenshots. Does not hit live sync or Cloudflare. Skips testmode.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8813/index.html',OUT=process.env.OUT||'/workspace/v49push';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('PUSH49 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},90000);
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
 const ctx=await b.createBrowserContext();
 await ctx.overridePermissions(U.replace(/\/index\.html.*/,''), ['notifications']);
 const pg=await ctx.newPage();pg.setDefaultTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36'});
 await pg.setRequestInterception(true);
 pg.on('request',r=>{const u=r.url();
  if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
  if(/api\.open-meteo\.com/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"hourly":{"time":[],"temperature_2m":[],"weather_code":[]}}'});
  if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();
  return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
 await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render=="function"&&typeof pushPaint==="function"&&typeof pushAlarms==="function"',{timeout:15000});
 await W(400);
 const r={};
 // settings: Owner who-picker (no PIN in this clean test) then Alarm chain box at 390px
 await pg.evaluate(()=>show('owner'));await W(500);
 r.who=await pg.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.offsetParent&&x.textContent.trim()=='Jeffrey');if(b)b.click();return!!b});
 await W(700);
 r.settings=await pg.evaluate(()=>{const box=document.getElementById('pushbox');if(box)box.scrollIntoView({block:'center'});
  return{has:!!box,w:box&&box.getBoundingClientRect().width,txt:(box&&box.innerText.replace(/\s+/g,' '))||'',btn:[...document.querySelectorAll('.pushbtn')].map(b=>b.textContent),st:[...document.querySelectorAll('.pushst')].map(s=>s.textContent),owner:!$('owner').classList.contains('hide')}});
 await W(200);
 await pg.screenshot({path:OUT+'/v49_settings_closed_app_alarms.png'});
 // enable (notifications pre-granted; worker not configured — that's the current pre-deploy state)
 r.enable=await pg.evaluate(async()=>{const b=document.querySelector('#pushbox .pushbtn');if(b)b.click();await new Promise(r=>setTimeout(r,500));await pushPaint();
  return{on:MS.getItem('alPush')=='1',perm:Notification.permission,st:document.querySelector('#pushbox .pushst')?.textContent,btn:document.querySelector('#pushbox .pushbtn')?.textContent}});
 await W(200);
 await pg.screenshot({path:OUT+'/v49_settings_closed_app_enabled.png'});
 // alarm dialog also shows the same box; pushAlarms must not include rider/address
 r.alarms=await pg.evaluate(async()=>{
  const t=new Date(Date.now()+45*6e4);
  jobs.push({uid:'P49',evuid:'P49',start:t,endT:new Date(+t+36e5),driver:'BB',client:'Test Rider',title:'Test Rider',raw:'Test Rider',from:'1 Secret St',to:'2 Hidden Ave',pax:1});
  alarmSet('P49',1,20);alarmPrep('P49',1);
  const A0=_alAL('P49');if(!(A0['1h']&&A0['1h'].on))alarmHeat('P49',1);
  await pushPaint();
  const alarms=pushAlarms();
  const dlg=document.getElementById('alarmdlg');
  const box=document.getElementById('pushdlg');
  const A=_alAL('P49');
  return{alarms,dlg:!!dlg,box:!!box,heatOn:!!(A['1h']&&A['1h'].on),boxTxt:(box&&box.innerText.replace(/\s+/g,' '))||'',hasName:(JSON.stringify(alarms)+((box&&box.innerText)||'')).includes('Test Rider')};
 });
 if(await pg.$('#alarmdlg')){
  await pg.evaluate(()=>document.getElementById('pushdlg')?.scrollIntoView({block:'center'}));
  await W(200);
  await pg.screenshot({path:OUT+'/v49_alarm_dialog_push.png'});
 }
 // OS-style notification mock (not a live push — Worker is not deployed yet)
 await pg.evaluate(t=>{document.getElementById('alarmdlg')?.remove();document.getElementById('pinov')?.remove();
  const m=document.createElement('div');m.id='nmock';m.style.cssText='position:fixed;inset:0;background:#111;z-index:999999;display:flex;align-items:flex-start;justify-content:center;padding:48px 16px 16px;font-family:Roboto,Arial,sans-serif';
  m.innerHTML=`<div style="width:100%;max-width:358px;background:#2d2e31;color:#fff;border-radius:20px;padding:12px 14px;display:flex;gap:12px;align-items:flex-start;box-shadow:0 8px 24px rgba(0,0,0,.45)"><img src="icon-192.png" width="36" height="36" alt="" style="border-radius:8px;flex:0 0 auto"><div style="min-width:0"><div style="opacity:.75;font-size:12px">Driver Schedule · now</div><div style="font-weight:700;font-size:16px;margin-top:2px">Time to leave</div><div style="font-size:14px;margin-top:1px">Leave at ${t}</div></div></div>`;
  document.body.appendChild(m);
 }, '7:42 AM');
 await W(250);
 await pg.screenshot({path:OUT+'/v49_notification_mock.png'});
 r.vp=await pg.evaluate(()=>({w:innerWidth,h:innerHeight}));
 r.errs=errs;
 console.log(JSON.stringify(r,null,1));
 const al=JSON.stringify(r.alarms&&r.alarms.alarms||[]);
 const ok=r.settings.has&&r.settings.owner&&r.settings.w>0&&r.settings.w<=390
  &&/Closed-app alarms/.test(r.settings.txt)
  &&r.settings.btn.some(t=>/Enable closed-app alarms/.test(t))
  &&r.enable.perm==='granted'&&r.enable.on
  &&/server is connected|Allow notifications/.test(r.enable.st||'')
  &&r.alarms.dlg&&r.alarms.box&&!r.alarms.hasName
  &&/"kind":"heat"/.test(al)&&/"kind":"prep"/.test(al)&&/"kind":"leave"/.test(al)
  &&!/Test Rider|Secret St|Hidden Ave/.test(al)
  &&r.vp.w===390&&!errs.length;
 console.log(ok?'PUSH49 PASS':'PUSH49 FAIL');
 clearTimeout(killer);await b.close();process.exit(ok?0:1);
})().catch(e=>{console.log('PUSH49 ERROR',e&&e.message);process.exit(1)});
