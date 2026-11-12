package com.pokerchips.game

import com.pokerchips.model.GameSummary
import com.pokerchips.model.JournalEntry
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileOutputStream
import java.io.InputStream
import java.io.OutputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream
import java.util.zip.ZipOutputStream

/**
 * Every game is one append-only file, `games/<id>.jsonl`, one [JournalEntry] per line.
 *
 * Append-only is the point: a write is never a rewrite of what is already on disk, so a
 * crash or a dead battery mid-write can at worst leave a torn last line, which [readAll]
 * skips. Every line before it is intact, and each line holds the full state, so the game
 * comes back as it was one action earlier. Nothing here ever deletes a game.
 */
class GameStore(private val dir: File) {

    companion object {
        /** Game ids are timestamps plus a suffix; anything else in an import is ignored. */
        private val SAFE_ID = Regex("^[A-Za-z0-9-]{1,80}$")
    }

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

    private fun decode(line: String): JournalEntry? =
        runCatching { json.decodeFromString(JournalEntry.serializer(), line) }.getOrNull()

    fun latest(gameId: String): JournalEntry? = readAll(gameId).lastOrNull()

    fun exists(gameId: String) = fileFor(gameId).exists()

    fun listGames(): List<GameSummary> =
        (dir.listFiles { f -> f.isFile && f.name.endsWith(".jsonl") } ?: emptyArray())
            .mapNotNull { file ->
                // Only the first and last entries matter for a summary; decoding every
                // line of every game made the history screen slower with each game played.
                val lines = file.readLines(Charsets.UTF_8).filter { it.isNotBlank() }
                val decoded = lines.indices.asSequence().map { i -> i to decode(lines[i]) }
                val first = decoded.firstOrNull { it.second != null } ?: return@mapNotNull null
                val last = lines.indices.reversed().asSequence()
                    .mapNotNull { i -> decode(lines[i]) }.first()
                // Undecodable lines (a torn last write) are not actions.
                val torn = if (decode(lines.last()) == null) 1 else 0
                GameSummary(
                    gameId = file.name.removeSuffix(".jsonl"),
                    createdAt = first.second!!.timestamp,
                    updatedAt = last.timestamp,
                    actions = lines.size - first.first - torn,
                    players = last.players,
                    pot = last.pot,
                    smallBlind = last.smallBlind,
                    bigBlind = last.bigBlind
                )
            }
            .sortedByDescending { it.updatedAt }

    // --- moving history between phones or apps ---

    /** Writes every game file into one zip. Reads only; nothing on this phone changes. */
    fun exportTo(out: OutputStream): Int {
        val files = (dir.listFiles { f -> f.isFile && f.name.endsWith(".jsonl") } ?: emptyArray()).sortedBy { it.name }
        ZipOutputStream(out).use { zip ->
            for (file in files) {
                zip.putNextEntry(ZipEntry("games/${file.name}"))
                file.inputStream().use { it.copyTo(zip) }
                zip.closeEntry()
            }
        }
        return files.size
    }

    data class ImportResult(val added: Int, val alreadyHere: Int, val keptBoth: Int, val skipped: Int)

    /**
     * Adds the games from an exported zip. Never overwrites or deletes: a game that is
     * already here with the same content is left alone, and one with the same id but
     * different content is added next to it under a new id, so both survive.
     */
    fun importFrom(input: InputStream): ImportResult {
        var added = 0
        var same = 0
        var both = 0
        var skipped = 0
        ZipInputStream(input).use { zip ->
            while (true) {
                val entry = zip.nextEntry ?: break
                val name = entry.name.substringAfterLast('/')
                val id = name.removeSuffix(".jsonl")
                if (entry.isDirectory || !name.endsWith(".jsonl") || !SAFE_ID.matches(id)) {
                    skipped++
                    continue
                }
                val bytes = zip.readBytes()
                val lines = bytes.toString(Charsets.UTF_8).lines().filter { it.isNotBlank() }
                if (lines.none { decode(it) != null }) {
                    skipped++
                    continue
                }
                val existing = fileFor(id)
                val target = when {
                    !existing.exists() -> existing
                    existing.readBytes().contentEquals(bytes) -> { same++; null }
                    else -> {
                        var n = 2
                        while (fileFor("$id-imported-$n").exists()) n++
                        both++
                        fileFor("$id-imported-$n")
                    }
                } ?: continue
                FileOutputStream(target).use { out ->
                    out.write(bytes)
                    out.fd.sync()
                }
                if (target == existing) added++
            }
        }
        return ImportResult(added = added, alreadyHere = same, keptBoth = both, skipped = skipped)
    }

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
