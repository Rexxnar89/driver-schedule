// node tests/browser/still66.js  (U=.../index.html  VERBOSE=1)
// v66 "screen stays still", pass 5: popups/modals (Address book, Vehicles, Feedback, Online, Activity, Drafts, Merge jobs,
// Drive alarm, discount, vehicle issue), Back button and tab navigation (each tab keeps its own scroll spot). The Owner tab needs the owner PIN and is not covered.
// Opening a popup must not move the page under it; inside the popup nothing moves while idle; closing it (✕/Close/Done or
// the phone's Back) puts you back exactly where you were. Made-up data only; nothing is sent anywhere (network mocked).
const L=require('./still-lib.js');const U=process.env.U||'http://127.0.0.1:8812/index.html';
let _b;const killer=setTimeout(()=>{console.log('STILL66 TIMEOUT');try{_b&&_b.close()}catch(e){}process.exit(2)},900000);
(async()=>{const H=await L.open(U);_b=H.b;const{pg,bad,R,errs,step,tapSel,place,W}=H;const V=process.env.VERBOSE;
  await pg.evaluate(()=>{document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href]');if(a&&!/^(#|javascript:)/.test(a.getAttribute('href')||'#'))e.preventDefault()},true);window.open=()=>null;try{navigator.clipboard.writeText=async()=>{}}catch(e){}});
  await pg.waitForFunction('typeof LOADING=="undefined"||!LOADING',{timeout:60000}).catch(()=>{});await pg.evaluate(()=>{window.loadLive=async()=>{}});await W(1000);
  const hd=u=>`[onclick="tog('${u}')"]`;
  const pos=()=>pg.evaluate(()=>{const h=document.querySelector(`[onclick="tog('T5')"]`);return{y:Math.round(scrollY),t:h&&h.offsetParent?Math.round(h.getBoundingClientRect().top):null}});
  const visFixed=()=>pg.evaluate(()=>[...document.body.children].filter(e=>getComputedStyle(e).position=='fixed'&&getComputedStyle(e).display!='none'&&!e.classList.contains('hide')&&e.getBoundingClientRect().height>200).map(e=>{e.dataset.stillSeen=1;return e.id||e.className||e.tagName}));
  let F0=[];const newFixed=async()=>{const n=await visFixed();const r=n.filter(x=>!F0.includes(x));return r};
  F0=await visFixed();
  const closeTop=async()=>pg.evaluate(()=>{const P=[...document.body.children].filter(e=>e.dataset.stillSeen&&e.isConnected&&getComputedStyle(e).position=='fixed'&&e.getBoundingClientRect().height>200&&getComputedStyle(e).display!='none'&&!e.classList.contains('hide'));const p=P[P.length-1];if(!p)return 'none';const b=[...p.querySelectorAll('button,[onclick]')].find(x=>/^(✕|×|x|Close|Done|Cancel)$/i.test((x.textContent||'').trim()));if(b){b.click();return 'btn:'+(b.textContent||'').trim()}return 'nobtn:'+(p.id||p.className)});
  const popup=async(name,open,o={})=>{await pg.evaluate(u=>{EXP.delete('T5');render()});await place(hd('T5'),0.5);await W(700);const p0=await pos();
    await pg.evaluate(()=>_watch(document.querySelector(`[onclick="tog('T5')"]`)));await pg.evaluate(open);await W(1500);const r1=await pg.evaluate(()=>_stop());const P=await newFixed();
    if(V)console.log(name,'opened',JSON.stringify(P),'page',JSON.stringify(r1).slice(0,200));
    if(!P.length&&!o.inline){R.push([name+': opens',{moved:-1,idle:0,rebuilt:[]}]);bad.push(name+' did not open a popup');return}
    if(r1.moved>2)bad.push(name+': page under the popup moved '+r1.moved+' '+JSON.stringify(r1.sc).slice(0,200));
    await step(name+': idle in popup',null,null,{idle:1,wait:3000,pre:200,okRebuild:o.okRebuild});
    if(o.inside)await o.inside();
    const how=o.back?'back':await closeTop();if(how=='back'||/^none|^nobtn/.test(how)){await pg.goBack().catch(()=>{});await pg.evaluate(()=>history.length)}await W(1500);
    const still=await pg.evaluate(()=>[...document.body.children].filter(e=>e.dataset.stillSeen&&e.isConnected&&getComputedStyle(e).position=='fixed'&&getComputedStyle(e).display!='none'&&!e.classList.contains('hide')&&e.getBoundingClientRect().height>200).map(e=>e.id||e.className));
    const p1=await pos();R.push([name+': close ('+how+') back to same spot dy',{moved:p1.y-p0.y,idle:p1.t-p0.t,rebuilt:still}]);if(V)console.log(name,'close',how,JSON.stringify(p0),JSON.stringify(p1),still);
    if(Math.abs(p1.y-p0.y)>2||Math.abs((p1.t??0)-(p0.t??0))>2)bad.push(name+': after closing, the page moved '+JSON.stringify([p0,p1]));
    if(still.length)bad.push(name+': popup still open after '+how+': '+still);
    await pg.evaluate(()=>{for(const e of [...document.body.children])if(e.dataset.stillSeen&&e.isConnected&&getComputedStyle(e).position=='fixed'&&e.getBoundingClientRect().height>200&&!/^(livebar)$/.test(e.id))e.style.display=e.style.display});};
  const into=s=>pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return false;e.scrollIntoView({block:'center'});return true},s);
  const pstep=async(n,s,act,o={})=>{if(!(await into(s))){if(V)console.log('skip',n);return}await W(400);await step(n,s,act,{noPlace:1,wait:1800,...o})};
  const typeIn=async(s,t)=>{await tapSel(s);await pg.keyboard.type(t,{delay:50})};
  const kb=async s=>{await tapSel(s);await pg.setViewport({width:390,height:480,isMobile:true,hasTouch:true,deviceScaleFactor:2});await W(800);await pg.setViewport({width:390,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:2});await pg.evaluate(()=>document.activeElement.blur())};
  await popup('Address book',()=>abOpen(),{inside:async()=>{await pstep('Address book: type search','#abp #clq',()=>typeIn('#abp #clq','Sample'));await pstep('Address book: clear search','#abp #clq',async()=>{for(let i=0;i<6;i++)await pg.keyboard.press('Backspace')});
    await pstep('Address book: Import addresses','#abp [onclick="clImpOpen()"]',()=>tapSel('#abp [onclick="clImpOpen()"]'));await pstep('Address book: Import close (Import button stays put)',`#abp [onclick="climp.classList.add('hide')"]`,()=>tapSel(`#abp [onclick="climp.classList.add('hide')"]`),{anchor:'#abp [onclick="clImpOpen()"]'});
    await pstep('Address book: type name','#abp #cname',()=>typeIn('#abp #cname','Made Up'));await pstep('Address book: keyboard opens/closes','#abp #cphone',()=>kb('#abp #cphone'));await pstep('Address book: New / clear',`#abp [onclick="clEditForm('')"]`,()=>tapSel(`#abp [onclick="clEditForm('')"]`))}});
  await popup('Vehicles',()=>vhOpen(),{inside:async()=>{const n=await pg.evaluate(()=>{document.querySelectorAll('#vhp summary').forEach((e,i)=>e.dataset.sti=i);return document.querySelectorAll('#vhp summary').length});for(let i=0;i<Math.min(n,5);i++){const q=`#vhp summary[data-sti="${i}"]`;if(!(await pg.evaluate(q=>!!document.querySelector(q).offsetParent,q)))continue;await pstep('Vehicles: toggle section '+i,q,()=>tapSel(q));await pstep('Vehicles: toggle back '+i,q,()=>tapSel(q))}
    await pstep('Vehicles: type wish item','#vhp #wi_all',()=>typeIn('#vhp #wi_all','Made-up strap'))}});
  await popup('Feedback',()=>fbOpen());
  await popup('Online',()=>kvOnline());
  await popup('Activity',()=>kvActs());
  await popup('Drafts',()=>kvDrafts());
  await popup('Merge jobs',()=>mergeOpen('T6'),{inside:async()=>{for(const u of ['T7','U2','T7']){const q=`#mergedlg [onclick="mergeTap('${u}')"]`;await pstep('Merge: tap '+u,q,()=>tapSel(q))}}});
  await popup('Drive alarm',()=>alarmOpen('T6'));
  await popup('Discount',()=>discAdd('T6'));
  await popup('Vehicle issue',()=>vrOpen('T6'));
  await popup('Drafts, closed with Back',()=>kvDrafts(),{back:1});
  await popup('Address book, closed with Back',()=>abOpen(),{back:1});
  // tabs: each keeps its own scroll spot, nothing flickers after switching
  /* Owner sits behind the owner PIN (not tested here) */const T=['driver','up','find','cmp','cal','newjob'];const Y={};
  for(const t of T){await pg.evaluate(t=>show(t),t);await W(1500);Y[t]=await pg.evaluate(()=>{const m=document.documentElement.scrollHeight-innerHeight;const y=Math.max(0,Math.round(Math.min(m,600)));scrollTo(0,y);return Math.round(scrollY)});await W(600)}
  for(const t of T){await pg.evaluate(t=>show(t),t);await W(1500);const y=await pg.evaluate(()=>Math.round(scrollY));R.push(['tab '+t+' restores its scroll (dy)',{moved:y-Y[t],idle:0,rebuilt:[]}]);if(Math.abs(y-Y[t])>2)bad.push('tab '+t+' came back at '+y+' instead of '+Y[t]);
    await step('tab '+t+': idle after switching',null,null,{idle:1,wait:2500,pre:0,okRebuild:/cal|cmp/.test(t)?1:0})}
  if(errs.length)bad.push('page errors '+errs.slice(0,3).join(' | '));
  console.log('STILL66',JSON.stringify(R.map(([n,r])=>[n,r.moved,r.idle,Array.isArray(r.rebuilt)?r.rebuilt.length:r.rebuilt])));
  console.log(bad.length?'STILL66 FAIL\n'+bad.join('\n'):'STILL66 PASS');await H.b.close();clearTimeout(killer);process.exit(bad.length?1:0)
})().catch(e=>{console.log('STILL66 ERROR',e&&e.stack||e);try{_b&&_b.close()}catch(x){}clearTimeout(killer);process.exit(1)});
