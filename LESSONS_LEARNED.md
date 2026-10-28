
## 2026-10-27 — Flex children clip text
A flex child with flex:1 1 0;min-width:0 next to a chip clips long text on phones; give it a min-width (min(220px,100
## 2026-10-27 — Flex children clip text
A flex child with flex:1 1 0;min-width:0 beside a chip clips long text on phones; give it min-width:min(220px,100%) and flex-wrap the row so it drops to its own line.

## 2026-10-27 — Programmatic date sets skip change events
Quick-day buttons set the date without firing change, so recDrv never ran; hook pdSync (debounced) instead of relying on input change events.

## 2026-10-27 — Re-render on blur eats taps
Typing in #np then tapping a chip fires change on blur first, which re-renders #vfree and the tap lands on the parent. Tests must blur first; hand-pick detection uses trusted events only (pg.select dispatches untrusted ones).

## 2026-10-27 — Alarm tests fire real overlays
Testing alarms against a job starting soon makes the scheduler ring mid-test (prep at now). Use a job 3+ hours out for alarm screenshots.

## 2026-10-27 — Testing alarm sounds headless
siren/fire are closure-private; drive them via window.alarmFireTest(uid,1,why) and wrap AudioContext.prototype.createOscillator to log oscillator types, then confirm nothing new is created after alarmStop().

2026-10-28 16:25 Phone differences root cause: deployed Apps Script was older than repo (getsettings fell through to the gas-price reply, so Settings and Feedback tabs were never created), and most data lived only in each phone's localStorage. Always probe the live /exec for each new action after changing sheet-sync.gs, and keep shared data in the sheet, not in LS.
2026-10-28 16:25 Mocked Apps Script responses in puppeteer need Access-Control-Allow-Origin, otherwise fetch fails with "Failed to fetch".

2026-10-28 16:30 Vehicle ts was bumped only inside vUpd/vrSubmit (VS.user flag); add/rename-free paths (Add vehicle/equipment, delete) saved with no ts, so they never uploaded. VSAVE now bumps ts on every changed item unless the save comes from a pull. Added per-item Save button for an immediate push.
2026-10-28 16:30 Driver variants (JEFFREY, jeffrey, Bb) came from Proton event titles in the Jay/Bruce calendars, parsed without case normalization. AL() now canonicalizes case-insensitively; never derive list entries from free text without normalizing.
2026-10-28 16:30 kv-sync heartbeat must honor navigator.webdriver too, or headless tests POST to the real sheet.
2026-10-28 16:40 Address book had a hard 200-row cap ("refine the search"), so with 1,173 entries most were unreachable. Paginate the full filtered list (50/page) and say which set is shown.
2026-10-28 16:40 Pickup rows: many callers use $('pks').querySelector('input') and stops() reads every input. A new per-row field must come after the address in the DOM (shown above with CSS order:-1) and be excluded from stops().

## 2026-10-28 — lag-fix v1 / sugg v2 / addr-preview v1 / tt-move v1
- Applying kv-sync items one at a time re-parsed and re-stringified the whole collection for each item (O(n²)). Batch per collection per pull, and only re-render views that are visible and whose keys changed.
- Cache the parsed result of CL() by its raw string and build a name/address index once. Never sort with localeCompare on every keystroke.
- Suggestion lists: anchor below the field and below any preview line, cap the height to the visualViewport, and scroll the field near the top on focus.
- The address preview resolves only from the address book index or the existing GEOR cache, so it makes no new requests.
- When moving a form block, move the whole node (radios + rptbox) so runtime insertAdjacentHTML anchors (nsplitw) move along with it.

## 2026-10-28 — climport v2
- Import used to match by address only, so a known name with a new address became a duplicate. It now matches the name first (case-insensitive), then the address. It only fills empty fields, appends phones and notes, and keeps a different address as "other address:" in the notes. It folds exact-name duplicates into the first entry and archives the extras (clientsArchive). Nothing is wiped.

## 2026-10-28 — ret1h v1 / job-phone v1 / split-leg2 v1
- Round-trip Return time defaults to pickup + 1 hour, computed with Date math so 23:30 rolls over to 00:30 the next day. It keeps following the pickup time until it is edited by hand (RET_ED); "Reset to estimate" makes it follow again.
- The job phone number is stored in the job's st record (key jph, kv-sync), so customer phone numbers never appear in the repo.
- A checkbox that was checked automatically must be unchecked automatically when the reason goes away (Split → Round trip), or it will quietly save an unwanted leg.

## 2026-10-28 — another-job v1 (Create another job)
- Search for an existing mechanism before building one: a shared Drafts store (kv-sync key `drafts`, kvDraftSync, curd/__curd, 📝 Drafts modal) already existed. My first version wrote a different schema to the same key, which would have corrupted it. Rewrote it to reuse kvDraftSync.
- The draftClear wrapper deletes drafts[__curd], so remove __curd *before* draftClear when parking a job. Flush the debounced draftSave synchronously first (clear _dT/_kvdT) so nothing gets lost.

## 2026-10-28 — org1 v1 (Organizer = pickup #1, phone auto-fill)
- Auto-fill only overwrites a field when it is empty or still holds the exact value we last filled (F.n/F.a/F.ph). That protects anything typed by hand without needing extra "dirty" flags.
- Put new mode controls outside #pks and give them an id. draftSave/formReset skip #pks children, and selects are not reset by formReset, so wrap formReset to set the default.

## 2026-10-28 — syncstat v1, nav2 v1, rep-move v1
- syncstat: kv-sync push/pull live inside an IIFE, so the status hooks are guarded calls (`window.ssB&&...`) defined by a later script. No extra fetches, and the DOM only updates on sync events plus a 30s tick. Heartbeat posts and the legacy PIN/settings sync are not logged.
- nav2: a Back-button layer system (NAV/MOD) already existed. Extend its MOD registry rather than building a second one. Full-screen panels (abp, vhp, jlbox, calfsm) are left out of backdrop-tap dismissal because their own padding would count as "outside".
- A layer with typed input asks before Back or a backdrop tap would lose it. If cancelled, Back re-pushes the history entry.
- rep-move: move HTML blocks with a balanced-<div> scan, never a regex guess.

## 2026-10-28 — org2 v1 (organizer slot follows position; N/A clears it)
- Model the pickups as an array of {name,addr,client}, change the array, then write it back into the rows. Moving, inserting and clearing are much simpler that way than patching the DOM row by row.
- N/A must not rely on auto-fill flags (they get lost across drafts and edits). It clears any slot whose name matches the organizer.
