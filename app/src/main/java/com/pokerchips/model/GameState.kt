package com.pokerchips.model

import kotlinx.serialization.Serializable

/** What the host screen and every connected browser see. */
@Serializable
data class GameState(
    val gameId: String,
    val createdAt: Long,
    val players: Map<String, Player>,
    val pot: Int,
    val startingChips: Int,
    val smallBlind: Int,
    val bigBlind: Int,
    val log: List<LogEntry>
)

@Serializable
data class LogEntry(
    val timestamp: Long,
    val message: String
)

/**
 * One line of a game's journal file. Every entry carries the complete state after the
 * action it describes, so any single intact line is enough to rebuild the game, and any
 * earlier line is a point the game can be restored to.
 */
@Serializable
data class JournalEntry(
    val seq: Int,
    val timestamp: Long,
    val message: String,
    val players: Map<String, Int>,
    val pot: Int,
    val startingChips: Int,
    val smallBlind: Int,
    val bigBlind: Int
)

data class GameSummary(
    val gameId: String,
    val createdAt: Long,
    val updatedAt: Long,
    val actions: Int,
    val players: Map<String, Int>,
    val pot: Int,
    val smallBlind: Int,
    val bigBlind: Int
)
