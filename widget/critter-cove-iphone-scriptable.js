// Critter Cove widget for Scriptable (iPhone). Free app: https://scriptable.app
// Shows one tiny task and a critter. Changes every hour. Tap it to open Critter Cove.
// It reads nothing from your phone and sends nothing anywhere.
// icon-color: teal; icon-glyph: paw;

const APP_URL = "https://novabytecore.github.io/critter-cove/";

const MORNING = ["Drink a glass of water","Make the bed. Lumpy counts.","Last night's dishes into the sink","Put keys, wallet and phone in their spot","Open the blinds"];
const NIGHT = ["Set a 5‑minute timer and grab stray stuff","Every cup and plate to the kitchen","Start the dishwasher or soak the pans","Clothes into the hamper","Phone on the charger","Set out tomorrow's clothes"];
const ROOMS = {"Kitchen":["Wipe one counter","Empty the drying rack","Toss 3 old things from the fridge","Take out the kitchen trash","Put away 5 things on the counter","Wipe the stovetop"],"Bedroom":["Pick up clothes off the floor","Clear the nightstand","Hang up 5 things","Put shoes in one pile","Bring stray cups to the kitchen"],"Bathroom":["Wipe the sink and faucet","Swish the toilet bowl","Hang the towels up","Clear 5 things off the counter","Empty the bathroom trash"],"Living room":["Fold the blanket, fluff the pillows","Clear the coffee table","Put 10 stray things back","Give the remote its home","Quick vacuum where you walk"],"Laundry":["Start one load","Move the wet load to the dryer","Fold 5 things","Put away one folded pile"],"Anywhere":["Throw away 5 pieces of trash","Clear one surface. Any surface.","Pick up everything that's blue","Carry one armful back where it belongs","Put on one song and tidy until it ends"]};
const ROOM_ORDER = ["Kitchen","Living room","Bedroom","Bathroom","Laundry","Kitchen","Anywhere"];
const MICRO = ["Throw away ONE thing","Put ONE dish in the sink","Pick up ONE thing off the floor","Put ONE thing back where it lives","Wipe ONE spot with a paper towel","Take 3 sips of water","Close ONE open drawer or cabinet","Put ONE piece of clothing in the hamper","Stand up, stretch, grab ONE cup","Push in ONE chair"];
const CRITTERS = [["Trash Panda Pete","🦝",["That sock was abandoned. I checked.","I ate a grape off the floor and I'd do it again.","Not you cleaning without me 😭"]],["Sir Crabsworth","🦀",["The counters? Acceptable. Barely.","I said what I said. Wipe it again.","Pinch first, ask questions never."]],["Gary","🐦",["Is that a fry? That's my fry.","I live here now. Rent is a crumb.","Coo. (Do the dishes, sis.)"]],["Snail Shelly","🐌",["Slow is still moving, baby.","Bonnet on. Now I'm ready.","One thing at a time. That's the whole secret."]],["Possum Patricia","🐭",["I'm not lazy. I'm conserving energy.","Wake me up when it's folded."]],["Bottlecap Bob","🐸",["Recycle that or I'm screaming.","412 bottle caps. Zero regrets.","Ribbit. That's frog for 'proud of you.'"]],["Couch Gremlin Kevin","👾",["I found 3 remotes and a fry back here.","Don't vacuum my house. I'm begging.","Chaos is a lifestyle, babe."]],["Lid Larry","🐀",["The lid fits nothing. That's the point.","Whose Tupperware is this? Mine now.","I don't do bottoms. Only lids."]],["Moss Frog Deborah","🐸",["Hydrate or I'm haunting you.","The moss is thriving. Are you?","Squish. That's all."]],["Mole Dale","🐹",["Is the floor clean? I can't see. Tell me.","These are prescription.","Dig. Dig. Tidy. Dig."]],["Spore Gremlin","👾",["Please wash the pan. I don't want to exist.","I'm becoming sentient. Do something.","Fungus says hey."]],["Auntie Shroom","🐌",["Baby, did you eat yet?","I heard what Kevin did. Mm-hm.","Come here, let me fix your collar."]],["Axel the Axolotl","🦎",["Spin cycle is my cardio.","I found your other sock. I'm keeping it.","Wet? Always. Happy? Also always."]],["Lint Bat","🦇",["Clean the lint trap, I can't breathe 😭","I'm fluffy because of neglect.","Fold upside down. Try it."]],["Mildew Mildred","🐙",["Eight arms and none of them doing YOUR laundry.","Fold, sis. FOLD.","I'm not mildew. I'm misunderstood."]],["Hoops Henrietta","🐭",["The hoops stay on. Even for laundry.","I'm not in the way. I'm decor.","Big hoops, bigger standards."]],["CEO Raccoon","🦝",["Let's circle back on that impulse buy.","Your budget is my KPI.","Synergy. Trash. Profit."]],["Coupon Possum","🐭",["Is it on sale? No? Then no.","I saved 40 cents today. Living lavish.","Park it 48 hours. Trust the possum."]],["Pigeon Influencer","🐦",["Link in bio.","This counter is GIVING.","Smash that coo button."]],["Penny-Pinching Rat","🐀",["That's six bags of rice, actually.","We have it at home."]],["Escar-Go","🐌",["Zoom zoom (it's been 4 minutes).","Lap one done. Lap two tomorrow.","Slow and steady still gets the snack."]],["Bayou Toad Earl","🐸",["Secret ingredient? Clean pots.","Don't touch my seasoning.","Come eat. Wash your hands first."]],["Axolotl Lou","🦎",["I'm smiling but I'm tired 😊","Empty sink, happy Lou.","Gills out. Mood up."]],["Octavia","🐙",["Who left the cabinet open. Who.","I can do eight chores. You can do one.","Not the dishes in the sink AGAIN."]],["The Goose","🪿",["HONK.","HONK. (Put that away.)","I saw what you left on the stairs."]],["Goose Lawyer","🪿",["Objection. That's a want, not a need.","The laundry pile is in contempt.","Honk, your honor."]],["Crab Knight","🦀",["For the cove!","I swore an oath to the clean sink.","Halt. Oh it's you. Hey boo."]],["Grandma Goose","🪿",["Not in my house.","Take your shoes off. I just mopped.","Come let me look at you. You look tired."]],["Unc","🦝",["Don't touch the grill.","Who brought the potato salad? We need to talk.","Unc is tired but Unc is here."]],["Spades Rat","🐀",["Run me my money.","You reneged. Get up.","Books on books on books."]],["Cousin Crabby","🦀",["I brought ice. Y'all should be thanking me.","Traffic was crazy (I was asleep).","Where the plates at?"]],["DJ Bat","🦇",["Everybody up. It's the cleaning slide.","This one's for the folded laundry.","Hands up if the sink is empty!"]],["Count Batula","🦇",["I vant... to vacuum.","Midnight tidying is a vibe.","The darkness hides crumbs. I don't."]],["Velvet","🐙",["Smooth moves, clean grooves.","Don't step on my tentacles.","I came to dance AND fold."]],["Frogger Fresh","🐸",["My shoes cost more than this couch.","Clean house, clean fit.","Brush your shoulders off."]],["Midnight Snail","🐌",["Shh. Night shift.","Lights low. Standards high.","I glide. You hustle."]],["Lava Gremlin","👾",["It's 900 degrees and I'm vibing.","You cleaned enough to find me. Respect.","Hot tip: do the dishes."]],["Disco Mole","🐹",["Clean floor? Let's DANCE.","Do the hustle. Then the dishes.","Saturday night fever. Sunday morning chores."]],["Goose Supreme","🪿",["HONKUS MAXIMUS.","You pleased the goose. That never happens.","Kneel. Then sweep."]],["Axolotl Queen","🦎",["She's HER. (I'm her.)","Bow. Then mop.","Clean island, clean queen."]]];

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
