
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
