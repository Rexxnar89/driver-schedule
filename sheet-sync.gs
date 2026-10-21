/**
 * Driver Schedule <-> Driver_Schedule_2026 sync (bound Apps Script web app).
 * Writes ONLY to the "All Drivers" tab. Never touches Trips.
 * Setup: Extensions > Apps Script, paste this, set SECRET below, Deploy > New deployment >
 * Web app, Execute as: Me, Who has access: Anyone. Copy the /exec URL into the app (Owner tab).
 */
const SECRET = 'CHANGE-ME-long-random-text';
const TAB = 'All Drivers';
const HEADERS = ['Date','Weekday','Driver','Client','Pickup','Destination','Return time','Miles','Base charge','Fuel cost','Total','Notes','Job ID'];
// Same rates as the Trips formulas: <2026-10-14 1.10, =2026-10-14 1.35, >=2026-10-15 1.30; 12 mpg.
const RATES = [{from:'2000-01-01',rate:1.10},{from:'2026-10-14',rate:1.35},{from:'2026-10-15',rate:1.30}];
const MPG = 12;

function out_(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}

function tab_(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB);
  if (!sh) { sh = ss.insertSheet(TAB); sh.getRange(1,1,1,HEADERS.length).setValues([HEADERS]).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}

function doGet(e){
  if ((e.parameter.secret||'') !== SECRET) return out_({ok:false,error:'bad secret'});
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GasLookup');
  const v = sh.getRange(2,1,sh.getLastRow()-1,2).getValues();
  const prices = {};
  v.forEach(r => { if (r[0] instanceof Date && typeof r[1] === 'number') prices[Utilities.formatDate(r[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')] = r[1]; });
  return out_({ok:true, prices, rates:RATES, mpg:MPG});
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
    const row = b.row;
    // A-H
    sh.getRange(r,1,1,8).setValues([[row[0],row[1],row[2],row[3],row[4],row[5],row[6],row[7]===''?'':Number(row[7])]]);
    // I-K formulas (same math as Trips sheet): Total=ROUND(mi*(rate+gas/12),2), Fuel=ROUND(mi*gas/12,2), Base=Total-Fuel
    const d = 'DATEVALUE(A'+r+')';
    const rate = 'IF('+d+'>=DATE(2026,10,15),1.3,IF('+d+'>=DATE(2026,10,14),1.35,1.1))';
    const gas = 'VLOOKUP('+d+',GasLookup!$A$2:$B$400,2,FALSE)';
    sh.getRange(r,9,1,3).setFormulas([[
      '=IFERROR(K'+r+'-J'+r+',"")',
      '=IFERROR(IF(H'+r+'="","",ROUND(H'+r+'*'+gas+'/12,2)),"")',
      '=IFERROR(IF(H'+r+'="","",ROUND(H'+r+'*('+rate+'+'+gas+'/12),2)),"")'
    ]]);
    // L notes, M job id
    sh.getRange(r,12,1,2).setValues([[row[11]||'', b.id]]);
    return out_({ok:true,row:r});
  } finally { lock.releaseLock(); }
}
