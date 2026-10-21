/**
 * Driver Schedule <-> Driver_Schedule_2026 sync (bound Apps Script web app).
 * Writes ONLY to the "All Drivers" tab. Never touches Trips.
 * Deploy > Manage deployments > edit > New version (keeps the same /exec URL). Execute as: Me, Access: Anyone.
 */
const SECRET = 'CHANGE-ME-long-random-text';
const TAB = 'All Drivers';
const HEADERS = ['Date','Weekday','Driver','Client','Pickup','Destination','Return time','Miles','Base charge','Fuel cost','Total','Notes',
                 'Job ID','Wait hrs','Wait charge','Wear (owner)','Owed (owner)','Profit (owner)'];
// Same as Trips formulas: <2026-10-14 1.10, =2026-10-14 1.35, >=2026-10-15 1.30; 12 mpg; wait $12.50/hr; wear $0.20/mi.
const RATES = [{from:'2000-01-01',rate:1.10},{from:'2026-10-14',rate:1.35},{from:'2026-10-15',rate:1.30}];
const MPG = 12, WAIT = 12.5, WEAR = 0.20;
// Proton read-only share links (PRIVATE - only in the deployed script, never in the repo).
const FEEDS = [
  {name:'Pickup Jobs', url:'PASTE-PICKUP-JOBS-ICS-LINK'},
  {name:'Jay',         url:'PASTE-JAY-ICS-LINK'},
  {name:'Jared',       url:'PASTE-JARED-ICS-LINK'},
  {name:'Bruce',       url:'PASTE-BRUCE-ICS-LINK'},
  {name:'Kaci',        url:'PASTE-KACI-ICS-LINK'}
];
const CACHE_SECS = 240;
const KEEP = /^(BEGIN:VEVENT$|END:VEVENT$|(UID|SUMMARY|DTSTART|DTEND|RRULE|EXDATE|RECURRENCE-ID|STATUS)[;:])/;

function trimIcs_(s){ // keep only event lines the app needs, and only events that can fall in -14d..+90d
  const now = Date.now(), lo = now - 14*864e5, hi = now + 90*864e5;
  const ymd = d => Utilities.formatDate(new Date(d), 'America/New_York', 'yyyyMMdd');
  const LO = ymd(lo), HI = ymd(hi);
  const lines = s.replace(/\r?\n[ \t]/g,'').split(/\r?\n/);
  const out = []; let ev = null;
  lines.forEach(l => {
    if (l.indexOf('BEGIN:VEVENT')===0) { ev = [l]; return; }
    if (!ev) return;
    if (KEEP.test(l)) ev.push(l);
    if (l.indexOf('END:VEVENT')===0) {
      const txt = ev.join('\n');
      const ds = (txt.match(/^DTSTART[^:]*:(\d{8})/m)||[])[1] || '';
      const rr = (txt.match(/^RRULE:(.*)$/m)||[])[1] || '';
      let keep;
      if (rr) { const u = (rr.match(/UNTIL=(\d{8})/)||[])[1]; keep = ds <= HI && (!u || u >= LO); }
      else keep = ds >= LO && ds <= HI;
      if (keep) out.push(txt);
      ev = null;
    }
  });
  return out.join('\n');
}
function cacheGet_(c,k){ const n = c.get(k+':n'); if (!n) return null; const parts = c.getAll(Array.from({length:+n},(_,i)=>k+':'+i)); let s=''; for (let i=0;i<+n;i++){ const p = parts[k+':'+i]; if (p==null) return null; s+=p; } return s; }
function cachePut_(c,k,s){ const sz=90000, o={}; const n=Math.max(1,Math.ceil(s.length/sz)); for(let i=0;i<n;i++) o[k+':'+i]=s.substr(i*sz,sz); o[k+':n']=String(n); c.putAll(o,CACHE_SECS); }

