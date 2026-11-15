// Pull the app's own tasks and critters out of index.html so the widget matches the app.
const fs = require("fs"); const src = fs.readFileSync(process.argv[2], "utf8");
const grab = (start, end) => { const a = src.indexOf(start); const b = src.indexOf(end, a); return src.slice(a, b + end.length); };
const code = [grab("const MORNING =", "];"), grab("const NIGHT =", "];"), grab("const ROOMS = {", "\n};"), grab("const ROOM_ORDER =", "];"), grab("const MICRO =", "];")].join("\n");
const C = (id, name, sp, z, r, acc, bio, say) => ({ id, name, sp, say });
const crit = grab("const CRITTERS = [", "\n];").replace("const CRITTERS =", "CRITTERS =");
let CRITTERS; eval(code + "\n" + crit + "\nglobalThis.out = { MORNING, NIGHT, ROOMS, ROOM_ORDER, MICRO };");
out.CRITTERS = CRITTERS.map(c => ({ name: c.name, sp: c.sp, say: c.say.filter(s => !s.includes("{R}") && !/^\*/.test(s)) })).filter(c => c.say.length);
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log(Object.keys(out.ROOMS).length, "rooms,", out.CRITTERS.length, "critters,", [...new Set(out.CRITTERS.map(c => c.sp))].join(" "));
