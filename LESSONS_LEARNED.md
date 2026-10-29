
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
