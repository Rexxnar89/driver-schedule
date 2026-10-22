// Headless conflict-math + override-visibility regression. Usage: node tests/conflict.js <url>
const p=require('puppeteer-core');(async()=>{const b=await p.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});const pg=await b.newPage();pg.on('dialog',d=>d.accept());pg.on('pageerror',e=>console.log('ERR',e.message));await pg.setViewport({width:375,height:800});await pg.goto(process.argv[2]);await pg.waitForFunction('LIVE',{timeout:120000});
const r=await pg.evaluate(async()=>{const D=(d,h,m=0)=>new Date(2027,0,d,h,m);const mk=(u,d,h,ret,o={})=>Object.assign({uid:u,driver:'TD',start:D(d,h),ret,title:'TD, Ford Van, 2 Test from A to B',client:'Test',vehicle:'Ford Van'},o);
jobs.push(mk('cA',5,8,'10am'),mk('cO',8,22,'2am'),mk('cX',12,8,'10am',{canceled:true}),mk('cV',15,8,'10am',{driver:'TD2',title:'TD2, Ford Van, 2 V from A to B'}),mk('cZ',28,8,'10am',{driver:'TD3',vehicle:'',title:'TD3, x, 1 Z from A to B'}));fillDrv();
const T=(n,s,e,B,want)=>{const h=busyAt('TD',s,e).length,nr=busyAt('TD',s,e,B).length;const got=h?'conflict':nr?'buffer warning':'ok';return{case:n,want,got,pass:got==want}};const out=[
T('exact overlap 8-10',D(5,8),D(5,10),30,'conflict'),
T('partial overlap 9-11',D(5,9),D(5,11),30,'conflict'),
T('back-to-back 10-11, buffer 0',D(5,10),D(5,11),0,'ok'),
T('back-to-back 10-11, buffer 30',D(5,10),D(5,11),30,'buffer warning'),
T('gap 15 < buffer 30',D(5,10,15),D(5,11),30,'buffer warning'),
T('gap 30 == buffer 30',D(5,10,30),D(5,11),30,'ok'),
T('ends == other start (6-8)',D(5,6),D(5,8),0,'ok'),
T('overnight: 10pm-2am job vs new 1am next day',D(9,1),D(9,3),30,'conflict'),
T('overnight: new 2:15am (gap<buffer)',D(9,2,15),D(9,4),30,'buffer warning'),
T('overnight: new 2:30am (gap==buffer)',D(9,2,30),D(9,4),30,'ok'),
T('new job crossing midnight into existing',D(4,23),D(5,8,30),30,'conflict'),
T('canceled job exact overlap',D(12,8),D(12,10),30,'ok')];
// UI override
const ui={};const set=(id,v)=>{$(id).value=v;$(id).dispatchEvent(new Event('input',{bubbles:true}));$(id).dispatchEvent(new Event('change',{bubbles:true}))};
show('newjob');const w=ms=>new Promise(r=>setTimeout(r,ms));
fillDrv&&0;['TD','TD3'].forEach(x=>{if(![...nd.options].some(o=>o.value==x))nd.add(new Option(x,x))});
$('nv').value='';set('nd','TD');set('npd','2027-01-05');set('npt','09:00');nbuf.value=30;avail();await w(300);ui.conflictShown=!$('ovrl').classList.contains('hide');ovr.checked=true;
set('nd','TD3');avail();await w(300);ui.afterDriverSwitch_hidden=$('ovrl').classList.contains('hide');ui.dbg=[CF,nv.value,($('vstat')||{}).textContent,($('eqstat')||{}).textContent,$('avail').textContent.slice(0,200)];ui.unchecked=!ovr.checked;
set('nd','TD');avail();await w(300);ui.backConflict=!$('ovrl').classList.contains('hide');set('npt','13:00');avail();await w(300);ui.outsideBuffer_hidden=$('ovrl').classList.contains('hide');
// vehicle time conflict with other driver
set('nd','TD3');set('npd','2027-01-15');set('npt','09:00');try{setVeh('Ford Van')}catch(e){$('nv').value='Ford Van'}avail();try{vehCheck()}catch(e){}await w(300);ui.vehBlocked=!!bookBlock();ui.vehMsg=($('vstat').textContent||'').slice(0,80);try{setVeh('Chevy Van')}catch(e){$('nv').value='Chevy Van'}avail();try{vehCheck()}catch(e){}await w(300);ui.vehClear_blocked=!!bookBlock();ui.vehClearMsg=($('vstat').textContent||'').slice(0,60);ui.vuov_hidden=$('vuov')?$('vuov').classList.contains('hide')||getComputedStyle($('vuov')).display=='none':'n/a';
return{out,ui}});console.log(JSON.stringify(r,null,1));const ok=r.out.every(x=>x.pass)&&r.ui.conflictShown&&r.ui.afterDriverSwitch_hidden&&r.ui.unchecked&&r.ui.outsideBuffer_hidden&&r.ui.vehBlocked&&!r.ui.vehClear_blocked;console.log(ok?'PASS':'FAIL');await b.close();process.exit(ok?0:1)})()
