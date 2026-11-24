// node tests/browser/bounce50.js
// At the upcoming-jobs boundary, when weather fills (placeholders too short),
// the next job card and "Next job after tomorrow" pointer must stay put.
// Fails on v.49 (dsKeepView anchors a mostly off-screen card). 390px, multi-leg.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('BOUNCE50 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},180000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const at=(day,h)=>{const d=new Date(t0);d.setDate(d.getDate()+day);d.setHours(h,0,0,0);return d};
const iso=d=>new Date(+d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16);
function meteoBody(){
  const times=[],T=[],C=[],P=[],G=[],V=[];
  const start=Math.floor(t0.getTime()/1000)-86400;
  for(let i=0;i<16*24;i++){
    times.push(start+i*3600);
    T.push(22+Math.round(8*Math.sin(i/6)));
    C.push(i%11===0?65:i%9===0?71:2);
    P.push(i%9===0?80:10);G.push(i%11===0?40:12);V.push(10000);
  }
  return JSON.stringify({hourly:{time:times,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}});
}
(async()=>{
  const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
  _b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  const meteo=meteoBody();
  pg.on('request',r=>{
    const u=r.url();
    if(/api\.open-meteo/.test(u))return setTimeout(()=>r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:meteo}),2500);
    if(/script\.google|photon|nominatim|openstreetmap/.test(u))
      return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:u.includes('photon')||u.includes('nominatim')?'{"features":[{"geometry":{"coordinates":[-81.9,40.8]}}]}':'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();
    return r.respond({status:200,body:''});
  });
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render==="function"',{timeout:15000});
  await pg.evaluate((A)=>{
    window.geo=async()=>[-81.9,40.8];
    try{MS&&MS.removeItem&&MS.removeItem('wxc')}catch(e){}
    jobs.length=0;
    const mk=(id,s,e,cl)=>({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:'BB',client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
    jobs.push(mk('T1',A.t8,A.t10,'Today Alpha'));
    jobs.push(mk('T2',A.t11,A.t13,'Today Bravo Multi'));
    setSt('T2','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'3 Grove Rd, Sampletown, OH',t:A.t12iso,drv:'BB',done:0}]);
    jobs.push(mk('T3',A.t15,A.t17,'Today Charlie'));
    jobs.push(mk('TM1',A.tm8,A.tm10,'Tomorrow Rider'));
    jobs.push(mk('TM2',A.tm13,A.tm16,'Tomorrow Multi'));
    setSt('TM2','legs',[{pk:'4 Lake St, Sampletown, OH',dz:'5 Hill Ave, Sampletown, OH',t:A.tm14iso,drv:'BB',done:0}]);
    jobs.push(mk('UP1',A.u8,A.u15,'Upcoming Multi'));
    setSt('UP1','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:A.u12iso,drv:'BB',done:0}]);
    jobs.push(mk('UP2',A.u16,A.u18,'Upcoming Later'));
    jobs.push(mk('UP3',A.v9,A.v11,'Day4 Job'));
    jobs.push(mk('UP4',A.w9,A.w12,'Day5 Job Multi'));
    setSt('UP4','legs',[{pk:'8 Oak St, Sampletown, OH',dz:'9 Pine Rd, Sampletown, OH',t:A.w10iso,drv:'BB',done:0}]);
    try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
    drv.value='BB';
    try{if(typeof EXPALL!='undefined'){EXPALL=false;sessionStorage.expall=''}EXP.clear();sessionStorage.exp='[]'}catch(e){}
    render();
  },{
    t8:+at(0,8),t10:+at(0,10),t11:+at(0,11),t13:+at(0,13),t15:+at(0,15),t17:+at(0,17),t12iso:iso(at(0,12)),
    tm8:+at(1,8),tm10:+at(1,10),tm13:+at(1,13),tm16:+at(1,16),tm14iso:iso(at(1,14)),
    u8:+at(2,8),u15:+at(2,15),u16:+at(2,16),u18:+at(2,18),u12iso:iso(at(2,12)),
    v9:+at(3,9),v11:+at(3,11),w9:+at(4,9),w12:+at(4,12),w10iso:iso(at(4,10))
  });
  await W(200);
  const r=await pg.evaluate(async ()=>{
    const findUp=()=>[...document.querySelectorAll('#driver .jc')].find(c=>/Upcoming Multi/.test(c.innerText||''));
    const findNxt=()=>[...document.querySelectorAll('#cafind .nxtjob, #driver .nxtjob')].find(n=>/after tomorrow/i.test(n.innerText||''));
    const vis=()=>{
      const all=[...document.querySelectorAll('#driver .jc')].filter(x=>x.offsetParent&&!x.closest('#nxttop'));
      const sliver=all.find(x=>{const r=x.getBoundingClientRect();return r.bottom>60&&r.top<innerHeight});
      const inView=all.find(x=>{const r=x.getBoundingClientRect();return r.top>=0&&r.bottom>60&&r.top<innerHeight});
      const txt=el=>el&&(el.innerText||'').replace(/\s+/g,' ').slice(0,40);
      return {
        sy:scrollY, sh:document.documentElement.scrollHeight,
        upTop:findUp()?+findUp().getBoundingClientRect().top.toFixed(1):null,
        nxtTop:findNxt()?+findNxt().getBoundingClientRect().top.toFixed(1):null,
        upH:findUp()?Math.round(findUp().getBoundingClientRect().height):null,
        sliver:txt(sliver), sliverTop:sliver?+sliver.getBoundingClientRect().top.toFixed(1):null,
        inView:txt(inView), inViewTop:inView?+inView.getBoundingClientRect().top.toFixed(1):null,
        wxwait:document.querySelectorAll('.wxwait').length
      };
    };
    const up=findUp();
    if(!up)return {ok:false,why:'no upcoming card'};
    scrollTo(0, Math.max(0, scrollY+up.getBoundingClientRect().top-400));
    await new Promise(r=>setTimeout(r,50));
    const before=vis();
    const t0=performance.now();
    let after=before;
    while(performance.now()-t0<6000){
      await new Promise(r=>setTimeout(r,50));
      after=vis();
      if(before.wxwait>0 && after.wxwait===0) break;
    }
    const screenUp=after.upTop-before.upTop;
    const screenNxt=after.nxtTop-before.nxtTop;
    return {ok:true,before,after,screenUp:+screenUp.toFixed(1),screenNxt:+screenNxt.toFixed(1),waited:Math.round(performance.now()-t0)};
  });
  const bad=[];
  if(!r.ok) bad.push(r.why||'setup failed');
  else{
    console.log('BOUNCE50', JSON.stringify({screenUp:r.screenUp,screenNxt:r.screenNxt,before:r.before,after:r.after,waited:r.waited}));
    if(!(r.before.wxwait>0)) bad.push('weather already filled before reaching the upcoming boundary (placeholders not visible)');
    if(!(r.after.wxwait===0)) bad.push('weather never filled');
    if(r.before.upTop==null||r.before.nxtTop==null) bad.push('upcoming card or Next-job pointer missing at boundary');
    // On-screen snap: the card/pointer must not be pushed down more than a sliver
    if(r.screenUp>20) bad.push('upcoming job card snapped down/back by '+r.screenUp+'px when weather filled (sy '+r.before.sy+'→'+r.after.sy+', upTop '+r.before.upTop+'→'+r.after.upTop+')');
    if(r.screenNxt>20) bad.push('Next-job pointer snapped down/back by '+r.screenNxt+'px when weather filled');
  }
  if(errs.length) bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log(bad.length?'BOUNCE50 FAIL\n'+bad.join('\n'):'BOUNCE50 PASS');
  await b.close();clearTimeout(killer);
  process.exit(bad.length?1:0);
})().catch(e=>{console.log('BOUNCE50 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
