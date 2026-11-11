package com.pokerchips.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.net.wifi.WifiManager
import android.os.Binder
import android.os.IBinder
import android.os.PowerManager
import com.pokerchips.MainActivity
import com.pokerchips.PokerChipsApplication
import com.pokerchips.R
import com.pokerchips.game.GameManager
import com.pokerchips.server.PokerServer
import com.pokerchips.util.NetworkUtils
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.InputStream

class ServerService : Service() {

    companion object {
        const val ACTION_START = "com.pokerchips.START"
        const val ACTION_STOP = "com.pokerchips.STOP"
        private const val CHANNEL_ID = "poker_server"
        private const val NOTIFICATION_ID = 1
    }

    private val binder = LocalBinder()
    private var pokerServer: PokerServer? = null
    private var serviceScope: CoroutineScope? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private var wifiLock: WifiManager.WifiLock? = null

    val gameManager: GameManager by lazy { (application as PokerChipsApplication).gameManager }

    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning.asStateFlow()

    private val _serverUrl = MutableStateFlow<String?>(null)
    val serverUrl: StateFlow<String?> = _serverUrl.asStateFlow()

    inner class LocalBinder : Binder() {
        fun getService(): ServerService = this@ServerService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startServer()
            ACTION_STOP -> stopServer()
        }
        return START_STICKY
    }

    private fun startServer() {
        if (_isRunning.value) return

        val ip = NetworkUtils.getLocalIpAddress() ?: "0.0.0.0"
        val port = 8080
        val url = "http://$ip:$port"

        val notification = buildNotification("Server running at $url")
        startForeground(NOTIFICATION_ID, notification)

        val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        serviceScope = scope

        val assetProvider: (String) -> InputStream? = { path ->
            try {
                assets.open("web/$path")
            } catch (_: Exception) {
                null
            }
        }

        pokerServer = PokerServer(gameManager, assetProvider, port).also {
            it.start(scope)
        }

        acquireLocks()

        _serverUrl.value = url
        _isRunning.value = true
    }

    // With the screen off Android lets the CPU sleep and puts the Wi-Fi radio into
    // power-save, so players' requests time out until the host touches the phone.
    // A foreground service alone does not prevent either; these locks do.
    @Suppress("DEPRECATION") // HIGH_PERF is deprecated on API 34+ but still the best hint for a background server
    private fun acquireLocks() {
        if (wakeLock == null) {
            val pm = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "PokerChips:server").apply {
                setReferenceCounted(false)
                acquire()
            }
        }
        if (wifiLock == null) {
            val wm = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            wifiLock = wm.createWifiLock(WifiManager.WIFI_MODE_FULL_HIGH_PERF, "PokerChips:server").apply {
                setReferenceCounted(false)
                acquire()
            }
        }
    }

    private fun releaseLocks() {
        wakeLock?.let { if (it.isHeld) it.release() }
        wakeLock = null
        wifiLock?.let { if (it.isHeld) it.release() }
        wifiLock = null
    }

    private fun stopServer() {
        pokerServer?.stop()
        pokerServer = null
        serviceScope?.cancel()
        serviceScope = null
        releaseLocks()
        _serverUrl.value = null
        _isRunning.value = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        stopServer()
        super.onDestroy()
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            getString(R.string.notification_channel_name),
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = getString(R.string.notification_channel_description)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(text: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE
        )
        return Notification.Builder(this, CHANNEL_ID)
            .setContentTitle("PokerChips")
            .setContentText(text)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }
}
