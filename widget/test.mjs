// Runs the Scriptable script against a fake Scriptable API for every hour of a week, all three sizes.
import fs from "fs";
const src = fs.readFileSync(new URL("./critter-cove-iphone-scriptable.js", import.meta.url), "utf8");
const calls = []; let texts = [];
class Stack { constructor() { this.kids = []; } addStack() { const s = new Stack(); this.kids.push(s); return s; } addText(t) { if (typeof t !== "string" || !t.trim() || /undefined|NaN/.test(t)) throw new Error("bad text: " + t); texts.push(t); return {}; } addSpacer() {} centerAlignContent() {} setPadding() {} }
class ListWidget extends Stack { async presentMedium() {} }
const api = { ListWidget, Color: Object.assign(function (h) { this.h = h; }, { dynamic: (a, b) => ({ a, b }) }),
  Font: new Proxy({}, { get: () => () => ({}) }), Script: { setWidget: w => calls.push(w), complete() {} } };
const run = async (date, family) => {
  texts = [];
  const RealDate = Date; globalThis.Date = class extends RealDate { constructor(...a) { super(...(a.length ? a : [date])); } static now() { return date.getTime(); } };
  const fn = new Function(...Object.keys(api), "config", "return (async () => {" + src + "})()");
  await fn(...Object.values(api), { runsInWidget: true, widgetFamily: family }); globalThis.Date = RealDate;
  return texts;
};
const seen = { where: new Set(), task: new Set() }; let n = 0;
for (let h = 0; h < 24 * 7; h++) for (const f of ["small", "medium", "large"]) {
  const d = new Date(2026, 10, 16, 0, 0, 0); d.setHours(h); const t = await run(d, f); n++;
  seen.where.add(t[1]); seen.task.add(t[2]);
  const hr = d.getHours(), w = t[1];
  if (hr >= 5 && hr < 11 && w !== "MORNING RESET") throw new Error("morning wrong " + hr + w);
  if ((hr >= 19 || hr < 3) && w !== "NIGHT RESET") throw new Error("night wrong " + hr + w);
}
const a = await run(new Date(2026, 10, 16, 14, 5), "medium"), b = await run(new Date(2026, 10, 16, 14, 55), "medium"), c = await run(new Date(2026, 10, 16, 15, 5), "medium");
console.log("renders:", n, "| setWidget calls:", calls.length, "| labels:", [...seen.where].join(", "), "| distinct tasks:", seen.task.size);
console.log("same within the hour:", JSON.stringify(a) === JSON.stringify(b), "| changes next hour:", JSON.stringify(a) !== JSON.stringify(c));
console.log("sample 2pm Mon:", a.join(" | "));
