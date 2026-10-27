# Reminders, notifications and the cleaning timer: what works where

Short version: **reminders work while Critter Cove is open** (on screen, or in a background browser tab where allowed). **Critter Cove can't remind you when it's fully closed.** Nothing here claims otherwise.

## Where reminders show up

| Where you use the app | App open on screen | App open in a background tab | App fully closed |
|---|---|---|---|
| **Inside Claude** (claude.ai or the Claude app) | In-app reminder banner + sound | Shows when you come back to it | Nothing from the app. Your separate 8:47am and 8:47pm scheduled email and push nudges still arrive; those are Claude scheduled tasks, not part of the app. |
| **GitHub Pages, desktop browser** | In-app banner + sound | Browser notification, if you allowed it | Nothing |
| **GitHub Pages, Android (Chrome)** | In-app banner + sound | Browser notification while the tab is still alive. Android may stop background tabs to save battery. | Nothing |
| **GitHub Pages, iPhone (Safari)** | In-app banner + sound | Not reliable. Safari pauses background tabs. | Nothing |

**Why the closed-app column is empty:** reaching a phone when the app is closed needs "web push". That means a service worker plus a push server that holds keys and sends messages on a schedule. GitHub Pages only serves files, so it can't run that server. On iPhone, web push also only works for apps added to the Home Screen (iOS 16.4 or newer). It could be built later with a small server (see `docs/PROPOSALS.md` for cost options), but it isn't built, so the app never says it will remind you when closed.

**Inside Claude**, the page runs in a protected frame that doesn't allow system notifications, so reminders appear inside the app.

## Permission

- The app asks for browser notification permission **only** when you tap "Turn these on" during setup or "Allow browser notifications" in Settings.
- If you say no (or dismiss it), it remembers and never asks again. Settings then explains how to change it in your browser.

## Missed reminders

If the app wasn't open at a reminder's time:

- With **"Show missed reminders later"** on, you'll see it labelled "Missed reminder" the next time you open the app **that same day**.
- With it off, the reminder is skipped.

Reminders from earlier days aren't replayed, so you never open the app to a pile of old nags.

## The cleaning timer

- Works with every notification setting turned off.
- Counts from a fixed end time, so a locked screen or sleeping tab doesn't make it drift. Tested: a 3-minute simulated lock left a 5-minute timer at 1:59.
- **Sounds:** a phone usually won't play a sound or show anything at the exact moment the timer ends if the screen is locked or the browser is in the background. When you come back, the timer shows "Time's up" and offers your choices. Where allowed (GitHub Pages with permission, tab open), a browser notification is sent.
- **Rewards:** finishing the timer never gives a reward by itself. You tap **I'm Done! 🎉** to confirm, and double taps count once.
- **Timer alerts:** each one (end, halfway, encouraging messages, break over, come back after a break) is optional. None of them open a pop-up over the timer.
