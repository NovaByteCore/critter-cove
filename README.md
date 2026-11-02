# Critter Cove

A one-tap chore and spending game for ADHD brains. Tiny tasks rebuild a messy creature island and lure in 40 weird critters. A cleaning timer helps you start, reminders you control help you remember, and Big Sis Check roasts you before you buy something you can't afford.

- **Website:** https://novabytecore.github.io/critter-cove/
- **Inside Claude:** the same app, saving to your Claude account so it follows you between devices.

## What's in it

### Tasks
- **One task, one tap.** The app picks the next tiny thing by time of day (morning reset, room of the day, night reset). Tap **Done**.
- **Too much?** "Smaller, please" gives a 30-second version. "Later" hides a task for two hours. "I'm overwhelmed" offers one tiny rescue step or permission to rest. None of these cost anything.
- **Your own tasks:** repeat daily, on weekdays, on certain days or once, with a time of day, length, category and an Important flag. Turn off suggested routines or rooms that don't fit your home.
- **Daily goal chests** at 1, 3 and 5 tiny things. The fifth always brings a new critter.
- **No guilt.** No streaks. Come back after a few days and the critters throw you a welcome-back party.

### Cleaning timer
- Lengths: 30 sec, 2, 5, 10, 15 or 20 min, or your own. Pick a default for the main **Start timer** button.
- Pause, Resume, Restart, End session. Hide the timer and it keeps running; a card on the island brings you back.
- When time's up: **I'm Done! 🎉**, **Five More Minutes**, **Take a Break** (your own break length) or **Switch Tasks**.
- Finishing the timer never gives a reward by itself. You confirm with I'm Done, and a double tap counts once.
- Optional alerts: time's up, halfway, encouraging messages, break over, come back after a break. None of them open a pop-up over the timer.
- Counts from a fixed end time, so a locked screen or sleeping tab doesn't make it drift.

