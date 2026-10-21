// node tests/regression.js — checks the app's trip math against Mike's Gas_Earnings_2026 Trips row for 2026-10-21
const fs=require('fs');const src=[...fs.readFileSync(__dirname+'/../index.html','utf8').matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const pick=n=>{const m=src.match(new RegExp('function '+n+'\\([^]*?\\n'));if(!m)throw 'missing '+n;return m[0]};
const env=`var R2=x=>Math.round((x+1e-9)*100)/100;var CFG={mpg:12,wait:12.5,wear:0.2,rates:[{from:'2000-01-01',rate:1.10},{from:'2026-10-14',rate:1.35},{from:'2026-10-15',rate:1.30}]};var JR={};function ratios(){return{mi:1.1,t:1.1}};function ymd(d){return d.toISOString().slice(0,10)};function gasFor(){return{gas:4.08,date:'2026-10-21',exact:1}};`;
const rf=src.match(/function rateFor\([^]*?\n/);eval(env+(rf?rf[0]:"function rateFor(d){let r=1.1;CFG.rates.forEach(x=>{if(ymd(d)>=x.from)r=x.rate});return r}")+pick('calc')+pick('projMi')+pick('trip'));
const t=trip({hm:60,wh:8},new Date('2026-10-21T09:00'),'x');
const exp={proj:120,expBW:196.8,wait:100,exp:296.8,pwear:24,pgas:40.8,powed:64.8};let ok=true;
for(const k in exp){const v=Math.round(t[k]*100)/100;const pass=v===exp[k];ok=ok&&pass;console.log(k.padEnd(6),v,'expected',exp[k],pass?'ok':'FAIL')}
const t2=trip({hm:60,wh:8,hmMode:'total',hmTot:120},new Date('2026-10-21T09:00'),'x');console.log('total-mode 120 →',t2.exp);ok=ok&&R2(t2.exp)===296.8;
console.log(ok?'PASS':'FAIL');process.exit(ok?0:1)
