package com.pokerchips.server

import com.pokerchips.game.GameManager
import com.pokerchips.model.ChipAction
import com.pokerchips.model.ErrorResponse
import com.pokerchips.model.JoinRequest
import io.ktor.http.ContentType
import io.ktor.http.HttpStatusCode
import io.ktor.server.application.Application
import io.ktor.server.request.receive
import io.ktor.server.response.respond
import io.ktor.server.response.respondText
import io.ktor.server.routing.get
import io.ktor.server.routing.post
import io.ktor.server.routing.routing
import io.ktor.server.websocket.webSocket
import java.io.InputStream

fun Application.configureRoutes(
    gameManager: GameManager,
    webSocketManager: WebSocketManager,
    assetProvider: (String) -> InputStream?
) {
    routing {
        get("/") {
            serveAsset(assetProvider, "index.html", ContentType.Text.Html, call)
        }
        get("/css/{file}") {
            val file = call.parameters["file"] ?: return@get
            serveAsset(assetProvider, "css/$file", ContentType.Text.CSS, call)
        }
        get("/js/{file}") {
            val file = call.parameters["file"] ?: return@get
            serveAsset(assetProvider, "js/$file", ContentType.Application.JavaScript, call)
        }

        get("/api/state") {
            call.respond(gameManager.stateFlow.value)
        }

        post("/api/join") {
            val request = call.receive<JoinRequest>()
            val name = request.name.trim()
            if (name.isBlank()) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Name cannot be empty"))
                return@post
            }
            if (name.length > 20) {
                call.respond(HttpStatusCode.BadRequest, ErrorResponse("Name too long"))
                return@post
            }
            val response = gameManager.joinPlayer(name)
            call.respond(response)
        }

        post("/api/pot/add") {
            val action = call.receive<ChipAction>()
            gameManager.addToPot(action.name, action.amount).fold(
                onSuccess = { call.respond(HttpStatusCode.OK, mapOf("ok" to true)) },
                onFailure = { call.respond(HttpStatusCode.BadRequest, ErrorResponse(it.message ?: "Error")) }
            )
        }

        post("/api/pot/take") {
            val action = call.receive<ChipAction>()
            gameManager.takeFromPot(action.name, action.amount).fold(
                onSuccess = { call.respond(HttpStatusCode.OK, mapOf("ok" to true)) },
                onFailure = { call.respond(HttpStatusCode.BadRequest, ErrorResponse(it.message ?: "Error")) }
            )
        }

        webSocket("/ws") {
            webSocketManager.handleSession(this)
        }
    }
}

private suspend fun serveAsset(
    assetProvider: (String) -> InputStream?,
    path: String,
    contentType: ContentType,
    call: io.ktor.server.application.ApplicationCall
) {
    val stream = assetProvider(path)
    if (stream != null) {
        call.respondText(stream.bufferedReader().readText(), contentType)
    } else {
        call.respond(io.ktor.http.HttpStatusCode.NotFound, "Not found")
    }
}
