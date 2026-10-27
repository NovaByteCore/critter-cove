// Screenshot harness: same seeded content, three looks (current / Cozy Cove / Playful Cove), light + dark, mobile + desktop.
// Themes are injected as CSS only. Nothing here touches the app's code.
const { chromium } = require("playwright");
const path = require("path"), fs = require("fs");
const DIR = __dirname, OUT = path.join(DIR, "shots");
fs.mkdirSync(OUT, { recursive: true });
const URL = "file:///home/claude/critter-cove/index.html";
const KEY = "critter-cove-v3";
const CSS = JSON.parse(fs.readFileSync(path.join(DIR, "themes-css.json"), "utf8"));
const FONTS = CSS.fonts.replace(/FONTDIR/g, "file://" + path.join(DIR, "fonts"));
const NOW = new Date("2026-10-27T09:12:00").getTime();
const crewIds = ["pete", "crab", "gary", "shelly", "patricia"];
const state = () => ({ v: 5, at: NOW, shells: 340, earned: 1210, tasks: 57, zones: 4, lastVisit: NOW - 3600e3, lastCollect: NOW - 2 * 3600e3, done: {}, goals: {}, week: [], sound: false,
  sis: { budget: { weekly: 150, spent: 38 } },
  crew: Object.fromEntries(["pete","shelly","kevin","dale","axel","hoops","influ","earl","goose","grandma","cuz","velvet","lava","queen"].map((id, i) => [id, { found: NOW - i * 864e5, friend: 1 + (i % 4) }])),
  notif: { setupDone: true, introSeen: true, enabled: true, personality: "bestie", reminders: [
      { id: "r1", title: "Morning reset", cat: "routines", time: "08:30", freq: "weekdays", days: [], on: true },
      { id: "r2", title: "Start the dishwasher", cat: "chores", time: "20:15", freq: "daily", days: [], on: true },
      { id: "r3", title: "Weekly money check-in", cat: "budget", time: "18:00", freq: "weekly", days: [0], on: true },
      { id: "r4", title: "Rent", cat: "bills", time: "10:00", freq: "once", date: "2026-11-01", days: [], on: false }] } });

const THEMES = (process.env.THEMES || "current,A,B").split(",");
const MODES = ["light", "dark"];
const SCREENS = (process.env.SCREENS || "home,timer,island,critters,money,notif").split(",");
const DESKTOP = ["home", "timer", "money"];

async function prep(ctx, theme) {
  const p = await ctx.newPage(); p.errs = [];
  p.on("pageerror", e => p.errs.push(e.message));
  await p.clock.install({ time: new Date(NOW) });
  await p.goto(URL);
  await p.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, state()]);
  await p.goto(URL); await p.waitForTimeout(200);
  await p.evaluate(css => { const st = document.createElement("style"); st.textContent = css; document.body.appendChild(st); }, FONTS + (CSS[theme] || ""));
  for (const id of ["#restBtn", "#zOk", "#wOk", "#rOk"]) if (await p.$(id)) await p.click(id);
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(150);
  return p;
}

async function screen(p, name) {
  if (name === "home") { await p.evaluate(() => { document.getElementById("task").scrollIntoView({ block: "start" }); window.scrollBy(0, -70); }); }
  if (name === "island") { await p.evaluate(() => window.scrollTo(0, 0)); }
  if (name === "timer") { await p.click("#defBtn"); await p.clock.fastForward(97000); await p.waitForTimeout(150); }
  if (name === "critters") { await p.click("nav button[data-tab=critters]"); await p.waitForTimeout(120); }
  if (name === "money") {
    await p.click("nav button[data-tab=money]"); await p.waitForTimeout(100);
    await p.fill("#buyItem", "Another pair of sneakers"); await p.fill("#buyAmt", "95"); await p.click("#checkBtn"); await p.waitForTimeout(250);
    await p.evaluate(() => { const v = document.querySelector(".verdict"); v && v.scrollIntoView({ block: "start" }); window.scrollBy(0, -80); });
  }
  if (name === "notif") { await p.click(".gear"); await p.waitForTimeout(100); await p.click("#sNotif"); await p.waitForTimeout(200); }
  await p.waitForTimeout(120);
}

(async () => {
  const browser = await chromium.launch();
  const log = [];
  for (const theme of THEMES) for (const mode of MODES) for (const vp of ["mobile", "desktop"]) {
    for (const name of SCREENS) {
      if (vp === "desktop" && !DESKTOP.includes(name)) continue;
      const ctx = await browser.newContext({ viewport: vp === "mobile" ? { width: 390, height: 844 } : { width: 1280, height: 820 }, deviceScaleFactor: vp === "mobile" ? 2 : 1, colorScheme: mode, reducedMotion: "reduce" });
      const p = await prep(ctx, theme);
      try { await screen(p, name); } catch (e) { log.push(`${theme}/${mode}/${vp}/${name}: ${e.message.split("\n")[0]}`); }
      const f = path.join(OUT, `${theme}-${mode}-${vp}-${name}.png`);
      await p.screenshot({ path: f });
      if (p.errs.length) log.push(`${theme}/${mode}/${vp}/${name} page errors: ${p.errs.join(" | ")}`);
      await ctx.close();
    }
  }
  await browser.close();
  console.log(log.length ? log.join("\n") : "all shots ok");
})();
