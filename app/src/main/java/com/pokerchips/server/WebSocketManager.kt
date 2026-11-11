package com.pokerchips.server

import com.pokerchips.game.GameManager
import com.pokerchips.model.GameState
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.concurrent.ConcurrentHashMap

class WebSocketManager(private val gameManager: GameManager) {

    companion object {
        /** A client that cannot take a frame within this time is treated as gone. */
        private const val SEND_TIMEOUT_MS = 5_000L
    }

    private val sessions = ConcurrentHashMap.newKeySet<WebSocketServerSession>()
    private var broadcastJob: Job? = null

    fun startBroadcasting(scope: CoroutineScope) {
        broadcastJob = scope.launch {
            gameManager.stateFlow.collect { state ->
                broadcast(scope, state)
            }
        }
    }

    // Each client gets its own send with a timeout. Before, one phone whose screen went
    // off mid-send could suspend the loop and freeze updates for every other player.
    private fun broadcast(scope: CoroutineScope, state: GameState) {
        val json = Json.encodeToString(state)
        for (session in sessions) {
            scope.launch {
                val sent = withTimeoutOrNull(SEND_TIMEOUT_MS) {
                    runCatching { session.outgoing.send(Frame.Text(json)) }.isSuccess
                }
                if (sent != true) drop(session)
            }
        }
    }

    private suspend fun drop(session: WebSocketServerSession) {
        sessions.remove(session)
        runCatching { session.close(CloseReason(CloseReason.Codes.GOING_AWAY, "unresponsive")) }
    }

    suspend fun handleSession(session: WebSocketServerSession) {
        sessions.add(session)
        try {
            session.outgoing.send(Frame.Text(Json.encodeToString(gameManager.stateFlow.value)))
            for (frame in session.incoming) {
                // Actions go over REST. The only client message is an app-level
                // heartbeat, so the browser can tell a silently dead socket from a quiet game.
                if (frame is Frame.Text && frame.readText() == "ping") {
                    session.outgoing.send(Frame.Text("pong"))
                }
            }
        } finally {
            sessions.remove(session)
        }
    }

    fun shutdown() {
        broadcastJob?.cancel()
        for (session in sessions) {
            runCatching {
                kotlinx.coroutines.runBlocking { session.close() }
            }
        }
        sessions.clear()
    }
}
