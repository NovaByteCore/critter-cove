// Copies the one-file app into the folder Capacitor packages.
import fs from "fs"; import path from "path";
const root = path.resolve(import.meta.dirname, "../.."), www = path.resolve(import.meta.dirname, "../www");
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(www, { recursive: true });
for (const f of ["index.html", "manifest.json", "icon-512.png"]) if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(www, f));
// The installed app needs Capacitor's own script before the app's script.
const cap = path.resolve(import.meta.dirname, "../node_modules/@capacitor/core/dist/capacitor.js");
if (!fs.existsSync(cap)) throw new Error("Run npm install in app/ first: " + cap + " is missing");
fs.copyFileSync(cap, path.join(www, "capacitor.js"));
const html = path.join(www, "index.html"), page = fs.readFileSync(html, "utf8");
if (!page.includes("<title>")) throw new Error("index.html has no <title>");
fs.writeFileSync(html, page.replace("<title>", '<script src="capacitor.js"></script>\n<title>'));
console.log("www ready:", fs.readdirSync(www).join(", "));
