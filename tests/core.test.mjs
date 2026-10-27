// Tests for the core engine (tasks, rewards, saves, merging, backups) and Big Sis budget periods.
// Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const ctx = {}; vm.runInNewContext(cut("/* ===ENGINE START===", "/* ===ENGINE END=== */") + cut("/* ===CORE START===", "/* ===CORE END=== */") + "\nthis.E = SisEngine; this.C = CoreEngine;", ctx);
const { E, C } = ctx;
const plain = x => JSON.parse(JSON.stringify(x));
const at = s => +new Date(s);
const MORNING = ["Water", "Bed"], NIGHT = ["Dishes", "Charger"];
const ROOMS = { Kitchen: ["Wipe counter"], Bedroom: ["Clothes"], Laundry: ["Start load"], Anywhere: ["Trash x5"] };
const ROOM_ORDER = ["Kitchen", "Bedroom", "Bedroom", "Kitchen", "Laundry", "Kitchen", "Anywhere"];
const Q = o => plain(C.buildQueue(Object.assign({ MORNING, NIGHT, ROOMS, ROOM_ORDER, done: [], snooze: {}, suggest: {}, custom: [] }, o))).map(x => x.t);
const OPTS = { critterIds: ["pete", "gary", "crab"], zoneCount: 10 };
const prep = d => C.sanitize(E.migrate(Object.assign({ shells: 0, earned: 0, tasks: 0, zones: 1, crew: {}, done: {}, goals: {} }, d), Date.now()), OPTS);

/* ---------- tasks ---------- */
test("morning shows the morning routine first, then today's room", () => {
  assert.deepEqual(plain(Q({ now: at("2026-10-27T08:00:00") })), ["Water", "Bed", "Clothes", "Trash x5"]); // Tuesday is ROOM_ORDER[1]: Bedroom
});
test("daytime has no routine; done and snoozed tasks are skipped", () => {
  const now = at("2026-10-27T14:00:00");
  assert.deepEqual(Q({ now }), ["Clothes", "Trash x5"]);
  assert.deepEqual(Q({ now, done: ["Clothes"] }), ["Trash x5"]);
  assert.deepEqual(Q({ now, snooze: { "Clothes": now + 1000 } }), ["Trash x5"]);
  assert.deepEqual(Q({ now, snooze: { "Clothes": now - 1000 } }), ["Clothes", "Trash x5"]); // snooze expired
});
test("turned-off suggestions disappear; a turned-off room passes to the next one", () => {
  const now = at("2026-10-27T14:00:00");
  assert.deepEqual(Q({ now, suggest: { rooms: { Bedroom: false } } }), ["Wipe counter", "Trash x5"]);
  assert.deepEqual(Q({ now: at("2026-10-27T08:00:00"), suggest: { morning: false, rooms: { Bedroom: false, Anywhere: false } } }), ["Wipe counter"]);
});
test("custom tasks: due rules, time of day, important first, done once", () => {
  const tue = at("2026-10-27T14:00:00"), sat = at("2026-10-31T14:00:00");
  const custom = [
    { id: "a", text: "Feed dog", when: "any", repeat: "daily", mins: 2 },
    { id: "b", text: "Pay phone bill", when: "any", repeat: "once", priority: "high", mins: 5 },
    { id: "c", text: "Trash day", when: "day", repeat: "weekly", days: [2] },
    { id: "d", text: "Laptop work", when: "any", repeat: "weekdays" },
    { id: "e", text: "Night meds reminder", when: "night", repeat: "daily" },
    { id: "f", text: "Paused one", repeat: "daily", paused: true }
  ];
  const q = Q({ now: tue, custom });
  assert.equal(q[0], "Pay phone bill");
  assert.ok(q.includes("Feed dog") && q.includes("Trash day") && q.includes("Laptop work"));
  assert.ok(!q.includes("Night meds reminder") && !q.includes("Paused one"));
  const satQ = Q({ now: sat, custom });
  assert.ok(!satQ.includes("Trash day") && !satQ.includes("Laptop work"));
  assert.ok(!Q({ now: tue, custom: [{ ...custom[1], completedAt: tue }] }).includes("Pay phone bill"));
  assert.ok(!Q({ now: tue, custom, done: ["c:a"] }).includes("Feed dog")); // done key for custom tasks
});

