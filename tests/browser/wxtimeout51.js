// node tests/browser/wxtimeout51.js   (U=.../index.html)
// v51: Upcoming tab, 390px Android, multi-leg jobs. The first weather fetch hangs past the
// 8s timeout (slow phone data). The card in view must not move (v.50 hid every placeholder at
// once and the view jumped ~1900px), and weather must come back by itself in well under 10 min.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('WXTIMEOUT51 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},170000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const FC=(()=>{const time=[],T=[],C=[],P=[],G=[],V=[];for(let i=0;i<24*17;i++){time.push(Math.round(+t0/1e3)-86400+i*3600);T.push(30+(i%25));C.push(i%11===0?71:i%7===0?95:i%5===0?61:2);P.push(i%5?10:70);G.push(i%9?10:45);V.push(i%13?20000:500)}return JSON.stringify({hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}})})();
async function run(b,where){
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);let nW=0;
  pg.on('request',async r=>{const u=r.url();
    if(/open-meteo/.test(u)){if(nW++==0){await W(9500);return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:FC}).catch(()=>{})}return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:FC})}
    if(/script\.google|photon|nominatim|openstreetmap/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof upWin=="function"',{timeout:15000});await W(400);
  await pg.evaluate(()=>{window.geo=async()=>[-81.9,40.8];try{MS.removeItem('wxc')}catch(e){}jobs.length=0;let n=0;const D=['Jeffrey','Jared','Kaci','BB'];
    for(let d=1;d<=7;d++)for(let h=6;h<=18;h+=3){n++;const s=new Date();s.setDate(s.getDate()+d);s.setHours(h,0,0,0);const id='W'+d+'_'+h,ml=n%3==0;
      jobs.push({uid:id,evuid:id,start:s,endT:new Date(+s+(ml?6:1)*36e5),driver:D[n%4],client:'Fake Rider '+id,title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
      if(ml)setSt(id,'legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'3 Grove Rd, Sampletown, OH',t:new Date(+s+3*36e5-s.getTimezoneOffset()*6e4).toISOString().slice(0,16),drv:D[n%4],done:0}])}
    drv.value='';EXP.clear();sessionStorage.exp='[]';sessionStorage.upspan='7';render();show('up')});
  await W(1500);
  const M=()=>pg.evaluate(()=>{const L=[...document.querySelectorAll('#driver .jc')].filter(x=>x.offsetParent&&!x.closest('#nxttop'));const a=window.__A||(window.__A=L.find(x=>{const r=x.getBoundingClientRect();return r.top>=0&&r.top<innerHeight-120}));
    return{tab:DTAB,sy:Math.round(scrollY),sh:document.documentElement.scrollHeight,top:a&&a.isConnected?+a.getBoundingClientRect().top.toFixed(1):null,wait:document.querySelectorAll('.wxwait').length,shown:[...document.querySelectorAll('.wxchip')].filter(c=>c.style.display!='none').length,filled:document.querySelectorAll('.wxchip .wxstrip').length}});
  await pg.evaluate(w=>{const m=document.documentElement.scrollHeight-innerHeight;scrollTo(0,w=='bottom'?m:Math.round(m/2))},where);await W(300);
  const A=await M();
  await W(9500);const B=await M(); // past the 8s timeout
  let C=B;for(let i=0;i<60&&!(C.wait===0&&C.filled>0);i++){await W(1000);C=await M()}
  await pg.close();
  return{where,A,B,C,errs};
}
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});_b=b;
  const R=await Promise.all([run(b,'bottom'),run(b,'middle')]);const bad=[];
  for(const r of R){console.log('WXTIMEOUT51',JSON.stringify(r));const{A,B,C}=r;
    if(A.tab!='up')bad.push(r.where+': not on Upcoming');
    if(!(A.wait>0))bad.push(r.where+': no weather placeholders before the timeout');
    if(A.top==null||B.top==null)bad.push(r.where+': anchor card lost');
    else if(Math.abs(B.top-A.top)>4)bad.push(r.where+': card in view moved '+(B.top-A.top).toFixed(0)+'px when the weather fetch timed out (sy '+A.sy+'→'+B.sy+', height '+A.sh+'→'+B.sh+')');
    if(Math.abs(B.sh-A.sh)>60)bad.push(r.where+': page height changed '+A.sh+'→'+B.sh+' on timeout');
    if(!(C.wait===0&&C.filled>0))bad.push(r.where+': weather did not come back within ~70s after the timeout');
    else if(C.top==null||Math.abs(C.top-A.top)>4)bad.push(r.where+': card in view moved '+(C.top==null?'?':(C.top-A.top).toFixed(0))+'px when the retry filled the weather');
    if(r.errs.length)bad.push(r.where+': page errors '+r.errs.slice(0,3).join(' | '))}
  console.log(bad.length?'WXTIMEOUT51 FAIL\n'+bad.join('\n'):'WXTIMEOUT51 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('WXTIMEOUT51 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
