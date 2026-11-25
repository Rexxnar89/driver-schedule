// node tests/browser/legmiles53.js   (U=.../index.html)
// v53 per-leg miles + odometer: each leg counts only its own miles, the trip total is the sum
// (decimals), Miles and Odometer legs mix in one trip, the next odometer leg starts at the previous
// end (editable), end<start is flagged and not counted, >300 mi asks first, switching back keeps the
// value, old jobs and the charge stay the same. 390px Android, made-up data.
const p=require('puppeteer-core');
const U=process.env.U||'http://127.0.0.1:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
let _b;const killer=setTimeout(()=>{console.log('LEGMILES53 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},120000);
(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});_b=b;
  const pg=await (await b.createBrowserContext()).newPage();
  await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36'});
  await pg.setRequestInterception(true);
  pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});
    if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
  const errs=[],dl=[];let accept=false;pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>{dl.push(d.message());(accept?d.accept():d.dismiss()).catch(()=>{})});
  await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
  await pg.waitForFunction('typeof render=="function"&&typeof legMiOf=="function"',{timeout:15000});await W(400);
  await pg.evaluate(()=>{jobs.length=0;const s=new Date();s.setHours(23,0,0,0);const iso=d=>new Date(+d-d.getTimezoneOffset()*6e4).toISOString().slice(0,16);
    const mk=(id,c)=>({uid:id,evuid:id,start:new Date(s),endT:new Date(+s+30*6e4),driver:'Jeffrey',client:c,title:'Fake',raw:'Fake',from:'1 Test St, Sampletown, OH',to:'2 Demo Ave, Sampletown, OH',pax:1});
    jobs.push(mk('LM1','Fake Rider'),mk('OLD1','Fake Old Split'),mk('ONE1','Fake Single'));
    const L=()=>[{pk:'2 Demo Ave, Sampletown, OH',dz:'3 Grove Rd, Sampletown, OH',t:iso(new Date(+s+40*6e4)),drv:'Jeffrey',done:0},{pk:'3 Grove Rd, Sampletown, OH',dz:'1 Test St, Sampletown, OH',t:iso(new Date(+s+50*6e4)),drv:'Jeffrey',done:0}];
    setSt('LM1','legs',L());
    /* old (v.46-v.52) saved split job: Leg 1 typed, Leg 2 auto copy, Leg 3 typed */
    const S=ST();S.OLD1={l1mi:'12',l1miEd:1,legs:L().map((l,i)=>i?{...l,mi:'7.25',miEd:1}:{...l,mi:'12',miAuto:1})};S.ONE1={emi:'30',pkm:'4'};LS.st=JSON.stringify(S);
    drv.value='';EXP.clear();EXP.add('LM1');render();show('driver')});
  const G=()=>pg.evaluate(()=>{const s=ST().LM1||{},t=trip(s,jobs[0].start,'LM1'),tot=document.querySelector('.legmitot');return{L:legMiList(s),mi:t.proj,exp:R2(t.exp),want:R2(calc(t.proj,jobs[0].start,s.wh).total),tot:tot?tot.textContent.replace(/\s+/g,' ').trim():'',msg:[...document.querySelectorAll('.legmi .odomsg')].map(x=>x.textContent),odo:[...document.querySelectorAll('.legmi')].map(x=>[x.dataset.leg,[...x.querySelectorAll('input')].map(i=>i.value).join('|')])}});
  const E=async(f,...a)=>{await pg.evaluate((f,a)=>window[f](...a),f,a);await W(120);return G()};
  const R={},bad=[],ok=(n,c,d)=>{if(!c)bad.push(n+' '+JSON.stringify(d||''))};
  // 1 typed miles per leg, decimals, total in the legs box, charge = rate x total
  await E('legMiSet','LM1',1,'20');R.def=await G();ok('leg 2/3 default from Leg 1',JSON.stringify(R.def.L)=='[20,20,20]'&&R.def.mi==60,R.def);
  R.a=await E('legMiSet','LM1',2,'5');ok('20+5+20=45 (leg 2 only changes leg 2)',JSON.stringify(R.a.L)=='[20,5,20]'&&R.a.mi==45,R.a);
  R.b=await E('legMiSet','LM1',3,'19,5');ok('comma decimal 19,5 -> 19.5, total 44.5',JSON.stringify(R.b.L)=='[20,5,19.5]'&&R.b.mi==44.5&&/20 \+ 5 \+ 19\.5 = 44\.5 mi/.test(R.b.tot),R.b);
  ok('charge = rate x total',R.b.exp==R.b.want&&R.b.exp>0,R.b);
  R.c=await E('legMiSet','LM1',2,'-3');ok('negative ignored',R.c.mi==44.5,R.c);
  R.dm=await pg.evaluate(()=>[...document.querySelectorAll('.legmi input')].every(i=>i.getAttribute('inputmode')=='decimal'&&i.step=='any'));ok('decimal keypad inputs',R.dm);
  // 2 mixed modes: legs 1-2 odometer, leg 3 typed; real taps/typing at 390px for leg 2
  await E('legModeSet','LM1',1,'odo');await E('legOdoSet','LM1',1,'a','10000');R.o1=await E('legOdoSet','LM1',1,'b','10020.4');
  ok('leg 1 odometer 20.4',R.o1.L[0]==20.4&&R.o1.L[1]==5&&R.o1.L[2]==19.5,R.o1);
  const tapIn=async(sel)=>{await pg.evaluate(s=>document.querySelector(s).scrollIntoView({block:'center'}),sel);await W(150);const r=await pg.evaluate(s=>{const e=document.querySelector(s).getBoundingClientRect();return[e.left+e.width/2,e.top+e.height/2]},sel);await pg.touchscreen.tap(r[0],r[1]);await W(250)};
  await tapIn('.legmi[data-leg="2"] button:nth-child(2)');R.o2=await G();
  ok('leg 2 odometer start = leg 1 end',R.o2.odo.find(x=>x[0]=='2')[1]=='10020.4|',R.o2);
  ok('leg 2 counts its typed 5 until both readings',R.o2.L[1]==5,R.o2);
    const endIn='.legmi[data-leg="2"] label:nth-child(2) input';await tapIn(endIn);await pg.keyboard.type('10025.9');await W(200);/* card fields commit with the green ✓ Done button (fdone), like every other card field */await tapIn('.legmi[data-leg="2"] .fdone');await W(300);R.o3=await G();
  ok('mixed 20.4 (odo) + 5.5 (odo) + 19.5 (typed) = 45.4',JSON.stringify(R.o3.L)=='[20.4,5.5,19.5]'&&R.o3.mi==45.4&&/45\.4 mi/.test(R.o3.tot)&&/\(odo\)/.test(R.o3.tot),R.o3);
  ok('charge follows mixed total',R.o3.exp==R.o3.want,R.o3);
  // 3 leg 1 end changes -> leg 2 start follows only while it is still the auto value
  R.o4=await E('legOdoSet','LM1',1,'b','10021');ok('auto start follows previous end',R.o4.odo.find(x=>x[0]=='2')[1]=='10021|10025.9'&&R.o4.L[1]==4.9,R.o4);
  // 4 odometer reset mid-trip: edit the start
  R.o4b=await E('legOdoSet','LM1',2,'a','0');ok('start reset far below end waits, not counted, no prompt',R.o4b.L[1]==5&&R.o4b.msg.some(m=>/over 300/.test(m))&&!dl.length,{R:R.o4b,dl});R.o5=await E('legOdoSet','LM1',2,'b','5.5');ok('reset: start 0 end 5.5 = 5.5',R.o5.L[1]==5.5,R.o5);
  R.o6=await E('legOdoSet','LM1',1,'b','10022');ok('edited start no longer follows leg 1',R.o6.odo.find(x=>x[0]=='2')[1]=='0|5.5'&&R.o6.L[1]==5.5,R.o6);
  // 5 end < start: flagged, not counted (typed miles used), never negative
  R.n=await E('legOdoSet','LM1',2,'b','-1');ok('negative reading ignored',R.n.L[1]==5.5,R.n);
  await E('legOdoSet','LM1',2,'a','100');R.n2=await G();ok('end<start flagged, counts typed 5, no negative',R.n2.L[1]==5&&R.n2.L.every(x=>x>=0)&&R.n2.msg.some(m=>/less than start/.test(m)),R.n2);
  // 6 over 300 mi asks first
  accept=false;const n0=dl.length;R.big=await E('legOdoSet','LM1',2,'b','450');ok('>300 asks, Cancel keeps old',dl.length==n0+1&&/over 300/.test(dl[n0]||'')&&R.big.L[1]==5,{R:R.big,dl});
  accept=true;R.big2=await E('legOdoSet','LM1',2,'b','450');ok('>300 OK saves 350',R.big2.L[1]==350,R.big2);
  await E('legOdoSet','LM1',2,'b','105.25');
  // 7 back to Miles keeps the odometer result
  R.sw=await E('legModeSet','LM1',2,'mi');ok('switch to Miles keeps 5.25',R.sw.L[1]==5.25&&R.sw.odo.find(x=>x[0]=='2')[1]=='5.25',R.sw);
  R.sw2=await E('legModeSet','LM1',2,'odo');ok('back to Odometer restores readings',R.sw2.odo.find(x=>x[0]=='2')[1]=='100|105.25'&&R.sw2.L[1]==5.25,R.sw2);
  // 8 old saved jobs and single-leg jobs unchanged; pickup miles never in the charge
  R.old=await pg.evaluate(()=>{const S=ST(),o=S.OLD1,one=S.ONE1,j=jobs.find(x=>x.uid=='ONE1');const e0=trip(one,j.start,'ONE1').exp;setSt('ONE1','pkm','99');const e1=trip(ST().ONE1,j.start,'ONE1').exp;return{L:legMiList(o),mi:projMi(o,'OLD1').mi,one:projMi(one,'ONE1').mi,e0,e1}});
  ok('old split job 12 + 12 (auto copy of Leg 1) + 7.25 = 31.25, as before',JSON.stringify(R.old.L)=='[12,12,7.25]'&&R.old.mi==31.25,R.old);
  ok('single-leg job stays on its estimate',R.old.one==30,R.old);ok('pickup miles not in the charge',R.old.e0==R.old.e1,R.old);
  if(process.env.SHOT){await pg.evaluate(()=>{EXP.add('LM1');render()});await W(300);}
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('LEGMILES53',JSON.stringify({b:R.b,o3:R.o3,old:R.old}));
  console.log(bad.length?'LEGMILES53 FAIL\n'+bad.join('\n'):'LEGMILES53 PASS');await b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('LEGMILES53 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
