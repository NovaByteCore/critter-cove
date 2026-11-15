// Adds the home-screen widget and release signing to the Android project that `npx cap add android` generates.
import fs from "fs"; import path from "path";
const app = path.resolve(import.meta.dirname, ".."), main = path.join(app, "android/app/src/main"), pkg = "com/novabytecore/crittercove";
const copyDir = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const e of fs.readdirSync(from, { withFileTypes: true })) { const a = path.join(from, e.name), b = path.join(to, e.name); e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b); } };
copyDir(path.join(app, "native/res"), path.join(main, "res"));
copyDir(path.join(app, "native/java"), path.join(main, "java", pkg));

const mf = path.join(main, "AndroidManifest.xml"); let m = fs.readFileSync(mf, "utf8");
if (!m.includes("CritterWidgetProvider")) m = m.replace("</application>", `    <receiver android:name=".CritterWidgetProvider" android:exported="false" android:label="Critter Cove">
            <intent-filter><action android:name="android.appwidget.action.APPWIDGET_UPDATE" /></intent-filter>
            <meta-data android:name="android.appwidget.provider" android:resource="@xml/critter_widget_info" />
        </receiver>
    </application>`);
fs.writeFileSync(mf, m);

const gf = path.join(app, "android/app/build.gradle"); let g = fs.readFileSync(gf, "utf8");
const code = process.env.VERSION_CODE || "1";
g = g.replace(/versionCode \d+/, "versionCode " + code).replace(/versionName "[^"]*"/, `versionName "1.0.${code}"`);
if (!g.includes("signingConfigs")) g = g.replace(/buildTypes\s*\{/, `signingConfigs {
        release {
            storeFile file(System.getenv("CC_KEYSTORE") ?: "missing.jks")
            storePassword System.getenv("CC_KEYSTORE_PASSWORD")
            keyAlias "crittercove"
            keyPassword System.getenv("CC_KEYSTORE_PASSWORD")
        }
    }
    buildTypes {`).replace(/release\s*\{\s*minifyEnabled false/, "release {\n            signingConfig signingConfigs.release\n            minifyEnabled false");
if (!g.includes("signingConfig signingConfigs.release")) throw new Error("could not add release signing to build.gradle");
fs.writeFileSync(gf, g);
console.log("android patched: widget, plugin, signing, version", code);
