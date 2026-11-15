// Builds two 24-item lists (one per hour of the day) for the KWGT widget, using the app's own time-of-day rules.
const fs = require("fs"); const D = JSON.parse(fs.readFileSync(__dirname + "/data.json", "utf8"));
const clean = s => s.replace(/[|$"]/g, "").replace(/‑/g, "-");
const tasks = [], lines = []; let m = 0, n = 0, r = 0, a = 0;
const day = [...D.ROOMS.Kitchen, ...D.ROOMS["Living room"], ...D.ROOMS.Anywhere];
for (let h = 0; h < 24; h++) {
  if (h >= 5 && h < 11) tasks.push("Morning: " + D.MORNING[m++ % D.MORNING.length]);
  else if (h >= 19 || h < 3) tasks.push("Night: " + D.NIGHT[n++ % D.NIGHT.length]);
  else tasks.push(day[r++ % day.length]);
  const c = D.CRITTERS[(h * 5) % D.CRITTERS.length]; lines.push(c.say[h % c.say.length] + " - " + c.name);
}
const T = tasks.map(clean).join("|"), L = lines.map(clean).join("|");
fs.writeFileSync(__dirname + "/kwgt-task.txt", `$tc(split, "${T}", "|", df(H))$`);
fs.writeFileSync(__dirname + "/kwgt-line.txt", `$tc(split, "${L}", "|", df(H))$`);
console.log(tasks.map((t, i) => i + ": " + t).join("\n"));
