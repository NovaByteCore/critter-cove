// Tests for the Big Sis Check engine. Run: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const block = html.slice(html.indexOf("/* ===ENGINE START==="), html.indexOf("/* ===ENGINE END=== */"));
const ctx = {}; vm.runInNewContext(block + "\nthis.E = SisEngine;", ctx);
const E = ctx.E;
// The engine runs in its own sandbox, so compare plain copies of objects it returns.
const plain = x => JSON.parse(JSON.stringify(x));
const NOON = new Date("2026-10-27T12:00:00"), LATE = new Date("2026-10-27T23:30:00");
const want = (item, price, extra = {}) => ({ id: "x", item, price, kind: "want", urgency: "whenever", ...extra });
const run = (budget, input, history = [], now = NOON) => { const n = E.numbers(budget, input.price, now); return { n, d: E.decide(input, n, history, {}, now) }; };

test("parsePrice accepts real prices and rejects junk", () => {
  assert.equal(E.parsePrice("24.99"), 24.99);
  assert.equal(E.parsePrice("$1,200"), 1200);
  assert.equal(E.parsePrice(" 95 "), 95);
  for (const bad of ["", "abc", "-5", "0", "12.3.4", null, undefined, "1e9"]) assert.equal(E.parsePrice(bad), null, String(bad));
});

test("numbers: available is weekly minus spent", () => {
  const n = E.numbers({ weekly: 180, spent: 0 }, 95, NOON);
  assert.equal(n.available, 180); assert.equal(n.after, 85); assert.equal(Math.round(n.pct), 53);
});

test("numbers: account balance never counts as spendable, only caps it", () => {
  const n = E.numbers({ weekly: 200, spent: 50, balance: 400, bills: 300 }, 20, NOON);
  assert.equal(n.remaining, 150); assert.equal(n.available, 100); // 400 - 300 bills caps it
  const rich = E.numbers({ weekly: 100, spent: 0, balance: 5000, bills: 0 }, 20, NOON);
  assert.equal(rich.available, 100); // big balance doesn't raise the weekly plan
});

test("missing weekly money asks instead of guessing", () => {
  const { d } = run({ weekly: null }, want("Shoes", 95));
  assert.equal(d.verdict, "needinfo");
});

test("spec example: $95 sneakers from $180 is a hold up, not approved", () => {
  const { d } = run({ weekly: 180, spent: 0 }, want("Sneakers", 95));
  assert.equal(d.verdict, "yellow");
});

test("spec example: $240 bag from $300 is absolutely not", () => {
  const { n, d } = run({ weekly: 300, spent: 0 }, want("Handbag", 240));
  assert.equal(d.verdict, "red"); assert.equal(Math.round(n.pct), 80); assert.equal(n.after, 60);
  assert.match(E.nextMove(want("Handbag", 240), n, d), /Wishlist Jail for 7 days/);
});

test("spec example: $25 book with $350 and bills covered is approved", () => {
  const { n, d } = run({ weekly: 350, spent: 0, balance: 1200, bills: 400 }, want("Book", 25));
  assert.equal(d.verdict, "green"); assert.equal(n.after, 325); assert.equal(n.pct.toFixed(1), "7.1");
  assert.equal(E.label("green", "Big Sis"), "🟢 BIG SIS APPROVED");
});

test("anything that cuts into bills is a no for wants", () => {
  const { d } = run({ weekly: 200, spent: 0, balance: 300, bills: 280 }, want("Lashes", 30));
  assert.equal(d.verdict, "red"); assert.ok(d.reasons.includes("bills"));
});

test("needs are supported, never auto-rejected", () => {
  const groceries = { id: "g", item: "Groceries for my son", price: 120, kind: "need", urgency: "today" };
  assert.equal(run({ weekly: 150, spent: 0 }, groceries).d.verdict, "green");
  const over = run({ weekly: 80, spent: 0 }, groceries);
  assert.equal(over.d.verdict, "yellow");
  assert.equal(over.d.cooldown, null);
  assert.doesNotMatch(E.nextMove(groceries, over.n, over.d), /skip|Wishlist/i);
});

test("not sure is judged a little stricter than want", () => {
  const b = { weekly: 100, spent: 0 };
  assert.equal(run(b, want("Hoodie", 24)).d.verdict, "green");
  assert.equal(run(b, want("Hoodie", 24, { kind: "unsure" })).d.verdict, "yellow");
});

test("savings goal turns an approve into a hold up", () => {
  const { d } = run({ weekly: 200, spent: 0, balance: 260, bills: 100, savings: 150 }, want("Candle", 20));
  assert.equal(d.verdict, "yellow"); assert.ok(d.reasons.includes("savings"));
});

test("third want in 24 hours gets a hold up and a 24h cooldown", () => {
  const t = +NOON;
  const hist = [{ id: "a", item: "Lip gloss", price: 8, kind: "want", at: t - 3600e3 }, { id: "b", item: "Phone case", price: 12, kind: "want", at: t - 7200e3 }];
  const { d } = run({ weekly: 300, spent: 0 }, want("Socks", 10), hist);
  assert.equal(d.verdict, "yellow"); assert.equal(d.cooldown, "24h");
});

