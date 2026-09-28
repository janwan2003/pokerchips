package com.pokerchips.game

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder
import java.io.File

class GameManagerTest {

    @get:Rule
    val tmp = TemporaryFolder()

    private fun manager(dir: File) = GameManager(GameStore(dir))

    @Test
    fun `a game survives the process dying`() = runBlocking {
        val dir = tmp.newFolder("games")
        val first = manager(dir)
        first.joinPlayer("Jan")
        first.joinPlayer("Ola")
        first.addToPot("Jan", 20)
        first.addToPot("Ola", 40)
        first.takeFromPot("Ola", 60)

        val reborn = manager(dir).stateFlow.value
        assertEquals(first.stateFlow.value.gameId, reborn.gameId)
        assertEquals(980, reborn.players.getValue("Jan").chips)
        assertEquals(1020, reborn.players.getValue("Ola").chips)
        assertEquals(0, reborn.pot)
    }

    @Test
    fun `a torn last line loses only that action`() = runBlocking {
        val dir = tmp.newFolder("games")
        val gm = manager(dir)
        gm.joinPlayer("Jan")
        gm.addToPot("Jan", 100)
        val id = gm.stateFlow.value.gameId
        File(dir, "$id.jsonl").appendText("{\"seq\":99,\"timestamp\":1,\"mess")

        val reborn = manager(dir).stateFlow.value
        assertEquals(900, reborn.players.getValue("Jan").chips)
        assertEquals(100, reborn.pot)
    }

    @Test
    fun `blinds default to 10-20 and drive nothing else`() = runBlocking {
        val gm = manager(tmp.newFolder("games"))
        assertEquals(10, gm.stateFlow.value.smallBlind)
        assertEquals(20, gm.stateFlow.value.bigBlind)
        assertTrue(gm.setBlinds(50, 25).isFailure)
        assertTrue(gm.setBlinds(25, 50).isSuccess)
        assertEquals(50, gm.stateFlow.value.bigBlind)
    }

    @Test
    fun `new game keeps the old one in history and resume brings it back`() = runBlocking {
        val gm = manager(tmp.newFolder("games"))
        gm.joinPlayer("Jan")
        gm.addToPot("Jan", 300)
        val oldId = gm.stateFlow.value.gameId

        gm.newGame()
        val newState = gm.stateFlow.value
        assertNotEquals(oldId, newState.gameId)
        assertEquals(1000, newState.players.getValue("Jan").chips)
        assertEquals(0, newState.pot)
        assertEquals(2, gm.listGames().size)

        gm.resumeGame(oldId)
        assertEquals(oldId, gm.stateFlow.value.gameId)
        assertEquals(700, gm.stateFlow.value.players.getValue("Jan").chips)
        assertEquals(300, gm.stateFlow.value.pot)
    }

    @Test
    fun `restore rewinds to an entry and is itself recorded`() = runBlocking {
        val gm = manager(tmp.newFolder("games"))
        gm.joinPlayer("Jan")
        gm.addToPot("Jan", 100)
        gm.addToPot("Jan", 200)
        val id = gm.stateFlow.value.gameId
        val afterFirstBet = gm.history(id).first { it.message.startsWith("Jan bet 100") }

        gm.restoreToEntry(id, afterFirstBet.seq)
        assertEquals(900, gm.stateFlow.value.players.getValue("Jan").chips)
        assertEquals(100, gm.stateFlow.value.pot)
        val history = gm.history(id)
        assertTrue(history.last().message.startsWith("Restored to state after #${afterFirstBet.seq}"))
        assertTrue(history.any { it.message.startsWith("Jan bet 200") })
    }

    @Test
    fun `a game can start from any typed-in state`() = runBlocking {
        val gm = manager(tmp.newFolder("games"))
        assertTrue(gm.startFromState(listOf("Jan" to 1500, "Ola" to 300), 200, 10, 20).isSuccess)
        val s = gm.stateFlow.value
        assertEquals(1500, s.players.getValue("Jan").chips)
        assertEquals(300, s.players.getValue("Ola").chips)
        assertEquals(200, s.pot)

        // A phone rejoining with different case gets the typed-in balance, not a fresh stack.
        val rejoin = gm.joinPlayer("jan")
        assertTrue(rejoin.isRejoin)
        assertEquals("Jan", rejoin.name)
        assertEquals(1500, rejoin.chips)

        assertTrue(gm.startFromState(listOf("Jan" to 1, "JAN" to 2), 0, 10, 20).isFailure)
        assertTrue(gm.startFromState(listOf(" " to 1), 0, 10, 20).isFailure)
    }
}
