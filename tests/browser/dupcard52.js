// node tests/browser/dupcard52.js   (U=.../index.html)
// v52: a multi-day "available" event shows a card on every day it covers, all with the same uid.
// Its cards carry no tog() uid. When that card's later copy (e.g. Thursday) is the card in view, any repaint must not jump the
// page back to its first copy near the top (v.51 tapAnchor looked cards up by uid only).
// Upcoming tab, 7 days, 390px Android, multi-leg jobs, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('DUPCARD52 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},120000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const FC=(()=>{const time=[],T=[],C=[],P=[],G=[],V=[];for(let i=0;i<24*17;i++){time.push(Math.round(+t0/1e3)-86400+i*3600);T.push(30+(i%25));C.push(i%7===0?61:2);P.push(10);G.push(10);V.push(20000)}return JSON.stringify({hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}})})();
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();
    if(/open-meteo/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:FC});
    if(/script\.google|photon|nominatim|openstreetmap/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof upWin=="function"',{timeout:15000});await W(400);
  await pg.evaluate(()=>{window.geo=async()=>[-81.9,40.8];try{MS.removeItem('wxc')}catch(e){}jobs.length=0;let n=0;const D=['Jeffrey','Jared','Kaci','BB'];
    const a0=new Date();a0.setHours(6,30,0,0);const a1=new Date(+a0);a1.setDate(a1.getDate()+3);a1.setHours(17,0,0,0);
    jobs.push({uid:'AV1',evuid:'AV1',start:a0,endT:a1,driver:'Jeffrey',client:'',title:'Fake Driver available',raw:'Fake Driver available',cal:'Fake'});
    for(let d=1;d<=7;d++)for(let h=7;h<=19;h+=4){n++;const s=new Date();s.setDate(s.getDate()+d);s.setHours(h,0,0,0);const id='D'+d+'_'+h,ml=n%3==0;
      jobs.push({uid:id,evuid:id,start:s,endT:new Date(+s+(ml?5:1)*36e5),driver:D[n%4],client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
      if(ml)setSt(id,'legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'3 Grove Rd, Sampletown, OH',t:new Date(+s+2*36e5-s.getTimezoneOffset()*6e4).toISOString().slice(0,16),drv:D[n%4],done:0}])}
    drv.value='';EXP.clear();sessionStorage.exp='[]';sessionStorage.upspan='7';render();show('up')});
  await W(2500);
  const r=await pg.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));
    const C=[...document.querySelectorAll('#driver .jc.availc')].filter(c=>c.offsetParent);if(C.length<2)return{why:'availability card shows '+C.length+' time(s), need 2+'};
    const c=C[C.length-1],want=Math.round(scrollY+c.getBoundingClientRect().top-120);scrollTo(0,want);const S0=Math.round(scrollY);await w(400);
    const A={sy:Math.round(scrollY),top:+c.getBoundingClientRect().top.toFixed(1)};
    const h=document.querySelector('#driver .jc .jh');h.classList.add('dup52');await w(150);h.classList.remove('dup52');await w(400);
    const B={sy:Math.round(scrollY),top:+c.getBoundingClientRect().top.toFixed(1)};
    return{copies:C.length,tab:DTAB,want,S0,A,B}});
  const bad=[];console.log('DUPCARD52',JSON.stringify(r));
  if(r.why)bad.push(r.why);else{if(r.tab!='up')bad.push('not on Upcoming');if(Math.abs(r.S0-r.want)>4)bad.push('could not scroll to the later copy ('+r.S0+' vs '+r.want+')');if(Math.abs(r.A.sy-r.S0)>4)bad.push('page jumped '+(r.A.sy-r.S0)+'px right after scrolling to the later copy');if(Math.abs(r.B.sy-r.A.sy)>4||Math.abs(r.B.top-r.A.top)>4)bad.push('page jumped '+(r.B.sy-r.A.sy)+'px (sy '+r.A.sy+'→'+r.B.sy+') on a repaint while a later copy of a multi-day card was in view')}
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log(bad.length?'DUPCARD52 FAIL\n'+bad.join('\n'):'DUPCARD52 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('DUPCARD52 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
