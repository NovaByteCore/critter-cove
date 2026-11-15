// Copies the one-file app into the folder Capacitor packages.
import fs from "fs"; import path from "path";
const root = path.resolve(import.meta.dirname, "../.."), www = path.resolve(import.meta.dirname, "../www");
fs.rmSync(www, { recursive: true, force: true }); fs.mkdirSync(www, { recursive: true });
for (const f of ["index.html", "manifest.json", "icon-512.png"]) if (fs.existsSync(path.join(root, f))) fs.copyFileSync(path.join(root, f), path.join(www, f));
console.log("www ready:", fs.readdirSync(www).join(", "));
