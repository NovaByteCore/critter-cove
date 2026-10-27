# Critter Cove

A one-tap chore game for ADHD brains. Tiny tasks rebuild a messy creature island, lure in 40 weird critters, and Big Sis Check roasts you before you buy something you can't afford.

## What's in it

- **One task, one tap.** The app picks the next tiny thing based on time of day (morning reset, room of the day, night reset). Tap **Done**. "Smaller, please" turns any task into a 30-second version.
- **Daily goal chests** at 1, 3 and 5 tiny things. The fifth always brings a new critter.
- **Clean runs.** Finish another task within 12 minutes for bonus shells.
- **40 critters across 10 island zones**, from Driftwood Beach to Volcano Lounge. Critters gather shells while you're away.
- **No guilt.** No streaks. Come back after a few days and the critters throw you a welcome-back party.
- **Island news.** Breaking stories from the cove.
- **Big Sis Check:** enter your real budget (weekly spending money, what's spent, optional balance, bills, savings goal, payday), describe a purchase, and tap **Should I Buy This? 👀**. You get a roast, a verdict (🟢 approved, 🟡 hold up, 🔴 absolutely not), the numbers, a reality check and one next move. Then: buy it, Wishlist Jail it, or cool off for 24h, 48h or 7 days.
  - Pick a companion (Big Sis, Haitian Dad, Black Dad, Bestie or your own custom one), rename them, and choose a roast level (Gentle Reality Check, Don't Play With Me, Drag Me).
  - The verdict comes from a deterministic engine (`SisEngine` in `index.html`, between the `ENGINE START` / `ENGINE END` markers). Personality never changes the math.
  - Inside Claude, Claude writes the roast in your companion's voice. Elsewhere, built-in roasts are used.
  - Tracks avoided spending (only things you said no to), purchase history you can edit or delete, and patterns like late-night shopping or checking the same item over and over.
- **Also in Money:** a one-tap no-spend day button and a weekly check-in.
- **Share my island:** makes a picture of your progress to post or text.

## Running it

It's a single `index.html` with no build step. Open it in a browser, or turn on GitHub Pages (Settings → Pages → Deploy from branch → `main` / root) and open the Pages link on your phone, then use **Add to Home Screen**.

Progress saves in the browser on that device. Nothing connects to your bank; the app only uses numbers you type in. Inside Claude, the same app also saves to your Claude account and can save the share image through the app's share sheet.

## Tests

```
npm test
```

Runs the Big Sis Check engine tests (budget math, verdict rules, needs vs wants, bills and savings, impulse patterns, no double counting, weekly reset, save migration). Needs Node 18 or newer, no installs.
