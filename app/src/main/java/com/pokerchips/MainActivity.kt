package com.pokerchips

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PowerManager
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.lifecycleScope
import com.pokerchips.service.ServerService
import com.pokerchips.ui.screens.ActionRunner
import com.pokerchips.ui.screens.DashboardScreen
import com.pokerchips.ui.screens.GameDetailScreen
import com.pokerchips.ui.screens.HistoryScreen
import com.pokerchips.ui.screens.HomeScreen
import com.pokerchips.ui.screens.JoinScreen
import com.pokerchips.ui.screens.WebGameScreen
import com.pokerchips.util.JoinTarget
import com.pokerchips.ui.screens.SetupScreen
import com.pokerchips.ui.theme.PokerChipsTheme
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private var serverService: ServerService? by mutableStateOf(null)

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, binder: IBinder?) {
            serverService = (binder as ServerService.LocalBinder).getService()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            serverService = null
        }
    }

    private val notificationPermissionLauncher =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { _ -> }

    // "home", "dashboard", "history", "setup", "join", "game:<id>" or "web:<url>"
    private var screen by mutableStateOf("home")

    private val prefs by lazy { getSharedPreferences("pokerchips", MODE_PRIVATE) }
    private var lastOnlineTable by mutableStateOf<String?>(null)

    private val notRunning = MutableStateFlow(false)
    private val noUrl = MutableStateFlow<String?>(null)

    private val runAction: ActionRunner = { action, onSuccess ->
        lifecycleScope.launch {
            action().fold(
                onSuccess = { onSuccess() },
                onFailure = { Toast.makeText(this@MainActivity, it.message ?: "Failed", Toast.LENGTH_LONG).show() }
            )
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        val gameManager = (application as PokerChipsApplication).gameManager
        lastOnlineTable = prefs.getString(KEY_LAST_TABLE, null)
        screen = savedInstanceState?.getString(KEY_SCREEN) ?: linkScreen(intent) ?: "home"

        setContent {
            PokerChipsTheme {
                val service = serverService
                val state by gameManager.stateFlow.collectAsStateWithLifecycle()
                val running by (service?.isRunning ?: notRunning).collectAsStateWithLifecycle()
                val toDashboard = { screen = "dashboard" }

                // A phone already serving a game opens straight on its dashboard, as before.
                var routed by rememberSaveable { mutableStateOf(false) }
                if (!routed && service != null) {
                    routed = true
                    if (running && screen == "home") screen = "dashboard"
                }

                when {
                    screen == "dashboard" -> BackHandler { screen = "home" }
                    screen == "history" || screen == "setup" -> BackHandler { screen = "dashboard" }
                    screen.startsWith("game:") -> BackHandler { screen = "history" }
                    screen == "join" -> BackHandler { screen = "home" }
                }

                when {
                    screen == "home" -> HomeScreen(
                        serverRunning = running,
                        lastOnlineTable = lastOnlineTable,
                        onHostHere = toDashboard,
                        onHostOnline = { screen = "web:" + JoinTarget.ONLINE_HOME },
                        onJoin = { screen = "join" },
                        onReopenTable = { screen = "web:" + JoinTarget.onlineTableUrl(it) }
                    )
                    screen == "join" -> JoinScreen(
                        onBack = { screen = "home" },
                        onOpen = { screen = "web:$it" }
                    )
                    screen.startsWith("web:") -> WebGameScreen(
                        url = screen.removePrefix("web:"),
                        onExit = { screen = "home" },
                        onTableSeen = { code ->
                            lastOnlineTable = code
                            prefs.edit().putString(KEY_LAST_TABLE, code).apply()
                        }
                    )
                    screen == "history" -> HistoryScreen(
                        gameManager = gameManager,
                        currentGameId = state.gameId,
                        onBack = toDashboard,
                        onOpenGame = { screen = "game:$it" }
                    )
                    screen.startsWith("game:") -> GameDetailScreen(
                        gameManager = gameManager,
                        gameId = screen.removePrefix("game:"),
                        currentGameId = state.gameId,
                        runAction = runAction,
                        onShare = ::shareText,
                        onBack = { screen = "history" },
                        onRestored = toDashboard
                    )
                    screen == "setup" -> SetupScreen(
                        gameManager = gameManager,
                        current = state,
                        runAction = runAction,
                        onBack = toDashboard,
                        onStarted = toDashboard
                    )
                    else -> DashboardScreen(
                        isRunning = service?.isRunning ?: notRunning,
                        serverUrl = service?.serverUrl ?: noUrl,
                        gameState = gameManager.stateFlow,
                        gameManager = gameManager,
                        runAction = runAction,
                        onStartServer = { startServer() },
                        onStopServer = { stopServer() },
                        onOpenHistory = { screen = "history" },
                        onOpenSetup = { screen = "setup" }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        linkScreen(intent)?.let { screen = it }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        outState.putString(KEY_SCREEN, screen)
    }

    /** An easypoker.cc table link (from a scanned QR code or a chat) opens that table here. */
    private fun linkScreen(intent: Intent?): String? {
        if (intent?.action != Intent.ACTION_VIEW) return null
        return JoinTarget.parse(intent.dataString ?: return null)?.let { "web:$it" }
    }

    companion object {
        private const val KEY_SCREEN = "screen"
        private const val KEY_LAST_TABLE = "lastOnlineTable"
    }

    override fun onStart() {
        super.onStart()
        val intent = Intent(this, ServerService::class.java)
        bindService(intent, connection, BIND_AUTO_CREATE)
    }

    override fun onStop() {
        super.onStop()
        unbindService(connection)
        serverService = null
    }

    private fun shareText(text: String) {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        startActivity(Intent.createChooser(send, "Share game"))
    }

    private fun startServer() {
        val intent = Intent(this, ServerService::class.java).apply {
            action = ServerService.ACTION_START
        }
        startForegroundService(intent)
        requestBatteryExemption()
    }

    // Doze and OEM battery savers cut a background app's network even with a wake lock.
    // Asking once per start is cheap; the system dialog does not appear once granted.
    private fun requestBatteryExemption() {
        val pm = getSystemService(PowerManager::class.java)
        if (pm.isIgnoringBatteryOptimizations(packageName)) return
        runCatching {
            startActivity(
                Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS)
                    .setData(android.net.Uri.parse("package:$packageName"))
            )
        }
    }

    private fun stopServer() {
        val intent = Intent(this, ServerService::class.java).apply {
            action = ServerService.ACTION_STOP
        }
        startService(intent)
    }
}
