package com.pokerchips

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
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

        setContent {
            PokerChipsTheme {
                val service = serverService
                val state by gameManager.stateFlow.collectAsStateWithLifecycle()
                // "dashboard", "history", "setup" or "game:<id>"
                var screen by rememberSaveable { mutableStateOf("dashboard") }
                val toDashboard = { screen = "dashboard" }

                if (screen != "dashboard") {
                    BackHandler {
                        screen = if (screen.startsWith("game:")) "history" else "dashboard"
                    }
                }

                when {
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
    }

    private fun stopServer() {
        val intent = Intent(this, ServerService::class.java).apply {
            action = ServerService.ACTION_STOP
        }
        startService(intent)
    }
}
