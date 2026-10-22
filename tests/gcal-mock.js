// Mock test of the Google Calendar side-by-side sync (no real Google calls). Usage: node tests/gcal-mock.js <url>
const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});const pg=await b.newPage();const dl=[];pg.on('dialog',d=>{dl.push(d.message().slice(0,50));d.accept()});pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:375,height:800});await pg.goto(process.argv[2]);await pg.waitForFunction('LIVE',{timeout:120000});
const r=await pg.evaluate(async()=>{const o={};const CAL={},EV={},LOG=[];let n=0;const F=window.fetch;
window.fetch=async(u,opt={})=>{u=String(u);if(!u.startsWith('https://www.googleapis.com/calendar/v3'))return F(u,opt);const m=(opt.method||'GET').toUpperCase(),U=new URL(u),path=U.pathname.replace('/calendar/v3','');LOG.push(m+' '+path);const J=x=>new Response(JSON.stringify(x),{status:200});const body=opt.body?JSON.parse(opt.body):{};
if(path=='/users/me/calendarList')return J({items:Object.values(CAL)});if(path=='/calendars'&&m=='POST'){const id='cal'+(++n);CAL[id]={id,summary:body.summary};EV[id]={};return J(CAL[id])}
let mm=path.match(/^\/users\/me\/calendarList\/(.+)$/);if(mm){CAL[decodeURIComponent(mm[1])].bg=body.backgroundColor;return J({})}
mm=path.match(/^\/calendars\/([^/]+)$/);if(mm&&m=='DELETE'){delete CAL[decodeURIComponent(mm[1])];return new Response(null,{status:204})}
mm=path.match(/^\/calendars\/([^/]+)\/events(?:\/(.+))?$/);if(mm){const c=decodeURIComponent(mm[1]),E=EV[c];if(m=='POST'){const id='e'+(++n);E[id]={...body,id};return J(E[id])}if(m=='PATCH'){Object.assign(E[mm[2]],body);return J(E[mm[2]])}if(m=='DELETE'){delete E[mm[2]];return new Response(null,{status:204})}const pe=U.searchParams.get('privateExtendedProperty');let L=Object.values(E);if(pe){const v=pe.split('=').slice(1).join('=');L=L.filter(e=>e.extendedProperties.private.dsJobId==v)}return J({items:L})}
return new Response('{}',{status:404})};
window.google={accounts:{oauth2:{initTokenClient:c=>({requestAccessToken:()=>setTimeout(()=>c.callback({access_token:'TOK',expires_in:3600}),10)}),hasGrantedAllScopes:()=>true}}};
show('owner');await new Promise(r=>setTimeout(r,200));o.panel=!!$('gcpanel');o.defaultOff=!gcOn()&&!$('gcsw').checked;o.guideSteps=$('gcpanel').querySelectorAll('ol li').length;
LS.gcClient='test.apps.googleusercontent.com';LS.gcOn='1';delete LS.gcCals;gcUI();o.signed=await gcSignIn();
await gcSyncAll();o.cals=Object.values(CAL).map(c=>c.summary+' '+c.bg);o.events=Object.values(EV).reduce((a,E)=>a+Object.keys(E).length,0);o.rangeJobs=gcRange().length;
await gcCheck();o.check1=$('gcres').querySelector('b').parentNode.textContent.slice(0,80);
const E1=Object.values(EV).find(E=>Object.keys(E).length);const ids=Object.keys(E1);E1[ids[0]].summary='changed in Google';delete E1[ids[1]];await gcCheck();o.check2=$('gcres').textContent.slice(0,80);
o.jobsUntouched=!jobs.some(j=>/changed in Google/.test(j.title||''));
const j=gcRange().find(j=>!j.canceled&&!j.rr);LOG.length=0;cancelMark(j.uid);await new Promise(r=>setTimeout(r,300));const ev=Object.values(EV).flatMap(E=>Object.values(E)).find(e=>e.extendedProperties.private.dsJobId==gcKey(j));o.cancel={log:LOG.slice(),color:ev&&ev.colorId,sum:ev&&ev.summary.slice(0,20)};
const j2=gcRange().find(x=>x!==j&&!x.canceled&&!x.rr);LOG.length=0;delDo(j2.uid);await new Promise(r=>setTimeout(r,300));o.del=LOG.filter(x=>x.startsWith('DELETE'));
window.TESTMODE=true;LOG.length=0;await gcUpsert(gcRange()[0]);o.testModeWrites=LOG.filter(x=>!x.startsWith('GET')).length;window.TESTMODE=false;
GC.exp=0;LOG.length=0;await gcCheck();o.reSignedAfterExpiry=GC.tok=='TOK'&&GC.exp>Date.now();
await gcRemove();o.calsLeft=Object.keys(CAL).length;LS.gcOn='0';delete LS.gcClient;delete LS.gcCals;return o});
console.log(JSON.stringify({...r,dialogs:dl},null,1));const ok=r.panel&&r.defaultOff&&r.signed&&r.events>0&&/❌ 0 missing/.test(r.check1)&&/⚠️ 0 out/.test(r.check1)===false?false:true;
const pass=r.panel&&r.defaultOff&&r.signed&&r.events==r.rangeJobs&&/0 out of sync · ❌ 0 missing/.test(r.check1)&&/1 out of sync · ❌ 1 missing/.test(r.check2)&&r.jobsUntouched&&r.cancel.color=='8'&&r.del.length==1&&r.testModeWrites==0&&r.reSignedAfterExpiry&&r.calsLeft==0;console.log(pass?'PASS':'FAIL');await b.close();process.exit(pass?0:1)})()
