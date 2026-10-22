// Mock test of the Google Calendar side-by-side sync (fake Google; no real calls). Usage: node tests/gcal-mock.js <url>
const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});const pg=await b.newPage();const dl=[];pg.on('dialog',d=>{dl.push(d.message().slice(0,50));d.accept()});pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:375,height:800});await pg.goto(process.argv[2]);await pg.waitForFunction('LIVE',{timeout:120000});
const r=await pg.evaluate(async()=>{const out={};const F=window.fetch;
function server(mode){const S={CAL:{},EV:{},LOG:[],n:0,fresh:{},valid:true,rl:1};
 S.fetch=async(u,opt={})=>{u=String(u);if(u.startsWith('https://oauth2.googleapis.com/tokeninfo'))return new Response('{}',{status:S.valid?200:400});if(!u.startsWith('https://www.googleapis.com/calendar/v3'))return F(u,opt);
 const m=(opt.method||'GET').toUpperCase(),U=new URL(u),path=U.pathname.replace('/calendar/v3','');S.LOG.push(m+' '+path);const J=(x,st=200)=>new Response(JSON.stringify(x),{status:st});const E401=()=>J({error:{message:'Request had invalid authentication credentials.'}},401);const body=opt.body?JSON.parse(opt.body):{};
 if(!S.valid)return E401();
 if(path=='/users/me/calendarList'&&m=='GET')return mode=='narrow'?J({error:{message:'Request had insufficient authentication scopes.'}},403):J({items:Object.values(S.CAL)});
 if(path=='/calendars'&&m=='POST'){const id='cal'+(++S.n);S.CAL[id]={id,summary:body.summary};S.EV[id]={};S.fresh[id]=1;return J(S.CAL[id])}
 if(path.startsWith('/users/me/calendarList')){if(mode=='narrow')return E401();const id=m=='POST'?body.id:decodeURIComponent(path.split('/').pop());S.CAL[id].bg=body.backgroundColor;return J({})}
 let mm=path.match(/^\/calendars\/([^/]+)$/);if(mm){const id=decodeURIComponent(mm[1]);if(m=='DELETE'){delete S.CAL[id];return new Response(null,{status:204})}return S.CAL[id]?J(S.CAL[id]):J({error:{message:'Not Found'}},404)}
 mm=path.match(/^\/calendars\/([^/]+)\/events(?:\/(.+))?$/);if(mm){const c=decodeURIComponent(mm[1]);if(S.fresh[c]){delete S.fresh[c];return E401()}if(S.rl&&m=='POST'){S.rl=0;return J({error:{message:'Rate Limit Exceeded'}},429)}const E=S.EV[c];if(m=='POST'){const id='e'+(++S.n);E[id]={...body,id};return J(E[id])}if(m=='PATCH'){Object.assign(E[mm[2]],body);return J(E[mm[2]])}if(m=='DELETE'){delete E[mm[2]];return new Response(null,{status:204})}const pe=U.searchParams.get('privateExtendedProperty');let L=Object.values(E);if(pe){const v=pe.split('=').slice(1).join('=');L=L.filter(e=>e.extendedProperties.private.dsJobId==v)}return J({items:L})}
 return J({},404)};return S}
window.google={accounts:{oauth2:{initTokenClient:c=>({requestAccessToken:()=>setTimeout(()=>c.callback({access_token:'TOK',expires_in:3600}),10)}),hasGrantedAllScopes:()=>true}}};
GC.backoff=[20,40,80];show('owner');await new Promise(r=>setTimeout(r,200));out.panel=!!$('gcpanel');out.defaultOff=LS.gcOn!='1'&&!$('gcsw').checked;
// ---- narrow scope run, with 2 pre-existing calendars from the failed real run
const S=server('narrow');window.fetch=S.fetch;S.CAL.calJ={id:'calJ',summary:'DS Test, Jared'};S.CAL.calP={id:'calP',summary:'DS Test, Pickup Jobs'};S.EV.calJ={};S.EV.calP={};
LS.gcClient='x.apps.googleusercontent.com';LS.gcOn='1';LS.gcScope='https://www.googleapis.com/auth/calendar.app.created';LS.gcCals=JSON.stringify({Jared:'calJ','Pickup Jobs':'calP'});delete LS.gcColOk;GC.colTried={};gcUI();await gcSignIn();
await gcSyncAll();out.narrow={signedInAfter:GC.tok=='TOK',cals:Object.values(S.CAL).map(c=>c.summary).sort(),dupes:Object.values(S.CAL).filter(c=>/Jared|Pickup/.test(c.summary)).length,events:Object.values(S.EV).reduce((a,E)=>a+Object.keys(E).length,0),range:gcRange().length,listCalls:S.LOG.filter(x=>x=='GET /users/me/calendarList').length,colorEv:Object.values(S.EV).flatMap(E=>Object.values(E)).filter(e=>e.colorId&&e.colorId!='8').length,msg:$('gcmsg').textContent.slice(0,90)};
await gcCheck();out.narrow.check=$('gcres').textContent.slice(0,70);
// 403 on events => message, no sign-out
const f0=S.fetch;window.fetch=async(u,o)=>String(u).includes('/events')&&(o&&o.method)=='POST'?new Response(JSON.stringify({error:{message:'Forbidden'}}),{status:403}):f0(u,o);let e403='';try{await gcUpsert({...gcRange()[0],uid:'zz-new',start:new Date(Date.now()+5*864e5)})}catch(e){e403=e.message}out.e403={err:e403,stillSignedIn:GC.tok=='TOK'};window.fetch=S.fetch;
// real expiry: token rejected => prompt sign-in
S.valid=false;const CF=[],oc=window.confirm;window.confirm=m=>{CF.push(m);S.valid=true;return true};let ex='';try{await gcCheck()}catch(e){ex=e.message}window.confirm=oc;out.expiry={prompted:CF.some(x=>/expired/.test(x)),signedIn:GC.tok=='TOK'};
// ---- full scope run (fresh state, existing calendar found by name, color via patch)
const S2=server('full');S2.CAL.calB={id:'calB',summary:'DS Test, BB'};S2.EV.calB={};window.fetch=S2.fetch;LS.gcScope='https://www.googleapis.com/auth/calendar';delete LS.gcCals;delete LS.gcColOk;GC.colTried={};await gcSyncAll();
out.full={cals:Object.values(S2.CAL).map(c=>c.summary+' '+(c.bg||'-')).sort(),bbDupes:Object.values(S2.CAL).filter(c=>c.summary=='DS Test, BB').length,events:Object.values(S2.EV).reduce((a,E)=>a+Object.keys(E).length,0),evColors:Object.values(S2.EV).flatMap(E=>Object.values(E)).filter(e=>e.colorId&&e.colorId!='8').length};
await gcRemove();out.full.left=Object.keys(S2.CAL).length;window.fetch=F;LS.gcOn='0';delete LS.gcClient;delete LS.gcCals;delete LS.gcColOk;delete LS.gcScope;out.log=GC.log.slice(0,6);return out});
console.log(JSON.stringify({...r,dialogs:[...new Set(dl)]},null,1));
const N=r.narrow,Fu=r.full;const pass=r.panel&&r.defaultOff&&N.signedInAfter&&N.dupes==2&&N.events==N.range&&N.listCalls==0&&N.colorEv>0&&/0 out of sync · ❌ 0 missing/.test(N.check)&&/Forbidden/.test(r.e403.err)&&r.e403.stillSignedIn&&r.expiry.prompted&&r.expiry.signedIn&&Fu.bbDupes==1&&Fu.events==N.range&&Fu.evColors==0&&!Fu.cals.some(c=>/ -$/.test(c))&&Fu.left==0;
console.log(pass?'PASS':'FAIL');await b.close();process.exit(pass?0:1)})()
