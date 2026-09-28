package com.pokerchips.ui.screens

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Restore
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pokerchips.game.GameManager
import com.pokerchips.model.GameState
import com.pokerchips.ui.theme.Accent
import com.pokerchips.ui.theme.AccentGreen
import com.pokerchips.ui.theme.BgCard
import com.pokerchips.ui.theme.BgSecondary
import com.pokerchips.ui.theme.Gold
import com.pokerchips.ui.theme.TextSecondary
import com.pokerchips.util.QrCodeGenerator
import kotlinx.coroutines.flow.StateFlow

/** Runs a game action off the main thread; a failure is shown to the host as a toast. */
typealias ActionRunner = (action: suspend () -> Result<Unit>, onSuccess: () -> Unit) -> Unit

@Composable
fun DashboardScreen(
    isRunning: StateFlow<Boolean>,
    serverUrl: StateFlow<String?>,
    gameState: StateFlow<GameState>,
    gameManager: GameManager,
    runAction: ActionRunner,
    onStartServer: () -> Unit,
    onStopServer: () -> Unit,
    onOpenHistory: () -> Unit,
    onOpenSetup: () -> Unit
) {
    val running by isRunning.collectAsStateWithLifecycle()
    val url by serverUrl.collectAsStateWithLifecycle()
    val state by gameState.collectAsStateWithLifecycle()

    var editingPlayer by remember { mutableStateOf<String?>(null) }
    var editingPot by remember { mutableStateOf(false) }
    var confirmNewGame by remember { mutableStateOf(false) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { AppTitle(onOpenHistory) }
        item { ServerStatusCard(running, url) }
        item { StartStopButton(running, onStartServer, onStopServer) }
        item {
            BlindsCard(state.smallBlind, state.bigBlind) { sb, bb ->
                runAction({ gameManager.setBlinds(sb, bb) }) {}
            }
        }
        item {
            StartingChipsSlider(state.startingChips, state.bigBlind) {
                runAction({ gameManager.setStartingChips(it) }) {}
            }
        }
        item {
            PotDisplay(
                pot = state.pot,
                total = state.pot + state.players.values.sumOf { it.chips },
                onClick = { editingPot = true }
            )
        }

        if (state.players.isNotEmpty()) {
            item {
                Text(
                    "Players (${state.players.size}) · tap to correct",
                    color = TextSecondary,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            }
            items(state.players.values.toList(), key = { it.name }) { player ->
                PlayerCard(player.name, player.chips, state.bigBlind) { editingPlayer = player.name }
            }
        } else {
            item {
                Text(
                    if (running) "Waiting for players to join…" else "Start the server so players can join.",
                    color = TextSecondary,
                    fontSize = 14.sp
                )
            }
        }

        item { WideButton("New game (same players)", Icons.Default.Refresh, BgCard) { confirmNewGame = true } }
        item { WideButton("Start from custom state", Icons.Default.Edit, BgCard, onOpenSetup) }
        item { WideButton("Game history & restore", Icons.Default.History, BgCard, onOpenHistory) }

        if (state.log.isNotEmpty()) {
            item {
                Text("Recent Activity", color = TextSecondary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            }
            items(state.log.reversed().take(15)) { entry ->
                Text("${formatTime(entry.timestamp)}  ${entry.message}", color = TextSecondary, fontSize = 12.sp)
            }
        }

        item {
            Text(
                "Game ${state.gameId} · started ${formatDateTime(state.createdAt)} · saved after every action",
                color = TextSecondary,
                fontSize = 11.sp
            )
        }
        item { Spacer(Modifier.height(32.dp)) }
    }

    editingPlayer?.let { name ->
        val chips = state.players[name]?.chips
        if (chips == null) {
            editingPlayer = null
        } else {
            EditPlayerDialog(
                name = name,
                chips = chips,
                onSave = { value -> runAction({ gameManager.setPlayerChips(name, value) }) { editingPlayer = null } },
                onRemove = { runAction({ gameManager.removePlayer(name) }) { editingPlayer = null } },
                onDismiss = { editingPlayer = null }
            )
        }
    }

    if (editingPot) {
        EditAmountDialog(
            title = "Correct the pot",
            initial = state.pot,
            onSave = { value -> runAction({ gameManager.setPot(value) }) { editingPot = false } },
            onDismiss = { editingPot = false }
        )
    }

    if (confirmNewGame) {
        ConfirmDialog(
            title = "Start a new game?",
            text = "Everyone goes back to ${state.startingChips} chips and the pot is emptied. " +
                "This game stays in history and can be resumed at any time.",
            confirmLabel = "New game",
            onConfirm = { runAction({ gameManager.newGame() }) {} },
            onDismiss = { confirmNewGame = false }
        )
    }
}

@Composable
private fun AppTitle(onOpenHistory: () -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = "♠ PokerChips",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Accent,
            modifier = Modifier.weight(1f)
        )
        IconButton(onClick = onOpenHistory) {
            Icon(Icons.Default.Restore, contentDescription = "Game history")
        }
    }
}

@Composable
private fun ServerStatusCard(running: Boolean, url: String?) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BgSecondary),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(if (running) AccentGreen else Accent)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    if (running) "Server Running" else "Server Stopped",
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 18.sp
                )
            }
            if (running && url != null) {
                Spacer(Modifier.height(12.dp))
                Text(url, color = Gold, fontSize = 16.sp, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(12.dp))
                val qrBitmap: Bitmap = remember(url) { QrCodeGenerator.generate(url, 400) }
                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        bitmap = qrBitmap.asImageBitmap(),
                        contentDescription = "QR Code to join game",
                        modifier = Modifier
                            .size(200.dp)
                            .clip(RoundedCornerShape(8.dp))
                    )
                }
                Spacer(Modifier.height(4.dp))
                Text(
                    "Scan with phone camera to join",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }
        }
    }
}

