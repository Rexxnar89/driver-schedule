// TEST MODE isolation test: live localStorage must be byte-identical after using test mode. Usage: node tests/testmode.js <url>
const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});const pg=await b.newPage();const dl=[];pg.on('dialog',d=>{dl.push(d.message().slice(0,40));d.accept()});pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:375,height:800});const U=process.argv[2];
await pg.goto(U);await pg.waitForFunction('LIVE',{timeout:120000});await new Promise(r=>setTimeout(r,3000));
const snap=()=>{const R=window.__RLS,o={};for(let i=0;i<R.length;i++){const k=R.key(i);if(!k.startsWith('TEST:')&&k!='__testmode')o[k]=R.getItem(k)}return JSON.stringify(Object.keys(o).sort().map(k=>[k,o[k]]))};
const S1=await pg.evaluate(`(${snap})()`);
await Promise.all([pg.waitForNavigation(),pg.evaluate(()=>tmEnter())]);await pg.waitForFunction('LIVE',{timeout:120000});
const r=await pg.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));const o={tm:TESTMODE,banner:!!$('tmban')};const j=jobs.find(j=>!j.block);setSt(j.uid,'mi','999');LS.drivers=JSON.stringify(['ZZ test']);localStorage.setItem('draft','{"x":1}');localStorage.removeItem('vehdb');try{clStore&&0}catch(e){}
const before=TM_BLOCKED.length;await fetch(LS.syncurl||'https://script.google.com/macros/s/x/exec',{method:'POST',body:'{"action":"savejob"}'});await fetch((LS.syncurl||'https://script.google.com/macros/s/x/exec')+'?action=rows');o.blocked=TM_BLOCKED.length-before;
const bl=new Blob(['BEGIN:VCALENDAR\nSUMMARY:BB, Ford Van, 2 X from A to B\nEND:VCALENDAR'],{type:'text/calendar'});o.icsTitle=(await bl.text()).match(/SUMMARY:.*/)[0];const a=document.createElement('a');a.href='data:text/plain,x';a.download='job.ics';a.click();o.dlName=a.download;o.readBack=SJ(j).mi;await w(1500);return o});
const S2=await pg.evaluate(`(${snap})()`);
await Promise.all([pg.waitForNavigation(),pg.evaluate(()=>tmExit())]);await pg.waitForFunction('LIVE',{timeout:120000});
const r2=await pg.evaluate(()=>({tm:TESTMODE,banner:!!document.getElementById('tmban'),drivers:localStorage.drivers}));
// calendar opens on today
const cal=await pg.evaluate(async()=>{sessionStorage.calv=JSON.stringify({mode:'week',d:'2026-01-01'});show('cal');await new Promise(r=>setTimeout(r,200));return{d:CALS().d,mode:CALS().mode,today:ymdL(new Date()),scrollTop:$('calscroll').scrollTop}});
const ok=r.tm&&r.banner&&r.blocked==2&&/SUMMARY:TEST /.test(r.icsTitle)&&r.dlName=='TEST-job.ics'&&r.readBack=='999'&&S1===S2&&!r2.tm&&!r2.banner&&r2.drivers!=JSON.stringify(['ZZ test']);
console.log(JSON.stringify({test:r,liveIdentical:S1===S2,liveBytes:S1.length,afterExit:r2,cal,dialogs:dl},null,1));console.log(ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1)})()
