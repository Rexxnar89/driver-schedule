// node tests/locorder45.js — Proton LOCATION order: pickup first, last is drop-off; one address = pickup
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../index.html','utf8');
const m=src.match(/function locPD\(pickups,dropoffs\)\{[^]*?\nfunction /);
if(!m){console.log('missing locPD');process.exit(1)}
eval(m[0].replace(/\nfunction $/,''));
const eq=(a,b,n)=>{const ok=a===b;console.log(n,ok?'ok':'FAIL',JSON.stringify(a),'expected',JSON.stringify(b));return ok};
let ok=true;
ok=eq(locPD(['123 Main St'],['9 Oak Ave']),'123 Main St & 9 Oak Ave','two addresses')&&ok;
ok=eq(locPD(['A','B'],['C']),'A & B & C','pickup then stops then drop-off')&&ok;
ok=eq(locPD(['Only St'],[]),'Only St','one address is pickup')&&ok;
ok=eq(locPD([],['Only St']),'Only St','lone drop-off still one address')&&ok;
ok=eq(locPD(['A','B'],['C','D']),'A & B & C & D','two pickups two drop-offs, last is drop-off')&&ok;
ok=eq(locPD(['  A  '],['']),'A','trim blanks')&&ok;
ok=eq(locPD([],[]),'','empty')&&ok;
// ICS writer uses locPD
ok=/LOCATION:\$\{locPD\(stops\('pks'\),stops\('dos'\)\)/.test(src)&&ok;
ok=/const loc=locPD\(T\.p,T\.d\)/.test(src)&&ok;
console.log(ok?'PASS':'FAIL');
process.exit(ok?0:1);
