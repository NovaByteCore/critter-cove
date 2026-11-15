package com.novabytecore.crittercove;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(CritterWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
