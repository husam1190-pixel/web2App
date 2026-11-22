package __JAVA_PACKAGE__;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.http.SslError;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.browser.customtabs.CustomTabsIntent;

public class MainActivity extends Activity {
    private static final String START_URL = "__START_URL__";
    // WEBVIEW keeps the site inside the app. CUSTOM_TAB uses the browser's
    // first-party session and is the recommended mode for OAuth sign-in.
    private static final String BROWSER_MODE = "__BROWSER_MODE__";

    private static final int FILE_CHOOSER_REQUEST = 701;
    private WebView webView;
    private ProgressBar progress;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        if ("CUSTOM_TAB".equals(BROWSER_MODE)) {
            openCustomTab(START_URL);
            finish();
            return;
        }

        FrameLayout root = new FrameLayout(this);
        webView = new WebView(this);
        progress = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progress.setMax(100);
        FrameLayout.LayoutParams bar = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, dp(3));
        root.addView(webView, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));
        root.addView(progress, bar);
        setContentView(root);

        configureWebView();
        if (state == null) {
            webView.loadUrl(START_URL);
        } else if (webView.restoreState(state) == null) {
            webView.loadUrl(START_URL);
        }
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return routeUrl(request.getUrl().toString());
            }

            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeUrl(url);
            }

            @Override
            public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
                // Never bypass certificate errors.
                handler.cancel();
                Toast.makeText(MainActivity.this,
                        "تعذر فتح الموقع بسبب مشكلة في شهادة الأمان.", Toast.LENGTH_LONG).show();
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    Toast.makeText(MainActivity.this,
                            "تعذر تحميل الصفحة. تحقق من الاتصال بالإنترنت.", Toast.LENGTH_LONG).show();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                progress.setProgress(newProgress);
                progress.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = callback;
                Intent intent;
                try {
                    intent = params.createIntent();
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST);
                    return true;
                } catch (ActivityNotFoundException ex) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this,
                            "لا يوجد تطبيق لاختيار الملفات على هذا الجهاز.", Toast.LENGTH_LONG).show();
                    return false;
                }
            }
        });

        webView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition,
                                        String mimeType, long contentLength) {
                // Delegate downloads to the device browser/download handler.
                openExternal(url);
            }
        });
    }

    /** Returns true when this URL was handled outside the WebView. */
    private boolean routeUrl(String rawUrl) {
        Uri uri = Uri.parse(rawUrl);
        String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();

        if ("http".equals(scheme) || "https".equals(scheme)) {
            String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
            if (isOAuthHost(host)) {
                // Google and several identity providers reject embedded WebViews.
                // For a complete shared browser session, build the whole app in CUSTOM_TAB mode.
                openCustomTab(rawUrl);
                return true;
            }
            return false;
        }

        if ("about".equals(scheme) || "blob".equals(scheme) || "data".equals(scheme)) {
            return false;
        }

        // tel:, mailto:, sms:, geo:, market:, intent:, WhatsApp and other app links.
        if ("intent".equals(scheme)) {
            try {
                Intent intent = Intent.parseUri(rawUrl, Intent.URI_INTENT_SCHEME);
                if (intent.resolveActivity(getPackageManager()) != null) {
                    startActivity(intent);
                    return true;
                }
                String fallback = intent.getStringExtra("browser_fallback_url");
                if (fallback != null && (fallback.startsWith("https://") || fallback.startsWith("http://"))) {
                    openExternal(fallback);
                    return true;
                }
            } catch (Exception ignored) { }
            return true;
        }
        openExternal(rawUrl);
        return true;
    }

    private boolean isOAuthHost(String host) {
        return host.equals("accounts.google.com") || host.endsWith(".accounts.google.com")
                || host.equals("login.microsoftonline.com") || host.endsWith(".login.microsoftonline.com")
                || host.equals("appleid.apple.com") || host.equals("github.com")
                || host.equals("auth0.com") || host.endsWith(".auth0.com");
    }

    private void openCustomTab(String url) {
        try {
            CustomTabsIntent customTabs = new CustomTabsIntent.Builder()
                    .setShowTitle(true)
                    .setToolbarColor(Color.rgb(21, 92, 197))
                    .build();
            customTabs.launchUrl(this, Uri.parse(url));
        } catch (Exception ex) {
            openExternal(url);
        }
    }

    private void openExternal(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (ActivityNotFoundException ex) {
            Toast.makeText(this, "لا يوجد تطبيق مناسب لفتح هذا الرابط.", Toast.LENGTH_LONG).show();
        }
    }

    @SuppressWarnings("deprecation")
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST && filePathCallback != null) {
            Uri[] results = WebChromeClient.FileChooserParams.parseResult(resultCode, data);
            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @SuppressWarnings("deprecation")
    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (filePathCallback != null) {
            filePathCallback.onReceiveValue(null);
            filePathCallback = null;
        }
        if (webView != null) {
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
