// Builds the iPhone (Scriptable) widget script from the app's own content.
const fs = require("fs"), path = require("path");
const D = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));
const EMOJI = { raccoon: "🦝", crab: "🦀", pigeon: "🐦", snail: "🐌", possum: "🐭", frog: "🐸", gremlin: "👾", rat: "🐀", mole: "🐹", axolotl: "🦎", bat: "🦇", octopus: "🐙", goose: "🪿" };
const crit = D.CRITTERS.map(c => [c.name, EMOJI[c.sp] || "🐾", c.say]);

const script = `// Critter Cove widget for Scriptable (iPhone). Free app: https://scriptable.app
// Shows one tiny task and a critter. Changes every hour. Tap it to open Critter Cove.
// It reads nothing from your phone and sends nothing anywhere.
// icon-color: teal; icon-glyph: paw;

const APP_URL = "https://novabytecore.github.io/critter-cove/";

const MORNING = ${JSON.stringify(D.MORNING)};
const NIGHT = ${JSON.stringify(D.NIGHT)};
const ROOMS = ${JSON.stringify(D.ROOMS)};
const ROOM_ORDER = ${JSON.stringify(D.ROOM_ORDER)};
const MICRO = ${JSON.stringify(D.MICRO)};
const CRITTERS = ${JSON.stringify(crit)};

// Same rules as the app: morning 5-11am, night 7pm-3am, otherwise today's room.
function pickFor(date) {
  const h = date.getHours();
  const seed = Math.floor(date.getTime() / 3600000); // changes once an hour
  const at = (list, k) => list[((seed * 7 + k) % list.length + list.length) % list.length];
  let where, task;
  if (h >= 5 && h < 11) { where = "Morning reset"; task = at(MORNING, 0); }
  else if (h >= 19 || h < 3) { where = "Night reset"; task = at(NIGHT, 0); }
  else {
    const room = ROOM_ORDER[(date.getDay() + 6) % 7];
    where = room === "Anywhere" ? "Anywhere" : room;
    task = at(ROOMS[room], 0);
  }
  const c = at(CRITTERS, 3);
  return { where, task, tiny: at(MICRO, 5), name: c[0], emoji: c[1], line: c[2][seed % c[2].length] };
}

// Playful Cove colors, light and dark.
const C = (light, dark) => Color.dynamic(new Color(light), new Color(dark));
const BG = C("#FFF4E6", "#0F1F29"), CARD = C("#FFFDF8", "#182C38"), INK = C("#1E2D38", "#EBF3F6"),
  MUTED = C("#536270", "#A5B8C2"), GREEN = C("#6FC277", "#78CB7E"), GOLD = C("#FFC93E", "#FFD056"), ON = new Color("#1B2530");

function build(p, size) {
  const w = new ListWidget();
  w.backgroundColor = BG;
  w.url = APP_URL;
  w.setPadding(14, 14, 14, 14);
  w.refreshAfterDate = new Date(Math.ceil(Date.now() / 3600000) * 3600000 + 5000);

  const top = w.addStack(); top.centerAlignContent();
  const em = top.addText(p.emoji); em.font = Font.systemFont(size === "small" ? 22 : 26);
  top.addSpacer(6);
  const lab = top.addText(p.where.toUpperCase()); lab.font = Font.boldSystemFont(11); lab.textColor = MUTED; lab.lineLimit = 1;
  w.addSpacer(6);

  const t = w.addText(p.task);
  t.font = Font.boldRoundedSystemFont(size === "small" ? 16 : 19); t.textColor = INK; t.minimumScaleFactor = 0.7;
  t.lineLimit = size === "small" ? 3 : 2;

  if (size !== "small") {
    w.addSpacer(6);
    const q = w.addText("“" + p.line + "” · " + p.name);
    q.font = Font.italicSystemFont(13); q.textColor = MUTED; q.lineLimit = 2; q.minimumScaleFactor = 0.8;
  }
  if (size === "large") {
    w.addSpacer(10);
    const tip = w.addText("Too much? Try this instead: " + p.tiny);
    tip.font = Font.systemFont(13); tip.textColor = MUTED; tip.lineLimit = 2;
  }
  w.addSpacer();

  const btn = w.addStack(); btn.backgroundColor = GREEN; btn.cornerRadius = 12; btn.setPadding(6, 12, 6, 12);
  btn.addSpacer();
  const bt = btn.addText("Open Critter Cove"); bt.font = Font.boldRoundedSystemFont(13); bt.textColor = ON; bt.lineLimit = 1; bt.minimumScaleFactor = 0.8;
  btn.addSpacer();
  return w;
}

const size = config.widgetFamily || "medium";
const widget = build(pickFor(new Date()), size);
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();
`;
fs.writeFileSync(path.join(__dirname, "critter-cove-iphone-scriptable.js"), script);
console.log("bytes", script.length);
