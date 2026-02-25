package com.pokerchips.model

import kotlinx.serialization.Serializable

@Serializable
data class GameState(
    val players: Map<String, Player>,
    val pot: Int,
    val startingChips: Int,
    val log: List<LogEntry>
)

@Serializable
data class LogEntry(
    val timestamp: Long,
    val message: String
)
