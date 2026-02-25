package com.pokerchips.model

import kotlinx.serialization.Serializable

@Serializable
data class Player(
    val name: String,
    val chips: Int
)
