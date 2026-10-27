# Optional upgrades: costs and options (not built)

Nothing in this file has been built or turned on. Each option needs your approval first, and none of them puts an API key in the app's code.

## 1. Live Claude-written roasts on the public GitHub Pages site

**Today:** inside Claude, Big Sis Check roasts are written live by Claude through your own Claude session (no key, no extra cost). On GitHub Pages, the app uses its built-in lines (now about 100 of them across companions and roast levels).

**How it would work safely:**
GitHub Pages can only serve files, so it can't hold a secret key. A small "proxy" would sit in the middle:

1. The app sends the purchase facts and the already-decided verdict to a tiny server function (for example a Cloudflare Worker).
2. The Worker holds your Anthropic API key as a secret setting, adds it, and calls Claude.
3. The roast comes back. The key never reaches the browser or the repo.

It would also need a daily limit (per device and overall), so a stranger can't run up your bill.

**Estimated cost:**

| Piece | Cost |
|---|---|
| Cloudflare Workers free plan | $0. Includes 100,000 requests per day and 10 ms of CPU time per request. The paid plan starts at $5/month if you ever outgrow it. ([Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)) |
| Claude Haiku 5.5 | Reported at $0.10 per million input tokens and $0.50 per million output tokens for prompts under 100K tokens ([Price Per Token](https://pricepertoken.com/pricing-page/model/anthropic-claude-haiku-5.5), [braindetox.kr](https://braindetox.kr/en/posts/claude_haiku_5_5_release_pricing_2026.html)). Please confirm on Anthropic's own pricing page before deciding; I couldn't open it from here. |
| One roast | About 1,200 input + 250 output tokens, so roughly **$0.00025** (a quarter of a tenth of a cent). |
| 1,000 roasts | About **$0.25**. |

With a hard daily cap (say 200 roasts a day total), the worst case is roughly $1.50 a month. You'd also need an Anthropic API account with billing set up.

## 2. Syncing progress across devices on GitHub Pages

**Today:**
- **Inside Claude:** progress already syncs through your Claude account (now with merging, so two devices can't overwrite each other).
- **On GitHub Pages:** progress stays on each device, and you can move it with **Settings → Download backup / Restore from backup**.

**Options if you want automatic sync on GitHub Pages:**

| Option | What it takes | Cost |
|---|---|---|
| A. Keep backup files (current) | Nothing new | $0 |
| B. Supabase (database + sign-in) | Email sign-in, per-user locked rows, the app saves to it. | **Free plan:** 50,000 monthly active users, 500 MB database, 2 active projects, but free projects are **paused after 1 week of inactivity**. **Pro:** from $25/month. ([Supabase pricing](https://supabase.com/pricing)) |
| C. Cloudflare Worker + storage | Sign-in still needed (more custom work than B). | Free plan likely enough for personal use. |

**Privacy:** options B and C mean your money records live on a third-party server. They'd be locked to your login, but it's a real change from "only on my device or my Claude account."

**My suggestion:** keep option A for now, and use the Claude version when you want sync. If more people start using the public site, option B is the simplest upgrade.
