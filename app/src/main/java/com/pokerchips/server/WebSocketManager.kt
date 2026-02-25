package com.pokerchips.server

import com.pokerchips.game.GameManager
import com.pokerchips.model.GameState
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.concurrent.ConcurrentHashMap

class WebSocketManager(private val gameManager: GameManager) {

    private val sessions = ConcurrentHashMap.newKeySet<WebSocketServerSession>()
    private var broadcastJob: Job? = null

    fun startBroadcasting(scope: CoroutineScope) {
        broadcastJob = scope.launch {
            gameManager.stateFlow.collect { state ->
                broadcast(state)
            }
        }
    }

    private suspend fun broadcast(state: GameState) {
        val json = Json.encodeToString(state)
        val deadSessions = mutableListOf<WebSocketServerSession>()
        for (session in sessions) {
            try {
                session.outgoing.send(Frame.Text(json))
            } catch (_: Exception) {
                deadSessions.add(session)
            }
        }
        sessions.removeAll(deadSessions.toSet())
    }

    suspend fun handleSession(session: WebSocketServerSession) {
        sessions.add(session)
        try {
            session.outgoing.send(Frame.Text(Json.encodeToString(gameManager.stateFlow.value)))
            for (frame in session.incoming) {
                // Client messages are handled via REST, WebSocket is broadcast-only
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
