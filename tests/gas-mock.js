// node tests/gas-mock.js : runs sheet-sync.gs against mocked SpreadsheetApp/ContentService/UrlFetchApp. Fake data only; prints no secret.
const fs=require('fs'),vm=require('vm');const src=fs.readFileSync(__dirname+'/../sheet-sync.gs','utf8');
const day=(o,h=9)=>{const d=new Date();d.setHours(h,0,0,0);d.setDate(d.getDate()+o);return d};
const ics=d=>{const p=n=>String(n).padStart(2,'0');return`${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}T${p(d.getHours())}0000`};
const ICS=['BEGIN:VCALENDAR',...[-3,0,1,30].flatMap((o,i)=>['BEGIN:VEVENT','UID:e'+i,'SUMMARY:Test '+i,'DTSTART:'+ics(day(o)),'END:VEVENT']),'BEGIN:VEVENT','UID:r','SUMMARY:Weekly','DTSTART:'+ics(day(-100)),'RRULE:FREQ=WEEKLY','END:VEVENT','END:VCALENDAR'].join('\r\n');
const sheet=rows=>({rows,getLastRow(){return rows.length},getLastColumn(){return rows[0].length},getRange(r,c,nr,nc){return{getValues:()=>rows.slice(r-1,r-1+nr).map(x=>x.slice(c-1,c-1+nc)),setValues(){},setFontWeight(){return this}}},appendRow(r){rows.push(r)},setFrozenRows(){}});
const T=Date.now();const S={Sync:sheet([['Key','Updated','By','Deleted','JSON'],['c:clients:1',T-5e5,'a',false,'{}'],['c:clients:2',T-1e5,'a',false,'{}'],['c:st:9',T-2e5,'a',false,'{}']]),
Vehicles:sheet([['k','kind','','','','','ts','json'],['veh:a','veh','','','','',T-9e5,'{"name":"A"}'],['veh:b','veh','','','','',T-1e4,'{"name":"B"}']]),
'Saved Jobs':sheet([['UID','Updated','Job JSON'],['u1',new Date(T-9e5),'{"a":1}'],['u2',new Date(T-1e4),'{"a":2}'],['p_old',new Date(T-90*864e5),JSON.stringify({start:new Date(T-60*864e5).toISOString()})],['p_new',new Date(T-2*864e5),JSON.stringify({start:new Date(T-60*864e5).toISOString()})],['f_old',new Date(T-90*864e5),JSON.stringify({start:new Date(T+5*864e5).toISOString()})]])};
const cache={};const ctx={console,Date,JSON,Math,String,Number,Array,Object,RegExp,
 SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>S[n]||null,insertSheet:n=>S[n]=sheet([])})},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({s,setMimeType(){return this}})},
 CacheService:{getScriptCache:()=>({get:k=>cache[k]||null,getAll:ks=>Object.fromEntries(ks.map(k=>[k,cache[k]])),put:(k,v)=>cache[k]=v,putAll:o=>Object.assign(cache,o)})},
 UrlFetchApp:{fetchAll:a=>a.map(()=>({getResponseCode:()=>200,getContentText:()=>ICS}))},
 LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},Session:{getScriptTimeZone:()=>'America/New_York'},Utilities:{formatDate:d=>d.toISOString().slice(0,10)}};
vm.createContext(ctx);vm.runInContext(src,ctx);const SEC=vm.runInContext('typeof SECRET!="undefined"?SECRET:""',ctx);
const get=q=>JSON.parse(ctx.doGet({parameter:{secret:SEC,...q}}).s);let fail=0;const ok=(n,c,x)=>{console.log((c?'PASS ':'FAIL ')+n+(x?' — '+x:''));if(!c)fail++};
const ev=o=>(o.cals||[]).map(c=>(c.ics.match(/UID:\w+/g)||[]).join(',')).join('|');
const ymd=d=>d.toISOString().slice(0,10);const td=day(0);const tds=`${td.getFullYear()}-${String(td.getMonth()+1).padStart(2,'0')}-${String(td.getDate()).padStart(2,'0')}`;
let o=get({action:'jobs'});ok('jobs unscoped -> today..+90d, no past',o.ok&&o.range&&o.range[1]-o.range[0]==90*864e5&&!/e0/.test(ev(o))&&/e1/.test(ev(o))&&/UID:r/.test(ev(o)),ev(o));
o=get({action:'jobs',all:'1'});ok('jobs all=1 (explicit full)',o.ok&&!o.range&&ev(o).split('|')[0].split(',').length==5);
o=get({action:'jobs',date:tds});ok('jobs date=today',o.range&&!/e0/.test(ev(o))&&/e1/.test(ev(o))&&!/e2/.test(ev(o))&&!/e3/.test(ev(o))&&/UID:r/.test(ev(o)),ev(o));
o=get({action:'jobs',scope:'upcoming'});ok('jobs scope=upcoming',o.range&&!/e0/.test(ev(o))&&/e1/.test(ev(o))&&/e3/.test(ev(o)),ev(o));
o=get({action:'jobs',from:+day(-5,0),to:+day(2,0)});ok('jobs from/to range',o.range&&/e0/.test(ev(o))&&/e2/.test(ev(o))&&!/e3/.test(ev(o)),ev(o));
o=get({action:'kvget',since:T-15e4});ok('kvget since',o.items.length==1&&o.items[0].k=='c:clients:2',o.items.map(x=>x.k));
o=get({action:'kvget'});ok('kvget legacy full',o.items.length==3);
o=get({action:'getvehicles',since:T-5e4});ok('getvehicles since',o.items.length==1&&o.items[0].key=='veh:b');
o=get({action:'getvehicles'});ok('getvehicles legacy',o.items.length==2);
o=get({action:'savedjobs',since:T-5e4});ok('savedjobs since',Object.keys(o.jobs).join()=='u2');
o=get({action:'savedjobs',since:T-3*864e5});ok('savedjobs since includes changed past job',Object.keys(o.jobs).includes('p_new')&&!Object.keys(o.jobs).includes('p_old'));
o=get({action:'savedjobs',from:+day(-70,0),to:+day(-50,0)});ok('savedjobs explicit past range',Object.keys(o.jobs).sort().join()=='p_new,p_old',Object.keys(o.jobs).join());
o=get({action:'savedjobs'});{const K=Object.keys(o.jobs).sort().join();ok('savedjobs since=0: future + changed<30d, no old past',K=='f_old,p_new,u1,u2',K)}
const v=get({action:'abver'});ok('abver',v.ver=='2:'+(T-1e5)&&v.n==2,v.ver.replace(/:\d+/,':<ts>'));
o=get({action:'abget',ver:v.ver});ok('abget same version -> no data',o.same===true&&!o.items);
o=get({action:'abget',ver:'0:0'});ok('abget changed -> clients only',o.same===false&&o.items.length==2&&o.items.every(x=>/^c:clients/.test(x.k)));
o=get({action:'abget',ver:'0:0',since:T-2e5});ok('abget changed + since',o.items.length==1);
o=JSON.parse(ctx.doGet({parameter:{action:'kvget',secret:'wrong'}}).s);ok('bad secret rejected',!o.ok);
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);
