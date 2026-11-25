// node tests/browser/drafts581.js   (U=.../index.html)
// v58.1: opening a shared Drafts item (LS/IDB 'drafts' -> Open -> Create job form) must
// return and fill the form. v.58 hung forever because the draftLoad wrap looped
// `for (n=3; n<=MAXN; n++)` after MAXN became Infinity (no leg cap). Also checks the
// Create job headings: "Priority driver (optional, preferred if free)" and
// "Assign driver, best fit first". 390px Android, made-up data.
const p=require('puppeteer-core');
const fs=require('fs');
const U=process.env.U||'http://127.0.0.1:8812/index.html',SH=process.env.SHOTS||'';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('DRAFTS581 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},120000);
(async()=>{
  const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
  _b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();
    if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/api\.open-meteo|nominatim|photon|openstreetmap|maps\.google|googleapis/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u)||/^blob:/.test(u))return r.continue();
    return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(String(e.message||e)));
  pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof kvDrOpen=="function" && typeof draftLoad=="function" && typeof show=="function"',{timeout:20000});
  await W(400);
  const bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+(d===undefined?'':' '+JSON.stringify(d)))};

  // Source must not loop to Infinity when restoring a draft
  const src=await pg.evaluate(()=>{
    const s=[...document.querySelectorAll('script')].map(x=>x.textContent).join('\n');
    return {
      ver: (document.querySelector('meta[name=ds-ver]')||{}).content||'',
      infLoop: /for\s*\(\s*let n=3\s*;\s*n<=MAXN/.test(s),
      keyLoop: /for\s*\(\s*let n=3\s*;\s*\('nl'\+n\+'pk'\) in v/.test(s),
      pri: /Priority driver \(optional, preferred if free\)/.test(s),
      asn: /Assign driver, best fit first/.test(s)
    };
  });
  ok('version is 2026-11-25.63', src.ver==='2026-11-25.63', src.ver);
  ok('draftLoad wrap does not loop n<=MAXN', !src.infLoop, src);
  ok('draftLoad wrap walks existing nlNpk keys', src.keyLoop, src);
  ok('priority heading text in source', src.pri);
  ok('assign-driver heading text in source', src.asn);

  const seed=await pg.evaluate(()=>{
    const D={
      v:{nc:'Fake Rider Draft',npd:'2026-11-28',npt:'09:00',ndt:'2026-11-28T09:00',np:'2',nd:'Jeffrey',nv:'Ford Van',njnotes:'Made-up drafts581 job',nsplit:true,
        nl2pk:'30 Fake Rd, Sampletown, OH',nl2dz:'40 Demo Blvd, Sampletown, OH',nl2t:'',nl2d:'Jeffrey',
        nl3pk:'60 Third St, Sampletown, OH',nl3dz:'70 Fourth Ave, Sampletown, OH',nl3t:'',nl3d:'Jeffrey'},
      tt:'split',pks:['10 Test St, Sampletown, OH','20 Demo Ave, Sampletown, OH'],dos:['50 Finish Ln, Sampletown, OH'],
      FW:[],RET_ED:0,RF:{},nrpt:'',t:Date.now()-3600e3,XD:{},LV:{},DV:{}
    };
    const id='dTEST581';
    MS.setItem('drafts',JSON.stringify({[id]:{id,D,cr:'Jeffrey',by:'Jeffrey',dev:'Android probe',at:Date.now()-600e3,title:'Fake Rider Draft · 10 Test St, Sampletown, OH',when:'2026-11-28T09:00'}}));
    return id;
  });

  // Open the drafts list, then Open — must return (v.58 hung here)
  const opened=await pg.evaluate(async id=>{
    const t0=Date.now();
    kvDrafts();
    const m=document.getElementById('kvmod');
    const b=m&&[...m.querySelectorAll('button')].find(x=>/^open$/i.test(x.textContent.trim()));
    if(!b)return {ok:false,reason:'no Open button',ms:Date.now()-t0};
    b.click();
    return {ok:true,ms:Date.now()-t0, clickReached:true};
  },seed);
  ok('Open handler returned (did not hang)', !!(opened&&opened.ok), opened);
  ok('Open returned in under 3s', !!(opened&&opened.ms<3000), opened&&opened.ms);

  const form=await pg.evaluate(()=>{
    const f=id=>{const e=document.getElementById(id);if(!e)return 'MISSING';return e.type==='checkbox'?e.checked:e.value};
    const nj=document.getElementById('newjob');
    const pri=document.querySelector('#pribox .prilbl');
    const asn=document.getElementById('asnlbl');
    const pb=document.getElementById('pribox'), st=document.getElementById('lstrip');
    let between=null;
    if(pb&&st){
      const css=getComputedStyle(pb);
      between={mb:parseFloat(css.marginBottom)||0, pb:parseFloat(css.paddingBottom)||0, border:css.borderBottomWidth+' '+css.borderBottomStyle};
    }
    return {
      hide:nj.classList.contains('hide'), vis:!!nj.offsetParent,
      nc:f('nc'),npd:f('npd'),npt:f('npt'),nd:f('nd'),njnotes:f('njnotes'),
      nsplit:f('nsplit'),nl2pk:f('nl2pk'),nl3pk:f('nl3pk'),
      pks:typeof stops==='function'?stops('pks'):null,
      dos:typeof stops==='function'?stops('dos'):null,
      draftmsg:(document.getElementById('draftmsg')||{}).textContent||(document.getElementById('draftmsg')||{}).innerHTML||'',
      pri:pri?pri.textContent.trim():'',
      asn:asn?asn.textContent.trim():'',
      asnBetween:!!(pb&&asn&&st&&pb.nextElementSibling===asn&&asn.nextElementSibling===st),
      between,
      modal:!!document.getElementById('kvmod')
    };
  });
  ok('Create job screen is visible', form.vis && !form.hide, form);
  ok('client filled from draft', form.nc==='Fake Rider Draft', form.nc);
  ok('pickup date/time filled', form.npd==='2026-11-28' && form.npt==='09:00', {npd:form.npd,npt:form.npt});
  ok('pickup stops restored', Array.isArray(form.pks)&&form.pks[0]&&/10 Test St/.test(form.pks[0])&&form.pks.length>=2, form.pks);
  ok('drop-off restored', Array.isArray(form.dos)&&form.dos[0]&&/50 Finish Ln/.test(form.dos[0]), form.dos);
  ok('split + extra legs restored', form.nsplit===true && /30 Fake Rd/.test(form.nl2pk||'') && /60 Third St/.test(form.nl3pk||''), {nsplit:form.nsplit,nl2pk:form.nl2pk,nl3pk:form.nl3pk});
  ok('draft restored message shown', /draft restored/i.test(form.draftmsg||''), form.draftmsg);
  ok('priority heading visible text', form.pri==='Priority driver (optional, preferred if free)', form.pri);
  ok('assign-driver heading visible text', form.asn==='Assign driver, best fit first', form.asn);
  ok('assign heading sits between priority box and lstrip', form.asnBetween, form);
  ok('space and divider between the two controls', form.between && form.between.mb>=10 && form.between.pb>=8, form.between);
  ok('no page errors', errs.length===0, errs);

  if(SH){
    fs.mkdirSync(SH,{recursive:true});
    await pg.screenshot({path:SH+'/5-form-after-open.png',fullPage:false});
    await pg.evaluate(()=>{const el=document.getElementById('drvsec')||document.getElementById('pribox');if(el)el.scrollIntoView({block:'center'})});
    await W(200);
    await pg.screenshot({path:SH+'/6-priority-assign-headings.png',fullPage:false});
  }

  await b.close();clearTimeout(killer);
  if(bad.length){console.log('DRAFTS581 FAIL');bad.forEach(x=>console.log(' - '+x));process.exit(1)}
  console.log('DRAFTS581 PASS');
  process.exit(0);
})().catch(e=>{console.error('DRAFTS581 ERR',e);process.exit(1)});
