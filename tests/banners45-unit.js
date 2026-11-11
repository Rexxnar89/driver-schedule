// node tests/banners45-unit.js — banner vs vehicle vs overnight; availability excluded from driving
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
const chunk=src.match(/function isVehEvt\(j\)\{[^]*?\nfunction locPD/);
if(!chunk){console.log('missing isVehEvt chunk');process.exit(1)}
eval(chunk[0].replace(/\nfunction locPD$/,''));
function spans(j){return j.endT?[[j.start,j.endT]]:[[j.start,new Date(+j.start+36e5)]]}
let ok=true;
const at=(d,h,m)=>{const x=new Date(d);x.setHours(h,m||0,0,0);return x};
const day0=new Date('2026-11-02T00:00:00'); // Mon
const allDay={start:new Date('2026-11-02T00:00:00'),endT:new Date('2026-11-03T00:00:00'),title:'Off work',raw:'Off work'};
const veh={start:new Date('2026-11-02T00:00:00'),endT:new Date('2026-11-03T00:00:00'),title:'Ford Van in shop',raw:'Ford Van in shop',vehicle:'Ford Van'};
const vehTitle={start:new Date('2026-11-02T00:00:00'),endT:new Date('2026-11-03T00:00:00'),title:'Chevy in the yard',raw:'Chevy in the yard'};
const avail={start:at(day0,6,30),endT:at(new Date('2026-11-05T00:00:00'),17,0),title:'Available TILL 5PM',raw:'Available TILL 5PM'};
const overnight={start:at(day0,22,0),endT:at(new Date('2026-11-03T00:00:00'),1,0),title:'Late ride',raw:'Late ride',client:'Sam'};
const job={start:at(day0,9,0),endT:at(day0,12,0),title:'Sam from A to B',raw:'Sam from A to B',client:'Sam'};
const xblock={start:at(day0,0,0),endT:new Date('2026-11-03T00:00:00'),title:'x off',raw:'x off',block:1};
const chk=(n,v,e)=>{const p=!!v===!!e;console.log(n,!!v,p?'ok':'FAIL');return p};
ok=chk('all-day banner',isBanner(allDay),true)&&ok;
ok=chk('vehicle field not banner',isBanner(veh),false)&&ok;
ok=chk('Chevy title not banner',isBanner(vehTitle),false)&&ok;
ok=chk('Available TILL 5PM Mon-Thu is banner',isBanner(avail),true)&&ok;
ok=chk('overnight job not banner',isBanner(overnight),false)&&ok;
ok=chk('normal job not banner',isBanner(job),false)&&ok;
ok=chk('drive job',isDriveJob(job),true)&&ok;
ok=chk('avail not drive',isDriveJob(avail),false)&&ok;
ok=chk('x block not drive',isDriveJob({...xblock,block:1,client:''}),false)&&ok;
ok=chk('no client not drive',isDriveJob({title:'Clara',raw:'Clara',start:day0}),false)&&ok;
ok=chk('vote no client not drive',isDriveJob({title:'VOTE · PICKUP VAL at 12:00',raw:'VOTE · PICKUP VAL at 12:00',start:day0}),false)&&ok;
console.log(ok?'PASS':'FAIL');
process.exit(ok?0:1);
