package com.pokerchips.server

import com.pokerchips.game.GameManager
import io.ktor.server.websocket.WebSocketServerSession
import io.ktor.websocket.CloseReason
import io.ktor.websocket.Frame
import io.ktor.websocket.close
import io.ktor.websocket.readText
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.concurrent.ConcurrentHashMap

/**
 * Every connected browser gets its own sender that follows [GameManager.stateFlow].
 *
 * One sender per client keeps a stalled phone from freezing updates for everyone else,
 * and because each sender walks the state flow in order, a client can never receive an
 * older state after a newer one. If a client falls behind, the flow conflates and it
 * simply gets the latest state next — never a stale one.
 */
class WebSocketManager(private val gameManager: GameManager) {

    companion object {
        /** A client that cannot take a frame within this time is treated as gone. */
        private const val SEND_TIMEOUT_MS = 5_000L
    }

    private val sessions = ConcurrentHashMap.newKeySet<WebSocketServerSession>()

    suspend fun handleSession(session: WebSocketServerSession) {
        sessions.add(session)
        val sender = session.launch {
            gameManager.stateFlow.collect { state ->
                val json = Json.encodeToString(state)
                val sent = withTimeoutOrNull(SEND_TIMEOUT_MS) {
                    try {
                        session.outgoing.send(Frame.Text(json))
                        true
                    } catch (e: CancellationException) {
                        throw e
                    } catch (_: Exception) {
                        false
                    }
                }
                if (sent != true) {
                    drop(session)
                    throw CancellationException("client unresponsive")
                }
            }
        }
        try {
            for (frame in session.incoming) {
                // Actions go over REST. The only client message is an app-level
                // heartbeat, so the browser can tell a silently dead socket from a quiet game.
                if (frame is Frame.Text && frame.readText() == "ping") {
                    session.outgoing.send(Frame.Text("pong"))
                }
            }
        } finally {
            sender.cancel()
            sessions.remove(session)
        }
    }

    private suspend fun drop(session: WebSocketServerSession) {
        sessions.remove(session)
        runCatching { session.close(CloseReason(CloseReason.Codes.GOING_AWAY, "unresponsive")) }
    }

    fun shutdown() {
        for (session in sessions) {
            runCatching { runBlocking { session.close() } }
        }
        sessions.clear()
    }
}
