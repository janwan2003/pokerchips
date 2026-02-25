package com.pokerchips.model

import kotlinx.serialization.Serializable

@Serializable
data class JoinRequest(val name: String)

@Serializable
data class JoinResponse(val name: String, val chips: Int, val isRejoin: Boolean)

@Serializable
data class ChipAction(val name: String, val amount: Int)

@Serializable
data class ErrorResponse(val error: String)
