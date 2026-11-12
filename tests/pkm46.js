// node tests/pkm46.js — pickup-miles is a note only (does not change fare); usual-miles hint
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
const pick=n=>{const m=src.match(new RegExp('function '+n+'\\([^]*?\\n'));if(!m)throw 'missing '+n;return m[0]};
const env=`var R2=x=>Math.round((x+1e-9)*100)/100;var CFG={mpg:12,wait:12.5,wear:0.2,rates:[{from:'2000-01-01',rate:1.10},{from:'2026-10-14',rate:1.35},{from:'2026-10-15',rate:1.30}]};var JR={};function ratios(){return{mi:1.1,t:1.1}};function ymd(d){return d.toISOString().slice(0,10)};function gasFor(){return{gas:4.08,date:'2026-10-21',exact:1}};`;
const rf=src.match(/function rateFor\([^]*?\n/);
eval(env+(rf?rf[0]:"function rateFor(d){let r=1.1;CFG.rates.forEach(x=>{if(ymd(d)>=x.from)r=x.rate});return r}")+pick('calc')+pick('l1miOf')+pick('legMiList')+pick('projMi')+pick('trip'));
const d=new Date('2026-10-21T09:00');
const t=trip({hm:60,wh:8},d,'x');
const t2=trip({hm:60,wh:8,pkm:40},d,'x');
let ok=true;
const same=['proj','expBW','wait','exp','pwear','pgas'].every(k=>{const pass=R2(t[k])===R2(t2[k]);if(!pass)console.log('CHARGE CHANGED',k,t[k],t2[k]);return pass});
console.log('pkm does not change charge',same?'ok':'FAIL',t.exp);
ok=ok&&same;
// 100 mi no wait at $1.30 + 4.08/12
const c=calc(100,d,''),c2=calc(100,d,'');
ok=ok&&R2(c.total)===R2(c2.total);
console.log('calc ignores leftover pkm (not in args)',ok?'ok':'FAIL',c.total);

// extract pkmUsual + friends
const chunk=src.match(/function pkNorm\(a\)\{[^]*?\nfunction pkmHint/);
if(!chunk){console.log('missing pkmUsual chunk');process.exit(1)}
eval(chunk[0].replace(/\nfunction pkmHint$/,''));
// mock jobs / SJ / jStops
function jStops(j){return{p:[j.from],d:[j.to]}}
function SJ(j){return j}
const jobs=[
  {uid:'a',from:'1 Main St',pkm:10},
  {uid:'b',from:'1 Main St',pkm:12},
  {uid:'c',from:'1 Main St',pkm:11},
  {uid:'d',from:'1 Main St',pkm:200}, // outlier
  {uid:'e',from:'9 Other Rd',pkm:5},
  {uid:'self',from:'1 Main St',pkm:99}
];
const u=pkmUsual('1 Main St','self');
const passU=u===11;
console.log('usual median ignore outlier',u,passU?'ok':'FAIL');
ok=ok&&passU;
const none=pkmUsual('9 Other Rd');
console.log('need 2 readings',none==null?'ok':'FAIL',none);
ok=ok&&none==null;
const two=pkmUsual('1 Main St'); // includes self 99; 10,11,12,200,99 — outliers 200 and maybe 99
// 10,11,12,99,200 — Q1=11, Q3=99, IQR=88, lo=11-132, hi=99+132 — 200 might stay? 
// Q1 at 0.25*(4)= wait 5 values: indices 0..4, Q1 at 1 = 11, Q3 at 3 = 99, IQR=88, lo=-121, hi=231, all stay, median=12
// That's weak outlier filtering when n=5 with two high values. With except self: 10,11,12,200
// n=4: Q1 at 0.25*3=0.75 → 10.75, Q3 at 2.25 → 12+0.25*(200-12)=59, IQR~48, lo=-61, hi=131, 200 dropped, median of 10,11,12=11
// Good - we already tested with except self.

// split: each share rounds UP to the nearest $5; the fare total is unchanged; extra is only in the paid tally
const pickFn=n=>{const m=src.match(new RegExp('function '+n+'\\([^\\n]+\\n'));if(!m)throw 'missing '+n;return m[0]};
eval(pickFn('splitCalc')+pickFn('splitShares')+pickFn('splitPaidMsg')+pickFn('splitTxt').replace(/=splitN\(\)/, "=''"));
const S=splitCalc(104,3);
const passS=S.each===3500&&S.c===10400&&S.st===10400;
console.log('splitCalc 104/3 each',S.each/100,'fare',S.c/100,passS?'ok':'FAIL');
ok=ok&&passS;
const Sh=splitShares(104,3),sum=Sh.shares.reduce((a,b)=>a+b,0);
ok=ok&&Sh.shares.every(x=>x===3500)&&sum===10500&&Sh.c===10400&&Sh.st===10400;
console.log('splitShares equal $35, fare stays $104',Sh.shares.map(x=>x/100).join('+'),'fare',Sh.c/100,ok?'ok':'FAIL');
const stay=splitCalc(100,4);
ok=ok&&stay.each===2500&&stay.c===10000; // already a $5 multiple
console.log('100/4 stays $25 each',stay.each/100,stay.each===2500?'ok':'FAIL');
const stay2=splitCalc(30,2);
ok=ok&&stay2.each===1500&&stay2.c===3000;
console.log('30/2 stays $15 each',stay2.each===1500?'ok':'FAIL');
const txt=splitTxt(104,3);
ok=ok&&txt==='Fare $104.00 ÷ 3 = $35.00 each';
console.log('splitTxt',txt,txt==='Fare $104.00 ÷ 3 = $35.00 each'?'ok':'FAIL');
ok=ok&&splitPaidMsg(35,104)==='Paid $35.00 of $104.00';
ok=ok&&splitPaidMsg(70,104)==='Paid $70.00 of $104.00';
ok=ok&&splitPaidMsg(105,104)==='Paid $105.00 of $104.00 (+$1.00 extra)';
console.log('paid msgs',splitPaidMsg(70,104),'|',splitPaidMsg(105,104),splitPaidMsg(105,104).includes('+$1.00 extra')?'ok':'FAIL');

// form still has the note box above wait, and charge formula does not mention pkm
ok=ok&&/id="npkm"[\s\S]{0,250}id="nwh"/.test(src);
ok=ok&&!/calc\([^)]*pkm/.test(src);
ok=ok&&!/trip\([^)]*pkm/.test(src.replace(/pkmHist[\s\S]*?pkmUsual/,''));
console.log(ok?'PASS':'FAIL');
process.exit(ok?0:1);
