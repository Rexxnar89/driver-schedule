# Completed-job card v1 (archived 2026-10-26)
Before 2026-10-26, completed jobs in `.donesec` used the full-size card: the same `card(j,1)` markup and the base `.card`/`.jh`/`.jdate` CSS as active jobs, with no `.donesec` overrides. It was about 400px tall on a 420px-wide phone (screenshot: done-card-v1.png).
Restore it by deleting the `/* compact completed jobs ... */` CSS block (every `.donesec ...` rule) at the end of the main `<style>` in index.html. No markup was changed.
