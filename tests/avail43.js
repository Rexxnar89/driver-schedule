// v43: "X Available TILL ..." calendar events are availability, not blocked time; only real unavailable spans (e.g. Fri-Sun wrapping into Sunday) block.
const fs=require('fs');const s=fs.readFileSync(__dirname+'/../index.html','utf8');
const m=s.match(/const blk=!p\.client&&(\/\^\(x[^\n]*?\/i)\.test/);if(!m){console.log('FAIL regex not found');process.exit(1)}
const re=eval(m[1]);let bad=0;const ok=(c,t)=>{if(!c){bad++;console.log('FAIL',t)}};
ok(!re.test('Jeffrey Available TILL 5:00PM Thursdays'),'available till must not block');
ok(re.test('Jeffrey unavailable'),'unavailable blocks');ok(re.test('x'),'x blocks');ok(re.test('Kaci no drives'),'no drives blocks');
// wrap check: weekly events Mon06:30-Thu17:00 (available) + Thu17:00-Sun23:59 (unavailable) -> blocked days Thu,Fri,Sat,Sun only
const ev=[['Jeffrey Available TILL 5:00PM Thursdays',new Date(2026,10,2,6,30),new Date(2026,10,5,17)],['Jeffrey unavailable',new Date(2026,10,5,17),new Date(2026,10,8,23,59)]];
const days=new Set();for(const[t,a,b]of ev)if(re.test(t))for(let d=new Date(a);d<b;d=new Date(+d+36e5))days.add(d.getDay());
ok([...days].sort().join()=='0,4,5,6','blocked weekdays '+[...days].sort().join());
console.log(bad?'FAIL':'ALL PASS');process.exit(bad?1:0)
