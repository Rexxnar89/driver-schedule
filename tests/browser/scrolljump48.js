// node tests/browser/scrolljump48.js — unprompted scroll jumps, both directions, 390px.
// Weather, the 1s jobhold loop, and a mid-scroll list/livebar refresh stay active.
// Pass: an on-screen card's screen-top only moves by the amount we scrolled (residual <= 30px),
// and a mid-list card stays put when delayed weather arrives while we sit still.
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const WX_DELAY=Number(process.env.WX_DELAY||2500);
const STEP_MS=Number(process.env.STEP_MS||80);
const STEP_PX=50;
const LIMIT=30;
let _b;const killer=setTimeout(()=>{console.log('SCROLLJUMP48 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},180000);
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const FC=(()=>{const n=384,time=[],T=[],C=[],P=[],G=[],V=[];
  for(let i=0;i<n;i++){time.push(Math.round(+t0/1e3)+i*3600);T.push(50+(i%8));C.push(i%11===0?66:i%9===0?95:i%7===0?61:2);P.push(20);G.push(15);V.push(20000)}
  return{hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}}})();

async function boot(b, delay){
  const pg=await (await b.createBrowserContext()).newPage();
  pg.setDefaultTimeout(20000);
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
  await pg.setRequestInterception(true);
  pg.on('request',async r=>{
    const u=r.url();
    if(/api\.open-meteo\.com/.test(u)){
      if(delay)await W(delay);
      if(!r.isInterceptResolutionHandled())return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify(FC)});
      return;
    }
    if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();
    return r.respond({status:200,body:''});
  });
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render==="function"',{timeout:15000});
  await pg.evaluate(()=>{
    window.__sj={own:0,calls:[],into:[]};
    const rec=(kind,args)=>{if(window.__sj.own)return;const st=(new Error().stack||'').split('\n').slice(2,8).map(s=>s.trim());window.__sj.calls.push({kind,args:String(args).slice(0,140),sy:Math.round(scrollY),st})};
    const wST=window.scrollTo.bind(window),wSB=window.scrollBy.bind(window);
    window.scrollTo=function(){if(!window.__sj.own)rec('scrollTo',arguments[0]&&arguments[0].top!=null?arguments[0].top:arguments[1]);return wST.apply(this,arguments)};
    window.scrollBy=function(){if(!window.__sj.own)rec('scrollBy',arguments[0]&&arguments[0].y!=null?arguments[0].y:arguments[1]);return wSB.apply(this,arguments)};
    const siv=Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView=function(){rec('scrollIntoView',(this.id||this.className||this.tagName));window.__sj.into.push((this.id||'')+':'+(this.textContent||'').replace(/\s+/g,' ').slice(0,40));return siv.apply(this,arguments)};
    const foc=HTMLElement.prototype.focus;
    HTMLElement.prototype.focus=function(opts){rec('focus',(this.id||this.tagName)+' ps='+!!(opts&&opts.preventScroll));return foc.apply(this,arguments)};
    window.geo=async()=>[-81.9,40.8];
    const uo=c=>{const h=c&&c.querySelector('.jh');const m=h&&(h.getAttribute('onclick')||'').match(/tog\('([^']+)'\)/);return m&&m[1]};
    window.__cardAt=()=>{const v=[...document.querySelectorAll('#driver .jc')].find(x=>{if(!x.offsetParent||x.closest('#nxttop'))return 0;const r=x.getBoundingClientRect();return r.bottom>80&&r.top<innerHeight-40});if(!v)return null;const r=v.getBoundingClientRect();return{u:uo(v),top:r.top,h:r.height,sy:scrollY,wx:!!v.querySelector('.wxall'),docH:document.documentElement.scrollHeight,wait:!!v.querySelector('.wxwait')}};
    window.__posU=u=>{const c=[...document.querySelectorAll('#driver .jc')].find(c=>{const h=c.querySelector('.jh');return h&&(h.getAttribute('onclick')||'').includes("tog('"+u+"')")});if(!c)return null;const r=c.getBoundingClientRect();return{u,top:r.top,h:r.height,sy:scrollY,wx:!!c.querySelector('.wxall'),docH:document.documentElement.scrollHeight,connected:true}};
  });
  await pg.evaluate(()=>{
    jobs.length=0;
    const mk=(id,s,e,cl)=>({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:'BB',client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
    let n=0;
    for(let day=0;day<=5;day++){
      for(let h=6;h<=20;h+=2){
        n++;const id='J'+day+'_'+h,s=new Date();s.setDate(s.getDate()+day);s.setHours(h,0,0,0);
        const e=new Date(+s+((n%3===0)?7:1)*36e5);
        jobs.push(mk(id,+s,+e,'Rider '+id+(n%3===0?' Long':'')));
        if(n%3===0){const t2=new Date(+s+4*36e5);setSt(id,'legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:new Date(+t2-t2.getTimezoneOffset()*6e4).toISOString().slice(0,16),drv:'BB',done:0}])}
      }
    }
    try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
    drv.value='BB';render();
  });
  await W(200);
  return {pg,errs};
}

async function scrollPhase(pg, dir, steps, label, midFn){
  const jumps=[];
  let last=await pg.evaluate(()=>window.__cardAt());
  for(let i=0;i<steps;i++){
    if(midFn&&i===Math.floor(steps/3))await midFn(pg,i);
    const before=last&&last.u?await pg.evaluate(u=>window.__posU(u),last.u):await pg.evaluate(()=>window.__cardAt());
    await pg.evaluate(px=>{
      window.__sj.own=1;
      const max=Math.max(0,document.documentElement.scrollHeight-innerHeight);
      window.scrollTo(0,Math.max(0,Math.min(max,scrollY+px)));
      window.__sj.own=0;
    }, dir*STEP_PX);
    await W(STEP_MS);
    const after=before&&before.u?await pg.evaluate(u=>({tracked:window.__posU(u),vis:window.__cardAt()}),before.u):{tracked:null,vis:await pg.evaluate(()=>window.__cardAt())};
    if(after.tracked&&before){
      const dTop=after.tracked.top-before.top,dSy=after.tracked.sy-before.sy,residual=dTop+dSy,dH=after.tracked.docH-before.docH;
      const atEnd=(dir>0&&before.sy>=Math.max(0,before.docH-844)-2)||(dir<0&&before.sy<=2);
      const rec={i,label,u:after.tracked.u,dTop:Math.round(dTop),dSy:Math.round(dSy),residual:Math.round(residual),dH:Math.round(dH),sy:after.tracked.sy,docH:after.tracked.docH,wx:after.tracked.wx};
      if(Math.abs(residual)>LIMIT)jumps.push({...rec,why:'visual'});
      else if(!atEnd&&Math.abs(dH)<20&&Math.abs(dSy)<STEP_PX*0.4)jumps.push({...rec,why:'undone-scroll'});
    }
    last=after.vis||after.tracked||last;
  }
  return {label,jumps,end:await pg.evaluate(()=>({sy:scrollY,docH:document.documentElement.scrollHeight,wx:document.querySelectorAll('.wxall').length,cards:document.querySelectorAll('#driver .jc').length}))};
}

(async()=>{
  const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
  _b=b;
  const hold=await boot(b, WX_DELAY);
  await hold.pg.evaluate(()=>{window.__sj.own=1;scrollTo(0,1800);window.__sj.own=0});
  await W(80);
  await hold.pg.evaluate(()=>{window.__sj.own=1;scrollTo(0,scrollY+1);scrollTo(0,scrollY-1);window.__sj.own=0});
  await W(80);
  const h0=await hold.pg.evaluate(()=>window.__cardAt());
  let h1=h0,hWait=0;
  const hT0=Date.now();
  for(let i=0;i<40;i++){
    await W(150);
    h1=await hold.pg.evaluate(u=>window.__posU(u),h0.u);
    hWait=Date.now()-hT0;
    if(h1&&h1.wx&&h1.docH!==h0.docH)break;
  }
  const holdJump=h1?Math.round(h1.top-h0.top):999;
  const holdInfo={h0,h1,dTop:holdJump,dSy:h1?Math.round(h1.sy-h0.sy):null,dH:h1?h1.docH-h0.docH:null,ms:hWait};
  console.log('HOLD',JSON.stringify(holdInfo));
  await hold.pg.browserContext().close();

  const sc=await boot(b, WX_DELAY);
  const tScroll=Date.now();
  const STEPS=Math.max(20, Math.round(10000/STEP_MS));
  const down=await scrollPhase(sc.pg, +1, STEPS, 'down-with-weather');
  const up=await scrollPhase(sc.pg, -1, STEPS, 'up-with-loop', async pg=>{
    await pg.evaluate(()=>{
      const lb=document.getElementById('livebar');
      if(lb){lb.innerHTML='✔ LIVE from Proton · '+jobs.length+' jobs · Last updated '+new Date().toLocaleTimeString();lb.style.background='#c8e6c9'}
      try{nxtTop()}catch(e){}
      try{renderQuiet()}catch(e){try{renderDriver()}catch(x){}}
    });
  });
  const elapsed=Date.now()-tScroll;
  const extra=await sc.pg.evaluate(()=>({into:window.__sj.into,calls:window.__sj.calls.filter(c=>c.kind==='scrollIntoView'||c.kind==='scrollTo'||(c.kind==='focus'&&!/ps=true/.test(c.args)))}));
  console.log('DOWN',down.end,'jumps',down.jumps.length, JSON.stringify(down.jumps.slice(0,8)));
  console.log('UP',up.end,'jumps',up.jumps.length, JSON.stringify(up.jumps.slice(0,8)));
  console.log('ELAPSED_MS',elapsed,'INTO',extra.into,'ERRS',sc.errs);

  const bad=[];
  if(!h0||!h1)bad.push('hold: could not track a mid-list card');
  if(Math.abs(holdJump)>LIMIT)bad.push('hold: card jumped '+holdJump+'px when weather arrived (scrollY delta '+holdInfo.dSy+')');
  if(down.end.wx<10)bad.push('down: weather did not render on cards');
  if(down.jumps.length)bad.push('down: '+down.jumps.length+' unprompted visual jumps '+JSON.stringify(down.jumps.slice(0,5)));
  if(up.jumps.length)bad.push('up: '+up.jumps.length+' unprompted visual jumps '+JSON.stringify(up.jumps.slice(0,5)));
  if(extra.into.length)bad.push('unprompted scrollIntoView '+JSON.stringify(extra.into));
  if(sc.errs.length)bad.push('page errors '+sc.errs.slice(0,3).join(' | '));
  if(elapsed<15000)bad.push('scroll phase too short '+elapsed+'ms');

  console.log(bad.length?'SCROLLJUMP48 FAIL\n'+bad.join('\n'):'SCROLLJUMP48 PASS');
  await b.close();clearTimeout(killer);
  process.exit(bad.length?1:0);
})().catch(e=>{console.log('SCROLLJUMP48 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