/* ---------- rewards ---------- */
test("rewards: base, timer bonus, runs and their limits", () => {
  assert.equal(C.gainFor({ micro: false, viaTimer: false, chain: 1, roll: 0 }), 8);
  assert.equal(C.gainFor({ micro: false, viaTimer: false, chain: 1, roll: 0.999 }), 12);
  assert.equal(C.gainFor({ micro: true, viaTimer: true, chain: 3, roll: 0 }), 5 + 4 + 6);
  const t = 1e12;
  assert.equal(C.chainFor(t, t - 5 * 6e4, 2), 3);
  assert.equal(C.chainFor(t, t - 13 * 6e4, 4), 1); // run expired
  assert.equal(C.chainFor(t, t - 6e4, 5), 5);       // capped
  assert.equal(C.chainFor(t, t + 9e5, 4), 1);       // clock set back: no free run bonus
});
test("daily chests open once each at 1, 3 and 5", () => {
  const G = [[1, 8], [3, 15], [5, 25]];
  let r = C.chestFor(1, [], G); assert.equal(r.chest.bonus, 8);
  r = C.chestFor(1, r.claimed, G); assert.equal(r.chest, null); // no double chest
  r = C.chestFor(3, plain(r.claimed), G); assert.equal(r.chest.i, 1);
  r = C.chestFor(5, plain(r.claimed), G); assert.equal(r.chest.i, 2);
  assert.deepEqual(plain(r.claimed), [0, 1, 2]);
});
test("critter gifts: capped at 12 hours, frozen clock fixed", () => {
  const now = 1e12;
  assert.equal(C.giftFor(now, now - 2 * 36e5, 5), 6);
  assert.equal(C.giftFor(now, now - 48 * 36e5, 5), 36);   // 12-hour cap
  assert.equal(C.giftFor(now, now - 2 * 36e5, 40), 24);  // crew cap of 20
  assert.equal(C.giftFor(now, now + 36e5, 5), 0);
  const fixed = C.clampClock({ lastCollect: now + 5 * 36e5, runAt: now + 1, run: 4, lastVisit: now + 9 }, now);
  assert.equal(fixed.lastCollect, now); assert.equal(fixed.run, 0); assert.equal(fixed.lastVisit, now);
});

