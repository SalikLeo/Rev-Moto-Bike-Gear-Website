package com.revmoto.admin;

import android.webkit.JavascriptInterface;

public class WebAppInterface {
    private MainActivity activity;

    public WebAppInterface(MainActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void showOrderNotification(String orderId, String customerName, String amount) {
        if (activity != null) {
            activity.triggerOrderNotification(orderId, customerName, amount);
        }
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public String getAppVersion() {
        return "1.0.0";
    }
}
