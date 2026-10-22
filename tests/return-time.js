// Headless regression: a manually typed return time must stick (all trip types), survive other edits, draft reload and Save job.
// Usage: node tests/return-time.js <url>   (needs puppeteer-core + Chrome; PUPPETEER_CORE path via NODE_PATH)
const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox','--lang=en-US'],headless:'new'});const pg=await b.newPage();pg.on('dialog',d=>d.accept());await pg.setViewport({width:375,height:800});await pg.goto(process.argv[2]);await pg.waitForFunction('typeof LIVE!="undefined"&&LIVE',{timeout:120000});
const W=ms=>new Promise(r=>setTimeout(r,ms));let ok=true;
const typeInto=async id=>{await pg.$eval('#'+id,e=>e.scrollIntoView({block:'center'}));const bb=await (await pg.$('#'+id)).boundingBox();await pg.mouse.click(bb.x+14,bb.y+bb.height/2);await pg.keyboard.type('0415P')};
for(const tt of ['rt','split','ow']){await pg.evaluate(async tt=>{localStorage.removeItem('draft');cancelEdit();show('newjob');nd.value='BB';nc.value='Smith';ndt.value='2026-10-23T08:00';setStops('pks','Berlin, OH');setStops('dos','Wooster, OH');setTT(tt);ttChg();jobTitle();for(let i=0;i<40&&!nm.value;i++)await new Promise(r=>setTimeout(r,300));await rptCalc();retUI()},tt);await W(1200);
 const ids=tt=='split'?['nrtm','nrht','nsrt']:['nrtm'];for(const id of ids){await typeInto(id);await W(2500)}await pg.evaluate(()=>document.activeElement.blur());
 // edit other fields, let estimates rerun
 await pg.evaluate(async()=>{nwh.value='3';nwh.dispatchEvent(new Event('input'));ndt.value='2026-10-23T08:30';ndt.dispatchEvent(new Event('change'));jobTitle();estRoute(1);await new Promise(r=>setTimeout(r,3000));retUI();await new Promise(r=>setTimeout(r,800))});
 const v1=await pg.evaluate(ids=>ids.map(i=>$(i).value),ids);
 // draft reload
 await W(600);await pg.reload();await pg.waitForFunction('typeof LIVE!="undefined"&&LIVE',{timeout:120000});await pg.evaluate(async()=>{show('newjob');await new Promise(r=>setTimeout(r,3000));retUI()});
 const v2=await pg.evaluate(ids=>ids.map(i=>$(i).value),ids);
 // Save job, then reopen it in Edit
 const v3=await pg.evaluate(async(ids)=>{NUID='rtt'+Date.now()+'@x';const u=NUID;await saveJob();await new Promise(r=>setTimeout(r,800));editJob((jobs.find(x=>x.uid==u||x.evuid==u)||{}).uid);await new Promise(r=>setTimeout(r,2500));const o=ids.map(i=>$(i).value);try{delete JSON.parse(localStorage.saved||'{}')[u]}catch(e){}cancelEdit();return o},ids);
 const pass=[v1,v2,v3].every(v=>v.every(x=>x=='16:15'));ok=ok&&pass;console.log(tt,'after edits',v1,'after reload',v2,'after save+edit',v3,pass?'ok':'FAIL')}
await b.close();console.log(ok?'PASS':'FAIL');process.exit(ok?0:1)})()
