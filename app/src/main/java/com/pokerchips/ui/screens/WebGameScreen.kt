package com.pokerchips.ui.screens

import android.annotation.SuppressLint
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.pokerchips.ui.theme.Accent
import com.pokerchips.ui.theme.BgPrimary
import com.pokerchips.ui.theme.Gold
import com.pokerchips.ui.theme.TextSecondary
import com.pokerchips.util.JoinTarget

/**
 * A game page (an easypoker.cc table, or another phone's Wi-Fi game) inside the app.
 * It is the same web client players get in a browser; the app only adds a bridge so
 * Share and Copy use the phone's own share sheet and clipboard.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebGameScreen(
    url: String,
    onExit: () -> Unit,
    onTableSeen: (code: String) -> Unit
) {
    var webView by remember { mutableStateOf<WebView?>(null) }
    var loading by remember { mutableStateOf(true) }
    var failed by remember { mutableStateOf(false) }
    val homeHost = remember(url) { Uri.parse(url).host }

    BackHandler {
        val view = webView
        if (view != null && view.canGoBack() && !failed) view.goBack() else onExit()
    }

    Box(
        Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .statusBarsPadding()
    ) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { context ->
                WebView(context).apply {
                    setBackgroundColor(0xFF1A1A2E.toInt())
                    settings.javaScriptEnabled = true
                    // localStorage keeps the player's name and the host key for online tables.
                    settings.domStorageEnabled = true
                    addJavascriptInterface(AppBridge(context), "PokerChipsApp")
                    webChromeClient = WebChromeClient()
                    webViewClient = object : WebViewClient() {
                        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                            val target = request.url
                            val host = target.host
                            val ours = (target.scheme == "http" || target.scheme == "https") &&
                                (host == homeHost || JoinTarget.isOnline(target.toString()))
                            if (ours) return false
                            runCatching { context.startActivity(Intent(Intent.ACTION_VIEW, target)) }
                            return true
                        }

                        override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
                            loading = true
                        }

                        override fun onPageFinished(view: WebView, url: String?) {
                            loading = false
                            JoinTarget.onlineCode(url)?.let(onTableSeen)
                        }

                        override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                            if (request.isForMainFrame) failed = true
                        }
                    }
                    loadUrl(url)
                    webView = this
                }
            }
        )

        if (loading && !failed) {
            LinearProgressIndicator(
                color = Gold,
                trackColor = BgPrimary,
                modifier = Modifier.fillMaxWidth().align(Alignment.TopCenter)
            )
        }

        if (failed) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BgPrimary)
                    .padding(32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text("Can't reach the table", fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Text(
                    if (JoinTarget.isOnline(url)) "Check your internet connection and try again."
                    else "Make sure you are on the same Wi-Fi as the host phone and that its server is running.",
                    color = TextSecondary,
                    textAlign = TextAlign.Center
                )
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(onClick = onExit) { Text("Back") }
                    Button(
                        onClick = { failed = false; webView?.reload() },
                        colors = ButtonDefaults.buttonColors(containerColor = Accent)
                    ) { Text("Try again") }
                }
            }
        }
    }

    DisposableEffect(Unit) {
        onDispose { webView?.destroy() }
    }
}

/** What the web client may ask the app for. Nothing here reads data or acts unasked. */
private class AppBridge(private val context: Context) {
    private val main = Handler(Looper.getMainLooper())

    @JavascriptInterface
    fun share(text: String) {
        main.post {
            val send = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, text)
            }
            runCatching { context.startActivity(Intent.createChooser(send, "Invite players")) }
        }
    }

    @JavascriptInterface
    fun copy(text: String) {
        main.post {
            val clipboard = context.getSystemService(ClipboardManager::class.java)
            clipboard?.setPrimaryClip(ClipData.newPlainText("EasyPoker", text))
        }
    }
}
