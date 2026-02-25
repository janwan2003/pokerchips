package com.pokerchips.server

import com.pokerchips.game.GameManager
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.install
import io.ktor.server.cio.CIO
import io.ktor.server.engine.embeddedServer
import io.ktor.server.engine.EmbeddedServer
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.plugins.statuspages.StatusPages
import io.ktor.server.response.respondText
import io.ktor.server.websocket.WebSockets
import kotlinx.coroutines.CoroutineScope
import kotlinx.serialization.json.Json
import java.io.InputStream

class PokerServer(
    private val gameManager: GameManager,
    private val assetProvider: (String) -> InputStream?,
    private val port: Int = 8080
) {
    private var server: EmbeddedServer<*, *>? = null
    private val webSocketManager = WebSocketManager(gameManager)

    fun start(scope: CoroutineScope) {
        server = embeddedServer(CIO, port = port) {
            install(ContentNegotiation) { json() }
            install(WebSockets) {
                pingPeriodMillis = 15000
                timeoutMillis = 15000
            }
            install(StatusPages) {
                exception<Throwable> { call, cause ->
                    val errorJson = Json.encodeToString(
                        kotlinx.serialization.serializer<Map<String, String>>(),
                        mapOf("error" to (cause.message ?: "Internal error"))
                    )
                    call.respondText(
                        errorJson,
                        ContentType.Application.Json,
                        HttpStatusCode.InternalServerError
                    )
                }
            }
            configureRoutes(gameManager, webSocketManager, assetProvider)
        }.start(wait = false)

        webSocketManager.startBroadcasting(scope)
    }

    fun stop() {
        webSocketManager.shutdown()
        server?.stop(1000, 2000)
        server = null
    }
}
