package com.pokerchips

import android.Manifest
import android.content.ComponentName
import android.content.Intent
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.pokerchips.service.ServerService
import com.pokerchips.ui.screens.DashboardScreen
import com.pokerchips.ui.theme.PokerChipsTheme
import kotlinx.coroutines.runBlocking

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

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        setContent {
            PokerChipsTheme {
                val service = serverService
                if (service != null) {
                    DashboardScreen(
                        isRunning = service.isRunning,
                        serverUrl = service.serverUrl,
                        gameState = service.gameManager.stateFlow,
                        onStartServer = { startServer() },
                        onStopServer = { stopServer() },
                        onResetGame = { runBlocking { service.gameManager.resetGame() } },
                        onSetStartingChips = { runBlocking { service.gameManager.setStartingChips(it) } }
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
