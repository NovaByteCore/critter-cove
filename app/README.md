# Critter Cove Android app

The same one-file app (`../index.html`) packaged with [Capacitor](https://capacitorjs.com) as an Android app, plus a home-screen widget.

**Widget:** next tiny task with a **Done ✓** button, shells, chest progress, and a critter line that changes through the day. Light and dark. Tapping Done on the widget marks that task; the app counts it (shells, chests, critters) the next time it opens, once per task. Tapping anywhere else opens the app.

**How it's built:** GitHub Actions (`.github/workflows/android.yml`) builds it on every push to the `android-app` branch and publishes `critter-cove.apk` to the `android-latest` release. Nothing is built on a paid service.

- `native/java/`: the widget (`CritterWidgetProvider`), the bridge the app talks to (`CritterWidgetPlugin`), and `MainActivity`.
- `native/res/`: widget layout, colors (Playful Cove light/dark), widget settings.
- `scripts/patch-android.mjs`: adds the widget and release signing to the generated Android project.
- `signing/release.jks.enc`: the signing key, encrypted. The password lives only in the repo secret `CC_SIGNING_PASSWORD` (and with the owner). Without it, builds use a throwaway key and aren't published. Keep the password safe: updates must be signed with the same key to install over the old version.

**Not done yet:** the iPhone version (needs Xcode on a Mac; free Apple accounts expire the app every 7 days, the $99/year Apple Developer Program removes that limit), and reminders while the app is closed.

Signing password added to the repo secrets on 2026-11-15; release builds publish to the `android-latest` release.
