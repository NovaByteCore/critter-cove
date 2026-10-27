# Critter Cove

A one-tap chore game for ADHD brains. Tiny tasks rebuild a messy creature island, lure in 40 weird critters, and Big Sis Check roasts you before you buy something you can't afford.

## What's in it

- **One task, one tap.** The app picks the next tiny thing based on time of day (morning reset, room of the day, night reset). Tap **Done**.
- **Cleaning timer:** 30 sec to 20 min or custom, with your own default. Pause, resume, restart, end. When time's up: I'm Done!, Five More Minutes, Take a Break, or Switch Tasks. It keeps running if you leave, and a card on the island brings you back.
- **Reminders you control:** optional, set up in onboarding or Settings → Notifications. See `docs/NOTIFICATIONS.md` for what works where (they only work while the app is open).
- **Too much?** "Smaller, please" gives a 30-second version, "Later" hides a task for two hours, and "I'm overwhelmed" offers one tiny rescue step or permission to rest. None of these cost anything.
- **Your own tasks:** add tasks that repeat daily, on weekdays, on certain days or just once, with a time of day, length, category and an Important flag. Turn off suggested routines or rooms that don't fit your life.
- **Daily goal chests** at 1, 3 and 5 tiny things. The fifth always brings a new critter.
- **Clean runs.** Finish another task within 12 minutes for bonus shells.
- **40 critters across 10 island zones**, from Driftwood Beach to Volcano Lounge. Critters gather shells while you're away.
- **No guilt.** No streaks. Come back after a few days and the critters throw you a welcome-back party.
- **Low stimulation** and **Skip reward pop-ups** settings, and the phone's reduce-motion setting is respected.
- **Island news.** Breaking stories from the cove.
- **Big Sis Check:** enter your real budget (spending money per period, what's spent, optional balance, bills, savings goal, payday). Periods can be weekly, every 2 weeks, monthly or a custom number of days, starting on your own reset date, describe a purchase, and tap **Should I Buy This? 👀**. You get a roast, a verdict (🟢 approved, 🟡 hold up, 🔴 absolutely not), the numbers, a reality check and one next move. Then: buy it, Wishlist Jail it, or cool off for 24h, 48h or 7 days. **But Hear Me Out… 😭** lets you add facts (it's a need, the real price, money set aside for it); new facts can change the verdict, insisting can't.
  - Pick a companion (Big Sis, Haitian Dad, Black Dad, Bestie or your own custom one), rename them, and choose a roast level (Gentle Reality Check, Don't Play With Me, Drag Me).
  - The verdict comes from a deterministic engine (`SisEngine` in `index.html`, between the `ENGINE START` / `ENGINE END` markers). Personality never changes the math.
  - Inside Claude, Claude writes the roast in your companion's voice. Elsewhere, built-in roasts are used.
  - Shows actual spending, planned spending (cooling off) and avoided spending separately. Keeps past periods and your full purchase history (edit or delete any record), and spots patterns like late-night shopping.
- **Also in Money:** a one-tap no-spend day button and a weekly check-in.
- **Share my island:** makes a picture of your progress to post or text.

## Backups

**Settings → Download backup** saves everything (tasks, critters, settings and money records) to a file. **Restore from backup** checks the file before using it, shows what's in it, and keeps your current progress as a safety copy you can undo. Backups include money records, so keep them private.

## Running it

It's a single `index.html` with no build step. Open it in a browser, or turn on GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) and open the Pages link on your phone, then use **Add to Home Screen**.

Progress saves in the browser on that device. Nothing connects to your bank; the app only uses numbers you type in. Inside Claude, the same app also saves to your Claude account and can save the share image through the app's share sheet.

## Tests

```
npm test
```

Runs the unit tests for the money engine and the core engine (task queue, rewards, save validation, device merging, backups, budget periods). Needs Node 18 or newer, no installs.

```
npm i -D playwright && npx playwright install chromium
npm run test:e2e
```

Runs the browser tests: the real app in Chromium, covering tasks, timers, rewards, critters, zones, persistence, old-save migration, Big Sis Check, cooldowns, budget resets, backups, security, accessibility and five screen sizes. `npm run audit` reruns the audit checks in `docs/AUDIT.md`.

See `docs/AUDIT.md` for the audit and `docs/PROPOSALS.md` for optional paid upgrades (not built).
