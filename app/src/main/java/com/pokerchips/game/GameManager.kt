package com.pokerchips.game

import com.pokerchips.model.GameState
import com.pokerchips.model.GameSummary
import com.pokerchips.model.JoinResponse
import com.pokerchips.model.JournalEntry
import com.pokerchips.model.LogEntry
import com.pokerchips.model.Player
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.random.Random

/**
 * The game in memory, written through to [GameStore] on every change. The in-memory
 * state is never ahead of the journal by more than the action being recorded, and on
 * start-up the last active game is loaded back from disk, so killing the app, the
 * service or the phone loses nothing that was already on screen.
 */
class GameManager(
    private val store: GameStore,
    private val clock: () -> Long = System::currentTimeMillis
) {

    companion object {
        const val DEFAULT_STARTING_CHIPS = 1000
        const val DEFAULT_SMALL_BLIND = 10
        const val DEFAULT_BIG_BLIND = 20
        const val MAX_NAME_LENGTH = 20
        /** Upper bound for any single typed-in amount, so sums stay far from Int overflow. */
        const val MAX_CHIPS = 1_000_000_000
        private const val RECENT_LOG_SIZE = 50

        /** Common cash-game and home-game levels. */
        val BLIND_LEVELS = listOf(
            1 to 2, 5 to 10, 10 to 20, 20 to 40, 50 to 100,
            100 to 200, 200 to 400, 500 to 1000, 1000 to 2000
        )
    }

    private val mutex = Mutex()

    private var gameId = ""
    private var createdAt = 0L
    private var seq = 0
    private val players = LinkedHashMap<String, Int>()
    private var pot = 0
    private var startingChips = DEFAULT_STARTING_CHIPS
    private var smallBlind = DEFAULT_SMALL_BLIND
    private var bigBlind = DEFAULT_BIG_BLIND
    private val recentLog = ArrayDeque<LogEntry>()

    private val _stateFlow: MutableStateFlow<GameState>
    val stateFlow: StateFlow<GameState>

    init {
        val restored = store.readActiveGameId()?.let { id -> store.readAll(id).takeIf { it.isNotEmpty() }?.let { id to it } }
            ?: store.listGames().firstOrNull()?.let { summary -> summary.gameId to store.readAll(summary.gameId) }
        if (restored != null) {
            load(restored.first, restored.second)
            runCatching { store.writeActiveGameId(gameId) }
        } else {
            beginGame(emptyMap(), 0)
            // Nothing to protect yet; if storage is broken, the first real action reports it.
            runCatching { record("New game") }
        }
        _stateFlow = MutableStateFlow(snapshot())
        stateFlow = _stateFlow.asStateFlow()
    }

    // --- internals, all called with the mutex held (or from init) ---

    private fun snapshot() = GameState(
        gameId = gameId,
        createdAt = createdAt,
        players = players.mapValues { (name, chips) -> Player(name, chips) },
        pot = pot,
        startingChips = startingChips,
        smallBlind = smallBlind,
        bigBlind = bigBlind,
        log = recentLog.toList()
    )

    private fun newGameId(): String {
        val stamp = SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(Date(clock()))
        val suffix = Random.nextInt(0x1000, 0xFFFF).toString(16)
        return "$stamp-$suffix"
    }

    private fun beginGame(newPlayers: Map<String, Int>, newPot: Int) {
        gameId = newGameId()
        createdAt = clock()
        seq = 0
        players.clear()
        players.putAll(newPlayers)
        pot = newPot
        recentLog.clear()
        setActive(gameId)
    }

    private fun load(id: String, entries: List<JournalEntry>) {
        val last = entries.last()
        gameId = id
        createdAt = entries.first().timestamp
        seq = last.seq
        applySnapshot(last)
        recentLog.clear()
        entries.takeLast(RECENT_LOG_SIZE).forEach { recentLog.addLast(LogEntry(it.timestamp, it.message)) }
    }

    private fun applySnapshot(entry: JournalEntry) {
        players.clear()
        players.putAll(entry.players)
        pot = entry.pot
        startingChips = entry.startingChips
        smallBlind = entry.smallBlind
        bigBlind = entry.bigBlind
    }

    private fun setActive(id: String) {
        try {
            store.writeActiveGameId(id)
        } catch (e: Exception) {
            throw JournalWriteException(e)
        }
    }

    private fun record(message: String) {
        seq += 1
        val now = clock()
        val entry = JournalEntry(
            seq = seq,
            timestamp = now,
            message = message,
            players = LinkedHashMap(players),
            pot = pot,
            startingChips = startingChips,
            smallBlind = smallBlind,
            bigBlind = bigBlind
        )
        try {
            store.append(gameId, entry)
        } catch (e: Exception) {
            throw JournalWriteException(e)
        }
        recentLog.addLast(LogEntry(now, message))
        while (recentLog.size > RECENT_LOG_SIZE) recentLog.removeFirst()
    }

    private fun emit() {
        _stateFlow.value = snapshot()
    }

    private fun findName(name: String): String? =
        players.keys.firstOrNull { it.equals(name.trim(), ignoreCase = true) }

    /** Everything [record] snapshots, so a failed journal write can be undone in memory. */
    private class Saved(
        val gameId: String, val createdAt: Long, val seq: Int, val players: Map<String, Int>,
        val pot: Int, val startingChips: Int, val smallBlind: Int, val bigBlind: Int,
        val log: List<LogEntry>
    )

    private fun save() = Saved(
        gameId, createdAt, seq, LinkedHashMap(players), pot, startingChips, smallBlind, bigBlind,
        recentLog.toList()
    )

    private fun restore(s: Saved) {
        if (gameId != s.gameId) runCatching { store.writeActiveGameId(s.gameId) } // best effort
        gameId = s.gameId
        createdAt = s.createdAt
        seq = s.seq
        players.clear()
        players.putAll(s.players)
        pot = s.pot
        startingChips = s.startingChips
        smallBlind = s.smallBlind
        bigBlind = s.bigBlind
        recentLog.clear()
        recentLog.addAll(s.log)
    }

    /**
     * Runs [block] under the mutex. If its journal write fails, the in-memory game is put
     * back exactly as it was, so the screen never shows an action that is not on disk.
     */
    private suspend fun <T> locked(block: () -> T): T =
        withContext(Dispatchers.IO) {
            mutex.withLock {
                val before = save()
                try {
                    block()
                } catch (e: JournalWriteException) {
                    restore(before)
                    throw e
                }
            }
        }

    /** [locked] for actions that report failure as a [Result] (the host UI toasts it). */
    private suspend fun <T> lockedResult(block: () -> Result<T>): Result<T> =
        try {
            locked(block)
        } catch (e: JournalWriteException) {
            Result.failure(e)
        }

    /** a + b, or null if it would overflow an Int. */
    private fun plus(a: Int, b: Int): Int? = runCatching { Math.addExact(a, b) }.getOrNull()

    private fun fail(message: String): Result<Nothing> = Result.failure(IllegalArgumentException(message))

    // --- player actions ---

    suspend fun joinPlayer(name: String): JoinResponse = locked {
        val existing = findName(name)
        if (existing != null) {
            JoinResponse(name = existing, chips = players.getValue(existing), isRejoin = true)
        } else {
            val clean = name.trim()
            players[clean] = startingChips
            record("$clean joined with $startingChips")
            emit()
            JoinResponse(name = clean, chips = startingChips, isRejoin = false)
        }
    }

    suspend fun addToPot(playerName: String, amount: Int): Result<Unit> = lockedResult {
        val name = findName(playerName) ?: return@lockedResult fail("Player not found")
        val chips = players.getValue(name)
        if (amount <= 0) return@lockedResult fail("Amount must be positive")
        if (chips < amount) return@lockedResult fail("Not enough chips")
        val newPot = plus(pot, amount) ?: return@lockedResult fail("Too many chips in the pot")
        players[name] = chips - amount
        pot = newPot
        record("$name bet $amount (pot $pot)")
        emit()
        Result.success(Unit)
    }

    suspend fun takeFromPot(playerName: String, amount: Int): Result<Unit> = lockedResult {
        val name = findName(playerName) ?: return@lockedResult fail("Player not found")
        if (amount <= 0) return@lockedResult fail("Amount must be positive")
        if (pot < amount) return@lockedResult fail("Not enough in pot")
        players[name] = plus(players.getValue(name), amount) ?: return@lockedResult fail("Too many chips")
        pot -= amount
        record("$name took $amount from pot" + if (pot > 0) " (pot $pot)" else "")
        emit()
        Result.success(Unit)
    }

    /** The winner takes the whole pot, whatever it is by the time the request lands. */
    suspend fun takeWholePot(playerName: String): Result<Int> = lockedResult {
        val name = findName(playerName) ?: return@lockedResult fail("Player not found")
        if (pot <= 0) return@lockedResult fail("Pot is empty")
        val won = pot
        players[name] = plus(players.getValue(name), won) ?: return@lockedResult fail("Too many chips")
        pot = 0
        record("$name took the whole pot ($won)")
        emit()
        Result.success(won)
    }

    // --- host corrections ---

    suspend fun setPlayerChips(playerName: String, chips: Int): Result<Unit> = lockedResult {
        val name = findName(playerName) ?: return@lockedResult fail("Player not found")
        if (chips < 0) return@lockedResult fail("Chips cannot be negative")
        if (chips > MAX_CHIPS) return@lockedResult fail("At most $MAX_CHIPS chips")
        val before = players.getValue(name)
        if (before == chips) return@lockedResult Result.success(Unit)
        players[name] = chips
        record("Host set $name's chips $before → $chips")
        emit()
        Result.success(Unit)
    }

    suspend fun setPot(amount: Int): Result<Unit> = lockedResult {
        if (amount < 0) return@lockedResult fail("Pot cannot be negative")
        if (amount > MAX_CHIPS) return@lockedResult fail("At most $MAX_CHIPS chips")
        if (amount == pot) return@lockedResult Result.success(Unit)
        val before = pot
        pot = amount
        record("Host set pot $before → $amount")
        emit()
        Result.success(Unit)
    }

    suspend fun removePlayer(playerName: String): Result<Unit> = lockedResult {
        val name = findName(playerName) ?: return@lockedResult fail("Player not found")
        val chips = players.remove(name) ?: 0
        record("$name left the game with $chips")
        emit()
        Result.success(Unit)
    }

    suspend fun setBlinds(small: Int, big: Int): Result<Unit> = lockedResult {
        if (small <= 0 || big <= 0) return@lockedResult fail("Blinds must be positive")
        if (small > big) return@lockedResult fail("Small blind cannot exceed big blind")
        if (big > MAX_CHIPS) return@lockedResult fail("At most $MAX_CHIPS chips")
        if (small == smallBlind && big == bigBlind) return@lockedResult Result.success(Unit)
        smallBlind = small
        bigBlind = big
        record("Blinds set to $small/$big")
        emit()
        Result.success(Unit)
    }

    suspend fun setStartingChips(amount: Int): Result<Unit> = lockedResult {
        if (amount <= 0) return@lockedResult fail("Starting chips must be positive")
        if (amount > MAX_CHIPS) return@lockedResult fail("At most $MAX_CHIPS chips")
        if (amount == startingChips) return@lockedResult Result.success(Unit)
        startingChips = amount
        record("Starting chips set to $amount")
        emit()
        Result.success(Unit)
    }

    // --- games ---

    /** Starts a fresh game with the same players on starting chips. The old one stays in history. */
    suspend fun newGame(): Result<Unit> = lockedResult {
        val names = players.keys.toList()
        beginGame(names.associateWith { startingChips }, 0)
        record(
            if (names.isEmpty()) "New game"
            else "New game: ${names.size} players on $startingChips"
        )
        emit()
        Result.success(Unit)
    }

    /**
     * Starts a new game from whatever the table says — the recovery path when the app or
     * a phone lost track. The previous game stays in history untouched.
     */
    suspend fun startFromState(
        newPlayers: List<Pair<String, Int>>,
        newPot: Int,
        small: Int,
        big: Int
    ): Result<Unit> = lockedResult {
        val cleaned = LinkedHashMap<String, Int>()
        for ((rawName, chips) in newPlayers) {
            val name = rawName.trim()
            if (name.isEmpty()) return@lockedResult fail("Every player needs a name")
            if (name.length > MAX_NAME_LENGTH) return@lockedResult fail("Name too long: $name")
            if (cleaned.keys.any { it.equals(name, ignoreCase = true) }) return@lockedResult fail("Duplicate name: $name")
            if (chips < 0) return@lockedResult fail("Chips cannot be negative ($name)")
            if (chips > MAX_CHIPS) return@lockedResult fail("At most $MAX_CHIPS chips ($name)")
            cleaned[name] = chips
        }
        if (newPot < 0) return@lockedResult fail("Pot cannot be negative")
        if (newPot > MAX_CHIPS) return@lockedResult fail("At most $MAX_CHIPS chips in the pot")
        if (small <= 0 || big <= 0 || small > big || big > MAX_CHIPS) return@lockedResult fail("Invalid blinds")
        smallBlind = small
        bigBlind = big
        beginGame(cleaned, newPot)
        record("Game started from custom state: ${cleaned.size} players, pot $newPot, blinds $small/$big")
        emit()
        Result.success(Unit)
    }

    /** Makes a game from history the current one, exactly as it was left. */
    suspend fun resumeGame(id: String): Result<Unit> = lockedResult {
        val entries = store.readAll(id)
        if (entries.isEmpty()) return@lockedResult fail("Game not found")
        load(id, entries)
        setActive(id)
        record("Game resumed")
        emit()
        Result.success(Unit)
    }

    /**
     * Rewinds a game to the state right after entry [targetSeq]. It is recorded as a new
     * entry at the end of that game's journal, so the rewind itself can be undone.
     */
    suspend fun restoreToEntry(id: String, targetSeq: Int): Result<Unit> = lockedResult {
        val entries = store.readAll(id)
        val target = entries.firstOrNull { it.seq == targetSeq } ?: return@lockedResult fail("History entry not found")
        load(id, entries)
        setActive(id)
        applySnapshot(target)
        record("Restored to state after #${target.seq}: ${target.message}")
        emit()
        Result.success(Unit)
    }

    suspend fun history(id: String): List<JournalEntry> = withContext(Dispatchers.IO) { store.readAll(id) }

    suspend fun listGames(): List<GameSummary> = withContext(Dispatchers.IO) { store.listGames() }
}

/** The journal could not be written; the action was undone in memory and did not happen. */
class JournalWriteException(cause: Throwable) :
    IllegalStateException("Could not save to game history: ${cause.message}", cause)