/* ---------- validation ---------- */
test("sanitize blocks injected HTML values and clamps junk", () => {
  const s = prep({ shells: "-50", zones: 99, crew: { pete: { friend: 3 }, hacker: { friend: 1 } }, name: "<b>x</b>".repeat(10),
    sis: { history: [{ id: "x", item: "ok", price: 5, verdict: 'green"><img src=x onerror=alert(1)>', decision: "<script>", kind: "evil", n: { available: "abc" } }, { id: "y", price: -3 }, { item: "no id", price: 4 }] } });
  assert.equal(s.shells, 0); assert.equal(s.zones, 10); assert.deepEqual(Object.keys(s.crew), ["pete"]); assert.equal(s.name.length, 20);
  assert.equal(s.sis.history.length, 1);
  const r = s.sis.history[0];
  assert.equal(r.verdict, null); assert.equal(r.decision, null); assert.equal(r.kind, "want"); assert.equal(r.n.available, null);
});
test("sanitize keeps a normal save exactly usable", () => {
  const good = { shells: 120, earned: 400, tasks: 20, zones: 3, crew: { pete: { found: 5, friend: 2 } }, done: { "2026-10-27": ["Wipe counter"] }, goals: { "2026-10-27": [0] }, nospend: ["2026-10-26"], checkins: [{ week: "2026-10-20", amt: 40, budget: 60 }],
    custom: [{ id: "a", text: "Feed dog", repeat: "weekly", days: [1, 3], mins: 2, when: "morning" }], sis: { name: "Auntie", intensity: 3, budget: { weekly: 200, spent: 30, cycle: "monthly", anchor: "2026-10-15" },
    history: [{ id: "r1", item: "Shoes", price: 95, kind: "want", at: 5, verdict: "yellow", decision: "jail", n: { available: 180, price: 95, after: 85, pct: 52.8 } }] } };
  const s = prep(good);
  assert.equal(s.shells, 120); assert.equal(s.zones, 3); assert.equal(s.crew.pete.friend, 2); assert.deepEqual(plain(s.done), good.done);
  assert.equal(s.custom[0].days.join(), "1,3"); assert.equal(s.sis.name, "Auntie"); assert.equal(s.sis.intensity, 3); assert.equal(s.sis.budget.cycle, "monthly");
  assert.equal(s.sis.history[0].decision, "jail"); assert.equal(s.sis.history[0].n.pct, 52.8);
});
test("old saves (v3, v4, v5) load without losing progress", () => {
  const v3 = { v: 3, shells: 70, earned: 300, tasks: 12, zones: 4, crew: { pete: { found: 1, friend: 1 }, gary: { found: 2, friend: 3 } }, parked: [{ item: "Candle", amt: 38, until: 1e12 }], nahAmt: 40, budget: 60 };
  const s3 = prep(v3);
  assert.equal(s3.shells, 70); assert.equal(s3.zones, 4); assert.equal(Object.keys(s3.crew).length, 2); assert.equal(s3.nahAmt, 40);
  assert.equal(s3.sis.history[0].item, "Candle"); assert.equal(s3.sis.history[0].decision, "cooldown"); assert.equal(s3.parked, undefined);
  const v5 = { v: 4, shells: 538, zones: 9, crew: { pete: { found: 1, friend: 2 } }, sis: { name: "Haitian Dad", persona: "haitiandad", intensity: 3, budget: { weekly: 300, spent: 25, week: "2026-10-26", updated: 9 }, history: [{ id: "c1", item: "Book", price: 25, verdict: "green", decision: "bought", counted: 25, countedWeek: "2026-10-26", at: 1 }] } };
  const s5 = prep(v5);
  assert.equal(s5.sis.budget.period, "2026-10-26"); // old Monday week becomes the current weekly period
  assert.equal(s5.sis.budget.cycle, "weekly"); assert.equal(s5.sis.history[0].counted, 25); assert.equal(s5.sis.persona, "haitiandad");
});

/* ---------- merging two devices ---------- */
test("merge keeps the newer device's progress and both devices' records", () => {
  const phone = prep({ at: 100, shells: 30, earned: 70, tasks: 4, crew: { pete: { found: 1, friend: 1 } }, nospend: ["2026-10-01"], sis: { history: [{ id: "p1", item: "Gum", price: 2, at: 50, decision: "skipped" }] } });
  const account = prep({ at: 50, shells: 999, earned: 5000, tasks: 300, zones: 6, crew: { gary: { found: 2, friend: 4 } }, sis: { history: [{ id: "a1", item: "Bag", price: 240, at: 40, decision: "jail" }] } });
  const m = C.mergeStates(phone, account);
  assert.equal(m.shells, 999); assert.equal(m.tasks, 300); assert.equal(m.zones, 6);
  assert.deepEqual(plain(Object.keys(m.crew).sort()), ["gary", "pete"]);
  assert.deepEqual(plain(m.sis.history.map(r => r.id)), ["a1", "p1"]);
  assert.deepEqual(plain(m.nospend), ["2026-10-01"]); assert.equal(m.at, 100);
});
test("merge respects deletions and newer edits, and is stable (no save ping-pong)", () => {
  const a = prep({ at: 2, earned: 10, sis: { history: [{ id: "r", item: "Old name", price: 10, at: 1, updated: 1 }, { id: "gone", item: "x", price: 1, at: 1 }], deleted: ["gone"] }, custom: [{ id: "t1", text: "A", updated: 5 }] });
  const b = prep({ at: 1, earned: 10, sis: { history: [{ id: "r", item: "New name", price: 12, at: 1, updated: 9 }, { id: "gone", item: "x", price: 1, at: 1 }] }, custom: [{ id: "t1", text: "A edited", updated: 8 }, { id: "t2", text: "B" }], tasksDeleted: ["t2"] });
  const m = C.mergeStates(a, b);
  assert.deepEqual(plain(m.sis.history.map(r => r.item)), ["New name"]);
  assert.deepEqual(plain(m.custom.map(t => t.text)), ["A edited"]);
  const again = C.mergeStates(m, b), again2 = C.mergeStates(b, m);
  assert.ok(C.sameProgress(again, m)); assert.ok(C.sameProgress(again2, m));
});
test("big histories are split into chunks and joined back exactly", () => {
  const hist = Array.from({ length: 401 }, (_, i) => ({ id: "h" + i, item: "Item " + i, price: 1 + i, at: i }));
  const { main, chunks } = C.splitForStorage({ shells: 5, sis: { history: hist } }, 150);
  assert.equal(chunks.length, 3); assert.equal(main.sis.history.length, 0); assert.equal(main.histChunks, 3);
  assert.ok(JSON.stringify(main).length < 2000);
  const back = C.joinFromStorage(main, chunks);
  assert.equal(back.sis.history.length, 401); assert.equal(back.sis.history[400].id, "h400"); assert.equal(back.histChunks, undefined);
});

