# Critter Cove audit

Audited version: `main` at commit `e11ad3a` (the code GitHub Pages serves), tagged `pre-refinements`.
Method: line-by-line code review plus scripted browser checks (Chromium via Playwright) against that exact file, at 320, 390, 768 and 1280 px wide.
Evidence scripts and raw output: `tests/audit/`.

Severity scale: **Critical** (data loss or wrong money math), **High** (silent data loss in normal use, or a security hole once a planned feature ships), **Medium** (a real usability or accessibility failure), **Low** (minor, cosmetic, or only happens if the user does something unusual).

## Confirmed bugs

| # | Severity | Feature | What happens | Evidence | Fix |
|---|---|---|---|---|---|
| 1 | **Critical** | Saving inside Claude (multi-device) | If you open the app on a second device and tap anything before your account data finishes loading, the older device's progress overwrites your newer account progress. | Browser test: account held 999 shells / 300 tasks; phone held 10 / 3 and tapped Done while the account load was in flight. Both writes to the account contained 30 shells / 4 tasks. The 999 / 300 progress was gone. | Merge instead of overwrite: critters, zones, purchases, check-ins and custom tasks are combined; the device with more lifetime progress wins for shell balance. Live updates from other devices are merged too. |
| 2 | **High** | Purchase history | History is capped at 300 records. The 301st check silently deletes the oldest purchase, and Avoided Spending drops with it. | Browser test: 300 seeded records, one new check. Record `h0` deleted; Avoided Spending went from $3000 to $2990. | Remove the cap. Never delete history unless the user deletes a record. |
| 3 | **High** | Saving inside Claude (size) | Everything is saved as one document. Claude's per-document limit is 256 KiB. With ~300 purchases the save is already 238 KB, so heavy users will hit the limit. Save errors are swallowed (`catch (e) {}`), so it would fail silently. | Measured: 238,206 bytes at 300 purchases. Code: `flush()` ignores errors. | Store purchase history in separate chunk documents (150 per document). Show a message if a save to the account fails. |
| 4 | **High** (once backups ship), Medium today | Security | Purchase `verdict` values are inserted into HTML class names without checking. A tampered save, or a future imported backup, can run code on the page. | Browser test: a stored verdict of `green"><img src=x onerror=...>` executed (`window.__xss === true`). | Validate every field when loading, merging and importing (allowed values only, numbers clamped, text length-limited). |
| 5 | **Medium** | Accessibility (pop-ups) | Pop-up sheets don't hold keyboard focus (16 of 25 Tab presses left the dialog), have no accessible name for screen readers, and focus isn't reliably returned when they close. | Browser test. `role="dialog"` with no `aria-label`. | Make the page behind a pop-up inert, trap Tab inside the pop-up, label every pop-up, and return focus to the button that opened it. |
| 6 | **Medium** | Timer | Closing the timer (or the app) throws it away. There's no way to resume an interrupted task. | Browser test: start timer, press Escape; nothing offers to resume. | Keep the running timer in saved progress; show a "you were in the middle of…" card with Resume and Done. |
| 7 | **Low** | Critter gifts | If the phone's clock is set back, critter gifts stop until the clock catches up (`lastCollect` is in the future). | Browser test: `lastCollect` 5 h ahead shows "Your crew is out foraging" with gifts frozen. | Clamp saved timestamps to "now" on load. |
| 8 | **Low** | Accessibility (contrast) | The "rare" label on critter cards is 2.6:1 contrast (needs 4.5:1). | Computed from the color tokens in both themes. | Darker text color for that label. |
| 9 | **Low** | Accessibility (island map) | Critters on the map are 26 px and can't be reached by keyboard. Same info is in the Critters tab, so nothing is lost, but it's inconsistent. | Browser measurement. | Make them focusable with a label. |
| 10 | **Low** (found while writing tests) | Money tab | Switching to a tab didn't refresh it, so an expired cooldown kept saying "Decide in…" until you did something else. | Browser test: fast-forward 25 hours, switch tabs, list unchanged. | Refresh a tab when you open it, plus a once-a-minute refresh. |

## Checked and working (no change needed)

- No horizontal scrolling and no console errors on any tab at 320, 390, 768 or 1280 px.
- Every visible button and input is at least 44 × 44 px and has a readable label (map critters excepted, see #9).
- Rapid double taps do not duplicate rewards: Done, critter gifts, weekly check-in and no-spend button each paid once.
- Missed days cost nothing. There are no streaks; coming back after 2+ days gives a +20 welcome-back gift.
- The phone's "reduce motion" setting turns off animation.
- Big Sis Check math: 20 automated tests pass (spec examples, bills, savings, needs, impulse patterns, no double counting, weekly reset, migration). Account balance is never treated as spending money.
- No secrets, keys or tokens in the code. The live roast feature uses the viewer's own Claude session inside Claude; on GitHub Pages it falls back to built-in lines.

## Missing features (requested, not bugs)

- Custom tasks, repeating tasks, turning off suggested tasks that don't fit your home.
- 30-second / 2-minute / 5-minute starts, "Later", and an "I'm overwhelmed" rescue.
- Budget cycles other than weekly-from-Monday; a record of past periods; a clear split of actual vs planned vs avoided spending.
- "But Hear Me Out… 😭" reconsideration.
- Backup and restore.
- On GitHub Pages, sharing says "press and hold" even though a normal website can download or use the phone's share sheet.
- An option to skip the reward pop-up after every task.

## Privacy notes

- **Inside Claude:** progress, including money records, is saved in your private area of the app's storage (`data/users/<your id>/`), which other viewers can't read.
- **On GitHub Pages:** progress is saved in the browser on that device only. Browser storage on `novabytecore.github.io` is shared by every GitHub Pages site under the NovaByteCore account, so a different site you publish there could technically read it. Low risk while this is your only Pages site.
- Nothing is sent to any outside service. The only network calls are Google Fonts (and, inside Claude, Claude itself).

## Status on the `refinements` branch

Re-running the same audit script on the new code (`tests/audit/audit-results-main.json` vs `audit-results-refinements.json`):

| Check | `main` (live today) | `refinements` |
|---|---|---|
| Older device taps Done while the account loads | Account overwritten: 30 shells, 4 tasks | Account kept: 999 shells, 300 tasks, both devices' critters |
| 301st purchase check | Oldest deleted, avoided spending $3000 → $2990 | All 301 kept, $3000 stays |
| Tampered save tries to run code | Code ran | Blocked |
| Tab presses escaping a pop-up | 16 of 25 | 0 of 25 |
| Map critters by keyboard | Not reachable | Reachable, labelled |
| Console errors / sideways scroll (320–1280 px) | None | None |
| Double-tap Done | Counted once | Counted once |

Bugs #1–#10 above are fixed on the branch. Each fix has a matching automated test (see `tests/`). One more issue turned up while testing: the new double-tap guard briefly ignored a fast second tap; it now only blocks taps under 0.25 s, with a test for it.
