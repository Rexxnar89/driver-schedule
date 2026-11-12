// node tests/splitgap46.js — split-job gap is not blocked; later-leg miles default from Leg 1 and enter the charge
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
function pick(name){
  const m=src.match(new RegExp('function '+name+'\\([\\s\\S]*?\\n(?=function )'));
  if(!m) throw new Error('missing '+name);
  return m[0];
}
function R2(x){return Math.round((+x)*100)/100}
const store={};
function ST(){return store}
function STR(){return store}
function SJ(j){return {...(store[j.uid]||{}),...(j._S||{})}}
function ttOf(j){return SJ(j).tt||j.tt||'rt'}
function owEnd(j){return j.endT||new Date(+j.start+36e5)}
function span(j,dur){const s=j.start;let e=null;if(j.endT&&s&&+j.endT>+s)e=new Date(+j.endT);if(!e||e<=s)e=new Date(+s+(dur||1)*3600e3);return[s,e]}
const JR={};
function ratios(){return{mi:1}}
const CFG={mpg:12,wait:12.5,wear:0};
function rateFor(){return 1.30}
function gasFor(){return{gas:0,date:'',exact:true}}
eval(pick('legSpansOf'));
eval(pick('spans'));
eval(pick('l1miOf'));
eval(pick('legMiList'));
eval(pick('projMi'));
eval(pick('calc'));

let ok=true;
const chk=(c,t)=>{if(!c){ok=false;console.log('FAIL',t)}else console.log(t,'ok')};

const t9=new Date('2026-11-12T09:00:00');
const t10=new Date('2026-11-12T10:00:00');
const t11=new Date('2026-11-12T11:00:00');
const t13=new Date('2026-11-12T13:00:00');
const t14=new Date('2026-11-12T14:00:00');
const t15=new Date('2026-11-12T15:00:00');
const t17=new Date('2026-11-12T17:00:00');

// single-leg: unchanged (one span, start→endT)
const one={uid:'ONE',start:t9,endT:t10,driver:'BB',_S:{}};
store.ONE={};
const S1=spans(one);
chk(S1.length===1&&+S1[0][0]===+t9&&+S1[0][1]===+t10,'single-leg one span 9–10');

// multi-leg whose Proton endT covers the afternoon: first leg clamps, gap stays free, later leg blocks
store.SG={eh:1,legs:[{t:t14.toISOString(),drv:'BB',d:60,done:0}]};
const sg={uid:'SG',start:t9,endT:t17,driver:'BB'};
const S=spans(sg);
const covers=(sp,a,b)=>sp.some(([x,y])=>+x<+b&&+y>+a);
chk(S.length===2,'multi-leg has 2 busy spans');
chk(covers(S,t9,t10)&&!covers(S,t11,t13)&&covers(S,t14,t15),'gap 11–13 free; 9–10 and 14–15 blocked');
chk(+S[0][1]<=+t11,'first span does not run into the midday gap');

// trip-type split halves
store.SP={tt:'split',eh:1,homeH:0,rhT:+t10,rpt:t14.toISOString(),srT:+t15};
const sp={uid:'SP',start:t9,endT:t17,tt:'split'};
const S2=spans(sp);
chk(S2.length===2&&!covers(S2,t11,t13)&&covers(S2,t9,t10)&&covers(S2,t14,t15),'split trip-type gap 11–13 free');

// miles: no per-leg values → existing emi (single/multi unchanged)
store.E={emi:30,legs:[{t:t14.toISOString(),d:60}]};
chk(projMi(store.E,'E').mi===30,'no leg-miles yet: charge still uses emi 30');
const none={emi:80};
chk(projMi(none,'X').mi===80,'single-leg emi 80 unchanged');

// Leg 1 30 → Leg 2 auto 30, charge uses 60
store.M={l1mi:30,legs:[{t:t14.toISOString(),d:60,mi:30,miAuto:1}]};
const P=projMi(store.M,'M');
chk(P.mi===60,'Leg 1 30 + auto Leg 2 30 → 60 mi');
const c30=calc(30,t9,''),c60=calc(60,t9,'');
chk(c30.total===39&&c60.total===78,'charge 30 mi $39.00 → 60 mi $78.00 (rate $1.30, no fuel)');

// typed later-leg value is kept when Leg 1 changes (legMiList with miEd)
store.K={l1mi:40,legs:[{t:t14.toISOString(),d:60,mi:35,miEd:1}]};
chk(projMi(store.K,'K').mi===75,'edited Leg 2 35 + new Leg 1 40 → 75, not overwritten to 80');

// auto later leg follows Leg 1 (empty mi, not miEd)
store.A={l1mi:40,legs:[{t:t14.toISOString(),d:60,miAuto:1}]};
chk(legMiList(store.A).join(',')==='40,40','unedited later leg still follows Leg 1');

chk(l1miOf({emi:80})===0&&l1miOf({l1mi:30})===30,'l1mi is its own field, not silently copied from emi');

if(!ok){console.log('FAIL');process.exit(1)}
console.log('PASS');
