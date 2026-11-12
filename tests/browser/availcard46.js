// node tests/browser/availcard46.js — 390px: availability cards + completed-leg sort
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const DEAD=Number(process.env.V46_MS||120000);
let _b;
const killer=setTimeout(()=>{console.log('AVAILCARD46 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},DEAD);
const loc=d=>{const p=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes())};
(async()=>{
 const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage'],protocolTimeout:60000});
 _b=b;
 const ctx=await b.createBrowserContext();
 const pg=await ctx.newPage();
 pg.setDefaultTimeout(20000);pg.setDefaultNavigationTimeout(20000);
 await pg.emulate({viewport:{width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2},userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
 await pg.setRequestInterception(true);
 pg.on('request',r=>{const u=r.url();if(/script\.google/.test(u))return r.respond({status:200,headers:{'Access-Control-Allow-Origin':'*'},contentType:'application/json',body:'{"ok":true,"items":[],"now":1,"ts":{}}'});if(/^https?:\/\/(localhost|127\.0\.0\.1)/.test(u)||/^data:/.test(u))return r.continue();return r.respond({status:200,body:''})});
 const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('dialog',d=>d.accept().catch(()=>{}));
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});
 await pg.waitForFunction('typeof jobs!=="undefined" && typeof render=="function" && typeof isAvailEvt=="function" && typeof dayCards=="function"',{timeout:15000});
 await W(400);
 const info=await pg.evaluate(()=>{
  jobs.length=0;
  const day=new Date();day.setHours(0,0,0,0);
  const at=(h,m=0)=>{const d=new Date(day);d.setHours(h,m,0,0);return d};
  const pad=n=>String(n).padStart(2,'0');
  const loc=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());
  jobs.push({uid:'AV1',evuid:'AV1',start:at(6,30),endT:at(17,0),driver:'BB',raw:'Jeffrey Available TILL 5:00PM',title:'Jeffrey Available TILL 5:00PM',client:'',block:false,cal:'BB'});
  jobs.push({uid:'E8',evuid:'E8',start:at(8,0),endT:at(9,0),driver:'BB',client:'Early split',title:'Early split',raw:'Early split from 1 A St to 2 B Ave',from:'1 A St',to:'2 B Ave',pax:1});
  jobs.push({uid:'H830',evuid:'H830',start:at(8,30),endT:at(9,30),driver:'BB',client:'Eight thirty',title:'Eight thirty',raw:'Eight thirty from 3 C St to 4 D Ave',from:'3 C St',to:'4 D Ave',pax:1});
  jobs.push({uid:'DN7',evuid:'DN7',start:at(7,0),endT:at(7,45),driver:'BB',client:'Already done',title:'Already done',raw:'Already done from 5 E St to 6 F Ave',from:'5 E St',to:'6 F Ave',pax:1});
  try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
  drv.value='BB';
  setSt('E8','l1done',Date.now());
  setSt('E8','legs',[{pk:'2 B Ave',dz:'1 A St',t:loc(at(14,0)),drv:'BB',done:0,d:60}]);
  setSt('DN7','st','Done');
  try{show('driver')}catch(e){}
  render();
  const av=jobs.find(j=>j.uid=='AV1'),un={raw:'Jeffrey unavailable',block:true,start:at(17),driver:'BB'};
  const t0=new Date(day),t1=new Date(+day+864e5);
  const mid=new Date(+at(11,0));
  const blocked=busyAt('BB',mid,new Date(+mid+36e5),0).map(j=>j.uid);
  const order=[...document.querySelectorAll('#dcards .card, #dcards .availc')].map(c=>{
    const av=c.classList.contains('availc')||c.getAttribute('data-avail')==='1';
    const t=(c.innerText||'').replace(/\s+/g,' ').trim();
    return {av,t:t.slice(0,80),hasFare:/Expected|\$\d/.test(t)&&!av,hasAlarm:/Drive alarm|alarm/i.test(t)};
  });
  return {
    isAv:isAvailEvt(av),notJob:isDriveJob(av)===false,notUn:isAvailEvt(un)===false,
    blocked,hasAv:order.some(x=>x.av),
    avNoFare:order.filter(x=>x.av).every(x=>!x.hasFare&&!x.hasAlarm),
    avLabel:order.some(x=>x.av&&/Available/.test(x.t)),
    order:order.map(x=>({av:x.av,t:x.t})),
    times:[listTime(jobs.find(j=>j.uid=='AV1')),listTime(jobs.find(j=>j.uid=='H830')),listTime(jobs.find(j=>j.uid=='E8')),listTime(jobs.find(j=>j.uid=='DN7'))]
  };
 });
 await W(500);
 // screenshot the Available card
 const avEl=await pg.$('#dcards .availc, #dcards [data-avail="1"]');
 if(avEl){
  await pg.evaluate(el=>el.scrollIntoView({block:'center'}),avEl);
  await W(200);
  await avEl.screenshot({path:'/workspace/v46_avail_card.png'});
 }else{
  await pg.screenshot({path:'/workspace/v46_avail_card.png'});
 }
 // screenshot the today list showing sort order
 await pg.evaluate(()=>{
  const box=document.querySelector('#dcards')||document.body;
  const t=[...box.querySelectorAll('div')].find(x=>/TODAY/.test(x.textContent)&&x.children.length<3)||box;
  (t||box).scrollIntoView({block:'start'});
 });
 await W(250);
 // prefer the today box (navy header + cards) if we can find it
 const box=await pg.evaluateHandle(()=>{
  const h=[...document.querySelectorAll('div')].find(x=>/^TODAY/.test((x.textContent||'').trim())||/TODAY/.test(x.textContent||'')&&/job/.test(x.textContent||'')&&x.style&&/1f3a5f/.test(x.getAttribute('style')||''));
  if(h&&h.parentElement)return h.parentElement;
  return document.querySelector('#dcards');
 });
 try{
  const el=box.asElement();
  if(el)await el.screenshot({path:'/workspace/v46_done_sort.png'});
  else await pg.screenshot({path:'/workspace/v46_done_sort.png'});
 }catch(e){await pg.screenshot({path:'/workspace/v46_done_sort.png'})}

 const add=(t,c)=>{console.log(t,c?'ok':'FAIL');if(!c)fail=true};let fail=false;
 add('available till is an avail event',info.isAv);
 add('not a drive job',info.notJob);
 add('unavailable is not an avail card',info.notUn);
 add('avail event does not block 11:00',!info.blocked.includes('AV1'));
 add('Available card is in the list',info.hasAv);
 add('Available card has the Available label',info.avLabel);
 add('Available card has no fare or alarm',info.avNoFare);
 // order of first texts: Available, then 8:30, then Early split (2pm), then completed Already done
 const texts=(info.order||[]).map(x=>x.t);
 const iAv=texts.findIndex(t=>/Available/.test(t));
 const i830=texts.findIndex(t=>/8:30 AM/.test(t));
 const i8=texts.findIndex(t=>/2:00 PM/.test(t)||/Early split/.test(t));
 const iDn=texts.findIndex(t=>/Completed/.test(t)&&/7:00 AM/.test(t)||/Already done/.test(t));
 add('8:30 appointment is above the 8:00 job (which sorts at 2 PM)',i830>=0&&i8>=0&&i830<i8);
 add('fully done job is after upcoming items',iDn>i8&&iDn>i830);
 add('Available card is placed by time (before 8:30)',iAv>=0&&iAv<i830);
 add('no page errors',errs.length===0);
 console.log(JSON.stringify({info,iAv,i830,i8,iDn,errs},null,1));
 await b.close();clearTimeout(killer);
 process.exit(fail?1:0);
})().catch(e=>{console.log('AVAILCARD46 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
