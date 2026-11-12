package com.pokerchips.util

import java.net.URI

/**
 * Turns whatever a player typed, pasted or scanned into the page to open in the app:
 * an easypoker.cc table code ("KAA29S"), an easypoker.cc link, or the link of a game
 * another phone hosts on the local Wi-Fi ("http://192.168.1.20:8080").
 */
object JoinTarget {

    const val ONLINE_HOST = "easypoker.cc"
    const val ONLINE_HOME = "https://$ONLINE_HOST/"

    /** Same alphabet the site uses: no 0/O or 1/I/L. */
    private val CODE = Regex("^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$")

    fun onlineTableUrl(code: String) = "https://$ONLINE_HOST/$code"

    /** The page to open, or null if the input is neither a code nor a usable link. */
    fun parse(input: String): String? {
        val text = input.trim()
        if (text.isEmpty()) return null
        val upper = text.uppercase()
        if (CODE.matches(upper)) return onlineTableUrl(upper)

        val withScheme = when {
            text.startsWith("http://", ignoreCase = true) || text.startsWith("https://", ignoreCase = true) -> text
            text.contains("://") -> return null
            else -> (if (looksOnline(text)) "https://" else "http://") + text
        }
        val uri = runCatching { URI(withScheme) }.getOrNull() ?: return null
        val host = uri.host?.lowercase() ?: return null
        if (host == ONLINE_HOST || host == "www.$ONLINE_HOST") {
            val code = uri.path.orEmpty().trim('/').uppercase()
            return if (CODE.matches(code)) onlineTableUrl(code) else null
        }
        // A phone hosting over Wi-Fi: keep scheme, host and port, drop anything else.
        if (uri.scheme.lowercase() !in setOf("http", "https")) return null
        if (!host.contains('.') && uri.port <= 0) return null // a bare word is a typo, not an address
        val port = if (uri.port > 0) ":${uri.port}" else ""
        return "${uri.scheme.lowercase()}://$host$port/"
    }

    /** The table code if [url] is an easypoker.cc table page. */
    fun onlineCode(url: String?): String? {
        val uri = runCatching { URI(url ?: return null) }.getOrNull() ?: return null
        val host = uri.host?.lowercase() ?: return null
        if (host != ONLINE_HOST && host != "www.$ONLINE_HOST") return null
        val code = uri.path.orEmpty().trim('/').uppercase()
        return code.takeIf { CODE.matches(it) }
    }

    fun isOnline(url: String): Boolean =
        runCatching { URI(url).host?.lowercase() }.getOrNull()?.let { it == ONLINE_HOST || it == "www.$ONLINE_HOST" } == true

    private fun looksOnline(text: String) = text.lowercase().let { it.startsWith(ONLINE_HOST) || it.startsWith("www.$ONLINE_HOST") }
}
