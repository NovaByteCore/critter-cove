# Theme preview (not applied to the app)

Proposed colors for **Cozy Cove** (A) and **Playful Cove** (B). Nothing here is loaded by `index.html`; the live app's colors are unchanged until a theme is approved.

- `themes.json`: proposed color tokens, light and dark.
- `contrast.py` / `contrast2.py`: WCAG contrast checks. `current-contrast.txt` is today's theme (11 failures), `themes-contrast.txt` is both proposals (92/92 pass).
- `mkcss.py` builds the preview CSS; `shots.cjs` takes the comparison screenshots (needs the Fredoka and Atkinson Hyperlegible font files in `fonts/`, not committed).

Worst current issue: in dark mode the "Start timer" button is dark text on dark teal (1.83:1).
