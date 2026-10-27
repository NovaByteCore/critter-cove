// Browser tests: drive the real app in Chromium with Playwright.
// Run: npm run test:e2e   (needs Playwright with Chromium installed: npm i -D playwright && npx playwright install chromium)
// APP_URL can point at a deployed copy; default is the local index.html.
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const os = require("os");
const URL = process.env.APP_URL || "file://" + path.resolve(__dirname, "../../index.html");
const KEY = "critter-cove-v3";
const results = [];
let browser;

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 390, height: 844 }, reducedMotion: opts.reducedMotion || "no-preference", acceptDownloads: true });
  const p = await ctx.newPage(); p.errs = [];
  p.on("pageerror", e => p.errs.push(e.message));
  if (opts.init) await p.addInitScript(opts.init);
  if (opts.clock) await p.clock.install({ time: new Date(opts.clock) });
  if (opts.state) { await p.goto(URL); await p.evaluate(([k, s]) => localStorage.setItem(k, JSON.stringify(s)), [KEY, opts.state]); }
  await p.goto(URL); await p.waitForTimeout(250);
  if (!opts.keepWelcome && await p.$("#wOk")) await p.click("#wOk");
  return p;
}
const saved = p => p.evaluate(k => JSON.parse(localStorage.getItem(k)), KEY);
const closeSheetIfAny = async p => { for (const id of ["#restBtn", "#zOk", "#wOk", "#rOk"]) if (await p.$(id)) { await p.click(id); return; } };
const base = (extra = {}) => Object.assign({ v: 5, at: Date.now(), shells: 0, earned: 0, tasks: 0, zones: 1, crew: {}, lastVisit: Date.now(), lastCollect: Date.now(), done: {}, goals: {}, week: [] }, extra);
function ok(cond, msg) { if (!cond) throw new Error(msg); }
async function t(name, fn) {
  let p; try { p = await fn(); results.push({ name, pass: true }); }
  catch (e) { results.push({ name, pass: false, error: e.message.split("\n")[0] }); }
}

