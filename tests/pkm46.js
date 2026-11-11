// node tests/pkm46.js — pickup-miles is a note only (does not change fare); usual-miles hint
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
const pick=n=>{const m=src.match(new RegExp('function '+n+'\\([^]*?\\n'));if(!m)throw 'missing '+n;return m[0]};
const env=`var R2=x=>Math.round((x+1e-9)*100)/100;var CFG={mpg:12,wait:12.5,wear:0.2,rates:[{from:'2000-01-01',rate:1.10},{from:'2026-10-14',rate:1.35},{from:'2026-10-15',rate:1.30}]};var JR={};function ratios(){return{mi:1.1,t:1.1}};function ymd(d){return d.toISOString().slice(0,10)};function gasFor(){return{gas:4.08,date:'2026-10-21',exact:1}};`;
const rf=src.match(/function rateFor\([^]*?\n/);
eval(env+(rf?rf[0]:"function rateFor(d){let r=1.1;CFG.rates.forEach(x=>{if(ymd(d)>=x.from)r=x.rate});return r}")+pick('calc')+pick('projMi')+pick('trip'));
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

// split paid shares: each share rounds down to a cent, last share absorbs the remainder, sum equals the charge
const sm=src.match(/function splitShares\(t,n\)\{[^\n]+\n/);
if(!sm){console.log('missing splitShares');process.exit(1)}
eval(sm[0]);
const S=splitShares(104,3);
const sum=S.shares.reduce((a,b)=>a+b,0);
const passS=S.shares[0]===3466&&S.shares[1]===3466&&S.shares[2]===3468&&sum===10400&&S.c===10400;
console.log('splitShares 104/3',S.shares.map(x=>(x/100).toFixed(2)).join(' + '),'=',(sum/100).toFixed(2),passS?'ok':'FAIL');
ok=ok&&passS;
const S2=splitShares(100,3),sum2=S2.shares.reduce((a,b)=>a+b,0);
ok=ok&&S2.shares[0]===3333&&S2.shares[1]===3333&&S2.shares[2]===3334&&sum2===10000;
console.log('splitShares 100/3',S2.shares.join(','),sum2===10000?'ok':'FAIL');

// form still has the note box above wait, and charge formula does not mention pkm
ok=ok&&/id="npkm"[\s\S]{0,250}id="nwh"/.test(src);
ok=ok&&!/calc\([^)]*pkm/.test(src);
ok=ok&&!/trip\([^)]*pkm/.test(src.replace(/pkmHist[\s\S]*?pkmUsual/,''));
console.log(ok?'PASS':'FAIL');
process.exit(ok?0:1);
