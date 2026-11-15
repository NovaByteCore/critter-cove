# Home-screen widgets

Phones only let installed apps add real widgets, so these use free helper apps. Both show one tiny task plus a critter line, change every hour using the app's time-of-day rules (morning 5–11am, night 7pm–3am, otherwise today's room), and open Critter Cove when tapped. They don't read your progress and send nothing anywhere.

- **iPhone:** `critter-cove-iphone-scriptable.js` for the free [Scriptable](https://scriptable.app) app. Small, medium and large sizes; follows light/dark.
- **Android:** `android-kwgt-setup.txt` for the free KWGT app (steps plus the two formulas to paste).

Rebuild after changing the app's tasks or critters: `node widget/extract.cjs index.html widget/data.json && node widget/build.cjs && node widget/android.cjs`. Test the iPhone script: `node widget/test.mjs` (renders every hour of a week in all sizes against a stand-in for Scriptable).

Not tested on real phones. The KWGT formula syntax was written from KWGT's documentation and hasn't been tried in the app.
