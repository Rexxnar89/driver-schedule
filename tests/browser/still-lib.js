// Reusable "screen stays still" harness (v62+). 390px Android-like Chrome, made-up data only.
// open(U) loads the app with made-up jobs (incl. a multi-leg job) and returns helpers. watch/stop sample right AFTER each
// painted frame (rAF, then a task), i.e. what was really on screen:
//   moved  = biggest on-screen move of the element you touched (it must stay under your finger)
//   above  = info: how far content visible above it moved (only when the app inserted something between them)
//   idle   = biggest move of ANY element that was visible at the start (idle checks: must be 0)
//   rebuilt= visible elements removed and replaced while you looked (flicker)
//   sc     = scroll calls the app made (scrollTo/scrollBy/scrollIntoView/scrollTop=) with a short stack, to find causes.
const p=require('puppeteer-core');
const W=ms=>new Promise(r=>setTimeout(r,ms));
const t0=(()=>{const d=new Date();d.setHours(0,0,0,0);return d})();
const at=(day,h,m)=>{const d=new Date(t0);d.setDate(d.getDate()+day);d.setHours(h,m||0,0,0);return+d};
const iso=ms=>new Date(ms-new Date(ms).getTimezoneOffset()*6e4).toISOString().slice(0,16);
const FC=(()=>{const n=384,time=[],T=[],C=[],P=[],G=[],V=[];for(let i=0;i<n;i++){time.push(Math.round(+t0/1e3)+i*3600);T.push(48+(i%9));C.push(i%11===0?61:1);P.push(10);G.push(12);V.push(20000)}return{hourly:{time,temperature_2m:T,weather_code:C,precipitation_probability:P,wind_gusts_10m:G,visibility:V}}})();
const JOBS=[['T1',0,7,8,'Jeffrey','Sample Rider A'],['T2',0,9,10.5,'Jared','Sample Rider B'],['T3',0,11,12,'Kaci','Sample Rider C'],['T4',0,13,14,'BB','Sample Rider D'],['T5',0,15,16.5,'Jeffrey','Sample Rider E'],['T6',0,17,18,'Jared','Sample Rider F'],['T7',0,19,20,'Kaci','Sample Rider G'],['U1',1,8,15,'Jeffrey','Demo Multi-Leg J'],['U2',1,16,17,'Jared','Demo Client K'],['U3',2,9,10,'Kaci','Demo Client L'],['U4',3,7,9,'BB','Demo Client M']];
async function open(U){const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:120000});
  const pg=await (await b.createBrowserContext()).newPage();pg.setDefaultTimeout(30000);
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});if(/open-meteo/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:JSON.stringify(FC)});if(/^https?:\/\/(localhost|127\.0\.0\.1|rexxnar89\.github\.io)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
  await pg.evaluateOnNewDocument(()=>{window._scl=[];const rec=k=>{try{_scl.push({k,t:Math.round(performance.now()),y:Math.round(scrollY),s:(new Error().stack||'').split('\n').slice(2,6).map(x=>x.trim().slice(0,140)).join(' < ')});if(_scl.length>400)_scl.shift()}catch(e){}};
    for(const [o,n] of [[window,'scrollTo'],[window,'scrollBy'],[window,'scroll'],[Element.prototype,'scrollIntoView']]){const f=o[n];if(!f)continue;o[n]=function(){rec(n+(this&&this.id?'#'+this.id:''));return f.apply(this,arguments)}}
    const d=Object.getOwnPropertyDescriptor(Element.prototype,'scrollTop');Object.defineProperty(Element.prototype,'scrollTop',{get(){return d.get.call(this)},set(v){if(this===document.documentElement||this===document.body)rec('scrollTop='+v);return d.set.call(this,v)},configurable:true});
    window._watch=sel=>{let el=sel?(typeof sel=='string'?document.querySelector(sel):sel):null;const rq=el&&el.dataset&&el.dataset.d?{c:el.className,d:el.dataset.d}:null;const re=()=>{if(el&&!el.isConnected&&typeof sel=='string'){const n=document.querySelector(sel);if(n){el=n;return}}if(el&&!el.isConnected&&rq){const n=[...document.getElementsByClassName(rq.c)].find(x=>x.dataset.d==rq.d);if(n)el=n}};const top0=el?el.getBoundingClientRect().top:Infinity;_scl.length=0;
      const V=[...document.querySelectorAll('body *')].filter(e=>{if(/^(SCRIPT|STYLE|OPTION|BR)$/.test(e.tagName))return false;const r=e.getBoundingClientRect();return r.height>0&&r.width>0&&r.top>=0&&r.top<innerHeight&&getComputedStyle(e).position!='fixed'&&!e.closest('#sugg,#fsPill,.sug,[style*="position:fixed"]')}).slice(0,1500).map(e=>({e,t:e.getBoundingClientRect().top,ab:e.getBoundingClientRect().top<=top0+1&&!(el&&el.contains(e)),c:e.closest('[id]')}));
      window._st={on:1,el,top0,V,moved:0,idle:0,rb:new Set(),who:''};const f=()=>{if(!_st.on)return;re();if(el){const d=el.isConnected?Math.abs(el.getBoundingClientRect().top-top0):999;if(d>_st.moved){_st.moved=d;_st.who='anchor'}}
        for(const v of V){if(!v.e.isConnected){_st.rb.add(v.c?v.c.id:'?');continue}const d=Math.abs(v.e.getBoundingClientRect().top-v.t);if(d>_st.idle){_st.idle=d;_st.iw=(v.e.id||v.e.className||v.e.tagName)+'@'+(v.c&&v.c.id)}if(v.ab&&d>(_st.ab||0)){_st.ab=d;_st.abw=(v.e.id||String(v.e.className).slice(0,30)||v.e.tagName)+'@'+(v.c&&v.c.id)}}nx()};
      const nx=()=>requestAnimationFrame(()=>setTimeout(f,0));nx()};
    window._stop=()=>{_st.on=0;return{moved:Math.round(_st.moved),above:Math.round(_st.ab||0),aw:_st.abw,idle:Math.round(_st.idle),iw:_st.iw,rebuilt:[..._st.rb].slice(0,10),sc:_scl.slice(0,4).map(x=>x.k+'@'+x.t+' '+x.s.slice(0,240))}}});
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof jobs!=="undefined"&&typeof render==="function"',{timeout:20000});await W(800);
  await pg.evaluate((J,leg)=>{window.geo=async()=>[-81.9,40.8];jobs.length=0;J.forEach(([id,s,e,dr,cl])=>jobs.push({uid:id,evuid:id,start:new Date(s),endT:new Date(e),driver:dr,client:cl,title:cl,raw:cl,from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1}));
    setSt('U1','legs',[{pk:'2 Demo Ave, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:leg,drv:'Jeffrey',done:0}]);drv.value='';try{EXP.clear()}catch(e){}render()},JOBS.map(x=>[x[0],at(x[1],Math.floor(x[2]),(x[2]%1)*60),at(x[1],Math.floor(x[3]),(x[3]%1)*60),x[4],x[5]]),iso(at(1,12)));
  await W(1500);
  const bad=[],R=[],VB=process.env.VERBOSE;
  const place=async(sel,frac)=>pg.evaluate((s,f)=>{const e=document.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();scrollTo(0,scrollY+r.top-innerHeight*(f??0.45));return true},sel,frac);
  const tapSel=async s=>{const h=await pg.$(s);if(!h)throw new Error('no '+s);const bb=await h.boundingBox();await pg.touchscreen.tap(bb.x+Math.min(bb.width/2,30),bb.y+Math.min(bb.height/2,20))};
  // step(name, selector, action, {idle, wait, anchor, frac, lim, okRebuild}): put the selector at 45% of the screen and watch it
  const step=async(name,sel,act,o2={})=>{if(sel&&!o2.noPlace&&!(await place(sel,o2.frac))){bad.push(name+': missing '+sel);return}await W(o2.pre||500);
    await pg.evaluate(a=>_watch(a),o2.idle?null:(o2.anchor||sel));if(act)await act();await W(o2.wait||1500);const r=await pg.evaluate(()=>_stop());R.push([name,r]);if(VB)console.log(name,JSON.stringify(r));
    const lim=o2.lim??2;if(o2.idle){if(r.idle>lim||(!o2.okRebuild&&r.rebuilt.length))bad.push(name+' (idle) moved/rebuilt: '+JSON.stringify(r))}else if(r.moved>lim)bad.push(name+' moved: '+JSON.stringify(r))};
  return{b,pg,bad,R,errs,place,tapSel,step,W,at,iso}}
module.exports={open,W,at,iso};
