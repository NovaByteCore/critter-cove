package com.novabytecore.crittercove;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.util.DisplayMetrics;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.TextView;
import androidx.test.core.app.ActivityScenario;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import org.json.JSONArray;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Runs on an Android emulator in GitHub Actions. Saves widget pictures for review. */
@RunWith(AndroidJUnit4.class)
public class CritterWidgetTest {
    private static final String SAMPLE = "{\"v\":1,\"shells\":340,\"doneToday\":1,\"day\":\"2026-11-15\",\"resting\":false,"
        + "\"chest\":\"2 more to open the next chest\",\"critter\":{\"name\":\"Trash Panda Pete\",\"sp\":\"raccoon\",\"lines\":[\"That sock was abandoned. I checked.\",\"I ate a grape off the floor and I'd do it again.\"]},"
        + "\"tasks\":[{\"key\":\"Wipe one counter\",\"t\":\"Wipe one counter\",\"where\":\"Kitchen\"},{\"key\":\"Take out the kitchen trash\",\"t\":\"Take out the kitchen trash\",\"where\":\"Kitchen\"}]}";

    private Context ctx() { return InstrumentationRegistry.getInstrumentation().getTargetContext(); }
    private SharedPreferences prefs() { return ctx().getSharedPreferences(CritterWidgetProvider.PREFS, Context.MODE_PRIVATE); }

    private View render(boolean dark) {
        Context c = ctx();
        Configuration conf = new Configuration(c.getResources().getConfiguration());
        conf.uiMode = (conf.uiMode & ~Configuration.UI_MODE_NIGHT_MASK) | (dark ? Configuration.UI_MODE_NIGHT_YES : Configuration.UI_MODE_NIGHT_NO);
        Context themed = c.createConfigurationContext(conf);
        FrameLayout parent = new FrameLayout(themed);
        View v = CritterWidgetProvider.build(c).apply(themed, parent);
        DisplayMetrics dm = c.getResources().getDisplayMetrics();
        int w = (int) (330 * dm.density), h = (int) (170 * dm.density);
        v.measure(View.MeasureSpec.makeMeasureSpec(w, View.MeasureSpec.EXACTLY), View.MeasureSpec.makeMeasureSpec(h, View.MeasureSpec.EXACTLY));
        v.layout(0, 0, w, h);
        return v;
    }

    private void save(View v, String name) throws Exception {
        Bitmap b = Bitmap.createBitmap(v.getWidth(), v.getHeight(), Bitmap.Config.ARGB_8888);
        v.draw(new Canvas(b));
        File dir = new File(ctx().getExternalFilesDir(null), "shots"); dir.mkdirs();
        try (FileOutputStream out = new FileOutputStream(new File(dir, name + ".png"))) { b.compress(Bitmap.CompressFormat.PNG, 100, out); }
    }

    private String text(View v, int id) { return ((TextView) v.findViewById(id)).getText().toString(); }

    @Test
    public void widgetShowsTaskAndDoneMovesToNext() throws Exception {
        prefs().edit().putString("data", SAMPLE).putString("pending", "[]").commit();
        View v = render(false);
        assertEquals("Wipe one counter", text(v, R.id.cc_task));
        assertTrue(text(v, R.id.cc_shells).contains("340"));
        assertTrue(text(v, R.id.cc_line).contains("Trash Panda Pete"));
        assertEquals(View.VISIBLE, v.findViewById(R.id.cc_done).getVisibility());
        save(v, "1-light");
        save(render(true), "2-dark");

        // Tap Done on the widget (same broadcast the button sends).
        new CritterWidgetProvider().onReceive(ctx(), new Intent(ctx(), CritterWidgetProvider.class).setAction(CritterWidgetProvider.ACTION_DONE));
        JSONArray pending = new JSONArray(prefs().getString("pending", "[]"));
        assertEquals(1, pending.length());
        assertEquals("Wipe one counter", pending.getJSONObject(0).getString("key"));
        View after = render(false);
        assertEquals("Take out the kitchen trash", text(after, R.id.cc_task));
        assertTrue(text(after, R.id.cc_shells).contains("+1 to collect"));
        assertTrue(text(after, R.id.cc_chest).startsWith("2 done today"));
        assertTrue(text(after, R.id.cc_chest).contains("1 more to next chest"));
        save(after, "3-after-done");

        // Second task done: nothing left, Done button hides.
        new CritterWidgetProvider().onReceive(ctx(), new Intent(ctx(), CritterWidgetProvider.class).setAction(CritterWidgetProvider.ACTION_DONE));
        View clear = render(false);
        assertEquals(View.GONE, clear.findViewById(R.id.cc_done).getVisibility());
        save(clear, "4-all-done");
        prefs().edit().clear().commit();
    }

    @Test
    public void appSendsItsDataToTheWidget() throws Exception {
        prefs().edit().clear().commit();
        try (ActivityScenario<MainActivity> s = ActivityScenario.launch(MainActivity.class)) {
            String data = null;
            for (int i = 0; i < 60 && data == null; i++) { Thread.sleep(500); data = prefs().getString("data", null); }
            assertTrue("the app never sent its summary to the widget", data != null);
            assertTrue(data.contains("\"tasks\""));
            save(render(false), "5-from-real-app");
        }
    }
}