@Composable
private fun StartStopButton(running: Boolean, onStart: () -> Unit, onStop: () -> Unit) {
    Button(
        onClick = if (running) onStop else onStart,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (running) Accent else AccentGreen
        ),
        shape = RoundedCornerShape(16.dp)
    ) {
        Icon(
            if (running) Icons.Default.Stop else Icons.Default.PlayArrow,
            contentDescription = null
        )
        Spacer(Modifier.width(8.dp))
        Text(
            if (running) "Stop Server" else "Start Server",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun BlindsCard(small: Int, big: Int, onSelect: (Int, Int) -> Unit) {
    var custom by remember { mutableStateOf(false) }
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BgSecondary),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Blinds", fontWeight = FontWeight.Medium)
                Text("$small / $big", color = Gold, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                for ((sb, bb) in GameManager.BLIND_LEVELS) {
                    FilterChip(
                        selected = sb == small && bb == big,
                        onClick = { onSelect(sb, bb) },
                        label = { Text("$sb/$bb") },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = BgCard,
                            selectedLabelColor = Gold
                        )
                    )
                }
                FilterChip(selected = false, onClick = { custom = true }, label = { Text("Other…") })
            }
        }
    }
    if (custom) {
        CustomBlindsDialog(small, big, onSave = { sb, bb -> onSelect(sb, bb); custom = false }) { custom = false }
    }
}

@Composable
private fun CustomBlindsDialog(small: Int, big: Int, onSave: (Int, Int) -> Unit, onDismiss: () -> Unit) {
    var sb by rememberSaveable { mutableStateOf(small.toString()) }
    var bb by rememberSaveable { mutableStateOf(big.toString()) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Custom blinds") },
        text = {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                NumberField(sb, { sb = it }, "Small", Modifier.weight(1f))
                NumberField(bb, { bb = it }, "Big", Modifier.weight(1f))
            }
        },
        confirmButton = {
            TextButton(onClick = { onSave(sb.toIntOrNull() ?: 0, bb.toIntOrNull() ?: 0) }) { Text("Set") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}

@Composable
private fun StartingChipsSlider(currentValue: Int, bigBlind: Int, onValueChange: (Int) -> Unit) {
    // Local while dragging, committed on release: every committed value is a journal entry.
    var dragging by remember(currentValue) { mutableFloatStateOf(currentValue.toFloat()) }
    val shown = (dragging / 100).toInt() * 100
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = BgSecondary),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Starting Chips", fontWeight = FontWeight.Medium)
                Text("$shown (${shown / bigBlind} BB)", color = Gold, fontWeight = FontWeight.Bold)
            }
            Text("For new players and new games", color = TextSecondary, fontSize = 12.sp)
            Spacer(Modifier.height(8.dp))
            Slider(
                value = dragging,
                onValueChange = { dragging = it },
                onValueChangeFinished = { onValueChange(shown.coerceAtLeast(100)) },
                valueRange = 100f..10000f,
                steps = 98,
                colors = SliderDefaults.colors(
                    thumbColor = Gold,
                    activeTrackColor = Gold
                )
            )
        }
    }
}

@Composable
private fun PotDisplay(pot: Int, total: Int, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = BgCard),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier
                .padding(24.dp)
                .fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("POT", color = TextSecondary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
            Text(
                pot.toString(),
                color = Gold,
                fontSize = 48.sp,
                fontWeight = FontWeight.Bold
            )
            Text("$total chips on the table", color = TextSecondary, fontSize = 12.sp)
        }
    }
}

@Composable
private fun PlayerCard(name: String, chips: Int, bigBlind: Int, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = BgSecondary),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 14.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(name, fontWeight = FontWeight.Medium, fontSize = 16.sp)
            Column(horizontalAlignment = Alignment.End) {
                Text("$chips", color = Gold, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                Text("${chips / bigBlind} BB", color = TextSecondary, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun WideButton(label: String, icon: ImageVector, color: androidx.compose.ui.graphics.Color, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        colors = ButtonDefaults.buttonColors(containerColor = color),
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp)
    ) {
        Icon(icon, contentDescription = null)
        Spacer(Modifier.width(8.dp))
        Text(label)
    }
}

@Composable
private fun EditPlayerDialog(
    name: String,
    chips: Int,
    onSave: (Int) -> Unit,
    onRemove: () -> Unit,
    onDismiss: () -> Unit
) {
    var value by rememberSaveable(name) { mutableStateOf(chips.toString()) }
    var confirmRemove by remember { mutableStateOf(false) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(name) },
        text = {
            Column {
                NumberField(value, { value = it }, "Chips")
                Spacer(Modifier.height(8.dp))
                TextButton(onClick = { confirmRemove = true }) { Text("Remove player", color = Accent) }
            }
        },
        confirmButton = {
            TextButton(onClick = { value.toIntOrNull()?.let(onSave) }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
    if (confirmRemove) {
        ConfirmDialog(
            title = "Remove $name?",
            text = "Their $chips chips leave the table. This is recorded in the history and can be undone by restoring.",
            confirmLabel = "Remove",
            onConfirm = onRemove,
            onDismiss = { confirmRemove = false }
        )
    }
}

@Composable
private fun EditAmountDialog(title: String, initial: Int, onSave: (Int) -> Unit, onDismiss: () -> Unit) {
    var value by rememberSaveable { mutableStateOf(initial.toString()) }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = { NumberField(value, { value = it }, "Chips") },
        confirmButton = {
            TextButton(onClick = { value.toIntOrNull()?.let(onSave) }) { Text("Save") }
        },
        dismissButton = { TextButton(onClick = onDismiss) { Text("Cancel") } }
    )
}