(async () => {
  browser = await chromium.launch();

  await t("first visit: welcome, then completing a task pays shells, opens a chest and finds a critter", async () => {
    const p = await open({ keepWelcome: true });
    ok(await p.$("#wOk"), "no welcome"); await p.click("#wOk");
    await p.click("#doneBtn"); await p.waitForTimeout(150);
    const label = await p.getAttribute(".sheet", "aria-label");
    const s = await saved(p);
    ok(s.tasks === 1 && s.shells >= 16, "shells/tasks " + s.shells + "/" + s.tasks);
    ok(Object.keys(s.crew).length === 1, "first task should find a critter");
    ok(/joined your island/.test(label), "sheet label: " + label);
    ok(s.goals[Object.keys(s.goals)[0]].includes(0), "first chest not recorded");
    ok(!p.errs.length, p.errs.join());
  });

  await t("double tap on Done counts once", async () => {
    const p = await open({ state: base() }); await p.dblclick("#doneBtn"); await p.waitForTimeout(300);
    ok((await saved(p)).tasks === 1, "tasks " + (await saved(p)).tasks);
  });

  await t("double tap counts once even with reward pop-ups turned off", async () => {
    const p = await open({ state: base({ quick: true }) }); await p.dblclick("#doneBtn"); await p.waitForTimeout(300);
    ok((await saved(p)).tasks === 1, "tasks " + (await saved(p)).tasks);
    await p.click("#doneBtn"); await p.waitForTimeout(100); ok((await saved(p)).tasks === 2, "a normal second tap after a pause was ignored");
  });

  await t("Not this one, Smaller please and back again", async () => {
    const p = await open({ state: base() });
    const a = await p.textContent("#taskText"); await p.click("#skipBtn"); const b = await p.textContent("#taskText");
    ok(a !== b, "skip didn't change task");
    await p.click("#smallBtn"); ok((await p.textContent("#taskWhen")) === "Tiny version", "no tiny version");
    await p.click("#skipBtn"); ok((await p.textContent("#taskText")) === b, "didn't return to the bigger task");
  });

  await t("Later hides a task for two hours with no penalty", async () => {
    const p = await open({ state: base(), clock: "2026-10-27T13:00:00" });
    const a = await p.textContent("#taskText"); await p.click("#laterBtn");
    ok((await p.textContent("#taskText")) !== a, "task still showing");
    const s = await saved(p); ok(s.shells === 0 && s.tasks === 0, "penalty or reward applied");
    await p.clock.fastForward("02:01:00"); await p.click("nav button[data-tab=critters]"); await p.click("nav button[data-tab=island]");
    let back = false; for (let i = 0; i < 12 && !back; i++) { if ((await p.textContent("#taskText")) === a) back = true; else await p.click("#skipBtn"); }
    ok(back, "task never came back after 2 hours");
  });

  await t("30-second start: hide, resume card survives reload, finish via resume", async () => {
    const p = await open({ state: base(), clock: "2026-10-27T13:00:00" });
    const task = await p.textContent("#taskText");
    await p.click('[data-secs="30"]'); await p.waitForTimeout(100);
    ok(/30 seconds/.test(await p.textContent(".sheet .label")), "timer label");
    await p.click("#tHide"); ok(await p.isVisible("#resume"), "no resume card");
    await p.reload(); await p.waitForTimeout(200); ok(await p.isVisible("#resume"), "resume card lost on reload");
    await p.click("#resumeBtn"); await p.waitForTimeout(100); ok(await p.$("#tDone"), "resume didn't reopen timer");
    await p.clock.fastForward("00:00:40"); await p.waitForTimeout(400);
    ok(/You started/.test(await p.textContent("#tmsg")), "time-up message missing");
    await p.click("#tDone"); await p.waitForTimeout(150);
    const s = await saved(p); ok(s.tasks === 1 && !s.activeTimer, "not completed via timer");
    ok(Object.values(s.done)[0].includes(task), "wrong task completed");
  });

  await t("I'm overwhelmed: rescue picks one tiny thing; rest mode; ready again", async () => {
    const p = await open({ state: base() });
    await p.click("#overBtn"); await p.click('.rescue [data-i="0"]');
    ok((await p.textContent("#taskText")) === "Drink some water", "rescue task not set");
    await p.click("#overBtn"); await p.click("#kindBtn"); ok(await p.$(".sheet .roast"), "no kind words");
    await p.click("#restNow"); ok((await p.textContent("#taskWhen")) === "Resting", "not resting");
    ok(await p.isHidden("#doneBtn"), "Done visible while resting");
    await p.click("#readyBtn"); ok(await p.isVisible("#doneBtn"), "ready didn't restore");
  });

  await t("three daily chests open at 1, 3 and 5; the fifth guarantees a critter", async () => {
    const p = await open({ state: base({ tasks: 3 }) });
    for (let i = 0; i < 5; i++) { await p.click("#doneBtn"); await p.waitForTimeout(300); await closeSheetIfAny(p); }
    const s = await saved(p), k = Object.keys(s.goals)[0];
    ok(s.goals[k].length === 3, "chests " + JSON.stringify(s.goals));
    ok(/All 3 chests/.test(await p.textContent("#goalText")), "goal text");
    ok(Object.keys(s.crew).length >= 1, "no critter");
  });

  await t("Skip reward pop-ups shows a small note instead", async () => {
    const p = await open({ state: base({ quick: true }) });
    await p.click("#doneBtn"); await p.waitForTimeout(150);
    ok(!(await p.$(".sheet")), "sheet opened"); ok(/shells/.test(await p.textContent(".toast")), "no toast");
  });

  await t("opening a zone spends shells and tells its story", async () => {
    const p = await open({ state: base({ shells: 100, earned: 100, crew: { pete: { found: 1, friend: 1 } } }) });
    await p.click("nav button[data-tab=critters]"); await p.click("#zoneBuy"); await p.waitForTimeout(100);
    ok(/Junk Cove is open/.test(await p.textContent(".sheet")), "no zone story");
    const s = await saved(p); ok(s.zones === 2 && s.shells === 60, "zones/shells " + s.zones + "/" + s.shells);
  });

  await t("progress survives a reload", async () => {
    const p = await open({ state: base() }); await p.click("#doneBtn"); await closeSheetIfAny(p);
    const a = await saved(p); await p.reload(); await p.waitForTimeout(200);
    ok((await p.textContent("#shellCount")) === String(a.shells), "shell count changed after reload");
    const b = await saved(p); ok(b.tasks === a.tasks && JSON.stringify(b.crew) === JSON.stringify(a.crew), "progress changed");
  });

  await t("old saves load: version 3 parked items become cooldowns, nothing lost", async () => {
    const v3 = { v: 3, at: Date.now(), shells: 70, earned: 300, tasks: 12, zones: 4, crew: { pete: { found: 1, friend: 1 }, gary: { found: 2, friend: 3 } }, parked: [{ item: "Candle", amt: 38, until: Date.now() + 36e5 }], nahAmt: 40, budget: 60, lastVisit: Date.now(), lastCollect: Date.now() };
    const p = await open({ state: v3 });
    ok((await p.textContent("#shellCount")) === "70", "shells");
    await p.click("nav button[data-tab=money]"); ok(/Candle/.test(await p.textContent("#cooldowns")), "parked item missing");
    ok((await p.textContent("#avoidAmt")) === "$40", "old avoided amount lost");
    const s = await saved(p); ok(s.zones === 4 && Object.keys(s.crew).length === 2, "zones/crew");
  });

  await t("Big Sis: needs a budget, then red, jail, green, bought; spent and avoided add up", async () => {
    const p = await open({ state: base() });
    await p.click("nav button[data-tab=money]");
    await p.fill("#buyItem", "Handbag"); await p.fill("#buyAmt", "240"); await p.click("#checkBtn");
    ok(await p.$("#niGo"), "no budget prompt"); await p.click("#niGo");
    await p.fill("#bf-weekly", "300"); await p.fill("#bf-balance", "900"); await p.fill("#bf-bills", "400"); await p.click("#bfSave");
    ok((await p.textContent("#sisAvail")) === "$300", "available " + await p.textContent("#sisAvail"));
    await p.click("#checkBtn"); await p.waitForTimeout(250);
    ok(/ABSOLUTELY NOT/.test(await p.textContent(".verdict")), "verdict " + await p.textContent(".verdict"));
    await p.click('[data-r="jail"]'); ok((await p.textContent("#avoidAmt")) === "$240", "avoided");
    await p.fill("#buyItem", "Book"); await p.fill("#buyAmt", "25"); await p.click("#checkBtn"); await p.waitForTimeout(250);
    ok(/APPROVED/.test(await p.textContent(".verdict")), "book not approved");
    await p.click('[data-r="bought"]');
    ok((await p.textContent("#spentAmt")) === "$25" && (await p.textContent("#sisAvail")) === "$275", "spent/available");
  });

  await t("Big Sis rejects bad input with a message", async () => {
    const p = await open({ state: base() }); await p.click("nav button[data-tab=money]");
    await p.fill("#buyItem", "Shoes"); await p.fill("#buyAmt", "abc"); await p.click("#checkBtn");
    ok(/doesn't look right/.test(await p.textContent(".toast")), "no price error");
    await p.click("#budgetBtn"); await p.fill("#bf-weekly", "-5"); await p.click("#bfSave");
    ok(/0 or more/.test(await p.textContent(".toast")), "no negative error");
    ok(await p.$("#bfSave"), "sheet closed on invalid input");
  });

  await t("cooldown: decide after it expires; Nah counts as avoided once", async () => {
    const p = await open({ state: base({ sis: { budget: { weekly: 100, spent: 0 } } }), clock: "2026-10-27T13:00:00" });
    await p.click("nav button[data-tab=money]");
    await p.fill("#buyItem", "Hoodie"); await p.fill("#buyAmt", "40"); await p.click("#checkBtn"); await p.waitForTimeout(250);
    ok(/HOLD UP/.test(await p.textContent(".verdict")), "not yellow");
    await p.click('[data-r="cooldown"][data-c="24h"]');
    ok(/Decide in/.test(await p.textContent("#cooldowns")) && (await p.textContent("#plannedAmt")) === "$40", "cooldown not listed as planned");
    await p.clock.fastForward("25:00:00"); await p.click("nav button[data-tab=island]"); await p.click("nav button[data-tab=money]");
    ok(/Still want it/.test(await p.textContent("#cooldowns")), "didn't expire");
    await p.click('#cooldowns [data-act="skipped"]');
    ok((await p.textContent("#avoidAmt")) === "$40", "avoided " + await p.textContent("#avoidAmt"));
  });

  await t("But Hear Me Out: new facts can change it, insisting can't", async () => {
    const p = await open({ state: base({ sis: { budget: { weekly: 300, spent: 0 } } }) });
    await p.click("nav button[data-tab=money]");
    await p.fill("#buyItem", "Handbag"); await p.fill("#buyAmt", "240"); await p.click("#checkBtn"); await p.waitForTimeout(250);
    await p.click("#hearBtn"); await p.fill("#hNote", "But I really really want it"); await p.click("#hGo"); await p.waitForTimeout(400);
    ok(/ABSOLUTELY NOT/.test(await p.textContent(".verdict")), "insisting changed the verdict");
    await p.click("#hearBtn"); await p.fill("#hAside", "700"); await p.click("#hGo"); await p.waitForTimeout(400);
    ok(/APPROVED/.test(await p.textContent(".verdict")), "set-aside money didn't count");
    ok(/First answer/.test(await p.textContent(".sheet")), "original verdict not shown");
    const r = (await saved(p)).sis.history; ok(r.length === 1 && r[0].appeals.length === 2, "appeal not recorded or duplicated");
  });

  await t("budget cycles: monthly reset keeps history and logs the old period", async () => {
    const p = await open({ state: base({ sis: { budget: { weekly: 500, spent: 0 } } }), clock: "2026-10-27T13:00:00" });
    await p.click("nav button[data-tab=money]"); await p.click("#budgetBtn");
    await p.click('#bf-cycle [data-v="monthly"]'); await p.fill("#bf-anchor", "2026-10-15"); await p.click("#bfSave");
    await p.fill("#buyItem", "Book"); await p.fill("#buyAmt", "25"); await p.click("#checkBtn"); await p.waitForTimeout(250); await p.click('[data-r="bought"]');
    ok(/this month/.test(await p.textContent("#spentLbl")), "label not monthly");
    await p.clock.fastForward(20 * 864e5); await p.click("nav button[data-tab=island]"); await p.click("nav button[data-tab=money]");
    ok((await p.textContent("#spentAmt")) === "$0", "spent didn't reset");
    ok(/\$25/.test(await p.textContent("#periods")), "old period not logged");
    ok(/Book/.test(await p.textContent("#history")), "purchase history lost on reset");
  });

  await t("history: edit price and delete; deletion sticks after reload", async () => {
    const p = await open({ state: base({ sis: { budget: { weekly: 300, spent: 0 } } }) });
    await p.click("nav button[data-tab=money]");
    await p.fill("#buyItem", "Book"); await p.fill("#buyAmt", "25"); await p.click("#checkBtn"); await p.waitForTimeout(250); await p.click('[data-r="bought"]');
    await p.click('#history .hrow'); await p.fill("#hPrice", "30"); await p.click("#hSave");
    ok((await p.textContent("#spentAmt")) === "$30", "edit didn't update spent");
    await p.click('#history .hrow'); await p.click("#hDel"); await p.click("#hDel");
    ok((await p.textContent("#spentAmt")) === "$0", "delete didn't refund spent");
    await p.reload(); await p.waitForTimeout(200); await p.click("nav button[data-tab=money]");
    ok(/Nothing checked yet/.test(await p.textContent("#history")), "deleted record came back");
  });

  await t("my tasks: add, edit, delete; important tasks come first", async () => {
    const p = await open({ state: base() });
    await p.click("#gearBtn"); await p.click("#sTasks"); await p.click("#tAdd");
    await p.click("#te-save"); ok(/Give the task a name/.test(await p.textContent(".toast")), "empty name accepted");
    await p.fill("#te-text", "Give the dog meds"); await p.click("details.adv summary"); await p.click("#te-imp"); await p.click("#te-save");
    await p.click("#tClose"); ok((await p.textContent("#taskText")) === "Give the dog meds", "important task not first");
    await p.click("#gearBtn"); await p.click("#sTasks"); await p.click("#myTasks .hrow"); await p.fill("#te-text", "Dog meds"); await p.click("#te-save");
    ok(/Dog meds/.test(await p.textContent("#myTasks")), "edit failed");
    await p.click("#myTasks .hrow"); await p.click("#te-del"); await p.click("#te-del");
    ok(/No tasks of your own/.test(await p.textContent("#myTasks")), "delete failed");
  });

  await t("backup: download, change things, restore, then undo the restore", async () => {
    const p = await open({ state: base({ shells: 77, earned: 77, crew: { pete: { found: 1, friend: 1 } } }) });
    await p.click("#gearBtn");
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click("#sExport")]);
    const file = path.join(os.tmpdir(), "cc-backup-" + Date.now() + ".json"); await dl.saveAs(file);
    ok(JSON.parse(fs.readFileSync(file, "utf8")).app === "critter-cove", "not a backup file");
    await p.keyboard.press("Escape"); await p.click("#doneBtn"); await closeSheetIfAny(p);
    const changed = (await saved(p)).shells; ok(changed > 77, "didn't change");
    await p.click("#gearBtn"); await p.setInputFiles("#sFile", file); await p.waitForTimeout(200);
    ok(/Replace your progress/.test(await p.textContent(".sheet")), "no restore summary");
    await p.click("#rGo"); ok((await saved(p)).shells === 77, "restore failed");
    await p.click("#gearBtn"); await p.click("#sUndo"); ok((await saved(p)).shells === changed, "undo failed");
  });

  await t("backup: a damaged or wrong file is refused and nothing changes", async () => {
    const p = await open({ state: base({ shells: 50 }) });
    const bad = path.join(os.tmpdir(), "cc-bad-" + Date.now() + ".json"); fs.writeFileSync(bad, '{"hello": "world"');
    await p.click("#gearBtn"); await p.setInputFiles("#sFile", bad); await p.waitForTimeout(200);
    ok(/didn't work/.test(await p.textContent(".sheet")) && /Nothing was changed/.test(await p.textContent(".sheet")), "no error shown");
    ok((await saved(p)).shells === 50, "progress changed");
  });

  await t("security: tampered saved data can't run code", async () => {
    const st = base({ sis: { budget: { weekly: 100 }, history: [{ id: "x", item: '<img src=x onerror="window.__xss=1">', price: 5, at: Date.now(), verdict: 'green"><img src=x onerror="window.__xss=2">', n: {} }] }, name: "<script>window.__xss=3</script>" });
    const p = await open({ state: st }); await p.click("nav button[data-tab=money]"); await p.click("#history .hrow"); await p.click("#hView").catch(() => {});
    await p.waitForTimeout(200); ok(!(await p.evaluate(() => window.__xss)), "code ran");
  });

  await t("sync: account progress is merged, never overwritten by an older device", async () => {
    const remote = { json: JSON.stringify(base({ shells: 999, earned: 5000, tasks: 300, zones: 6, crew: { gary: { found: 2, friend: 4 } } })), at: Date.now() };
    const init = `(()=>{const remote=${JSON.stringify(remote)};window.__sets=[];const docs={};
      const mk=path=>({get:()=>new Promise(r=>setTimeout(()=>r(path.endsWith('/cove')?{exists:true,data:()=>remote}:{exists:false,data:()=>null}),1200)),set:async d=>{window.__sets.push([path,d])},onSnapshot:()=>()=>{}});
      window.claude={use:async n=>n==='db'?{doc:p=>docs[p]||(docs[p]=mk(p))}:n==='user'?{id:async()=>'u1'}:null};})()`;
    const p = await open({ state: base({ shells: 10, earned: 50, tasks: 3, crew: { pete: { found: 1, friend: 1 } }, at: Date.now() - 864e5 }), init });
    await p.click("#doneBtn"); await closeSheetIfAny(p); await p.waitForTimeout(2600);
    const last = await p.evaluate(() => { const s = window.__sets.filter(x => x[0].endsWith("/cove")).pop(); return s && JSON.parse(s[1].json); });
    ok(last && last.shells >= 999 && last.tasks >= 300 && last.zones === 6, "account progress lost: " + JSON.stringify(last && { shells: last.shells, tasks: last.tasks }));
    ok(last.crew.pete && last.crew.gary, "critters from both devices not kept");
  });

  await t("accessibility: pop-ups are named, hold focus, close with Escape and return focus", async () => {
    const p = await open({ state: base() });
    await p.focus("#gearBtn"); await p.keyboard.press("Enter"); await p.waitForTimeout(100);
    ok((await p.getAttribute(".sheet", "aria-label")) === "Settings", "no label");
    let outside = 0; for (let i = 0; i < 30; i++) { await p.keyboard.press("Tab"); if (await p.evaluate(() => !document.activeElement.closest(".sheet"))) outside++; }
    ok(outside === 0, outside + " tabs escaped");
    ok(await p.evaluate(() => document.querySelector("main").inert), "page behind not inert");
    await p.keyboard.press("Escape"); ok(!(await p.$(".sheet")), "Escape didn't close");
    ok(await p.evaluate(() => document.activeElement.id) === "gearBtn", "focus not returned");
    const unnamed = await p.evaluate(() => [...document.querySelectorAll("button,input,[role=button]")].filter(e => e.offsetParent && !(e.getAttribute("aria-label") || e.getAttribute("aria-labelledby") || e.textContent.trim() || (e.labels && e.labels.length))).length);
    ok(unnamed === 0, unnamed + " unnamed controls");
  });

  await t("accessibility: map critters work with the keyboard; rare label readable", async () => {
    const p = await open({ state: base({ crew: { kevin: { found: 1, friend: 1 } }, zones: 2 }) });
    await p.focus('[data-critter="kevin"]'); await p.keyboard.press("Enter");
    ok(/Couch Gremlin Kevin/.test(await p.textContent("#bubbleHost")), "no bubble");
    await p.click("nav button[data-tab=critters]");
    const c = await p.evaluate(() => getComputedStyle(document.querySelector(".rar.rare")).color); ok(c === "rgb(43, 103, 100)", "rare color " + c);
  });

  await t("reduced motion and low stimulation turn animations off", async () => {
    const p = await open({ state: base(), reducedMotion: "reduce" });
    ok(await p.evaluate(() => getComputedStyle(document.querySelector(".wave")).animationName) === "none", "OS setting ignored");
    const q = await open({ state: base({ calm: true }) });
    ok(await q.evaluate(() => getComputedStyle(document.querySelector(".wave")).animationName) === "none", "low stimulation ignored");
  });

  for (const vp of [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 412, height: 915 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }]) {
    await t(`layout at ${vp.width}px: tabs switch, nothing scrolls sideways, sheets fit`, async () => {
      const p = await open({ state: base({ sis: { budget: { weekly: 100 } } }), viewport: vp });
      for (const tab of ["island", "critters", "money"]) {
        await p.click(`nav button[data-tab=${tab}]`);
        ok(await p.isVisible(`#v-${tab}`), tab + " not shown");
        ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), tab + " overflows");
      }
      await p.click("#gearBtn"); const w = await p.evaluate(() => document.querySelector(".sheet").getBoundingClientRect().width);
      ok(w <= vp.width, "sheet wider than screen"); ok(!p.errs.length, p.errs.join());
    });
  }

  await browser.close();
  const pass = results.filter(r => r.pass).length;
  results.forEach(r => console.log((r.pass ? "ok   " : "FAIL ") + r.name + (r.error ? "\n     " + r.error : "")));
  console.log(`\n${pass}/${results.length} browser tests passed`);
  if (process.env.RESULTS_FILE) fs.writeFileSync(process.env.RESULTS_FILE, JSON.stringify({ when: new Date().toISOString(), url: URL, pass, total: results.length, results }, null, 1));
  process.exit(pass === results.length ? 0 : 1);
})();
