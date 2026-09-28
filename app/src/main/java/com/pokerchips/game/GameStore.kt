package com.pokerchips.game

import com.pokerchips.model.GameSummary
import com.pokerchips.model.JournalEntry
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileOutputStream

/**
 * Every game is one append-only file, `games/<id>.jsonl`, one [JournalEntry] per line.
 *
 * Append-only is the point: a write is never a rewrite of what is already on disk, so a
 * crash or a dead battery mid-write can at worst leave a torn last line, which [readAll]
 * skips. Every line before it is intact, and each line holds the full state, so the game
 * comes back as it was one action earlier. Nothing here ever deletes a game.
 */
class GameStore(private val dir: File) {

    private val json = Json { ignoreUnknownKeys = true }
    private val activeFile = File(dir, "active.txt")

    init {
        dir.mkdirs()
    }

    private fun fileFor(gameId: String) = File(dir, "$gameId.jsonl")

    fun append(gameId: String, entry: JournalEntry) {
        val line = json.encodeToString(JournalEntry.serializer(), entry) + "\n"
        FileOutputStream(fileFor(gameId), true).use { out ->
            out.write(line.toByteArray(Charsets.UTF_8))
            out.flush()
            out.fd.sync()
        }
    }

    fun readAll(gameId: String): List<JournalEntry> {
        val file = fileFor(gameId)
        if (!file.exists()) return emptyList()
        return file.readLines(Charsets.UTF_8).mapNotNull { line ->
            if (line.isBlank()) null
            else runCatching { json.decodeFromString(JournalEntry.serializer(), line) }.getOrNull()
        }
    }

    fun latest(gameId: String): JournalEntry? = readAll(gameId).lastOrNull()

    fun exists(gameId: String) = fileFor(gameId).exists()

    fun listGames(): List<GameSummary> =
        (dir.listFiles { f -> f.isFile && f.name.endsWith(".jsonl") } ?: emptyArray())
            .mapNotNull { file ->
                val id = file.name.removeSuffix(".jsonl")
                val entries = readAll(id)
                val first = entries.firstOrNull() ?: return@mapNotNull null
                val last = entries.last()
                GameSummary(
                    gameId = id,
                    createdAt = first.timestamp,
                    updatedAt = last.timestamp,
                    actions = entries.size,
                    players = last.players,
                    pot = last.pot,
                    smallBlind = last.smallBlind,
                    bigBlind = last.bigBlind
                )
            }
            .sortedByDescending { it.updatedAt }

    fun readActiveGameId(): String? =
        runCatching { activeFile.readText().trim() }.getOrNull()?.takeIf { it.isNotEmpty() }

    fun writeActiveGameId(gameId: String) {
        val tmp = File(dir, "active.txt.tmp")
        FileOutputStream(tmp).use { out ->
            out.write(gameId.toByteArray(Charsets.UTF_8))
            out.fd.sync()
        }
        if (!tmp.renameTo(activeFile)) {
            activeFile.writeText(gameId)
            tmp.delete()
        }
    }
}
