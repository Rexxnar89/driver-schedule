// node tests/availcard46.js — availability cards vs blocks; completed-leg list sort
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
function pick(name){
  const m=src.match(new RegExp('function '+name+'\\([\\s\\S]*?\\n(?=function )'));
  if(!m) throw new Error('missing '+name);
  return m[0];
}
function isVehEvt(j){if(!j)return false;if(j.vehicle)return true;const t=String(j.raw||j.title||j.client||'');return /\b(ford|chevy|chevrolet|pilot|durango|subaru|van|vehicle|trailer)\b/i.test(t)}
function SJ(j){return j._S||{}}
function LG(u){return (global.LEGS||{})[u]||[]}
function spans(j){return j.endT?[[j.start,j.endT]]:[[j.start,new Date(+j.start+36e5)]]}
eval(pick('isDriveJob')+pick('isAvailEvt')+pick('evUntil')+pick('overlapsDay')+pick('nextOpenAt')+pick('listTime'));

let ok=true;
const chk=(c,t)=>{if(!c){ok=false;console.log('FAIL',t)}else console.log(t,'ok')};

const av={uid:'A',start:new Date('2026-11-12T06:30:00'),endT:new Date('2026-11-12T17:00:00'),driver:'BB',raw:'Jeffrey Available TILL 5:00PM Thursdays',title:'Jeffrey Available TILL 5:00PM Thursdays',block:false};
const un={uid:'U',start:new Date('2026-11-12T17:00:00'),endT:new Date('2026-11-15T23:59:00'),driver:'BB',raw:'Jeffrey unavailable',title:'Jeffrey unavailable',block:true};
const xb={uid:'X',start:new Date('2026-11-12T09:00:00'),endT:new Date('2026-11-12T12:00:00'),driver:'BB',raw:'x TEST off',title:'x TEST off',block:true};
const job={uid:'J',start:new Date('2026-11-12T08:30:00'),endT:new Date('2026-11-12T09:30:00'),driver:'BB',client:'Rider A',title:'Rider A',raw:'Rider A from 1 A St to 2 B Ave'};
const veh={uid:'V',start:new Date('2026-11-12T00:00:00'),endT:new Date('2026-11-12T01:00:00'),driver:'BB',vehicle:'Ford Van',title:'Ford Van',raw:'Ford Van'};

chk(isAvailEvt(av)&&!isDriveJob(av),'available till is an avail card, not a drive job');
chk(!isAvailEvt(un)&&!isAvailEvt(xb)&&un.block&&xb.block,'unavailable and x stay blocks, not avail cards');
chk(!isAvailEvt(job)&&isDriveJob(job),'real job is not an avail card');
chk(!isAvailEvt(veh),'vehicle event is not an avail card');

const t0=new Date('2026-11-12T00:00:00'),t1=new Date('2026-11-13T00:00:00');
const mid=new Date('2026-11-13T00:00:00'),mid1=new Date('2026-11-14T00:00:00');
const multi={...av,start:new Date('2026-11-10T06:30:00'),endT:new Date('2026-11-13T17:00:00')};
chk(overlapsDay(multi,t0,t1)&&overlapsDay(av,t0,t1),'avail event overlapping today is on today');
chk(!overlapsDay(job,new Date('2026-11-11T00:00:00'),t0),'a yesterday job is not on today');

// sort: completed 8am leg with Leg 2 at 2pm sits at 2pm, after an 8:30 appointment
const eight={uid:'E8',start:new Date('2026-11-12T08:00:00'),endT:new Date('2026-11-12T09:00:00'),driver:'BB',client:'Early',_S:{l1done:Date.now()}};
eight._S.legs=[{t:'2026-11-12T14:00:00',drv:'BB',done:0,d:60}];
const half={uid:'H',start:new Date('2026-11-12T08:30:00'),endT:new Date('2026-11-12T09:30:00'),driver:'BB',client:'Later',_S:{}};
const done={uid:'D',start:new Date('2026-11-12T07:00:00'),endT:new Date('2026-11-12T08:00:00'),driver:'BB',client:'Done',_S:{st:'Done'}};
chk(nextOpenAt(eight)===+new Date('2026-11-12T14:00:00'),'next open leg is 2 PM');
chk(listTime(eight)>listTime(half)&&listTime(half)>listTime({start:new Date('2026-11-12T08:00:00'),_S:{}}),'8:00 done-leg sorts after 8:30 upcoming');
chk(listTime(done)>listTime(eight),'fully done sorts after upcoming items');
const ord=[av,eight,half,done].sort((a,b)=>listTime(a)-listTime(b)||(+a.start)-(+b.start)).map(j=>j.uid);
chk(ord.join(',')==='A,H,E8,D','list order: avail 6:30, 8:30 appt, 8:00 job@2pm, then fully done');

if(!ok){console.log('FAIL');process.exit(1)}
console.log('PASS');
