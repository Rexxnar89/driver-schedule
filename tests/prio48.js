// node tests/prio48.js — unit: priSort + job.pd default/any vs named, last-resort exclusion
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
let bad=0;
const ok=(c,t)=>{if(!c){bad++;console.log('FAIL',t)}else console.log('ok',t)};

ok(/pd:\(window\.priName\?priName\(\):''\)/.test(src),'formJob stores job.pd');
ok(/id="priany"/.test(src)&&/id="pri"/.test(src),'checkbox #priany and dropdown #pri exist');
ok(/except last-resort/.test(src),'Any-driver hint mentions last-resort exclusion');
ok(!/<button[^>]*id="drvany"/.test(src),'Any-driver button markup removed');
ok(/A job set to Any driver also skips these/.test(src),'Owner last-resort blurb mentions Any-driver skip');
ok(/content="2026-11-25\.63"/.test(src),'app version is 2026-11-25.63');

const m=src.match(/window\.priSort=\(names,t,pri\)=>\{[\s\S]*?\};/);
ok(!!m,'priSort helper found');
if(m){
  const lrIs=(n)=>String(n)==='Kaci';
  global.window={lrIs}; global.lrIs=lrIs; eval(m[0]);
  const priSort=window.priSort;
  const names=['BB','Jeffrey','Jared','Kaci'];
  const any=priSort(names,Date.now(),'');
  ok(any[any.length-1]==='Kaci'&&any.slice(0,3).join()==='BB,Jeffrey,Jared','Any: last-resort Kaci sorts last, others keep order');
  const jeff=priSort(names,Date.now(),'Jeffrey');
  ok(jeff[0]==='Jeffrey'&&jeff[jeff.length-1]==='Kaci','Named priority Jeffrey first, Kaci still last');
  const kaci=priSort(names,Date.now(),'Kaci');
  ok(kaci[0]==='Kaci','Explicit last-resort priority sorts first');
  const keep=['Jeffrey','BB'];
  const same=priSort(keep,Date.now(),'');
  ok(same.join()==='Jeffrey,BB','Non-last-resort order preserved when no priority');
}

console.log(bad?'PRIO48 FAIL':'PRIO48 PASS');
process.exit(bad?1:0);