/* ---------- backups ---------- */
test("backup round trip restores everything", () => {
  const st = prep({ shells: 80, earned: 200, tasks: 9, zones: 3, crew: { pete: { found: 1, friend: 1 } }, custom: [{ id: "t", text: "Feed dog" }], sis: { budget: { weekly: 150 }, history: [{ id: "r", item: "Shoes", price: 95, at: 1, decision: "jail" }] } });
  const r = C.readBackup(C.makeBackup(st, at("2026-10-27T12:00:00")), prep);
  assert.equal(r.ok, true); assert.equal(r.summary.critters, 1); assert.equal(r.summary.purchases, 1); assert.equal(r.summary.customTasks, 1);
  assert.ok(C.sameProgress(r.data, st));
});
test("bad backup files are rejected with a clear message and change nothing", () => {
  for (const [txt, msg] of [["", /empty/], ["{not json", /couldn't be read/], ['{"app":"other","data":{}}', /isn't a Critter Cove backup/], ['{"app":"critter-cove","data":[1,2]}', /isn't a Critter Cove backup/], ['{"app":"critter-cove","format":99,"data":{}}', /newer version/], ["x".repeat(5e6 + 1), /too big/]]) {
    const r = C.readBackup(txt, prep); assert.equal(r.ok, false, txt.slice(0, 20)); assert.match(r.error, msg);
  }
  const evil = C.readBackup(JSON.stringify({ app: "critter-cove", data: { shells: 1e99, sis: { history: [{ id: "x", item: "<img onerror=1>", price: 5, verdict: "<script>" }] } } }), prep);
  assert.equal(evil.ok, true); assert.equal(evil.data.shells, 1e7); assert.equal(evil.data.sis.history[0].verdict, null);
});

/* ---------- budget periods ---------- */
test("weekly, biweekly, monthly and custom periods start on the user's reset date", () => {
  const now = at("2026-10-27T15:00:00"); // a Tuesday
  assert.equal(E.periodInfo({}, now).key, "2026-10-26"); // default: Monday
  assert.equal(E.periodInfo({ cycle: "weekly", anchor: "2026-10-02" }, now).key, "2026-10-23"); // Fridays
  assert.equal(E.periodInfo({ cycle: "biweekly", anchor: "2026-10-02" }, now).key, "2026-10-16");
  const m = E.periodInfo({ cycle: "monthly", anchor: "2026-01-15" }, now); assert.equal(m.key, "2026-10-15"); assert.equal(m.lastDay, "2026-11-14");
  assert.equal(E.periodInfo({ cycle: "monthly", anchor: "2026-01-31" }, at("2026-11-10T12:00:00")).key, "2026-10-31");
  assert.equal(E.periodInfo({ cycle: "monthly", anchor: "2026-01-31" }, at("2026-12-01T12:00:00")).key, "2026-11-30"); // short month
  assert.equal(E.periodInfo({ cycle: "custom", customDays: 10, anchor: "2026-10-01" }, now).key, "2026-10-21");
  assert.equal(E.periodInfo({ cycle: "weekly", anchor: "2026-12-04" }, now).key, "2026-10-23"); // future reset date works backwards
  assert.equal(E.periodLabel({ cycle: "monthly" }), "this month");
});
test("a new period logs the old total, resets spent, and leaves purchases alone", () => {
  const b = { weekly: 200, spent: 140, cycle: "weekly", anchor: "2026-10-19", period: "2026-10-19" };
  const r = E.rollPeriod(b, at("2026-10-27T09:00:00"));
  assert.equal(r.budget.spent, 0); assert.equal(r.budget.period, "2026-10-26");
  assert.deepEqual(plain(r.closed), { start: "2026-10-19", end: "2026-10-25", spent: 140, amount: 200, cycle: "weekly" });
  const same = E.rollPeriod(r.budget, at("2026-10-28T09:00:00")); assert.equal(same.closed, null); assert.equal(same.budget.spent, 0);
});
test("set-aside money for one purchase counts, insisting alone doesn't", () => {
  const b = { weekly: 300, spent: 0 }, now = at("2026-10-27T12:00:00");
  const bag = { id: "x", item: "Handbag", price: 240, kind: "want" };
  const before = E.decide(bag, E.numbers(b, 240, now), [], {}, now).verdict;
  assert.equal(before, "red");
  const insist = E.decide(bag, E.numbers(b, 240, now, 0), [], {}, now).verdict; // a note changes nothing
  assert.equal(insist, "red");
  const gift = E.numbers(b, 240, now, 700); // $700 birthday money set aside for it
  assert.equal(gift.available, 1000); assert.equal(E.decide(bag, gift, [], {}, now).verdict, "green");
  const billsCap = E.numbers({ weekly: 300, spent: 0, balance: 500, bills: 400 }, 240, now, 700);
  assert.equal(billsCap.available, 100); assert.equal(E.decide(bag, billsCap, [], {}, now).verdict, "red"); // still can't touch bill money
  assert.match(E.reality(bag, gift, E.decide(bag, gift, [], {}, now)).join(" "), /\$700 you set aside/);
});

/* ---------- cleaning timer ---------- */
test("timer math: pause, resume, restart, five more, alerts once each", () => {
  const t0 = 1e12, task = { key: "k", t: "Wipe counter" };
  let tm = C.tStart(task, 600, t0);
  assert.equal(C.tLeft(tm, t0 + 60000), 540000);
  tm = C.tPause(tm, t0 + 60000); assert.equal(C.tLeft(tm, t0 + 999999), 540000); // paused: time doesn't move
  tm = C.tResume(tm, t0 + 200000); assert.equal(C.tLeft(tm, t0 + 230000), 510000);
  assert.deepEqual(plain(C.tEvents(tm, t0 + 300000)), []);
  assert.deepEqual(plain(C.tEvents(tm, t0 + 500000)), ["half"]);
  tm.halfSent = true; assert.deepEqual(plain(C.tEvents(tm, t0 + 760000)), ["end"]);
  tm.endSent = true; assert.deepEqual(plain(C.tEvents(tm, t0 + 770000)), []); // end alert only once
  tm = C.tRestart(tm, t0 + 800000); assert.equal(C.tLeft(tm, t0 + 800000), 600000); assert.equal(tm.endSent, false);
  tm = C.tMore(tm, 300000, t0 + 900000); assert.equal(C.tLeft(tm, t0 + 900000), 300000);
  const br = Object.assign(C.tStart(task, 300, t0, "break"), { endSent: true, endedAt: t0 + 300000 });
  assert.deepEqual(plain(C.tEvents(br, t0 + 400000)), []); assert.deepEqual(plain(C.tEvents(br, t0 + 600001)), ["resume"]);
  assert.deepEqual(plain(C.tEvents(C.tStart(task, 60, t0), t0 + 40000)), []); // no halfway alert for very short timers
});

/* ---------- reminders ---------- */
test("reminder schedules: daily, weekdays, selected days, weekly, once, every N days", () => {
  const tue = at("2026-10-27T12:00:00"), sat = at("2026-10-31T12:00:00");
  assert.ok(C.occursOn({ freq: "daily" }, sat));
  assert.ok(C.occursOn({ freq: "weekdays" }, tue) && !C.occursOn({ freq: "weekdays" }, sat));
  assert.ok(C.occursOn({ freq: "days", days: [2, 6] }, sat) && !C.occursOn({ freq: "days", days: [1] }, tue));
  assert.ok(C.occursOn({ freq: "once", date: "2026-10-27" }, tue) && !C.occursOn({ freq: "once", date: "2026-10-28" }, tue));
  assert.ok(C.occursOn({ freq: "custom", every: 3, start: "2026-10-24" }, tue) && !C.occursOn({ freq: "custom", every: 3, start: "2026-10-25" }, tue));
  assert.ok(!C.occursOn({ freq: "custom", every: 3, start: "2026-11-01" }, tue)); // hasn't started yet
});
test("quiet hours, including ones that cross midnight", () => {
  const q = { on: true, start: "22:00", end: "08:00" };
  assert.ok(C.inQuiet(q, at("2026-10-27T23:10:00")) && C.inQuiet(q, at("2026-10-27T07:59:00")));
  assert.ok(!C.inQuiet(q, at("2026-10-27T08:00:00")) && !C.inQuiet({ ...q, on: false }, at("2026-10-27T23:00:00")));
  assert.ok(C.inQuiet({ on: true, start: "13:00", end: "15:00" }, at("2026-10-27T14:00:00")));
});
test("which reminders fire: time reached, once per day, snooze, done, categories, master switch, missed", () => {
  const rems = [{ id: "a", title: "Dishes", cat: "chores", time: "13:00", freq: "daily", on: true }, { id: "b", title: "Bills", cat: "bills", time: "12:00", freq: "daily", on: true }, { id: "c", title: "Off", cat: "chores", time: "09:00", freq: "daily", on: false }];
  const st = { enabled: true, cats: {}, reschedule: true }, now = at("2026-10-27T13:05:00");
  let r = C.checkReminders(rems, {}, now, st);
  assert.deepEqual(plain(r.fire.map(f => [f.id, f.missed])), [["a", false], ["b", true]]);
  assert.equal(C.checkReminders(rems, { "a@2026-10-27": { firedAt: now }, "b@2026-10-27": { done: true } }, now + 6e4, st).fire.length, 0);
  assert.equal(C.checkReminders(rems, { "a@2026-10-27": { firedAt: now, snoozeUntil: now + 6e5 } }, now + 6e5 + 1, st).fire.filter(f => f.id === "a").length, 1);
  assert.equal(C.checkReminders(rems, {}, now, { ...st, cats: { bills: false } }).fire.length, 1);
  assert.equal(C.checkReminders(rems, {}, now, { ...st, enabled: false }).fire.length, 0);
  r = C.checkReminders(rems, {}, now, { ...st, reschedule: false });
  assert.deepEqual(plain(r.fire.map(f => f.id)), ["a"]); assert.deepEqual(plain(r.skip), ["b@2026-10-27"]);
  assert.equal(C.checkReminders(rems, {}, at("2026-10-27T23:30:00"), { ...st, quiet: { on: true, start: "22:00", end: "08:00" } }).fire.length, 0);
});
test("notification and timer settings are validated and old saves get safe defaults", () => {
  const s = prep({ notif: { personality: "evil", snoozeMins: 9999, quiet: { on: true, start: "25:99" }, reminders: [{ id: "x", title: "<b>Hi</b>", time: "7:30", freq: "weird", days: [1, 9] }, { title: "no id" }] }, timerPrefs: { defaultSecs: 5, alerts: { half: true } } });
  assert.equal(s.notif.personality, "bestie"); assert.equal(s.notif.snoozeMins, 240); assert.equal(s.notif.quiet.start, "22:00");
  assert.equal(s.notif.reminders.length, 1); assert.equal(s.notif.reminders[0].freq, "daily"); assert.equal(s.notif.reminders[0].days.join(), "1");
  assert.equal(s.timerPrefs.defaultSecs, 30); assert.equal(s.timerPrefs.alerts.half, true); assert.equal(s.timerPrefs.alerts.end, true);
  const old = prep({ shells: 5 }); assert.equal(old.notif.enabled, true); assert.equal(old.notif.setupDone, false); assert.equal(old.timerPrefs.defaultSecs, 300);
});
