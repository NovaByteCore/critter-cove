package com.novabytecore.crittercove;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Lets the app hand its latest summary to the widget, and collect Done taps made on the widget. */
@CapacitorPlugin(name = "CritterWidget")
public class CritterWidgetPlugin extends Plugin {
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(CritterWidgetProvider.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void update(PluginCall call) {
        String data = call.getString("data");
        if (data == null) { call.reject("no data"); return; }
        prefs().edit().putString("data", data).apply();
        CritterWidgetProvider.updateAll(getContext());
        call.resolve();
    }

    @PluginMethod
    public void takeDone(PluginCall call) {
        String pending;
        synchronized (CritterWidgetProvider.LOCK) {
            pending = prefs().getString("pending", "[]");
            prefs().edit().putString("pending", "[]").commit();
        }
        JSObject result = new JSObject();
        try { result.put("items", new JSArray(pending)); } catch (Exception e) { result.put("items", new JSArray()); }
        call.resolve(result);
        CritterWidgetProvider.updateAll(getContext());
    }
}
