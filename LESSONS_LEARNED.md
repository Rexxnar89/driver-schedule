
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

## 2026-10-28 — syncperf v1 / syncaudit v1 / syncdot v1
- Big pulls starved typing (maxLag ~220ms at 4x CPU). Chunk with requestIdleCallback, defer while typing, queue re-render of the focused form until blur → maxLag ~32-46ms.
- Over-syncing causes: LS proxy called syncDirty on every setItem even when the value was identical; 20s pull interval ran while tab hidden; focus+visibilitychange both pulled on return (double pull). Fix: skip identical writes, 10s min pull gap (manual Sync forces), no pull/beat while hidden.
- Heartbeats (beat) must never drive sync indicators.
- Perf fixtures can blow the localStorage quota (__snap_*); a quota error looks like a logic bug.

## 2026-10-28 — vehsvc v1 (Scheduled service range per vehicle)
- Fields svcFrom/svcTo (datetime-local) live on the vehicle record, so the existing vsSaveNow/savevehicles sync carries them with no script change.
- vBlock checks a single instant; Create job also checks overlap of the job span with the window so a job starting before service still flags.

## 2026-10-28 — snagfix v1 (open/close/switch jank)
- ST() re-parsed the whole job-state JSON on every SJ/LG/surfOf call (hundreds per render). Read-only paths now use STR(), cached by raw string; writers still use fresh ST(). LG returns copies so mutate-then-save code stays safe.
- dhPairs() was recomputed 4x per render; memoized on (jobs, length, st raw, HOME) and cleared next task.
- Owner "All jobs" list was rebuilt on every card toggle while hidden; now rebuilt only when Owner is visible (MutationObserver on reveal).
- content-visibility:auto on job cards cuts layout when switching back to Current jobs.
- Remaining cost is building ~120 card HTML strings per toggle; per-card patching is unsafe because renderDriver wrappers decorate the box afterwards.
- history.pushState forces a layout (scroll save); it's not extra work, just earlier.

## 2026-10-28 — multileg v1
- LG lives inside an IIFE (not global); new code uses window.LGm reading st directly.
- Calendar block end comes from spans(), which only knows Leg 2; calJobs wrapper extends to last leg time + duration.
- Tests must stub alert/confirm or puppeteer hangs on saveJob dialogs.

## 2026-10-28 — startfix v1 (cold start)
- Startup paints Current jobs from LS.jobcache; the slow parts were the hidden "copy from job" list (copyOpts, toLocaleDateString per job) and the gas/sync work running in the same tick.
- copyOpts now builds only when Create job is visible, else at idle; uses one cached Intl.DateTimeFormat (identical output).
- loadGas re-render and the first sync pull (loadLive) wait for first paint + idle.
- Profile startup by seeding jobcache too, or nothing renders at load.

## 2026-10-28 — awin v1 (Available windows)
- Panel under pickup date/time; repaints debounced 180ms + idle after avail(), only for the chosen day (~3ms).
- Fit check reuses busyAt; free vehicles/equipment reuse VBUSY/EBUSY. vehCheck now fills VBUSY whenever a time is set, even with no vehicle chosen (UI unchanged).

## 2026-10-28 — layout u v1
- Leg 2/extra legs back inside #nsplitw (original spot); Organizer..Drop-offs moved (DOM move, same nodes, no copies) right under pickup date/time + Available windows.

## 2026-10-28 — layout v v1 + labels
- Driver box moved under Available windows; labels now "Vehicles free" / "Equipment free".

## 2026-10-28 — orgfix v1
- Organizer autofill required exactly ONE address-book entry per name; clSeed (src jobs) + import often create duplicates, so nothing filled. Now first entry with an address (and first with a phone) wins, same as the address preview.

## 2026-10-28 dropsug
- Leg inputs (nl{n}pk/dz) had no class loc, so they were outside the autocomplete. Add class loc and route it in sugShow; do not build a second autocomplete.
- Organizer fill failed when the address book had duplicate names (C.length==1). Pick the first entry that has the field.

