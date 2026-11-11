// node tests/browser/v46ui.js — 390px screenshots + pickup-miles hint / split-paid UI; charge unchanged
const p=require('puppeteer-core');
const U=process.env.U||'http://localhost:8812/index.html';
const W=ms=>new Promise(r=>setTimeout(r,ms));
const DEAD=Number(process.env.V46_MS||120000);
let _b;
const killer=setTimeout(()=>{console.log('V46UI TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},DEAD);
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
 await pg.goto(U+'?x='+Date.now(),{waitUntil:'domcontentloaded'});await pg.waitForFunction('typeof jobs!=="undefined" && typeof render=="function" && typeof pkmHint=="function"',{timeout:15000});await W(500);
 await pg.evaluate(()=>{
  jobs.length=0;
  const t=new Date();t.setHours(10,0,0,0);
  const mk=(id,pkm,from)=>({uid:id,evuid:id,start:new Date(+t-(id==='CUR'?0:864e5*2)),endT:new Date(+t+2*36e5),driver:'BB',client:'Rider '+id,title:'Rider '+id,raw:'Rider '+id,from:from||'100 Main St, Shreve, OH',to:'2 B Ave',pax:2,split:3});
  ['H1','H2'].forEach((id,i)=>{const j=mk(id,0);jobs.push(j);setSt(id,'pkm',i?14:12);setSt(id,'emi',80);setSt(id,'hm','')});
  const cur=mk('CUR');jobs.push(cur);
  setSt('CUR','pkm',13);setSt('CUR','emi',80);setSt('CUR','hm','');setSt('CUR','split',3);cur.split=3;setSt('CUR','spPaid',[1,1,0]);setSt('CUR','pxn',['Alex','Blair']);
  setSt('CUR','legs',[{pk:'2 B Ave',dz:'100 Main St, Shreve, OH',t:new Date(+t+3*36e5).toISOString().slice(0,16),drv:'BB',done:0}]);
  try{if(![...drv.options].some(o=>o.value=='BB'))drv.insertAdjacentHTML('beforeend','<option value="BB">BB</option>')}catch(e){}
  drv.value='BB';EXP.add('CUR');render();
 });
 await W(600);
 // form: Create job with same first pickup
 await pg.evaluate(()=>{show('newjob');setStops('pks','100 Main St, Shreve, OH');setStops('dos','2 B Ave');try{pkmHint()}catch(e){}});
 await W(400);
 await pg.evaluate(()=>{const e=$('npkm');if(e)e.scrollIntoView({block:'center'})});
 await W(200);
 await pg.screenshot({path:'/workspace/v46_pickupmiles_form.png'});
 const form=await pg.evaluate(()=>{
  const lab=[...document.querySelectorAll('#newjob label')].map(x=>x.textContent).find(t=>/Pickup miles/.test(t));
  const hint=($('npkmh')||{}).textContent||'';
  const order=[...document.querySelectorAll('#newjob label')].map(x=>x.textContent.trim());
  const iP=order.findIndex(t=>/Pickup miles/.test(t)),iW=order.findIndex(t=>/Wait hrs/.test(t));
  return {lab,hint,pkmBeforeWait:iP>=0&&iW>iP,fare:$('nfare').textContent};
 });
 // card with saved value + hint + split paid
 await pg.evaluate(()=>{show('driver');render();const c=[...document.querySelectorAll('#dcards .jc')].find(x=>/CUR|Rider CUR/.test(x.textContent));c&&c.scrollIntoView({block:'start'})});
 await W(500);
 // open CUR if needed
 await pg.evaluate(()=>{try{if(!EXP.has('CUR'))tog('CUR')}catch(e){}const el=[...document.querySelectorAll('#dcards .pkmhint,.sppaid,#splitbox')].find(x=>x.offsetParent);el&&el.scrollIntoView({block:'center'})});
 await W(300);
 await pg.screenshot({path:'/workspace/v46_pickupmiles_card.png'});
 // scroll to split paid
 await pg.evaluate(()=>{const el=document.querySelector('#dcards .sppaid')||document.querySelector('#splitbox');el&&el.scrollIntoView({block:'center'})});
 await W(200);
 await pg.screenshot({path:'/workspace/v46_split_paid.png'});
 const card=await pg.evaluate(()=>{
  const hint=[...document.querySelectorAll('#dcards .pkmhint')].map(x=>x.textContent);
  const pkm=[...document.querySelectorAll('#dcards label')].map(x=>x.textContent).filter(t=>/Pickup miles/.test(t));
  const paid=(document.body.innerText.match(/Paid \$[\d.]+ of \$[\d.]+(?: \(\+\$[\d.]+ extra\))?/g)||[]);
  const splitLine=(document.body.innerText.match(/Fare \$[\d.]+ ÷ \d+ = \$[\d.]+ each/g)||[]);
  const unpaid=(document.body.innerText.match(/Unpaid: [^\n]+/g)||[]);
  const shares=[...document.querySelectorAll('#dcards .sppaid label')].map(x=>x.textContent.replace(/\s+/g,' ').trim());
  const boxes=document.querySelectorAll('#dcards .sppaid input[type=checkbox]').length;
  const exp=(()=>{try{const j=jobs.find(x=>x.uid=='CUR');return trip(SJ(j),j.start,j.uid).exp}catch(e){return null}})();
  const expNo=(()=>{try{const j=jobs.find(x=>x.uid=='CUR');const s={...SJ(j)};delete s.pkm;return trip(s,j.start,j.uid).exp}catch(e){return null}})();
  return {hint,pkm,paid,unpaid,shares,boxes,splitLine,exp,expNo,same:exp===expNo,extra:typeof splitPaidMsg=='function'?splitPaidMsg(105,104):''};
 });
 const checks=[];
 const add=(n,p)=>{checks.push({n,p:!!p});console.log(n,p?'ok':'FAIL')};
 add('form has Pickup miles label',!!form.lab);
 add('Pickup miles sits above Wait hrs',form.pkmBeforeWait);
 add('form hint Usual',/Usual: ~\d/.test(form.hint));
 add('card hint Usual',card.hint.some(t=>/Usual: ~\d/.test(t)));
 add('card has pickup miles field',card.pkm.length>0);
 add('Paid $X of $Y shown',card.paid.length>0);
 add('Paid $70.00 of $104.00 (fare, not $105)',card.paid.some(t=>t==='Paid $70.00 of $104.00'));
 add('split line is Fare $104.00 ÷ 3 = $35.00 each',(card.splitLine||[]).some(t=>t==='Fare $104.00 ÷ 3 = $35.00 each'));
 add('all three shares $35.00',(card.shares||[]).length===3&&card.shares.every(t=>/\$35\.00/.test(t)));
 add('extra label when over fare',card.extra==='Paid $105.00 of $104.00 (+$1.00 extra)');
 add('charge still $104',card.exp===104);
 add('Unpaid names shown',card.unpaid.length>0);
 add('3 split checkboxes',card.boxes===3);
 add('charge unchanged by pkm',card.same);
 add('no page errors',errs.length==0);
 console.log(JSON.stringify({form,card,errs:errs.slice(0,3)},null,1));
 const pass=checks.every(c=>c.p);
 console.log(pass?'PASS':'FAIL');
 await b.close();clearTimeout(killer);process.exit(pass?0:1);
})().catch(e=>{console.log('V46UI ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