test("late night and repeats are flagged from real history", () => {
  const t = +LATE;
  const hist = [{ id: "a", item: "Jordan 4s", price: 210, kind: "want", at: t - 2 * 864e5 }, { id: "b", item: "jordan 4s!", price: 210, kind: "want", at: t - 5 * 864e5 }];
  const { d } = run({ weekly: 400, spent: 0 }, want("Jordan 4s", 210), hist, LATE);
  assert.ok(d.reasons.includes("late")); assert.ok(d.reasons.includes("repeat")); assert.equal(d.repeat, 2);
});

test("personality never changes the verdict (engine has no persona input)", () => {
  const b = { weekly: 300, spent: 0 }, i = want("Handbag", 240);
  const v1 = run(b, i).d.verdict, v2 = run(b, { ...i, persona: "haitiandad", intensity: 1 }).d.verdict;
  assert.equal(v1, v2);
});

test("reality check uses only given numbers and admits unknown bills", () => {
  const i = want("Wig", 60), n = E.numbers({ weekly: 200, spent: 0, bills: 150 }, 60, NOON), d = E.decide(i, n, [], {}, NOON);
  const txt = E.reality(i, n, d).join(" ");
  assert.match(txt, /30% of your \$200 available and leaves \$140/);
  assert.match(txt, /can't confirm they're covered/);
});

test("avoided spending counts only explicit no's, once each", () => {
  const h = [{ price: 40, decision: "skipped" }, { price: 60, decision: "jail" }, { price: 99, decision: "bought" }, { price: 20, decision: "cooldown" }, { price: 5, decision: null }];
  assert.equal(E.avoided(h), 100);
});

test("reconcile adds bought items to spent without double counting", () => {
  const wk = "2026-10-26";
  let b = { weekly: 200, spent: 10 }, r = { id: "r", price: 50, decision: "bought" };
  ({ rec: r, budget: b } = E.reconcile(r, b, wk)); assert.equal(b.spent, 60);
  ({ rec: r, budget: b } = E.reconcile(r, b, wk)); assert.equal(b.spent, 60); // same again: no double count
  r = { ...r, price: 45 }; ({ rec: r, budget: b } = E.reconcile(r, b, wk)); assert.equal(b.spent, 55); // price edit
  r = { ...r, decision: "skipped" }; ({ rec: r, budget: b } = E.reconcile(r, b, wk)); assert.equal(b.spent, 10); // changed mind
  const old = { id: "o", price: 30, decision: "skipped", counted: 30, countedWeek: "2026-10-19" };
  assert.equal(E.reconcile(old, { spent: 10 }, wk).budget.spent, 10); // last week's purchase leaves this week alone
});

test("spent resets when a new week starts", () => {
  assert.equal(E.rollWeek({ spent: 80, week: "2026-10-19" }, "2026-10-26").spent, 0);
  assert.equal(E.rollWeek({ spent: 80, week: "2026-10-26" }, "2026-10-26").spent, 80);
});

test("patterns only appear with enough real data", () => {
  assert.deepEqual(plain(E.patterns([{ item: "a", at: +NOON }], +NOON)), []);
  const t = +LATE, h = [0, 1, 2].map(i => ({ item: "Jordan 4s", price: 200, kind: "want", at: t - i * 864e5, decision: i ? "skipped" : "jail" }));
  const p = E.patterns(h, t).join(" ");
  assert.match(p, /after 10pm/); assert.match(p, /checked "Jordan 4s" 3 times/); assert.match(p, /said no to 3 of the 3/);
});

test("migrate keeps old saves and moves parked items into cooldowns", () => {
  const old = { shells: 50, parked: [{ item: "Candle", amt: 38, until: 1000 }] };
  const s = E.migrate(old, 2000);
  assert.equal(s.shells, 50); assert.equal(s.sis.name, "Big Sis"); assert.equal(s.sis.intensity, 2);
  assert.equal(s.sis.history.length, 1); assert.equal(s.sis.history[0].decision, "cooldown"); assert.equal(s.parked.length, 0);
  const again = E.migrate(JSON.parse(JSON.stringify(s)), 3000); // round trip through JSON like real storage
  assert.deepEqual(plain(again.sis), plain(s.sis));
  const partial = E.migrate({ sis: { name: "Auntie", budget: { weekly: 90 } } }, 0);
  assert.equal(partial.sis.name, "Auntie"); assert.equal(partial.sis.budget.weekly, 90); assert.equal(partial.sis.budget.spent, 0); assert.deepEqual(plain(partial.sis.history), []);
});

test("migrate carries an old Mr. Receipts weekly budget the user set into Big Sis", () => {
  const s = E.migrate({ v: 4, shells: 20, budget: 75, nahAmt: 12 }, 0);
  assert.equal(s.sis.budget.weekly, 75); assert.equal(s.shells, 20); assert.equal(s.nahAmt, 12);
  assert.equal(E.migrate({ v: 4, budget: 60 }, 0).sis.budget.weekly, null, "60 was the old built-in default, not a choice");
  assert.equal(E.migrate({ v: 4, budget: 0 }, 0).sis.budget.weekly, null, "a zero budget means not set");
  assert.equal(E.migrate({ v: 4, budget: "abc" }, 0).sis.budget.weekly, null);
  assert.equal(E.migrate({ sis: { budget: { weekly: 90 } }, budget: 60 }, 0).sis.budget.weekly, 90, "never overwrites a Big Sis budget");
});