## 2026-10-28 — t736 availability hub
- When re-rendering a panel via innerHTML, move any native inputs you embedded (e.g. #nv/#neq) into a DocumentFragment first and re-append after, or they are destroyed and other code gets null refs.
- Top-level `let` globals (e.g. CF) are NOT on `window`; test `typeof X` or DOM state instead of `window.X`.
- Headless tests that wrap each line in try{} scope away `const`; use `window.x=` for values shared across lines and keep multi-line blocks on one line.
- Collapsed "top N" lists must still always show the selected/active items.

## 2026-10-28 — sync quiet + scoped sync
- Every localStorage write scheduled a push (syncDirty 2.5 s, act 1.5 s), saveJob awaited vsPull up to 3 s, and focus/visibility fired pull, vsPull and loadLive. Each one flashed #kvdot and the top-right #rspin spinner. Sync should run from one idle scheduler and never from a tap or save.
- Global `let`/`const` bindings (VS, LASTIN, jobs) are NOT on window. Use `typeof X!='undefined'` across script tags, not `window.X`.
- Changed-only pulls need the client to keep the remote ts map (LS.vsR). Otherwise every local item looks newer and gets re-pushed.
- Test harnesses must never print POST bodies: they contain the sync secret.

## 2026-10-28 — perf v1
- On a 4x-throttled 390px phone profile with 219 jobs, startup was already ~0.55 s to scrollable because only ~28 cards render. The real lag came from sync triggers and the never-cleared 700 ms pxDeco intervals, not from rendering.
- The service worker caches static assets only. HTML is network-first so new deploys still arrive, and script.google is never cached.

## 2026-10-28 — scoped ranges
- The Current jobs sync range comes from the preview's own picker (dvRange), so it never drifts from what is on screen. An explicit pick syncs right away, keyed per scope in SYNCAT so a repeat pick within 5 min is free.

## 2026-10-28 — discounts
- A `const` declaration chain in card() blocked appending to `money`. Check whether a variable is const before using += on it in someone else's chain.

## 2026-10-28 — trailer sync
- Since b1edd56, vehicle/equipment pulls only ran on Owner/Create job, not on the Vehicles overlay or at app open, so a phone could miss others' adds and show the red not-synced label (VS.state stayed ''). Seeded defaults were stamped ts=now and could beat others' edits. Deletes never propagated. Fixed with a seed ts of 1, tombstones, a persistent push queue, a push 2.5 s after save, and a pull on open and on Vehicles open.

## 2026-10-28 — Past jobs never sync by default
Server defaults must be scoped (today..+90d); full history only on explicit request. Comments on one-line handlers must be /* */ or they swallow the rest of the line.

## 2026-10-28 — Per-driver vehicles
Defaults must be recomputed until the user picks by hand; a default cached before the date is set ignores conflicts.

## 2026-10-28 — Mirror layer (IndexedDB)
- Moving a key out of localStorage breaks any code that reads it with localStorage.getItem directly. Only move keys that are read through the LS proxy (jobcache, srows); keep small keys in localStorage too so direct reads stay correct.
- IndexedDB is async: anything read at boot from an IDB-only key needs a re-hydrate + re-render hook (MIR.ready) or the first load after migration shows nothing.
- `let` globals (jobs) are not on window; test with `typeof jobs`.

## 2026-10-28 — Mirror v2
- To make IndexedDB-only keys readable synchronously, the app scripts are tagged type="text/x-ds" and started by a boot loader after MIR.ready; DOMContentLoaded/load listeners added late are replayed. Tests that scrape `<script>` must also match the x-ds tag.
- Test mode uses a separate IndexedDB ('ds-mirror-test') so sandbox data never mixes with real data.

## 2026-10-28 — tapfast v1 + menuhold v1
- Date/time stutter was not a mirror bug: stOf re-parsed the whole `st` JSON on every busy check, and the avail/cells scan covered every job. Use the cached STR() for reads, limit the scan to a ±4-day window, memoize vehList.
- Organizer lag: each keystroke ran fill(), which autofilled the pickup and dispatched input → avail rebuild + geocode. Debounce fill (150 ms), defer avail while typing (150 ms + idle), and hold geocoding until 700 ms after the last keystroke.
- All suggestion menus share #sugg: close it only when the field that owns it asks. One shared hold rule (menuhold): a pick or programmatic input closes the menu, and only a new focus/tap reopens it.

## 2026-10-28 — drafts DV, multi-equipment, clone vehicle, auto-update
- Drafts must also save XD/LV/DV (equipment, leg times, per-driver vehicle), or a restored draft quietly loses them.
- A pairX shortcut in itemBusy made a clone default to the original's vehicle. Busy checks should not skip the source job.
- Auto-update dirty check: `window.EDIT` is undefined because EDIT is a lexical global. Use `typeof EDIT!='undefined'&&EDIT`, and treat any non-empty text field in a visible #newjob as unsaved. Headless focus() does not stick, so tests need to type real input.
- Keep sw.js VER and the ds-ver meta in step. Bump both on every release.

## 2026-10-28 — syncsmooth v1 (two-device mock test)
- Two simulated devices on a mock kv server showed no ping-pong. Echoes of a device's own writes are skipped by the server-ts check (TS), one edited row pushes exactly one item, and idle rounds push nothing.
- What sync did cost: every Create job date change started a kv pull, a full jobs reload (ICS parse + render) and a vehicle pull. These are now coalesced to one per 60 s, wait 2.5 s after the last tap or key, and skip the jobs reload on Create job.
- Idle CPU came from route estimates: photon misses were never cached, so they retried every pass, and LS.geo/phc were re-parsed on every call. Cache misses for 6 h and parse once per raw value (JC). Hidden-screen redraws (renderQuiet, sync renders) now wait until Create job closes.

## 2026-10-28 — cjrender v1 (Create job render module, Calendar trim)
- Most tap cost was the same work done many times in one tap: span() and busyAt() re-run for every driver and quarter-hour, toLocale*String re-formatting the same times, and a date tap firing avail twice (input + change). Per-task memo (cleared at end of the task) removes the repeats with no chance of stale data.
- Heavy follow-ups (vehicle, equipment, gate, title, fare, suggested driver) run after paint, one small task each; saveJob flushes them first so saving never sees half-finished checks.
- Calendar was a forced layout (clientWidth/getComputedStyle read right after innerHTML), not HTML building. Use a cached width per screen size and check once in requestAnimationFrame.
- First Create job open was a cold layout; one hidden idle warm-up halves it.
- Verify "same look" by diffing rendered text of old vs new for the same taps (cmp.js) before shipping.

## 2026-10-29 — droptap: display-only preview looked tappable
- Bug: drop-off "📍 Map match" tap did nothing. In drop-offs, after the pickup is filled the field sits low on the screen, so #sugg is often hidden (sugPos hides it when the input is off the viewport) and the user sees only the green addr-preview (.adpv) box. That box had no handler at all. It wasn't menuhold, a re-render, or z-index.
- Fix: droptap v1 makes .adpv tappable using one delegated capture listener (pointerdown preventDefault + click). It fills the address, fires input/change and closes the menu, so it works for rows and legs added later.
- Lesson: anything that looks like a suggestion must be tappable, or be styled as plain info. Test with touch emulation on fields lower down the form, not just the first one.

## 2026-10-29 — cjlayout v1: Create job layout
- Trip type now sits right under Organizer/phone. Return time is a chip ("Return 3:30 PM ▾") under the pickup date/time and expands on tap. A new #avs availability strip sits between Pickups and Drop-offs.
- #avs shows date · time · free counts plus Open/Tight/Full. Tight means ≤1 driver or ≤1 vehicle free; you can change that with localStorage ds-avs {"tightD","tightV"}, and the Status select overrides it per job. Tapping the strip opens the existing #awin and #awstrip; they were moved into it, not copied. stripP() publishes window._awst.
- Lesson: insert near doTog headers carefully. doTog only hides the header's nextElementSibling, so new blocks go before the next header.

## 2026-10-29 — wchips v1: window chips are time-only
- Window chips (Who fits and the per-driver windows) now show only "9:00–11:30", colored by status: green = fits, amber = window too short. On a Who-fits chip the driver name moves into the expanded detail line, which also has the "Use this driver" button.
- Lesson: when you strip a label down, move the details into an expand step rather than dropping them. Otherwise one tap acts on a choice the user can't see.

## 2026-10-29 — cjtop v1: window chips at the top (revised spec)
- Revised spec replaced the strip between Pickups and Drop-offs (archived in archive/index-pre-cjtop.html). #avs now sits right under the date/time picker. It is one compact row: time-only window chips colored green (holds the job) or amber (too short), a status pill and a "Roster ▾" toggle.
- Tapping a chip lists the drivers free in that window, each with "Use this driver" (window.awPick). The roster holds the existing #awstrip and #awin (with the vehicle/trailer picker) plus the Status override. They were moved there, not copied.
- Status: Full = no drivers free; Tight = drivers free but no vehicle; otherwise Open. Thresholds can be changed with localStorage ds-avs.
- Lesson: re-read the latest spec before building. A spec revised mid-build supersedes the queued one.

## 2026-10-29 — cjveh v1: Vehicles ▾ list in the top chip bar
- "Vehicles ▾" next to "Roster ▾" lists every vehicle and every piece of equipment as Free, Assigned to <driver · time> or blocked status, for newSpan(). It reuses itemBusy/itemState, exported from t736 as window.awItemBusy/awItemState.
- Lesson: t736 helpers are scoped to its IIFE, and a try/catch silently swallowed the ReferenceError, so every item showed Free. Always test a known conflict, not only the all-free case.

## 2026-10-29 — cjsticky v1 (v2026-10-29.5)
- Keep UI open state in JS variables and reassert it on every repaint; debounce toggles (450 ms) and stop pointer/touch events at the button so outside-tap helpers and ghost clicks can't flip panels shut.
- When code rebuilds a container with innerHTML, remember which `<details>` were open (by summary text) and reopen them with a MutationObserver.
- "Free until" uses an exported awNextUse that applies the same job filters as itemBusy and dvUses. Equipment matching relies on job text (jTxt: vehicle+title+desc), so test with realistic job text, not bare fields.
- Sticky bar: put a 1px sentinel before it and use an IntersectionObserver to toggle .pin. Cap the expanded sections at max-height:50vh with overflow:auto.

## 2026-10-29 — cjorder v1 (v2026-10-29.6)
- A sticky element only sticks inside its parent box. To pin just the Roster/Vehicles bar, #avs is display:contents so the bar's containing block is the whole form. With display:contents, #avs has no box, so scroll to or measure its children (.avt), not #avs itself.

## 2026-10-29 — cjfinal v1 (v2026-10-29.7)
- Split jobs were missing "Free until" on the second job because the Vehicles ▾ list checked every item against newSpan() (only the first leg's window). Availability has to use each leg's own legTimes(n).
- To reorder sections that paint() rebuilds with innerHTML, use a childList MutationObserver that moves the node, guarded so it only acts when the node is still in its old place (no loop). Keep minimize state in variables and reapply it after every rebuild.
- When a spec says "confirm X already does Y", measure the DOM order before reporting. Leg 2 (#nsplitw) sits above Pickups, not under Drop-offs.

## 2026-10-29 — cjlock v1 (v2026-10-29.8)
- A helper defined inside P() (DC) is not visible to sibling functions; module-level helpers go at the top of the IIFE. Per Jeffrey's rule, every lock has an override: tapping the lock, picking another window, or editing the time unlocks it.

## 2026-10-29 — leg2move v1 (v2026-10-29.9)
- The form-order IIFE re-lays out ranges after place() runs, so moving a node in place() alone gets undone. Pin it at the end of the order pass too, and check the DOM in a test, not just the code.

## 2026-10-29 — cjbar v1 (v2026-10-29.10)
- The expanded window detail now reuses the original driver-bar pieces (tlMarks ▼ arrows, tlOv job span) instead of new markup. Shade the buffer only at edges caused by a job, not at the day edge (H0/H1 exported as window.awH).
- Removing a UI piece (the strip v1 sticky strip) must keep any data it fed (window._awst feeds the window chips), so split the data into awSum() before deleting the DOM.

## 2026-10-29 — cjclone v1 (v2026-10-29.11)
- A form-level Clone reuses saveJob plus cloneJob instead of copying either. For a new job, find the saved uid by comparing job uids before and after the save. For an edited job, only continue if savedmsg shows Saved, so a failed check never clones stale data.

## 2026-10-29 — v2026-10-29.12 (cjtray, cjbounce, cjret, driver audit)
- Available Windows (renamed from Open Windows) is a tray that starts minimized. RO=true is the default and resets on RS. The roster (.aw) and per-driver vehicles (.vp) are hidden with `#avs.trc`. The one ▾/▴ toggle is on the label, and the duplicate roster-header toggle was removed.
- Current Jobs bounce: the Danger zone hard-coded `secw closed` snapped shut on every rebuild. Its open state now persists per job (dzo:uid in LS.secs). #dcards now goes through dcSet(), which skips identical HTML and re-anchors the element at the top of the screen when the HTML changes. Measured over 60 s: before, scrollY drifted on all 20 samples and Danger zone closed; after, scrollY drifted on 0 samples and Danger zone stayed open.
- Return box: compact (label and inputs on one row; home and shared-ride notes in a "More" expander). It was already directly below Available Windows (wday > owlab > avs > rchip > rbox).
- Driver audit: nd, nl2d and nl3d+ are never disabled. Lock, edit and clone keep them editable, and the saved legs keep their per-leg drivers.
- 2026-10-29 v.13: removed the 'Clone for second vehicle and driver' button from the card header (it should never be on minimized cards); cloneJob stays for Create job ⧉ Clone job. Snippet in archive/snippet-card-clone-button.txt.
- 2026-10-29 v.14: the expanded-detail free span (.wbs .fw) now uses the roster's single free color rgba(56,142,60,.45) with a #388e3c border instead of each driver's color. Roster bars already used it. Names stay on each row.
- 2026-10-29 v.15: removed the Return 'More' expander. The section is either fully open or fully closed, and the ▴ chip is its only collapse.
- 2026-10-29 v.16: leg-2 labels now say 'Leg 2 pickup time' and 'Leg 2 return time' (also the hint text and the add-leg note). The 'second vehicle' clone wording is kept because it isn't about legs.
- 2026-10-29 v.17: return labels are numbered by leg: '1) Leg 1 return home', '3) Leg 2 return home'. Non-split jobs say 'Return home'. Legs 3+ have no return field, so they have no label.
- 2026-10-29 v.18: every return-home date (nrd, nrhd, nsrd) auto-fills with the pickup date (today if none). It follows pickup changes only while it still holds the auto value (dataset.auto), and a trusted user edit clears the flag. Return/leg labels now sit on their own line with full-width date and time inputs, reversing v.12's one-row compaction.
- 2026-10-29 v.19: there are two sections. 'Open Windows' is the chips title above the window chips; it is never collapsed by the other toggle. 'Available Windows' has its own title with the ▾/▴ toggle at the top of .avt and collapses only its tray (roster, plus vehicles hidden by the same v.18 rule). Lesson: when a section name is changed, confirm whether it names a separate section rather than relabelling one.

## 2026-10-29 v.20 cjretabove
- Return chip+box moved into #avs (display:contents) before .avt so order is Open Windows > Return > Available Windows > vehicles. Insert inside the contents wrapper to reorder without changing tray/hide logic.

## 2026-10-29 v.21 cjbufclone
- Buffer label+#nbuf moved (same elements, same listeners) before #owlab, so window calc still reads nbuf. Clone hint added under nclone in awhint style. Moving existing nodes keeps behavior; never clone inputs.

## 2026-10-29 v.22 cjaddlegret
- "+ Add leg" (#nlegadd) moved into #rbox bottom by a late plain script; visibility follows #nleg2 visibility (Split). place() only creates it once (guarded by #nlegx), so moving is stable. Old placement archived.

## 2026-10-29 v.23 splitsync + cjvesec
- Split first-check bug: draft restore/reset set #nsplit.checked without firing change, so Leg 2 stayed hidden while ticked; first tap unticked. splitsync keeps #nleg2 in step with the checkbox. Draft restore also rebuilds legs 3-4 (restore only fills ids that already exist).
- Never write "*/" inside a /* */ comment (nl3*/nl4* closed the comment and broke the script).
- Vehicles+equipment (.vp) moved out of #awin into #vesec below Available Windows; delegated listeners widened to #vesec and #awin styles mirrored at runtime.
- + Add leg button lives at bottom of #rbox (Split only); leg sections stay under Drop-offs.

## 2026-10-29 v.24 cjampm
- Open Windows chips only show "5 AM – 11:45 AM" (drop :00); fallback "5A" if a chip > 48% of row width. toLocaleTimeString may use U+202F before AM/PM: normalise whitespace before matching.
- Regression still printed 2 with a module syntax error; always run a browser smoke test too.

## 2026-10-29 (v.25)
- Return-time edits can come from auto-fill without events; a cheap 300ms value-signature poll plus 150ms debounce catches them.
- Default-open trial lives in one constant (AW_DEFAULT_OPEN) so revert is one line; RS() must use the same constant.
- Per-form "default to Leg 2" needs a once-per-form flag reset in RS(), otherwise every repaint overrides the user's tab choice.

## 2026-10-29 (v.26)
- "Only show legs that exist": gate every Leg N surface on legN() (split + mlLegs), clamp the selected tab when legs shrink, and hide arrows for a leg with no time instead of falling back to Leg 1's span (that mislabeled Leg 1's time as Leg 2).
- Re-check shipped claims against the spec list before building the next version (v.25 missed "editing a leg opens its windows" and detail-arrow leg labels).

## 2026-10-29 (v.27)
- The visible vehicle picker on Create job is the #vesec per-leg select[data-dvv]; #nv is hidden and gets overwritten from it. Recommendations/"Use" must target the visible picker.
- Driver-suggestion toggle stored in the mirror (MS 'drvsug'); off = recDrv auto-pick/banner and "Try instead" skipped at the source, not just hidden.

## 2026-10-29 — v.28 drvsec + paxflash
- A script that creates a wrapper and moves nodes must insert the wrapper into the DOM *before* any later lookup by id (D('x') on a detached node returns null, throws, and leaves moved controls stranded in a detached div — showed up as "nd is not defined").
- Never rewrite <option> text on a timer: it makes open dropdowns flash/close on mobile. Mark options event-driven, only when text differs, and skip while the select is focused.

## 2026-10-29 — v.29 (awlegs, leg strip, Open Windows removed, buffer viz, gold priority, split stash)
- Moving live <select>s (strip) beats copying: one id each; when a builder re-renders (#nlegx draw), forward writes to the fresh twin and swap via MutationObserver.
- A `display:flex` rule silently beats the `[hidden]` attribute; always add `[hidden]{display:none}` for flex rows.
- Removing a section that other code anchors on (#owlab): hide it and keep it as an anchor instead of deleting, so placement code keeps working.
- Plain `<script>` blocks at the end of the body can run BEFORE deferred `text/x-ds` blocks; put patch scripts as x-ds right after the code they wrap.
- Split stash: snapshot Leg 2+ (fields, DV/XD/LV for n>=2) on uncheck, wipe, then draftSave so the draft is clean; restore on re-check; drop on save/reset.
- Dead code check before delete: grep that no element creates the id (#freelist) and syntax-check every script after the cut.

## 2026-10-29 — v.30 conflicts can never silently pass
- Leg 2+ spans used a fixed 60 min and AW rows judged against Leg 1's times, so "fits" appeared while the driver was busy. Use each leg's real return (fallback 60 min, labeled est.) and judge rows on the selected leg.
- Buffer counts as busy everywhere (fit, gold, sort, note, save). Every conflict needs override checkbox + reason; reason saved (ovrR/ovrD).
- Duplicate/clone previously bypassed CF entirely — now needs its own override.
- retUI clears SR_V outside split mode; read Leg 2 return fields directly (leg2Ret).
- IIFE-scoped helpers (xBusy) must be exposed explicitly before global code calls them; a throw inside avail() left a stale "AVAILABLE".
- One debounced (100 ms) delegated refresh (dsRefresh) replaces scattered per-input hooks; it never dispatches events.
- Every leg block + "Leg N" arrow on every driver bar; staggered labels avoid overlap.
- Puppeteer tests must clear localStorage between scenarios (drafts leak).

## 2026-10-29 — v.31 blank Available Windows + Vehicles on phone
- v.30's global legSpansOf() called stOf(), which only exists inside the awin IIFE. Any saved multi-leg job threw "stOf is not defined" inside busyAt, killing paint(): no bars, no Vehicles & equipment. Tests missed it because test data had no saved legs. Fix: read STR() directly with try/guard. Always seed saved multi-leg state in browser tests, and never call IIFE-scoped helpers from global code.
- Added date-only painting (npd set, no time): bars render for the day, no leg blocks, hint "Pick a time to place Leg 1".

## 2026-10-29 — v.32: clash list, row flags, override near Save, per-leg drivers, no leg cap
- Buffer clashes were real but invisible: legPrev output was discarded since v.29, spill() never returned 1, the busy driver sorted last and was hidden by "Drivers to show", and the priority auto-pick moved off them. Now one clashFor() feeds the row flags, the shared window._clash list, the near-Save "This job collides with:" list and bookBlock, all tied to the single #ovr/#ovrr override.
- Legs 2+ without a pickup time silently vanished from Available Windows (legSp lists only timed legs); now they are named with a hint.
- The v.29 leg strip MOVED each leg's driver select out of its leg box and hid its label, so there was no visible per-leg driver picker. Now each leg box keeps its own "Driver for Leg N" select; the strip shows a synced mirror.
- Leg count was capped at 4 (MAXN, the addleg check, the strip loop, draft restore, merge, and single-digit nl\d regexes). All removed or widened; tested with 7 legs saved.
- Lesson: a single-digit id regex is a hidden cap. Use \d+.

## 2026-10-29 — v.33: red clash stretch on AW bars
- The red overlap/buffer stretch (old v.10–v.28 big-bar idea) was requested mid-run but missed in v.32. Now drawn per row from the shared clash list (r.cl): exact overlap, or the part of the leg inside the other job buffer. Lesson: re-read steering messages against the final diff before reporting.

## 2026-10-29 — v.34: buffer box inside Available Windows, buffer banner, leg end arrows
- A clash only on non-picked drivers was hidden behind "Show more" because auto-pick chose a free driver; warnings must have an always-visible summary (banner at top of Available Windows).
- Moving an input into a container that is re-rendered via innerHTML needs a re-seat after every paint, and focus must be captured BEFORE innerHTML runs (activeElement is lost after).
- Old helper scripts (cjbufmove, form reorder) silently moved the field back; search for all code that repositions an element before moving it.
- `if(m.lg&&k)return;` from v.30 suppressed end arrows for legs; check old suppressions when markers go missing.

## 2026-10-29 — v.35: Current jobs bounce, drop-off Go, merge X/back
- Card actions (tog, setSt, secTog etc.) re-render the whole list via render/renderQuiet; on a lower card, expanding re-flowed the list and the page jumped ~650–850px. Fix: remember the tapped card and, after any render, scroll by the card's offset so it stays put (wrapped render/renderQuiet/renderDriver/allPaint).
- Measure bounce with real touch taps and re-query elements after each render; stale handles give false results.
- Modals should push a history state so phone Back closes them instead of leaving the page.

## 2026-10-29 — v.36: Leg 2 for "Split" trip type in Available Windows and alarms
- Two leg systems exist: the Split-job checkbox (nl2t / saved legs) and the "Split" trip type, which keeps Leg 2's pickup in the return fields (nrpt / retT). Available Windows (legSp) and alarms (legInfo) only read the first, so Leg 2 never showed for Split trip type. Both now fall back to the return pickup.

## 2026-10-29 v.37 (all-driver leg bars, anchor, FAB padding)
- Available Windows: every driver bar shows each leg as start/end lines (from just above the ▼ tips) plus a see-through band in a per-leg color (blue, purple, teal, magenta), hatched buffer before/after, and a green/red strip for fits/clash on THAT driver. No text on the bar. Lines are sized after paint by measuring arrow tips; the bar no longer clips overflow. Old: archive/index-pre-v37-allbars.html.
- Current jobs "17 px jump" was not the tapped button: a timer repaint (tick/nxtTop/sync) rebuilt #dcards and shifted the list. Fix: a MutationObserver on #dcards restores the anchored card (tapped card, else first visible) before paint. Lesson: when a bounce lands on a different button each run, it's time-based; probe by sampling card top over 60 s with no taps.
- The "next job" copy in #nxttop shares the uid; the anchor lookup must skip #nxttop cards or it anchors to the wrong one.
- Body gets bottom padding (96 px + safe area) and #awin 72 px so the floating A-/A/A+/🔊 and Find job buttons never cover the last card.

## 2026-10-29 (v.38)
- Calendar: calJobs drew one block per job, from the first span to the end of the last leg, so a merged job hid its gap; the merged-in job also showed again on its own. Fix: draw each merged piece as its own block labeled (i/n), skip jobs with mergedInto, and dedupe.
- Drive time to job (min): pre-job travel buffer = drive + 10 min before Leg 1 (max with Buffer). It is used in busyAt/clashFor, the hatched pre-buffer and the warnings ("42 drive + 10"). Saved per job as ST.drvm. Put new Available Windows inputs INSIDE #awbuf: awin repaints wipe sibling nodes.

## 2026-10-29 (v.39)
- Alarms were stored in the job's shared state (ST[uid].alarms). sheetSave uploaded the whole state, and loadSavedSheet merged it into every phone, so one person's alarm rang on every device. Fix: each device gets a local id (localStorage.dsdev). Alarms are tagged _dev, and AL() only returns this device's alarms. Alarms are removed from state before it's uploaded and when sheet state comes in. Untagged alarms set before v.39 are ignored and have to be set again.
- Current-jobs bounce mid-job: the 20 s kv pull, the 10-min loadLive, saved-jobs pulls and timer render/renderQuiet/renderDriver/nxtTop rebuilt the list while a job was underway. Fix (jobhold): while a job is started (as/ap) and not Done, hold pulls and any rebuild not caused by a tap in the last 2.5 s. Pushes keep running. Held work runs when a leg/job completes, when no job is active, on manual Sync, or after a 2 h cap.

## 2026-10-29 (v.40)
- Screen shift on tap: anchor the tapped button (not the card) and correct only non-user scrolls; let a real finger/wheel scroll release the anchor. Test taps with real touch events, never fast timers.
- Merged job collapsed on calendar after edit: the return-home time typed in Leg 1 (end of the whole day) stretched Leg 1 over Leg 2, and the v38 overlap-merge joined the pieces into one block. Fix: clip Leg 1 at the next leg start and move the overshoot to the last piece. Also the merged-in child job must never count as a clash with its own parent.
- Miles: Leg 2+ stops join the route only when Leg 2+ sections exist; the Leg-1-only path must stay byte-for-byte the same. Drop consecutive repeated stops to avoid double counting.

## 2026-11-01 (v.41)
- "Per-phone" data must not live in a synced record. v.39 tagged alarms with a device id but still stored them inside the shared 'st' record, so every phone downloaded them: any phone on an older cached copy rang them, and another phone editing the job overwrote them. Alarms now live in 'myal', a local-only key the sync never sends.
- Audit every path that can sound an alarm, not just the scheduler: the "next leg surfaced" hook rang a full TIME TO DRIVE alarm on whoever tapped Complete leg, even with no alarm set.
- Version-string edits: a regex replace on ds-ver also hit the update checker's own pattern. Check the diff for every occurrence.
- /tmp is wiped between sessions; keep browser tests in the repo (tests/browser/).

## 2026-11-02 — v.42: blank screen / jumping on card buttons and inputs
- ROOT CAUSE of blank screen: `content-visibility:auto; contain-intrinsic-size:auto 110px/140px` on `.jc` job cards. Every re-render (innerHTML) creates *new* card elements, which measure at the placeholder size until painted, so a ~13,000px list of open cards collapsed to ~1,200px for a frame. The page got shorter, scroll clamped = blank screen, then a jump. Never use content-visibility on lists that are rebuilt under the user's finger. It is still allowed on #cllist/#fblist rows.
- dcSet's index-path scroll anchor jumped up to 8000px after re-sorts (Complete/Done move cards). Removed. tapAnchor (v40) handles anchoring, and a no-blank guard now clears a stale body minHeight.
- sugTop now scrolls only as much as needed (no jump on name/address focus). AW repaint anchors to the tapped row. Changing the date/time now retargets Leg 1, so AW and its chips re-render right away.
- jobhold flush coalesces the render calls into one. topstab keeps content still when banners above the viewport change height.
- Test with real taps at 390px and record scrollY/height per frame (tests/browser/tap42.js, in42.js, aw42.js). Forcing `details.open` in tests is an artifact: click the summary instead.
- Last-resort drivers (Owner tab; Kaci by default) sort last and stay hidden in limited lists.

## 2026-11-02 — v.43: driver shown unavailable all week
- The calendar import treated any event whose first line contained "available till" as BLOCKED time. Jeffrey's weekly event "Available TILL 5:00PM Thursdays" runs Mon 6:30 AM to Thu 5 PM, so his available days (Mon–Thu) were painted as unavailable. The Fri–Sun "unavailable" event blocked the rest, so the whole week showed unavailable. Not a v.42 regression: the rule dates from 2026-10-21 (bf94488).
- Fix: "available" wording is never a block. Only x / unavailable / no drives block. tests/avail43.js checks that the blocked weekdays come out as Thu–Sun (Thu evening through Sunday) only.
- A word like "available" in a title is the opposite of "unavailable": never match it as a block keyword.

## 2026-11-02 — v.44: job hours on cards + day boxes
- Each card's "Ends" line shows the job length: start to end, or for split/legged jobs the sum of the leg spans with gaps left out, plus a per-leg breakdown like "(1h + 1h + 1h)". Lengths under 60 min show as "45 min", longer ones as hours to 0.1, e.g. "4.5 hrs".
- Every day's cards now sit in a bordered box (days with no DAYSTY style get green). The header shows the day's total hours. Leg cards (uid "X~M2") are counted once: when leg cards are in the same list, the parent counts only its first-leg span. Use the uid pattern, because _legOf is not set on these cards.
- No content-visibility (see v.42). tap42: 0 blank screens.

## 2026-11-11 — v.46: pickup-miles note, split-paid checklist, reconstructed v.45
- The unpushed `v45-banners` checkout in /tmp/ds was gone (never pushed; /tmp had been wiped). v.45 was reconstructed on current main (keeping later rate.json updates) and folded into v.46, local branch `v46-notes` only. Do not push until Jeffrey has seen the screenshots.
- v.45: all-day events and long/multi-day ones (Available TILL 5PM Mon–Thu) render as `.calban` banners; a vehicle (vehicle field, known name, or Ford/Chevy/Pilot/Durango/Subaru/van/vehicle/trailer in the title) stays a normal timed event. Day boxes use `Driving: X hrs · Y mi · $Z`, counting only real job legs (`isDriveJob`), so availability is no longer added into the 80-hour-style totals. `locPD(pickups, dropoffs)` writes Proton LOCATION as pickup first, last address the drop-off, one address = pickup. Gas/rate reloads on open and after a 6:30 AM or 2:30 PM ET boundary (one timeout to the next boundary, plus a visibility check; no polling).
- v.46: each job form and card has an optional Pickup miles box immediately above Wait hrs. It is a note only — it is not passed to `calc`/`trip`/`fare`. It is stored on the job as `pkm` (ST + saveEst/formJob, sheet notes, Proton description) without shifting the A–N export columns. A light `Usual: ~X mi` hint uses the median of at least two past readings with the same first-pickup address (IQR outliers dropped). The hint never auto-fills the box or the charge.
- Split how many ways (people/groups) already existed as a fare split, separate from Split trip type / split legs. Below it, a checklist (one box per person; names from passenger `pxn` when present, else Person N) adds each checked share to `Paid $X of $Y` plus who is unpaid. Checked state is saved as `spPaid`.
- Browser harness: allow `127.0.0.1` as well as `localhost` in request interceptors (a 127.0.0.1 page was aborted and looked hung). tap42 and banners45 now have an overall timeout, `protocolTimeout`, `waitForFunction` boot instead of a fixed 3.5s, and a guaranteed `process.exit`. tap42 still flags large scroll jumps from Edit/Duplicate/Cancel (those leave the card); the pass that matters is 0 blank screens.

## 2026-11-11 — v.46 split: -up shares, fare stays the charge
- Rounding each share up to the nearest $5 must not raise the fare, charge, calc, or export totals. $104 ÷ 3 → $35 each, but the job still shows Expected (charge) $104.00.
- Paid tally can go over the fare; then show extra: Paid $105.00 of $104.00 (+$1.00 extra). Two paid shares: Paid $70.00 of $104.00.
- Split line: Fare $104.00 ÷ 3 = $35.00 each (no inflated split total). splitCalc.st stays the real fare (c).
- A share already on a $5 multiple stays as-is ($100/4 = $25).

## 2026-11-12 — v.46 split gap is free; later-leg miles default from Leg 1
- A split/multi-leg job's Proton endT or the old calendar wrapper could treat start→last-leg as one busy block. Only each leg plus its buffers should block Available Windows, clashes, and vehicle/item time. The calendar shows separate linked blocks with the gap visible.
- calJobs must emit one entry per spans() interval. Do not re-extend x.e across later legs.
- Leg 2+ Miles prefills from the Leg 1 Miles field (not automatically from the ROUND TRIP emi, which would double existing estimates). Changing Leg 1 updates later legs only while they still hold the auto-filled value. Charge switches to the sum of leg miles once Leg 1 (or a later leg) has a value; single-leg jobs stay on emi/hm/routed estimate.

## 2026-11-17 — v.47 (branch alarm-chain, not live): alarm chain + job-card weather
- Alarm chain per leg, all from the departure alarm (`A[n].lead`, departure = leg pickup time − lead): Heat-up `A[n+'h']` = departure − (prep + heat), Prep `A[n+'p']` = departure − prep, Departure. Defaults heat 11 / prep 8; Settings (Owner) → Alarm chain, phone-only LS keys `alHeat`/`alPrep`/`alCold` (not in SCAL). The fired key includes the lead, so changing an offset re-arms cleanly.
- Departure calc's own "+ 11 min" early buffer (EARLY) is a different 11 than the heat-up 11; left unchanged.
- Snooze used to land on the departure alarm even when Prep rang (it would make Depart ring early and then never at the real time). Overlay `data-k` now carries the alarm key that rang (n, np, nh).
- Weather: Open-Meteo hourly (temp, code, precip %, gusts mph, visibility), via the app's existing geo() cache; only coords rounded to 0.1° leave the phone for weather. Cached in MS `wxc` (≤8 locations, refresh ≥1 h, 10 min backoff on failure), loaded on demand from card render / alarm dialog; no timers. Hour lookup uses floor (8:30 → 8:00 hour).
- Hazard thresholds live in `WXW`; max 3 symbols, most severe first; tap shows words. Hazards show regardless of temperature, and in the alarm dialog as "Heads up: … expected at departure."
- tests/browser/chain47.js mocks Open-Meteo and geo — never let a browser test call the real weather/geocoder with addresses. testmode.js/tap42.js fail on main too (live-sync/network dependent and detached frame); compare against a main worktree before blaming a change.

## 2026-11-18 — weather-layout (later folded into v.48): scannable card weather
- On closed cards, weather is visible without tapping. Multi-leg jobs get one overall line plus a compact L1/L2/… row; single-leg jobs stay a strip plus the condition line, with no extra "Job" / "L1" duplication.
- Temp strip under the alarm button: start–mid–end, 4 points when the first-departure→last-end span is ≥3 h, same-hour samples dropped so a 1-hour job does not repeat the same reading. Times and temps come from the hourly forecast already cached — no extra Open-Meteo or geocode requests. Mid-strip points use the leg whose departure window contains that time (pickup coords already fetched).
- Urgent hazards (freezing rain, thunderstorm, snow) stay on their own highlighted line with short words. Rain, high wind, fog, and extreme heat fold into one `.wxalso` line. Cold / below-freezing banners are unchanged. Alarm-dialog `wxWarnH` is unchanged.
- If the urgent box already names Freezing rain, Thunderstorm, or Snow, the overall line keeps the temperature and does not repeat that name. wx48 asserts Ice Demo overall has no "Freezing rain".
- `wxIn` was replaced by `wxJob` / `wxH` / `wxFill`; fetch, `wxc` cache, `WXW`, and `wxWarn` stayed. Replaced snippets are in `archive/weather-layout-replaced-snippets.txt`.
- tests/browser/wx48.js covers mixed multi-leg warnings, a 7-hour 4-point strip, and a mild single-leg day, all at 390px with mocked Open-Meteo/geo. chain47 assertions now expect visible Thunderstorm / High wind / Fog words instead of a combined hidden title. in42's norg1 102px jump is the same on main.

## 2026-11-18 — v.48 (branch v48-actual-end, later folded into v.48): Actual end under Actuals
- The "Actual end" / Finished picker (`timesEnd`, `.aend`) lived at the end of the Times section, immediately after the Drop-offs fold (`doFold` / `wtFold`) in `numBlock` (`index.html` ~line 169). Jeffrey (voice, Nov 18 ~10:03–10:04am ET) asked to move that value from under Drop-offs to under Actuals and leave everything else as-is.
- Moved the single `timesEnd(j,s,uq,ed,_PT)` call off the `SEC_T` concatenation and onto the end of the Actuals body `h` (after the existing `L('Finished',s.af)` summary row, ~line 173). No other Times, Drop-offs, or Actuals fields changed. The raw Finished summary line was already in Actuals and was left in place.
- Version bumped to 2026-11-18.48 (`<meta name=ds-ver>` and `sw.js` `VER` only; did not touch the update-checker regex).
- Archived the pre-change file as `archive/index-pre-actual-end.html`.
- Screenshots at 390px with a multi-leg job (not in the repo): `/workspace/v48/before_times.png`, `before_actuals.png`, `after_times.png`, `after_actuals.png`.
- Tests: regression PASS; chain47 and the other 390px browser suites PASS; known main failures unchanged (conflict, errsum, vehicle-status, tap42, return-time). testmode skipped (hits live sync). rate.json / gas.json untouched.

## 2026-11-18 — priority-driver (later folded into v.48): job-level Priority driver
- Job field `pd` (driver name, or '' for Any) is saved with the job JSON (`formJob` / LS.saved / Saved Jobs sheet). Apps Script `savejob` already stores opaque JSON — no sheet-sync.gs change and no redeploy.
- UI: "Any driver" is a checkbox (`#priany`, default checked) *above* the Priority driver dropdown (`#pri`), not a button or the main control. Picking a name unchecks the box; re-checking clears the dropdown. The old `#drvany` chip was removed.
- "Any driver" means any non-last-resort driver. The exclusive list is the Owner-tab Last-resort drivers setting (`lastres`; default Kaci Always). There is no separate exclusive list and no "Casey" in the code. Last-resort drivers still sort last / stay hidden in limited lists unless they are the explicit priority.
- `priSort` / `priName` are used in Available Windows, recDrv auto-pick, assignment dropdowns, and calendar driver chips. recDrv will not auto-pick a last-resort driver when Any is on, even if they are the only one free.
- Do not nest a `<script>` tag inside a `type="text/x-ds"` script — the first `</script>` closes the outer block and truncates the rest of that file. Insert the IIFE as plain JS.
- `lrIs` is defined late; call `fillDrv`/`priFill` at the end of the last-resort script so option order is correct on first paint.
- Tests: `tests/prio48.js` + `tests/browser/prio48.js` (390px, multi-leg). Screenshots: /workspace/v48prio/.


## 2026-11-18 — v.48 live: Actual end under Actuals + weather layout + Priority driver
- Jeffrey approved all three branches live at 10:46am ET. Pulled main first (42aadbf, Rate Nov 18 1.60); rate.json and gas.json were never overwritten.
- First trimmed a weather-layout duplicate on a freezing-rain day: the overall line and the urgent box both said "Freezing rain". The overall line now keeps the temperature and drops the urgent name; the urgent box keeps "Freezing rain" (also Thunderstorm / Snow). Commit 69db7b8 on weather-layout; wx48 asserts Ice Demo overall has no "Freezing rain".
- Merged into main (conflicts only in LESSONS_LEARNED.md; index.html auto-merged and was checked for all three features plus version 2026-11-18.48): 80c52c1 actual-end, 4a8ab53 weather-layout, 9aa6cf4 priority-driver, then 8b529c2 (prio48 unit test now expects 2026-11-18.48 instead of the pre-merge 2026-11-17.47 pin).
- Tests on the merge: regression PASS; actual-end placement PASS; chain47, wx48, prio48 PASS (390px, multi-leg); other 390px suites PASS. Known pre-existing failures unchanged (conflict, errsum, vehicle-status, tap42, return-time). testmode skipped.
- Pushed 8b529c2 to main. GitHub Pages build succeeded 11:03am ET. Live https://rexxnar89.github.io/driver-schedule/ serves meta and sw.js 2026-11-18.48 and contains timesEnd under Actuals, hideC/wxJob weather layout, and pri-driver / #priany. Screenshots: /workspace/v48/live_closed_card.png, live_create_form.png.

## 2026-11-18 — complete-advance (branch complete-advance, test copy only, not live)
- Today-only collapse-and-advance: completing a job that overlaps the local current day collapses it and smooth-scrolls to the next open job today (`scrollIntoView({behavior:smooth,block:start})` + `focus({preventScroll:true})`). Completing a job on any other day keeps the original completeJob path (no EXP/scroll/note changes).
- Completing the last open job today lands on the existing `#caday .donesec` ("✓ Today's completed jobs"), not a new section.
- Complete day never bulk-completes first when jobs are still open: it expands and jumps to the first open job today and shows a banner "N jobs still open today" with "Complete all anyway". That button opens a confirm modal; confirm marks the remaining today jobs Done in one render and offers Undo (restores prior `st`). If nothing is open, Complete day just collapses today's cards and lands on `.donesec`.
- `#pinov .pbox` styles are scoped to `#pinov`, so a new overlay (`#caov`) must copy those white-card rules or the confirm dialog is just transparent text over the page.
- Today's jobs (`#caday`, existing navy TODAY header/border + Complete day) and Find job / search / Upcoming-Previous filters (`#cafind`, own green header/border) are separate sections. The old dashed `<hr>` between them was removed. The floating 🔍 Find job overlay is unchanged (no new auto-scroll to `#cafind`).
- Do not add auto-scroll except these explicit post-complete jumps — a separate `scroll-jump-fix` branch is in flight. Viewport shots can land on the Find section after a jump because of the pre-existing scroll-jump; element shots of `#caday` / `.donesec` are the reliable record.
- Module-local banner state (`_note`) survives `jobs` reseeding in tests; expose `caReset()` and call it from fixtures.
- Version left at 2026-11-18.48. rate.json / gas.json untouched. Tests: `tests/browser/advance48.js` (25/25 at 390px, network mocked, testmode skipped). Screenshots: /workspace/advance48/.

## 2026-11-18 — v49-integrated (test branch, not live): upcoming-job snap + scroll-jump-fix + complete-advance
- Jeffrey (voice, Nov 18 10:14–10:16pm ET): the bounce was still happening on live v.48 (the earlier scroll-jump-fix was never pushed). When scrolling near the Upcoming jobs section, a particular upcoming job acted like a tap target and snapped the view back toward the top job. He asked to stop it and look for anything else like that. Branch `v49-integrated` off 68c8c47 combines reconstructed scroll-jump-fix, origin/complete-advance (c40e92e), and this snap fix. Version left at 2026-11-18.48. rate.json / gas.json untouched. Not merged, not deployed.
- What that job was doing: two controls in Upcoming share the same failure. (1) Every job card header (`.jh`) has `onclick="tog(uid)"`. A finger-scroll that starts on that header still fires a `click` when the finger lifts (classic mobile ghost click). `tog` expands the card and `renderQuiet()` rebuilds the list; tapAnchor then jumped `scrollY` back to the pre-scroll position — "back toward the top job." Reproduced at 390px on unpatched v.48 against the first post-tomorrow multi-leg job (`Upcoming Multi`): EXP flipped to that uid and scrollY 2515→2295. (2) The dashed "Next job after tomorrow" pointer (`nxtLine()`, `.nxtjob`, `role="button"`, `onclick="openNext(uid)"`) sits in the Upcoming section right after Tomorrow's day box and names that same upcoming job. A ghost click on it calls `openNext`, which expands the job, may `renderDriver()`, and `scrollIntoView({block:'start'})`. The `#nxttop` "Next job:" banner is the same widget higher on the page.
- Fix: a capture-phase click suppressor (`v49 nosnap`) ignores a click in `#driver` / `#nxttop` when the pointer/touch moved more than 10px in the same gesture (no timers). `tog` and `openNext` also bail on `dsScrollClick()`. Intentional `openNext` / `flashCard` / `caScroll` jumps use `dsOwnScroll` + `dsClearAnchor`. `tog` / complete-advance renders use `dsKeepView`.
- scroll-jump-fix (reconstructed; original `/tmp/ds-scroll` 1b40da6 was never pushed and the worktree was gone): `fix()` compensates only `layout = (cardTop-A.top)+(scrollY-A.sy)`; the scroll listener rebases `A` synchronously on user scroll; `wxFill` runs in `dsKeepView` with a 52px `.wxwait` placeholder; public `dsKeepView` / `dsOwnScroll` / `dsClearAnchor`; card lookups are `#driver .jc`.
- complete-advance integration: `caScroll` wrapped in `dsOwnScroll`+`dsClearAnchor`; `caCard` and the donesec fallback use `#driver`; `render`/`renderQuiet` after complete/Complete day/bulk go through `dsKeepView`. No `overflow-anchor` re-enable, no fast timers.
- Audit of other auto-move / scroll-as-tap paths (same branch):
  - FIXED: tapAnchor stale-`A` `fix()` (both directions). FIXED: async `wxFill` height insert. FIXED: ghost click on card headers and `.nxtjob` / `openNext`. FIXED: `loadRate` calling `renderDriver` while the driver list is visible — skipped if the user scrolled in the last 1.5s, otherwise `dsKeepView`. FIXED: `flashCard` `scrollIntoView` now `dsOwnScroll`. LEFT: `scrollTo(0,0)` on Edit / Create-return / draft save (intentional Create-job navigation). LEFT: `sugTop` `scrollBy` only when the suggestion list would sit under the keyboard. LEFT: `keepFocus` already uses `preventScroll:true`. LEFT: Create-job / discount / address-book `focus()` only in those flows. LEFT: `topstab` banner `scrollBy` already skips the driver screen. LEFT: jobhold's 1s loop does not rebuild the list every second. LEFT: tapAnchor `guard()` blank-screen recovery. LEFT: the Complete/Done far-move `scrollTo(A.sy)` special case (complete-advance clears the anchor first). LEFT: calJump / jlOpen / vJump / mergeDo / legGo (user-initiated). LEFT: `tfxPlay` on `pointerdown` for `role=button` (sound only).
- Tests: `tests/browser/upsnap49.js` FAIL on unpatched 68c8c47 (ghost tap + snap + `scrollIntoView` from the Next-job pointer) and PASS on this branch. `scrolljump48.js` PASS (both directions, 390px). `advance48.js`  PASS. Regression PASS. Other 390px suites PASS: prio48 (unit + browser), wx48, chain47, al41, availcard46, aw42, banners45, hours44, in42, lr42, splitgap46, v46ui. testmode skipped. Known pre-existing failures not re-run: conflict, errsum, vehicle-status, tap42, return-time.
- Screenshots (390px): `/workspace/v49int/today_section.png`, `today_page.png`, `find_section.png`, `find_page.png`, `upcoming_after_scroll.png`, `upcoming_job_card.png`.
- Replaced snippets: `archive/v49-integrated-replaced-snippets.txt`.

## 2026-11-23 — v49-integrated rebase + Android touch-scroll ghost-click fix (then pushed live as v.49)
- Live site was still v.48 (`2026-11-18.48`) when Jeffrey reported (Nov 23 voice) that scrolling down to upcoming jobs still bounced/redirected. v.49 had been held on `v49-integrated` (`9da38a8`) waiting for his OK; he then gave the go-ahead to push live. Pre-merge `origin/main` rollback target: `add7301` (gas.json after Rate Nov 23 1.58).
- Live v.48 root cause (confirmed on `origin/main`): no `dsScrollClick` / nosnap suppressor. (1) Job card headers `.jh` use `onclick="tog(uid)"` — a finger-scroll that starts on the header still fires a synthetic `click` on lift, `tog` expands the card and `renderQuiet()` rebuilds the list, and v.48 `tapAnchor` `fix()` treats the scroll as a layout shift and `scrollBy`s back (jumps toward the earlier job). (2) `#nxttop` ("Next job:") and the Upcoming "Next job after tomorrow" pointer (`.nxtjob`, `nxtLine()`, `onclick="openNext(uid)"`) — a ghost click calls `openNext`, which expands the job, may `setDV('jump',...)` / `renderDriver()`, and `scrollIntoView({block:'start'})`. (3) v.48 `fix()` uses `d=t-A.top` (no layout-delta), and `wxH`/`wxFill` can still insert weather height without a reserved placeholder.
- Audit of `v49-integrated` (`9da38a8` / rebased `deb15a4`) upcoming-section targets: card headers (`tog`), `#nxttop .nxtjob` and Upcoming `.nxtjob` (`openNext`), date/range `setDV` buttons, Find-job search, Expand/Collapse all, complete-advance `caScroll`/`flashCard`/`goDay` (no `goDay` in this tree). `tog` and `openNext` already bailed on `dsScrollClick()`; capture-phase click suppressor covered other in-`#driver` clicks, but only when `moved&&armed&&Date.now()-armed<=400`.
- Android hole: Chrome fires `pointercancel` (and often stops `pointermove`) once native scrolling starts, then `touchend` + a synthetic `click`. The nosnap scroll listener only armed if `moved` was already set (>10px of pointer/touchmove). If cancel happened first, `moved` stayed 0, scroll did not arm, and the ghost click went through. A 400ms arm window also missed a pause-then-lift. `tapAnchor` similarly set `UI` only from `touchmove`>10px / wheel, so an Android scroll after a card `pointerdown` could look like a layout shift.
- Extra fix on this branch: nosnap arms on `pointercancel`/`touchcancel` and on `scroll` while a pointer/touch is down; `moved` stays set until the next `pointerdown`/`touchstart` (no 400ms expiry). `tapAnchor` treats `pointercancel`/`touchcancel` and scroll-while-finger-down as a finger (`UI`/`fd`) so `fix()` rebases instead of fighting the pan. No other unexpected `scrollIntoView` / `setDV` / tab switch in the upcoming section.
- Rebased `v49-integrated` onto `origin/main` `add7301`. `rate.json` left at main's $1.58/mi (`9b1b1df`); `gas.json` untouched by these commits.
- Tests (390px, multi-leg): `upsnap49` PASS including Android `pointercancel` on the upcoming job card, `#nxttop` / Next-job pointer, and a 500ms post-scroll pause. `scrolljump48` PASS (both directions). `advance48` 25/25 PASS. Regression PASS. Other 390px suites PASS: prio48 (unit+browser), wx48, chain47, al41, availcard46, aw42, banners45, hours44, in42, lr42, splitgap46, v46ui. Known pre-existing failures unchanged: conflict, errsum, vehicle-status, tap42, return-time. testmode skipped (needs a URL; hits live sync).

## 2026-11-24 — v.50 four-tab driver screen (branch tabs50): Current · Upcoming · Find · Owner
- Jeffrey (voice, Nov 24 6:40am ET): move Upcoming jobs into its own tab right next to Current jobs so the Current page is short and never has upcoming cards render below it while scrolling (the remaining "snaps back up near upcoming jobs" bounce). Find and Owner unchanged. Each tab remembers its own scroll spot.
- Layout: header nav (same `.hnav` 2-column grid and yellow `.tabon` highlight) is now Address book, Vehicles, **Current jobs, Upcoming jobs (teal count badge), 🔍 Find job, Owner**, Calendar, Create job, Feedback. Calendar moved from between Current and Owner to after Owner so the four tabs sit in order (Current|Upcoming share a row).
- How: `show('driver'|'up'|'find')` all open `#driver`; `DTAB` ('cur'|'up'|'find', not persisted, app always opens on Current) picks which section `renderDriver()` builds. **Only the open tab is rendered** (no hidden duplicate cards): Current = Today read-out, Request time off / vehicle issue, `#caday` (Complete day, today's cards, ✓ Today's completed jobs), `#nxttop` banner and the ▲ NEXT LEG alert. Upcoming = new `#caup` (teal header `#00838f` like the Tomorrow day box, "Next job after tomorrow" pointer on top, Next 7 / 30 days, Expand/Collapse all, the usual `dayBox` borders + `dayHrs` hour totals, availability cards and weather inside the cards). Find = `#cafind` exactly as before (search + Upcoming/Previous range browser). Badge = Upcoming-window jobs (no availability, no canceled; a multi-leg job counts once).
- Day grouping shared by Upcoming and Find: `dayGroup(SL,W)` (was inline in Find). `curTab()` in the Back-stack module returns 'up'/'find', so Back walks between tabs. `viewRange()` (scoped sync) covers the Upcoming window too.
- Jumps to a job now open the tab that holds it: `dtTab(j)` (today → Current, inside Upcoming window → Upcoming, else Find with dir/jump set) and `dtGoTo(j)`. `openNext` (Next-job pointer, still bails on `dsScrollClick()`) and `flashCard` (save job, calendar, job lookup) use it.
- Per-tab scroll memory: one passive scroll listener stores scrollY for the open tab; a class MutationObserver on the sections plus a direct call at the end of `show()` restores the saved spot once on arrival (`dsClearAnchor` + `dsOwnScroll` so tapAnchor doesn't fight it). No timers.
- **Found while testing — a real snap-back on live v.49:** the in-app Back stack closes cards/tabs with `history.go(-n)` (rewind). With the browser's default `history.scrollRestoration='auto'`, Chrome then put scrollY back to where that history entry was pushed. Repro on main c0b3c78/f9d3687 at 390px: open a card, scroll 120px, tap its header to close → scrollY jumps back 120px to where the card was opened. Fix: `history.scrollRestoration='manual'` (the app owns scroll). Covered by tabs50 step 10.
- Lesson: when you add any `history.pushState`/`history.go` layer stack, set `scrollRestoration='manual'` or the browser will "helpfully" move the page on every in-app close.
- Lesson: a short page ends mid-step; scroll-jump tests must treat a step clamped at the top/bottom as the end, not as an "undone scroll".
- Tradeoff: the tab bar is at the top of the page (not sticky), so tapping a tab from deep in a list means scrolling up first; the scroll memory matters most for Back, the Next-job pointer, flashCard jumps and Owner/Calendar round trips.
- Tests: new `tests/browser/tabs50.js` (tab order, Current has no future-day cards, Upcoming sections/pointer/day boxes/hour totals, badge, scroll memory incl. Back, pointer tap + ghost scroll-click, flashCard tab switch, card-close no snap, slow wheel scroll to the bottom of Current and Upcoming with zero jumps). Tab-aware updates (open the Upcoming tab before looking for tomorrow-onward cards; guarded with `typeof upWin` so they still run on older builds): upsnap49, scrolljump48 (now runs on Upcoming and Current), advance48 (Today and Find checked on their own tabs), chain47, wx48, hours44.
- Replaced snippets: `archive/v50-tabs-replaced-snippets.txt`. Screenshots (390px): `/workspace/tabs50/`.
## 2026-11-24 — bounce50 (local only, not pushed): upcoming-boundary snap when weather fills
- Live v.49 report (Jeffrey, 6:38am ET): scrolling down past Upcoming, as soon as the next job card "begins rendering," the page snaps back up. Not a tap. Reproduced at 390px: weather placeholders (`.wxblock.wxwait` 52px) grow to 93–186px when `wxFill` runs; `dsKeepView` (index.html ~L1445, also `pickVis` ~L2183) anchored the first card with `r.bottom>60` even if its top was ~-300px (only a sliver still on screen). Compensation covered growth above that sliver card but not the sliver card's own weather growth, so the Upcoming card and "Next job after tomorrow" pointer jumped down ~92px. `overflow-anchor:none` on `#dcards,#driver` leaves this uncorrected by the browser. No lazy/IntersectionObserver; all upcoming cards are in the DOM from the first `dcSet`.
- Fix: prefer a card with `r.top>=-80` as the `dsKeepView`/`pickVis` anchor (fall back to the old sliver rule only if none). Local branch `bounce50` only — not pushed, not live.
- Tests: `tests/browser/bounce50.js` FAIL on unpatched v.49 (92px snap) and PASS on this branch (0.4px). `scrolljump48` and `upsnap49` PASS.

## 2026-11-24 — v.51: Upcoming tab jump when weather times out
- Jeffrey (Nov 24 call): Upcoming jumps while scrolling near the bottom; "it makes it hard to monitor things."
- Root cause found by hooking scrollBy with full stacks (Error.stackTraceLimit=40): the weather fetch has an 8s timeout. On slow phone data it times out, `wxFill` hid every 52px `.wxwait` placeholder at once (~2400px on 7 days, more on 30), and `dsKeepView` scrolled the page up ~1900–4300px to compensate; at the bottom the page then clamps. After that the weather was blocked for a flat 10 minutes.
- Fix: a chip whose fetch failed keeps its placeholder space with a small "Weather not loaded yet · retrying" note (`wxPend`); retry backoff `wxBack` 30s, 1, 2, 4, 8, then 10 min, one timer per place (`wxFail`). bounce50 (anchor prefers a card with top>=-80) is included.
- Lesson: never collapse many placeholders at once under the user's finger; keep the space until real content replaces it.
- Lesson: test slow networks by delaying the mocked response past the app's own timeout (9.5s > 8s), not just "slow".
- Tests: new `tests/browser/wxtimeout51.js` FAILS on v.50 (card moved 56px, height −1931px, no weather back) and PASSES on v.51 (0px); `bounce50.js` (now opens the Upcoming tab) FAILS on v.50 (93px) and PASSES (0px).

## 2026-11-24 — v.52: Upcoming jumps to the top "when I reach Thursday"
- Jeffrey (5:35pm ET, live v.51): every time he reaches Thursday under Upcoming it jumps to the top; "just currently".
- Real data (read-only, live site): this week's recurring "Available till 5:00PM" event runs Mon Nov 23 6:30am – Thu Nov 26 5pm, so Upcoming shows it on Wednesday (Tomorrow) AND Thursday; next week's copy shows on Mon/Tue. These availability cards have no tog() uid.
- Root cause: tapAnchor (v40) remembered the card in view by uid only. Reaching Thursday made Thursday's availability card the anchor (uid null); the next repaint (weather, timers, any class change) looked up the first uid-less card = Wednesday's copy near the top, and fix() scrolled by -4,000…-13,000px to "keep it still". Reproduced on live with real data: slow finger scroll, 5 jumps to sy≈750 from Thu/Mon/Tue.
- Fix: anchor = uid + which copy (index among visible cards with that uid): `same/fc(u,i)/ix(c)` in tapAnchor.
- Lesson: never identify a DOM item by a key that can repeat (multi-day events, legs, uid-less cards); store the occurrence index too or keep the element.
- Lesson: reproduce with the user's real (read-only) data when a bug is tied to a day — fixtures missed the multi-day availability card.
- Tests: new `tests/browser/dupcard52.js` FAILS on v.51 (jump -4581px) and PASSES on v.52 (0px). Real-data slow scroll on the fix: 0 drops.

## 2026-11-25 — v.53: per-leg miles + odometer mode
- Jeffrey (Nov 25 voice, 6:37–6:40am ET): each leg its own miles, trip total = sum (20 + 5 + 20 = 45), decimals like 19.5; per-leg Miles/Odometer toggle, modes can mix in one trip (e.g. legs 1–2 odometer, leg 3 typed); push live once tests pass.
- Already there since v.46: per-leg Miles fields on the job card and projMi summing them for the charge. Added: `legMiOf(s,n)` as the one place a leg's miles come from; a "Trip miles 20 + 5 + 19.5 = 44.5 mi" box under the legs; "(same as Leg 1 — change if different)" on legs still using the Leg 1 default; decimal/comma input (`legNum`, step any); Odometer mode.
- Odometer storage per job: Leg 1 `l1odo`, Leg 2+ `legs[i].odo` = {on, a:start, b:end, aAuto, okd}. Leg miles = end − start. Next odometer leg's start pre-fills from the previous odometer leg's end (`aAuto`) and keeps following it until edited (edit = odometer reset). End < start: red warning, not counted (typed miles used, never negative). Over 300 mi: counts only after OK on the end reading (a changed start just waits). Back to Miles keeps the odometer result as typed miles; readings stay stored.
- Card fields commit with the green ✓ Done button (fdone module stops plain `change`); browser tests must tap ✓ Done after typing.
- Sheet: rows use actual miles (`s.mi`) and halfway (`s.hm`), not projected leg miles — unchanged. Pickup miles stay note-only.
- Tests: new `tests/browser/legmiles53.js` (typed, decimals, default, mixed modes, prefill, reset, end<start, >300, switch back, old jobs, pickup miles, charge = rate × total); `tests/splitgap46.js` now loads `legMiOf` too.

## v.54 (2026-11-25) — Merge stays on merged jobs, leg cap 8
- The 4-leg cap lived only in the card's SPLIT JOB module (MAXL used by splitAdd and the Add leg button; picker text said "4 legs max" but never enforced it). The create form has been uncapped since v32 and the sheet has no per-leg columns, so raising the cap to 8 is one constant with no sheet change.
- Appending to a job that already has legs: keep the base's legs (with their v.53 miles/odometer) and insert new legs by time; never rebuild the leg list from scratch or typed per-leg values are lost.
- Jobs earlier than Leg 1 are kept out of the picker for a multi-leg base (they would have to become Leg 1 and shift all index-keyed state).
- Inserting a leg in the middle shifts index-keyed state (fork uid u~Ln, NEXT LEG, alarms A[n]) the same way legDel already does.
- Picker guards (mergeMore/mergeNow) check the slots left, not only the UI, so a stale tap can't overfill a job.

## v.55 (2026-11-25) — multi-leg jobs can be merged in
- Picker: multi-leg jobs are candidates; each needs 1 + its legs slots of the 8. Ones that won't fit are greyed with "needs N slots · K left". Merged-in, canceled, block and availability jobs stay out.
- Host rule: the earliest job is the host, so its Leg 1 stays Leg 1 (replaces v.54's "no job before Leg 1" rule). Every other leg goes in by time.
- Absorbing a multi-leg job: its Leg 1 becomes a leg (l1of, with l1mi/l1odo/l1done), its legs move over as-is, all tagged via:[uid,...]. Its own legs list is cleared so nothing (busy times, alarms, totals) counts twice. Auto miles are frozen (wasAuto) so they don't jump to the host's Leg 1 value.
- Restore: removing any leg tagged via[0]=X sends the whole of X back (Leg 1 fields, its legs with current miles/odometer/done; untouched auto miles go back to auto). via is a stack, so nested absorbs unwind one level at a time.

## v.56 (2026-11-25) — projections from leg numbers, Halfway/Total pair, your numbers, Proton rule, navigation, form order
- The fare already summed leg miles (projMi) but the Projections grid still showed halfway × 2 and hid Total $ without a halfway; the grid now reads the same source as the fare ("44.5 mi (legs)").
- Halfway/Total: two text inputs (inputmode=decimal, comma → point). oninput updates the twin live (input events pass the fdone module; only change is held until ✓ Done). fdRestore is wrapped so the twin stays in step after a repaint mid-typing. hm stays the sheet value; hmMode records which one was typed.
- Manual "yours" numbers (pmMan, fMan) are display-only keys, not in setSt's sync list, so the sheet format is unchanged.
- Proton location rule: locParse now records the label per line (cur), not per block — "Pickup:\nDrop-off:" in one block had made both drop-offs.
- regression.js expected nav A>B>C>H (Home appended); updated to A>B>C with the v.56 rule.
- Create form: #nv/#neq get tucked into the per-driver picker's hidden Manual entry when a driver is chosen; only move them when they are shown on their own, and never while focused.

## v.57 (2026-11-25) — manual boxes out, one projection from typed miles
- Removed v.56's "Your projected miles" / "Your fare $" boxes and Calc/Yours lines (archive/v57-manual-boxes-replaced-snippets.txt). Saved pmMan/fMan stay in job state untouched (never synced), so nothing is lost if they come back.
- New read-only line in Projections / fare, right under Expected (charge): "Projection from typed miles: <Halfway × 2> mi · $fare", using calc() with the same date (rate/gas) and wait hours as the charge. Shown only when the legs drive the charge and Halfway/Total has a number; it reads s.hm only and writes nothing, so leg numbers and the leg estimate can't change.
- proj56.js became proj57.js (manual-box checks replaced).

## v.58 (2026-11-25) — Please reset odometer
- One "Odometer reading (mi)" box under "Please reset odometer" first thing under the open card header (.jh). Putting it above the header made the tapped header jump on open/close (tabs50 HISTSNAP +112px), so it sits right below the header bar, saved as odoReset via setSt. Not in setSt's sync list and not read by exLine, so it stays off the sheet; nothing else reads it, so legs, totals, charge and the typed-miles line can't change.
- Jeffrey dropped the second "forgot to reset" box at the end of the call; only one box exists.
