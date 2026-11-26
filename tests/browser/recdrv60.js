// node tests/browser/recdrv60.js   (U=.../index.html)
// v.60: recommended driver must re-run when date/time (and other schedule inputs) change.
// v.59 left the ★ on a now-busy driver after a day-chip / pickDay because dsRefresh
// updated the availability list but never called recDrv. Also: busy uses j.endT
// (not only j.end / start+1h); early "everyone busy" / "no non-last-resort" returns
// clear the stale ★ and _recD; last-resort is not recommended when a free non-LR
// driver exists. 390px Android, made-up data, no pickup (recDrv can finish without geo).
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8877/index.html',SH=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('RECDRV60 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},120000);
(async()=>{
  const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
  _b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();
    if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/api\.open-meteo|nominatim|photon|openstreetmap|maps\.google|googleapis/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'[]'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u)||/^blob:/.test(u))return r.continue();
    return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(String(e.message||e)));
  pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof recDrv=="function" && typeof pickDay=="function" && typeof dsRefresh=="function"',{timeout:20000});
  await W(400);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+(d===undefined?'':' '+JSON.stringify(d)))};

  const src=await pg.evaluate(()=>{
    const s=[...document.querySelectorAll('script')].map(x=>x.textContent).join('\n');
    return {
      ver:(document.querySelector('meta[name=ds-ver]')||{}).content||'',
      dsCallsRec:s.includes('window.recDrv&&recDrv()}catch(e){}},100)'),
      pickCallsRec:s.includes('avail();try{window.recDrv&&recDrv()}'),
      endT:s.includes('j.end||j.endT'),
      wipe:s.includes("wipe=()=>{[...nd.options].forEach(o=>o.removeAttribute('label'));window._recD=''}")
    };
  });
  ok('version is 2026-11-25.65', src.ver==='2026-11-25.65', src.ver);
  ok('dsRefresh calls recDrv', src.dsCallsRec, src);
  ok('pickDay calls recDrv', src.pickCallsRec, src);
  ok('busy check uses endT', src.endT, src);
  ok('early returns wipe stale ★ / _recD', src.wipe, src);

  const snap=()=>pg.evaluate(()=>{
    const nd=document.getElementById('nd');
    const rec=document.getElementById('ndrec');
    const lab=[...nd.options].filter(o=>(o.getAttribute('label')||'').includes('Recommended')).map(o=>(o.getAttribute('label')||'').split(' ')[0]);
    return {nd:nd.value, recD:window._recD||'', ndrec:(rec&&rec.textContent)||'', lab, npt:npt.value, npd:npd.value, ndt:ndt.value, hand:!!nd.dataset.hand};
  });
  const waitRec=async()=>{
    // pdSync schedules recDrv at 400ms; dsRefresh at 100ms; npt change at 50ms.
    // Do not accept the previous banner just because it is no longer "finding…".
    await W(500);
    const t0=Date.now();
    let s=await snap();
    while(Date.now()-t0<1500){
      if(s.ndrec && !/finding/i.test(s.ndrec))return s;
      await W(50);
      s=await snap();
    }
    return s;
  };

  // Seed: Jeffrey busy 9–10am today (end+endT); BB busy 9am–12pm today with only endT (no end);
  // Jeffrey also busy 9–10am tomorrow. Jared free. Kaci is default last-resort.
  await pg.evaluate(()=>{
    MS.setItem('drvsug','1');
    LS.drivers=JSON.stringify(['Jeffrey','Jared','Kaci','BB']);
    try{delete LS.lastres}catch(e){}
    try{MS.removeItem('draft')}catch(e){}
    const at=(dayOff,h,m)=>{const d=new Date();d.setDate(d.getDate()+dayOff);d.setHours(h,m,0,0);return d};
    jobs.length=0;
    const j1s=at(0,9,0), j1e=at(0,10,0);
    jobs.push({uid:'BUSY9',evuid:'BUSY9',start:j1s,end:j1e,endT:j1e,driver:'Jeffrey',client:'Fake Rider Morning',title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,canceled:false,block:false});
    const bStart=at(0,9,0), bEnd=at(0,12,0);
    jobs.push({uid:'BBENDT',evuid:'BBENDT',start:bStart,endT:bEnd,driver:'BB',client:'Fake Rider Midday',title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,canceled:false,block:false});
    const t1s=at(1,9,0), t1e=at(1,10,0);
    jobs.push({uid:'BUSY9T',evuid:'BUSY9T',start:t1s,end:t1e,endT:t1e,driver:'Jeffrey',client:'Fake Rider Tomorrow AM',title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,canceled:false,block:false});
    EDIT='';
    show('newjob');
    formReset();
    fillDrv();
    const a=document.getElementById('priany');
    if(a&&!a.checked){a.checked=true;if(typeof priSync==='function')priSync();a.dispatchEvent(new Event('change',{bubbles:true}))}
  });

  // 2pm today, Jeffrey and Jared free (BB's endT job ends at 12). Any driver. No pickup.
  await pg.evaluate(()=>{
    const pad=n=>String(n).padStart(2,'0');
    const d=new Date();
    npd.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    npt.value='14:00';
    pdSync();
  });
  let s=await waitRec();
  ok('2pm recommends a free non-last-resort driver', ['Jeffrey','Jared'].includes(s.recD)&&['Jeffrey','Jared'].includes(s.nd)&&!/Kaci/.test(s.ndrec), s);
  ok('2pm rec is Jeffrey when he is free and Any', s.recD==='Jeffrey'&&s.lab[0]==='Jeffrey', s);
  if(SH){await pg.evaluate(()=>{const el=document.getElementById('drvsec')||document.getElementById('awin')||document.getElementById('lstrip');if(el)el.scrollIntoView({block:'center'})});await W(200);await pg.screenshot({path:SH+'/fix-1-rec-at-2pm.png'})}

  // User path: set 09:00 on the time input (pdSync + dsRefresh) — Jeffrey and BB busy, Jared free
  await pg.evaluate(()=>{
    npt.value='09:00';
    npt.dispatchEvent(new Event('input',{bubbles:true}));
    npt.dispatchEvent(new Event('change',{bubbles:true}));
    pdSync();
  });
  s=await waitRec();
  ok('9am time input moves rec off busy Jeffrey', s.recD==='Jared'&&s.nd==='Jared'&&!/Jeffrey/.test(s.ndrec)&&s.lab[0]==='Jared', s);
  ok('9am does not recommend last-resort Kaci when Jared is free', s.recD!=='Kaci'&&s.recD!=='Jeffrey'&&s.recD!=='BB', s);
  if(SH){await pg.evaluate(()=>{const el=document.getElementById('awin')||document.getElementById('lstrip');if(el)el.scrollIntoView({block:'center'})});await W(200);await pg.screenshot({path:SH+'/fix-2-rec-at-9am-jared.png'})}

  // endT-only: at 10:30 BB is still on the 9–12 job (would look free if busy used only start+1h)
  await pg.evaluate(()=>{
    npt.value='10:30';
    npt.dispatchEvent(new Event('input',{bubbles:true}));
    npt.dispatchEvent(new Event('change',{bubbles:true}));
    pdSync();
  });
  s=await waitRec();
  ok('10:30 does not recommend BB (endT-only 9–12 job)', s.recD!=='BB'&&s.nd!=='BB', s);
  ok('10:30 recommends a free non-LR (Jeffrey or Jared)', ['Jeffrey','Jared'].includes(s.recD), s);

  // Reset to 9am today, then click tomorrow's day chip (the v.59 stale-rec path)
  await pg.evaluate(()=>{
    const pad=n=>String(n).padStart(2,'0');
    const d=new Date();
    npd.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    npt.value='09:00';
    pdSync();
  });
  s=await waitRec();
  ok('back at 9am today rec is Jared', s.recD==='Jared', s);

  const clicked=await pg.evaluate(()=>{
    const btns=[...document.querySelectorAll('#qdays button')];
    if(btns.length<2)return {ok:false,n:btns.length};
    btns[1].click();
    return {ok:true,n:btns.length};
  });
  ok('tomorrow day chip clicked', !!(clicked&&clicked.ok), clicked);
  s=await waitRec();
  ok('day chip moves rec off Jeffrey (busy tomorrow 9am)', s.recD!=='Jeffrey'&&s.nd!=='Jeffrey'&&!/Jeffrey/.test(s.ndrec), s);
  ok('day chip recommends a free non-LR (Jared or BB)', ['Jared','BB'].includes(s.recD)&&s.lab[0]===s.recD, s);
  if(SH){await pg.evaluate(()=>{const el=document.getElementById('qdays')||document.getElementById('awin');if(el)el.scrollIntoView({block:'center'})});await W(200);await pg.screenshot({path:SH+'/fix-3-rec-after-day-chip.png'})}

  // Named priority: 2pm today, Jared preferred and free → Jared, not Jeffrey
  await pg.evaluate(()=>{
    const pad=n=>String(n).padStart(2,'0');
    const d=new Date();
    npd.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    npt.value='14:00';
    pdSync();
    const any=document.getElementById('priany');
    if(any)any.checked=false;
    const sel=document.getElementById('npri')||document.querySelector('#pribox select');
    if(sel){sel.value='Jared';sel.dispatchEvent(new Event('change',{bubbles:true}))}
    if(typeof priSync==='function')priSync();
  });
  s=await waitRec();
  ok('named priority Jared is recommended when he is free', s.recD==='Jared'&&s.nd==='Jared', s);

  // Priority Jeffrey at 9am (he is busy) → a free driver, not Jeffrey
  await pg.evaluate(()=>{
    npt.value='09:00';
    npt.dispatchEvent(new Event('change',{bubbles:true}));
    pdSync();
    const sel=document.getElementById('npri')||document.querySelector('#pribox select');
    if(sel){sel.value='Jeffrey';sel.dispatchEvent(new Event('change',{bubbles:true}))}
    if(typeof priSync==='function')priSync();
  });
  s=await waitRec();
  ok('busy priority Jeffrey is not recommended when Jared is free', s.recD!=='Jeffrey'&&s.nd!=='Jeffrey'&&['Jared','BB'].includes(s.recD), s);

  // Only last-resort free: Any driver, Jeffrey/Jared/BB all busy at 3pm — should not recommend Kaci
  await pg.evaluate(()=>{
    const at=(h,m)=>{const d=new Date();d.setHours(h,m,0,0);return d};
    jobs.push({uid:'JF3',evuid:'JF3',start:at(15,0),end:at(16,0),endT:at(16,0),driver:'Jeffrey',client:'Fake Rider 3pm Jf',title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,canceled:false,block:false});
    jobs.push({uid:'JA3',evuid:'JA3',start:at(15,0),end:at(16,0),endT:at(16,0),driver:'Jared',client:'Fake Rider 3pm Ja',title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,canceled:false,block:false});
    jobs.push({uid:'BB3',evuid:'BB3',start:at(15,0),end:at(16,0),endT:at(16,0),driver:'BB',client:'Fake Rider 3pm BB',title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1,canceled:false,block:false});
    const any=document.getElementById('priany');
    if(any&&!any.checked){any.checked=true;if(typeof priSync==='function')priSync();any.dispatchEvent(new Event('change',{bubbles:true}))}
    npt.value='15:00';
    npt.dispatchEvent(new Event('change',{bubbles:true}));
    pdSync();
  });
  s=await waitRec();
  ok('does not recommend last-resort Kaci when only Kaci is free (Any)', s.recD!=='Kaci'&&!/Kaci/.test(s.ndrec)&&/no non-last-resort/.test(s.ndrec), s);
  ok('stale ★ / _recD cleared when no non-LR is free', !s.lab.length && s.recD==='', s);
  if(SH){await pg.evaluate(()=>{const el=document.getElementById('ndrec')||document.getElementById('lstrip');if(el)el.scrollIntoView({block:'center'})});await W(200);await pg.screenshot({path:SH+'/fix-4-no-non-lr-free.png'})}

  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('RECDRV60', JSON.stringify({last:s, errs:errs.slice(0,3)}).slice(0,1500));
  console.log(bad.length?'RECDRV60 FAIL\n'+bad.join('\n'):'RECDRV60 PASS');
  await b.close();clearTimeout(killer);process.exit(bad.length?1:0);
})().catch(e=>{console.log('RECDRV60 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
