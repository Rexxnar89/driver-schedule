
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
