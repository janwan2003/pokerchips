package com.pokerchips.server

import com.pokerchips.game.GameManager
import com.pokerchips.game.GameStore
import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.plugins.websocket.WebSockets
import io.ktor.client.plugins.websocket.webSocketSession
import io.ktor.websocket.Frame
import io.ktor.websocket.readText
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.withTimeoutOrNull
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.net.ServerSocket

/** Boots the real Ktor server on a free port and talks to /ws like a browser would. */
class WebSocketTest {

    @get:Rule
    val tmp = TemporaryFolder()

    private lateinit var gm: GameManager
    private lateinit var server: PokerServer
    private lateinit var scope: CoroutineScope
    private val client = HttpClient(CIO) { install(WebSockets) }
    private var port = 0

    @Before
    fun setUp() {
        port = ServerSocket(0).use { it.localPort }
        gm = GameManager(GameStore(tmp.newFolder("games")))
        scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
        server = PokerServer(gm, { null }, port)
        server.start(scope)
    }

    @After
    fun tearDown() {
        client.close()
        server.stop()
        scope.cancel()
    }

    private suspend fun connect() = client.webSocketSession("ws://127.0.0.1:$port/ws")

    private suspend fun io.ktor.client.plugins.websocket.DefaultClientWebSocketSession.nextText(): String =
        withTimeout(5_000) { (incoming.receive() as Frame.Text).readText() }

    @Test
    fun `heartbeat ping gets a pong`() = runBlocking {
        val s = connect()
        s.nextText() // initial state
        s.send(Frame.Text("ping"))
        assertEquals("pong", s.nextText())
    }

    @Test
    fun `a client that stops reading does not freeze updates for others`() = runBlocking {
        gm.joinPlayer("Jan")
        val stalled = connect() // never reads after this
        val healthy = connect()
        healthy.nextText()
        // Far more traffic than the stalled client's buffers hold.
        repeat(1500) { gm.addToPot("Jan", 1); gm.takeFromPot("Jan", 1) }
        gm.addToPot("Jan", 7)
        val sawFinal = withTimeoutOrNull(15_000) {
            while (true) {
                val f = (healthy.incoming.receive() as? Frame.Text)?.readText() ?: continue
                if (f.contains("\"pot\":7")) return@withTimeoutOrNull true
            }
            @Suppress("UNREACHABLE_CODE") false
        } ?: false
        assertTrue("healthy client got the latest state", sawFinal)
        stalled.cancel()
    }
}
