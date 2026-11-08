package com.codewithpb11.neuroniq;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.IOException;
import java.io.InputStream;
import java.net.URLConnection;

/** A local-only WebView wrapper that serves the packaged Neuron app over HTTPS. */
public final class MainActivity extends Activity {
    private static final String APP_HOST = "neuron.local";
    private static final String ASSET_PREFIX = "/assets/";
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(12, 14, 29));
        configureWebView(webView);
        webView.setWebViewClient(new LocalAssetClient());
        setContentView(webView);

        webView.loadUrl("https://" + APP_HOST + ASSET_PREFIX + "index.html");
    }

    private static void configureWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    private final class LocalAssetClient extends WebViewClient {
        @Override
        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (!"https".equals(uri.getScheme()) || !APP_HOST.equals(uri.getHost()) || !uri.getPath().startsWith(ASSET_PREFIX)) {
                return super.shouldInterceptRequest(view, request);
            }

            String assetPath = uri.getPath().substring(ASSET_PREFIX.length());
            if (assetPath.contains("..")) return null;

            try {
                InputStream input = getAssets().open(assetPath);
                return new WebResourceResponse(mimeType(assetPath), "UTF-8", input);
            } catch (IOException ignored) {
                return null;
            }
        }
    }

    private static String mimeType(String path) {
        if (path.endsWith(".wasm")) return "application/wasm";
        if (path.endsWith(".js")) return "text/javascript";
        if (path.endsWith(".css")) return "text/css";
        if (path.endsWith(".svg")) return "image/svg+xml";
        if (path.endsWith(".html")) return "text/html";
        String guessed = URLConnection.guessContentTypeFromName(path);
        return guessed == null ? "application/octet-stream" : guessed;
    }
}
