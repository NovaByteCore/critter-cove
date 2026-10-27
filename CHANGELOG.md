# Changelog

## Refinements (branch `refinements`, not yet on `main`)

**Fixes** (details and evidence in `docs/AUDIT.md`)
- Two devices can no longer overwrite each other's progress inside Claude: saves are merged, and live changes from another device are merged in.
- Purchase history is no longer capped at 300; nothing is ever deleted unless you delete it.
- Large histories are stored in smaller pieces, so heavy users don't hit Claude's per-save size limit; failed saves now show a message.
- Every save, sync and backup is validated, which closes a code-injection hole from tampered data.
- Pop-ups are labelled for screen readers, keep keyboard focus inside, and return focus when closed.
- The timer can be resumed after closing it or reloading.
- A phone clock that was set back no longer freezes critter gifts or gives free run bonuses.
- Money tab refreshes when opened, so expired cooldowns show up right away.
- "Rare" critter label meets contrast guidelines; map critters work with a keyboard.

**ADHD usability**
- Start for 30 seconds, 2 minutes, 5 minutes, or the whole task.
- "Later" (hide for 2 hours) and "I'm overwhelmed" (one tiny rescue step, kind words, or rest mode).
- Your own tasks: repeat daily, weekdays, certain days or once; time of day; length; category; Important; pause; edit; delete.
- Turn off suggested routines or rooms that don't fit your home.
- Settings: Low stimulation, Skip reward pop-ups.

**Big Sis Check**
- Budget periods: weekly, every 2 weeks, monthly or custom, from your own reset date. Past periods are kept.
- Actual, planned (cooling off) and avoided spending shown separately.
- "But Hear Me Out… 😭": new facts can change the verdict; insisting can't.
- About 100 built-in lines across companions and roast levels (was 39).

**Backups**
- Download a backup file; restore it with validation, a summary, and an undo.

**Sharing**
- On GitHub Pages, Share uses the phone's share sheet or downloads the picture.

**Cleaning timer**
- Presets: 30 sec, 2, 5, 10, 15, 20 min, or custom; pick your default.
- Pause, Resume, Restart, End session; stays accurate if the screen locks.
- When time's up: I'm Done! 🎉, Five More Minutes, Take a Break (custom break length), Switch Tasks.
- Finishing the timer never rewards by itself; you confirm with I'm Done.
- Optional alerts: timer end, halfway, encouraging messages, break over, come back after a break.

**Notifications**
- Optional setup during onboarding (skippable); a one-time card for existing users.
- Settings → Notifications: one master switch, your own reminders (add, edit, delete, switch on/off), time, days and frequency (once, daily, weekdays, selected days, weekly, every few days), categories, personality (Gentle, Playful Bestie, Drag Me), quiet hours, snooze length, sound, missed reminders. Changes save automatically.
- Automatic reminders when a spending cooldown ends and when critter gifts are full.
- Browser notification permission is only asked when you choose, and never again after a no.
- What works where, and what doesn't (app closed): `docs/NOTIFICATIONS.md`.

**Tests**
- 43 unit tests (`npm test`) and 44 browser tests (`npm run test:e2e`).
