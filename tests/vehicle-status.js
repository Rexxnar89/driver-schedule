// Vehicle status / next-free / shared-status-sync regression. Usage: node tests/vehicle-status.js <url>
const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});const pg=await b.newPage();pg.on('dialog',d=>d.accept());pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:375,height:800});await pg.goto(process.argv[2]);await pg.waitForFunction('LIVE',{timeout:120000});
const r=await pg.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const o={};const F=window.fetch;
// mock shared-status server
const SV={items:{},posts:0};LS.syncurl='https://script.google.com/macros/s/MOCK/exec';LS.syncsec='s';window.VS_ALLOW=1;
window.fetch=async(u,opt={})=>{u=String(u);if(!u.startsWith(LS.syncurl))return F(u,opt);const J=x=>new Response(JSON.stringify(x));if(/action=getvehicles/.test(u))return J({ok:true,items:Object.values(SV.items)});if(opt.method=='POST'){const bd=JSON.parse(opt.body);if(bd.action=='savevehicles'){SV.posts++;bd.items.forEach(it=>{const c=SV.items[it.key];if(!c||c.ts<it.ts)SV.items[it.key]=it});return J({ok:true,items:Object.values(SV.items)})}return J({ok:true})}return J({ok:true,prices:{}})};
try{vSeed()}catch(e){}const setStat=(n,st,back)=>{const D=VDB();const v=D.list.find(x=>x.name==n)||D.equip.find(x=>x.name==n);v.status=st;v.back=back||'';VS.user=1;VSAVE(D);VS.user=0};
localStorage.removeItem('draft');show('newjob');formReset();npd.value='';npt.value='';ndt.value='';
const sel=v=>{nv.value=v;nv.dispatchEvent(new Event('change',{bubbles:true}))},typeDate=(d,t)=>{npd.value=d;npd.dispatchEvent(new Event('change',{bubbles:true}));npt.value=t;npt.dispatchEvent(new Event('input',{bubbles:true}));npt.dispatchEvent(new Event('change',{bubbles:true}))};
setStat('Ford Van','In shop');sel('Ford Van');await w(200);o.noDate={vstat:$('vstat').textContent,blocked:!!bookBlock()};
typeDate('2026-11-20','09:00');await w(300);o.withDate={vstat:$('vstat').textContent,blocked:!!bookBlock(),chip:[...$('vfree').querySelectorAll('span')].map(x=>x.textContent).join('|')};
let saved=false;const sj=SAVED();await saveJob();o.saveBlocked=JSON.stringify(SAVED())==JSON.stringify(sj);
setStat('Ford Van','In shop','2026-11-25');avail();await w(200);o.beforeBack={vstat:$('vstat').textContent,blocked:!!bookBlock()};
typeDate('2026-11-26','09:00');await w(300);o.afterBack={vstat:$('vstat').textContent,blocked:/Ford Van/.test(String(bookBlock()))};
setStat('Ford Van','Available');// equipment in shop
setStat('Enclosed trailer','Waiting on parts');sel('Ford Van');eqOpts('Enclosed trailer');neq.dispatchEvent(new Event('change',{bubbles:true}));await w(200);o.eq={stat:$('eqstat').textContent};setStat('Enclosed trailer','Available');
// shared sync: remote newer status wins, local change pushes
{const D=VDB();[...D.list,...D.equip].forEach(r=>r.ts=0);VS.pulling=1;VSAVE(D);VS.pulling=0}SV.items={};SV.posts=0;await vsPull(1);await w(200);o.seedsNotPushed=SV.posts==0;
const k='veh:chevy van',rem={key:k,kind:'veh',rec:{...vRec('Chevy Van')}};rem.rec.status='Out of service';rem.ts=Date.now()+5000;SV.items[k]=rem;await vsPull(1);o.mergedRemote=vRec('Chevy Van').status;
const p0=SV.posts;setStat('Chevy Van','Available');await w(1000);o.localPushed=SV.posts>p0&&SV.items[k].rec.status=='Available';
const st=document.createElement('div');vhOpen();await w(200);o.panelLabel=($('vsst')||{}).textContent;vhClose&&vhClose();
window.TESTMODE=true;const p1=SV.posts;setStat('Chevy Van','In shop');await w(1000);o.testModeNoPush=SV.posts==p1;window.TESTMODE=false;setStat('Chevy Van','Available');await w(900);
// Edit form
const ej=jobs.find(j=>!j.block&&j.vehicle&&/ford/i.test(j.vehicle));setStat('Ford Van','In shop');editJob(ej.uid);await w(500);sel('Ford Van');await w(300);o.edit={vstat:$('vstat').textContent.slice(0,60),blocked:!!bookBlock()};setStat('Ford Van','Available');cancelEdit();
window.fetch=F;delete LS.syncurl;delete LS.syncsec;return o});
console.log(JSON.stringify(r,null,1));
const pass=/✖ Ford Van is In shop/.test(r.noDate.vstat)&&r.noDate.blocked&&/✖ Ford Van is In shop/.test(r.withDate.vstat)&&r.withDate.blocked&&/Ford Van/.test(r.withDate.chip)&&r.saveBlocked&&/expected back/.test(r.beforeBack.vstat)&&r.beforeBack.blocked&&/⚠/.test(r.afterBack.vstat)&&/expected back/.test(r.afterBack.vstat)&&!r.afterBack.blocked&&/Waiting on parts/.test(r.eq.stat)&&r.seedsNotPushed&&r.mergedRemote=='Out of service'&&r.localPushed&&/synced ✓/.test(r.panelLabel)&&r.testModeNoPush&&/In shop/.test(r.edit.vstat)&&r.edit.blocked;
console.log(pass?'PASS':'FAIL');await b.close();process.exit(pass?0:1)})()
