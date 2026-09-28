package com.pokerchips.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pokerchips.game.GameManager
import com.pokerchips.model.GameSummary
import com.pokerchips.model.JournalEntry
import com.pokerchips.ui.theme.Accent
import com.pokerchips.ui.theme.AccentGreen
import com.pokerchips.ui.theme.BgCard
import com.pokerchips.ui.theme.BgSecondary
import com.pokerchips.ui.theme.Gold
import com.pokerchips.ui.theme.TextSecondary

@Composable
private fun ScreenHeader(title: String, onBack: () -> Unit, action: @Composable () -> Unit = {}) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        IconButton(onClick = onBack) {
            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
        }
        Text(title, fontSize = 22.sp, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
        action()
    }
}

private fun playersLine(players: Map<String, Int>): String =
    if (players.isEmpty()) "No players"
    else players.entries.joinToString(" · ") { "${it.key} ${it.value}" }

@Composable
fun HistoryScreen(
    gameManager: GameManager,
    currentGameId: String,
    onBack: () -> Unit,
    onOpenGame: (String) -> Unit
) {
    var games by remember { mutableStateOf<List<GameSummary>?>(null) }
    LaunchedEffect(currentGameId) { games = gameManager.listGames() }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item { ScreenHeader("Game history", onBack) }
        item {
            Text(
                "Every action is saved on this phone as it happens. Open a game to resume it or " +
                    "rewind it to any earlier moment.",
                color = TextSecondary,
                fontSize = 13.sp
            )
        }
        val list = games
        when {
            list == null -> item { Text("Loading…", color = TextSecondary) }
            list.isEmpty() -> item { Text("No games yet.", color = TextSecondary) }
            else -> items(list, key = { it.gameId }) { game ->
                GameCard(game, isCurrent = game.gameId == currentGameId) { onOpenGame(game.gameId) }
            }
        }
        item { Spacer(Modifier.height(32.dp)) }
    }
}

@Composable
private fun GameCard(game: GameSummary, isCurrent: Boolean, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = if (isCurrent) BgCard else BgSecondary),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(formatDateTime(game.createdAt), fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                if (isCurrent) Text("CURRENT", color = AccentGreen, fontSize = 12.sp, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(4.dp))
            Text(playersLine(game.players), color = Gold, fontSize = 13.sp)
            Spacer(Modifier.height(4.dp))
            Text(
                "Blinds ${game.smallBlind}/${game.bigBlind} · pot ${game.pot} · ${game.actions} actions · " +
                    "last ${formatDateTime(game.updatedAt)}",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }
    }
}

@Composable
fun GameDetailScreen(
    gameManager: GameManager,
    gameId: String,
    currentGameId: String,
    runAction: ActionRunner,
    onShare: (String) -> Unit,
    onBack: () -> Unit,
    onRestored: () -> Unit
) {
    var entries by remember { mutableStateOf<List<JournalEntry>?>(null) }
    var expandedSeq by remember { mutableStateOf<Int?>(null) }
    var confirmResume by remember { mutableStateOf(false) }
    var confirmRestore by remember { mutableStateOf<JournalEntry?>(null) }
    LaunchedEffect(gameId) { entries = gameManager.history(gameId) }

    val list = entries
    val isCurrent = gameId == currentGameId

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            ScreenHeader("Game", onBack) {
                if (!list.isNullOrEmpty()) {
                    IconButton(onClick = { onShare(shareText(gameId, list)) }) {
                        Icon(Icons.Default.Share, contentDescription = "Share")
                    }
                }
            }
        }
        if (list == null) {
            item { Text("Loading…", color = TextSecondary) }
            return@LazyColumn
        }
        if (list.isEmpty()) {
            item { Text("This game has no saved entries.", color = TextSecondary) }
            return@LazyColumn
        }
        val last = list.last()
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = BgCard),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Started ${formatDateTime(list.first().timestamp)}", fontWeight = FontWeight.SemiBold)
                    Text("Last state · blinds ${last.smallBlind}/${last.bigBlind} · pot ${last.pot}", color = TextSecondary, fontSize = 12.sp)
                    Spacer(Modifier.height(8.dp))
                    BalancesTable(last.players)
                }
            }
        }
        if (!isCurrent) {
            item {
                Button(
                    onClick = { confirmResume = true },
                    colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Resume this game")
                }
            }
        }
        item {
            Text(
                "Tap an entry to see everyone's chips at that moment and restore the game to it.",
                color = TextSecondary,
                fontSize = 12.sp
            )
        }
        items(list.reversed(), key = { it.seq }) { entry ->
            val expanded = expandedSeq == entry.seq
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expandedSeq = if (expanded) null else entry.seq },
                colors = CardDefaults.cardColors(containerColor = BgSecondary),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp)) {
                    Row {
                        Text("#${entry.seq}", color = TextSecondary, fontSize = 12.sp, modifier = Modifier.width(44.dp))
                        Text(entry.message, fontSize = 14.sp, modifier = Modifier.weight(1f))
                        Text(formatTime(entry.timestamp), color = TextSecondary, fontSize = 12.sp)
                    }
                    if (expanded) {
                        Spacer(Modifier.height(8.dp))
                        Text("Pot ${entry.pot} · blinds ${entry.smallBlind}/${entry.bigBlind}", color = TextSecondary, fontSize = 12.sp)
                        Spacer(Modifier.height(4.dp))
                        BalancesTable(entry.players)
                        Spacer(Modifier.height(8.dp))
                        Button(
                            onClick = { confirmRestore = entry },
                            colors = ButtonDefaults.buttonColors(containerColor = Accent),
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        ) { Text("Restore to this point") }
                    }
                }
            }
        }
        item { Spacer(Modifier.height(32.dp)) }
    }

    if (confirmResume) {
        ConfirmDialog(
            title = "Resume this game?",
            text = "It becomes the current game, exactly as it was left. The game you are playing now stays in history.",
            confirmLabel = "Resume",
            onConfirm = { runAction({ gameManager.resumeGame(gameId) }, onRestored) },
            onDismiss = { confirmResume = false }
        )
    }
    confirmRestore?.let { entry ->
        ConfirmDialog(
            title = "Restore to #${entry.seq}?",
            text = "Chips, pot and blinds go back to how they were right after \"${entry.message}\". " +
                "The restore is added to the history, so nothing after it is lost.",
            confirmLabel = "Restore",
            onConfirm = { runAction({ gameManager.restoreToEntry(gameId, entry.seq) }, onRestored) },
            onDismiss = { confirmRestore = null }
        )
    }
}

@Composable
private fun BalancesTable(players: Map<String, Int>) {
    if (players.isEmpty()) {
        Text("No players", color = TextSecondary, fontSize = 13.sp)
        return
    }
    Column {
        for ((name, chips) in players) {
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(name, fontSize = 14.sp, modifier = Modifier.weight(1f))
                Text("$chips", color = Gold, fontSize = 14.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

private fun shareText(gameId: String, entries: List<JournalEntry>): String {
    val last = entries.last()
    return buildString {
        appendLine("PokerChips game $gameId")
        appendLine("Started ${formatDateTime(entries.first().timestamp)}, last action ${formatDateTime(last.timestamp)}")
        appendLine("Blinds ${last.smallBlind}/${last.bigBlind}, pot ${last.pot}")
        appendLine()
        for ((name, chips) in last.players) appendLine("$name: $chips")
        appendLine()
        appendLine("History:")
        for (e in entries) appendLine("#${e.seq} ${formatDateTime(e.timestamp)} ${e.message}")
    }
}
