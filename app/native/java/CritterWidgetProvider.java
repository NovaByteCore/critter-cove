package com.novabytecore.crittercove;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Home-screen widget: next tiny task with a Done button, shells and chest progress, and a critter line.
 * Done taps are stored here and counted by the app (with shells and critters) the next time it opens.
 */
public class CritterWidgetProvider extends AppWidgetProvider {
    static final String PREFS = "critter_widget";
    static final String ACTION_DONE = "com.novabytecore.crittercove.WIDGET_DONE";
    static final Object LOCK = new Object();

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_DONE.equals(intent.getAction())) {
            markDone(context);
            updateAll(context);
            return;
        }
        super.onReceive(context, intent);
    }

    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, CritterWidgetProvider.class));
        if (ids == null || ids.length == 0) return;
        RemoteViews views = build(context);
        for (int id : ids) manager.updateAppWidget(id, views);
    }

    private static JSONObject data(SharedPreferences p) {
        try { return new JSONObject(p.getString("data", "")); } catch (Exception e) { return null; }
    }

    private static JSONArray pending(SharedPreferences p) {
        try { return new JSONArray(p.getString("pending", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    private static Set<String> pendingKeys(JSONArray pending) {
        Set<String> keys = new HashSet<>();
        for (int i = 0; i < pending.length(); i++) {
            JSONObject o = pending.optJSONObject(i);
            if (o != null) keys.add(o.optString("key"));
        }
        return keys;
    }

    /** The first task the app suggested that hasn't been tapped Done on the widget yet. */
    private static JSONObject nextTask(JSONObject d, Set<String> done) {
        if (d == null || d.optBoolean("resting")) return null;
        JSONArray tasks = d.optJSONArray("tasks");
        if (tasks == null) return null;
        for (int i = 0; i < tasks.length(); i++) {
            JSONObject t = tasks.optJSONObject(i);
            if (t != null && !done.contains(t.optString("key"))) return t;
        }
        return null;
    }

    private static void markDone(Context context) {
        synchronized (LOCK) {
            SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            JSONArray pending = pending(p);
            JSONObject t = nextTask(data(p), pendingKeys(pending));
            if (t == null) return;
            try {
                JSONObject item = new JSONObject();
                item.put("key", t.optString("key"));
                item.put("t", t.optString("t"));
                item.put("at", System.currentTimeMillis());
                pending.put(item);
                p.edit().putString("pending", pending.toString()).commit();
            } catch (Exception ignored) { }
        }
    }

    private static String emoji(String species) {
        switch (species == null ? "" : species) {
            case "raccoon": return "🦝";
            case "crab": return "🦀";
            case "pigeon": return "🐦";
            case "snail": return "🐌";
            case "possum": return "🐭";
            case "frog": return "🐸";
            case "gremlin": return "👾";
            case "rat": return "🐀";
            case "mole": return "🐹";
            case "axolotl": return "🦎";
            case "bat": return "🦇";
            case "octopus": return "🐙";
            case "goose": return "🪿";
            default: return "🐾";
        }
    }

    static RemoteViews build(Context context) {
        SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONObject d = data(p);
        JSONArray pending = pending(p);
        Set<String> keys = pendingKeys(pending);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.critter_widget);

        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open != null) {
            PendingIntent openPi = PendingIntent.getActivity(context, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            v.setOnClickPendingIntent(R.id.cc_root, openPi);
        }
        Intent done = new Intent(context, CritterWidgetProvider.class).setAction(ACTION_DONE);
        PendingIntent donePi = PendingIntent.getBroadcast(context, 1, done, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        v.setOnClickPendingIntent(R.id.cc_done, donePi);

        if (d == null) {
            v.setTextViewText(R.id.cc_emoji, "🦝");
            v.setTextViewText(R.id.cc_shells, "");
            v.setTextViewText(R.id.cc_where, "CRITTER COVE");
            v.setTextViewText(R.id.cc_task, "Open Critter Cove once to set up your widget.");
            v.setViewVisibility(R.id.cc_done, View.GONE);
            v.setTextViewText(R.id.cc_line, "");
            v.setTextViewText(R.id.cc_chest, "");
            return v;
        }

        int waiting = pending.length();
        String shells = "🐚 " + d.optInt("shells") + (waiting > 0 ? "  ·  +" + waiting + " to collect" : "");
        v.setTextViewText(R.id.cc_shells, shells);

        JSONObject critter = d.optJSONObject("critter");
        String name = critter != null ? critter.optString("name", "Trash Panda Pete") : "Trash Panda Pete";
        v.setTextViewText(R.id.cc_emoji, emoji(critter != null ? critter.optString("sp") : "raccoon"));
        JSONArray lines = critter != null ? critter.optJSONArray("lines") : null;
        if (lines != null && lines.length() > 0) {
            int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
            v.setTextViewText(R.id.cc_line, "“" + lines.optString(hour % lines.length()) + "” · " + name);
        } else {
            v.setTextViewText(R.id.cc_line, "");
        }

        JSONObject t = nextTask(d, keys);
        if (t != null) {
            String where = t.optString("where", "Next tiny thing");
            v.setTextViewText(R.id.cc_where, (where.endsWith("reset") ? where : "Next tiny thing · " + where).toUpperCase());
            v.setTextViewText(R.id.cc_task, t.optString("t"));
            v.setViewVisibility(R.id.cc_done, View.VISIBLE);
        } else if (d.optBoolean("resting")) {
            v.setTextViewText(R.id.cc_where, "RESTING");
            v.setTextViewText(R.id.cc_task, "Resting counts. Tap to come back whenever you're ready.");
            v.setViewVisibility(R.id.cc_done, View.GONE);
        } else {
            v.setTextViewText(R.id.cc_where, waiting > 0 ? "NICE" : "ALL CLEAR");
            v.setTextViewText(R.id.cc_task, waiting > 0 ? "Open Critter Cove to collect your shells and see what's next." : "You did every tiny thing for now. 🎉");
            v.setViewVisibility(R.id.cc_done, View.GONE);
        }
        int doneToday = d.optInt("doneToday") + waiting;
        int[] goals = { 1, 3, 5 };
        String chest = "All 3 chests\nopened today 🎉";
        for (int g : goals) { if (doneToday < g) { chest = doneToday + " done today\n" + (g - doneToday) + " more to next chest"; break; } }
        v.setTextViewText(R.id.cc_chest, chest);
        return v;
    }
}
