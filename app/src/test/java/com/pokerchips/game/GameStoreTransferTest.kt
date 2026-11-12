package com.pokerchips.game

import com.pokerchips.model.JournalEntry
import org.junit.Assert.assertEquals
import org.junit.Test
import java.io.ByteArrayInputStream
import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.file.Files
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class GameStoreTransferTest {

    private fun tempStore(): Pair<File, GameStore> {
        val dir = Files.createTempDirectory("games").toFile()
        return dir to GameStore(dir)
    }

    private fun entry(seq: Int, chips: Int) = JournalEntry(
        seq = seq, timestamp = 1_000L + seq, message = "#$seq",
        players = mapOf("Ana" to chips), pot = 0, startingChips = 1000, smallBlind = 10, bigBlind = 20
    )

    @Test
    fun `export then import into an empty phone brings every game over`() {
        val (_, from) = tempStore()
        from.append("20261101-200000-aaaa", entry(1, 1000))
        from.append("20261101-200000-aaaa", entry(2, 900))
        from.append("20261102-200000-bbbb", entry(1, 500))
        val zip = ByteArrayOutputStream().also { assertEquals(2, from.exportTo(it)) }.toByteArray()

        val (_, to) = tempStore()
        val result = to.importFrom(ByteArrayInputStream(zip))
        assertEquals(GameStore.ImportResult(added = 2, alreadyHere = 0, keptBoth = 0, skipped = 0), result)
        assertEquals(from.readAll("20261101-200000-aaaa"), to.readAll("20261101-200000-aaaa"))
        assertEquals(2, to.listGames().size)
    }

    @Test
    fun `importing never overwrites a game that differs, it keeps both`() {
        val (_, from) = tempStore()
        from.append("g1", entry(1, 1000))
        val zip = ByteArrayOutputStream().also { from.exportTo(it) }.toByteArray()

        val (_, to) = tempStore()
        to.append("g1", entry(1, 1))
        val again = to.importFrom(ByteArrayInputStream(zip))
        assertEquals(1, again.keptBoth)
        assertEquals(1, to.readAll("g1").single().players["Ana"])          // original untouched
        assertEquals(1000, to.readAll("g1-imported-2").single().players["Ana"])

        val twice = to.importFrom(ByteArrayInputStream(zip))                // same file again
        assertEquals(1, twice.keptBoth)                                    // g1 still differs
        assertEquals(3, to.listGames().size)
    }

    @Test
    fun `identical games are recognised, and junk or unsafe names are skipped`() {
        val (_, store) = tempStore()
        store.append("g1", entry(1, 1000))
        val bytes = ByteArrayOutputStream().also { out ->
            ZipOutputStream(out).use { zip ->
                zip.putNextEntry(ZipEntry("games/g1.jsonl"))
                zip.write(ByteArray(0))
                zip.closeEntry()
                zip.putNextEntry(ZipEntry("../../evil.jsonl")); zip.write("x".toByteArray()); zip.closeEntry()
                zip.putNextEntry(ZipEntry("games/notes.txt")); zip.write("hi".toByteArray()); zip.closeEntry()
            }
        }.toByteArray()
        val result = store.importFrom(ByteArrayInputStream(bytes))
        assertEquals(0, result.added)
        assertEquals(3, result.skipped) // empty game, unparsable "evil", non-game file

        val same = ByteArrayOutputStream().also { store.exportTo(it) }.toByteArray()
        assertEquals(1, store.importFrom(ByteArrayInputStream(same)).alreadyHere)
    }
}