### Reminders
- Optional. Set them up during onboarding (or skip) and change them any time in **Settings → Notifications**.
- Categories: chores, routines, cleaning timers, focus sessions, spending cooldowns, bills, budget check-ins, critter rewards.
- Time, days and frequency (once, daily, weekdays, selected days, weekly, every few days). Add, edit, delete, or switch off any reminder.
- Voice: Gentle, Playful Bestie or Drag Me. Quiet hours, snooze (5, 10, 15, 30 min or your own), sound on or off, and optionally show missed reminders later the same day.
- Browser notification permission is asked only when you choose to turn it on, and never again after a no.
- **They only work while the app is open.** See [Known limitations](#known-limitations) and `docs/NOTIFICATIONS.md`.

### Appearance (Settings → Appearance)
- **Theme:** Playful Cove 🌈 (default: brighter colors, game-style buttons) or Cozy Cove 🌿 (softer sea-glass colors).
- **Light or dark:** Follow my device (default), Light or Dark.
- **Low stimulation:** softer colors, no shadows, confetti, moving critters, waves or sounds. Every button still works.
- **Reduce animations:** stops movement but keeps the colors. The phone's own reduce-motion setting is always respected.
- **Bigger text.**
- Changes show right away and save automatically. Inside Claude, the latest change follows you to your other devices.
- Both themes meet WCAG 2.2 AA contrast in light and dark. Body text uses Atkinson Hyperlegible; headings use Fredoka.

### Island and critters
- **40 critters across 10 island zones**, from Driftwood Beach to Volcano Lounge. Critters gather shells while you're away.
- **Island news:** breaking stories from the cove.
- **Share my island:** makes a picture of your progress to post or text.

### Big Sis Check (Money tab)
- Enter your real budget: spending money per period, what's spent, and optionally your balance, bills, savings goal and payday. Periods can be weekly, every 2 weeks, monthly or a custom number of days, starting on your own reset date.
- Describe a purchase and tap **Should I Buy This? 👀**. You get a roast, a verdict (🟢 approved, 🟡 hold up, 🔴 absolutely not), the numbers, a reality check and one next move. Then buy it, put it in Wishlist Jail, or cool off for 24h, 48h or 7 days.
- **But Hear Me Out… 😭** lets you add facts (it's a need, the real price, money set aside). New facts can change the verdict; insisting can't.
- Companions: Big Sis, Haitian Dad, Black Dad, Bestie or your own. Roast levels: Gentle Reality Check, Don't Play With Me, Drag Me.
- The verdict comes from a fixed rules engine (`SisEngine` in `index.html`). Personality never changes the math. Inside Claude, Claude writes the roast in your companion's voice; on the website, built-in roasts are used.
- Shows actual, planned (cooling off) and avoided spending separately. Keeps past periods and your full purchase history (edit or delete any record), and spots patterns like late-night shopping.
- Also: a one-tap no-spend day button and a weekly check-in.

### Backups
**Settings → Download backup** saves everything (tasks, critters, settings and money records) to a file. **Restore from backup** checks the file first, shows what's in it, and keeps your current progress as a safety copy you can undo. Backups include money records, so keep them private.

## Your data

- **Website:** progress saves in that browser on that device only. Clearing site data erases it, so download a backup now and then.
- **Inside Claude:** progress also saves to your private area of the app's storage and syncs between your devices. If two devices change things, progress is merged rather than overwritten.
- **Upgrades keep your progress.** Older saves (including the original version and the Mr. Receipts version) load with critters, shells, tasks, zones, settings and purchase history intact. A weekly budget you set in the Mr. Receipts version carries into Big Sis. That version's built-in starting value of $60 is not carried over, because you never chose it; Big Sis asks for your budget instead.
- Nothing connects to your bank. The app only uses numbers you type in. No data is sent to any outside service; the only network requests are Google Fonts (and, inside Claude, Claude itself).

## Known limitations

- **Reminders need the app open.** Critter Cove can't remind you when it's fully closed. That would need web push, which needs a server; GitHub Pages only serves files. Not built.
- **iPhone:** Safari pauses background tabs, so reminders and timer alerts in a background tab aren't reliable. You'll see them when you come back.
- **Android:** browser notifications work in a background tab while Chrome keeps it alive; Android may stop it to save battery.
- **Inside Claude:** system notifications aren't allowed in Claude's protected frame, so reminders appear as banners inside the app.
- **Timer sounds** usually won't play at the exact moment time's up if the phone is locked. The timer shows "Time's up" when you return.
- **Website storage:** browser storage on `novabytecore.github.io` is shared by every GitHub Pages site under the NovaByteCore account. Low risk while this is the only one.
- **Not tested on real phones.** All testing runs in Chromium (desktop and phone-sized screens). Safari/iOS and real Android devices haven't been tested by automation.
- **Real notification permission prompts** can't be tested automatically; the tests simulate granting and denying.

## Running it

It's a single `index.html` with no build step. Open it in a browser, or use GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) and open the Pages link on your phone, then **Add to Home Screen**.

## Tests

```
npm test
```

Unit tests (45) for the money engine and the core engine: task queue, rewards, save validation, device merging, upgrades from old saves, backups, budget periods, timer math, reminder scheduling and quiet hours, appearance settings. Needs Node 18 or newer, no installs.

```
npm i -D playwright && npx playwright install chromium
npm run test:e2e
```

Browser tests (51): the real app in Chromium, covering onboarding, tasks, the cleaning timer (pause, restart, screen lock, end choices, double taps), reminders (snooze, quiet hours, missed reminders, permission asked only once), rewards, critters, zones, saved progress, upgrades from old saves inside Claude, Big Sis Check, cooldowns, budget resets, backups and restore, security, accessibility, Appearance (theme, light/dark/device, low stimulation, reduced animations) with contrast checks of both themes in light and dark, and five screen sizes from 320 to 1280 px. The last run's results are in `tests/e2e/last-run.json`.

`npm run audit` reruns the audit checks in `docs/AUDIT.md`. `tests/theme-preview/` holds the color tokens and contrast calculations behind the two themes.

## More docs

- `docs/NOTIFICATIONS.md`: what reminders and timer alerts can and can't do on each platform.
- `docs/AUDIT.md`: the full audit, bugs found, and before/after evidence.
- `docs/PROPOSALS.md`: optional paid upgrades with costs (none built).
- `CHANGELOG.md`: what changed in each release.

If a release causes problems, the previous version can be restored from git history (the release before timers and reminders is commit `e11ad3a`).