function jobs_(force){
  const c = CacheService.getScriptCache();
  const ts = c.get('jobs:ts');
  if (!force && ts) {
    const cals = FEEDS.map(f => ({name:f.name, ics:cacheGet_(c,'cal:'+f.name)}));
    if (cals.every(x => x.ics != null)) return {ok:true, cached:true, age:Math.round((Date.now()-Number(ts))/1000), cals};
  }
  const res = UrlFetchApp.fetchAll(FEEDS.map(f => ({url:f.url, muteHttpExceptions:true})));
  const cals = FEEDS.map((f,i) => { const r = res[i]; const ok = r.getResponseCode()===200; const ics = ok ? trimIcs_(r.getContentText()) : ''; if (ok) cachePut_(c,'cal:'+f.name,ics); return {name:f.name, ics, status:r.getResponseCode()}; });
  c.put('jobs:ts', String(Date.now()), CACHE_SECS);
  return {ok:true, cached:false, age:0, cals};
}


function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}

function tab_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB);
  if (!sh) { sh = ss.insertSheet(TAB); sh.setFrozenRows(1); }
  sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight('bold'); // keeps headers current
  return sh;
}

function doGet(e){
  if ((e.parameter.secret||'') !== SECRET) return out_({ok:false,error:'bad secret'});
  if (e.parameter.action === 'jobs') return out_(jobs_(e.parameter.force === '1'));
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GasLookup');
  const v = sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
  const prices = {};
  v.forEach(r => { if (r[0] instanceof Date && typeof r[1] === 'number') prices[Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')] = r[1]; });
  return out_({ok:true, prices, rates:RATES, mpg:MPG, wait:WAIT, wear:WEAR});
}

function doPost(e){
  let b; try { b = JSON.parse(e.postData.contents); } catch(x) { return out_({ok:false,error:'bad json'}); }
  if (b.secret !== SECRET) return out_({ok:false,error:'bad secret'});
  if (b.action !== 'upsert' || !b.id || !Array.isArray(b.row)) return out_({ok:false,error:'bad request'});
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const sh = tab_();
    const last = sh.getLastRow();
    let r = 0;
    if (last >= 2) { const ids = sh.getRange(2,13,last-1,1).getValues(); for (let i=0;i<ids.length;i++) if (ids[i][0] === b.id) { r = i+2; break; } }
    if (!r) r = last + 1;
    const row = b.row, num = x => (x === '' || x == null || isNaN(Number(x))) ? '' : Number(x);
    // A-H values
    sh.getRange(r,1,1,8).setValues([[row[0],row[1],row[2],row[3],row[4],row[5],row[6],num(row[7])]]);
    const d = 'DATEVALUE(A'+r+')';
    const rate = 'IF('+d+'>=DATE(2026,10,15),1.3,IF('+d+'>=DATE(2026,10,14),1.35,1.1))';
    const gas = 'VLOOKUP('+d+',GasLookup!$A$2:$B$400,2,FALSE)';
    // I Base = trip total - fuel (excl. wait), J Fuel, K Total = ROUND(mi*(rate+gas/12),2) + wait charge
    sh.getRange(r,9,1,3).setFormulas([[
      '=IFERROR(IF(H'+r+'="","",ROUND(H'+r+'*('+rate+'+'+gas+'/'+MPG+'),2)-J'+r+'),"")',
      '=IFERROR(IF(H'+r+'="","",ROUND(H'+r+'*'+gas+'/'+MPG+',2)),"")',
      '=IFERROR(IF(H'+r+'="","",ROUND(H'+r+'*('+rate+'+'+gas+'/'+MPG+'),2)+N(O'+r+')),"")'
    ]]);
    // L Notes, M Job ID, N Wait hrs (values)
    sh.getRange(r,12,1,3).setValues([[row[11]||'', b.id, num(row[12])]]);
    // O Wait charge, P Wear, Q Owed, R Profit (owner-only formulas)
    sh.getRange(r,15,1,4).setFormulas([[
      '=IF(ISNUMBER(N'+r+'),ROUND(N'+r+'*'+WAIT+',2),"")',
      '=IF(H'+r+'="","",ROUND(H'+r+'*'+WEAR+',2))',
      '=IF(H'+r+'="","",ROUND(P'+r+'+N(J'+r+'),2))',
      '=IF(K'+r+'="","",ROUND(K'+r+'-P'+r+'-N(J'+r+'),2))'
    ]]);
    return out_({ok:true,row:r});
  } finally { lock.releaseLock(); }
}
