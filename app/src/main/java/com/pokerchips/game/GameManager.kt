package com.pokerchips.game

import com.pokerchips.model.GameState
import com.pokerchips.model.JoinResponse
import com.pokerchips.model.LogEntry
import com.pokerchips.model.Player
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

class GameManager {

    private val mutex = Mutex()
    private val players = mutableMapOf<String, Player>()
    private var pot = 0
    private var startingChips = 1000
    private val log = mutableListOf<LogEntry>()

    private val _stateFlow = MutableStateFlow(snapshot())
    val stateFlow: StateFlow<GameState> = _stateFlow.asStateFlow()

    private fun snapshot() = GameState(
        players = players.toMap(),
        pot = pot,
        startingChips = startingChips,
        log = log.toList()
    )

    private fun emit() {
        _stateFlow.value = snapshot()
    }

    private fun addLog(message: String) {
        log.add(LogEntry(System.currentTimeMillis(), message))
        if (log.size > 50) log.removeAt(0)
    }

    suspend fun joinPlayer(name: String): JoinResponse = mutex.withLock {
        val existing = players[name]
        if (existing != null) {
            return JoinResponse(name = name, chips = existing.chips, isRejoin = true)
        }
        val player = Player(name = name, chips = startingChips)
        players[name] = player
        addLog("$name joined the game")
        emit()
        JoinResponse(name = name, chips = player.chips, isRejoin = false)
    }

    suspend fun addToPot(playerName: String, amount: Int): Result<Unit> = mutex.withLock {
        val player = players[playerName]
            ?: return Result.failure(IllegalArgumentException("Player not found"))
        if (amount <= 0) return Result.failure(IllegalArgumentException("Amount must be positive"))
        if (player.chips < amount) return Result.failure(IllegalArgumentException("Not enough chips"))

        players[playerName] = player.copy(chips = player.chips - amount)
        pot += amount
        addLog("$playerName added $amount to pot")
        emit()
        Result.success(Unit)
    }

    suspend fun takeFromPot(playerName: String, amount: Int): Result<Unit> = mutex.withLock {
        val player = players[playerName]
            ?: return Result.failure(IllegalArgumentException("Player not found"))
        if (amount <= 0) return Result.failure(IllegalArgumentException("Amount must be positive"))
        if (pot < amount) return Result.failure(IllegalArgumentException("Not enough in pot"))

        players[playerName] = player.copy(chips = player.chips + amount)
        pot -= amount
        addLog("$playerName took $amount from pot")
        emit()
        Result.success(Unit)
    }

    suspend fun removePlayer(playerName: String) = mutex.withLock {
        players.remove(playerName)
        addLog("$playerName left the game")
        emit()
    }

    suspend fun resetGame() = mutex.withLock {
        for ((name, _) in players) {
            players[name] = Player(name = name, chips = startingChips)
        }
        pot = 0
        log.clear()
        addLog("Game reset")
        emit()
    }

    suspend fun setStartingChips(amount: Int) = mutex.withLock {
        startingChips = amount
        emit()
    }
}
