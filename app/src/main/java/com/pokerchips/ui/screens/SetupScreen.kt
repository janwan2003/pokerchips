package com.pokerchips.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pokerchips.game.GameManager
import com.pokerchips.model.GameState
import com.pokerchips.ui.theme.AccentGreen
import com.pokerchips.ui.theme.Gold
import com.pokerchips.ui.theme.TextSecondary

private data class SetupRow(val name: String, val chips: String)

/**
 * Type in what is actually on the table and start a new game from it. Pre-filled with
 * the current game, so after a glitch only the wrong numbers need changing.
 */
@Composable
fun SetupScreen(
    gameManager: GameManager,
    current: GameState,
    runAction: ActionRunner,
    onBack: () -> Unit,
    onStarted: () -> Unit
) {
    val rows = remember {
        mutableStateListOf<SetupRow>().apply {
            current.players.values.forEach { add(SetupRow(it.name, it.chips.toString())) }
            if (isEmpty()) add(SetupRow("", current.startingChips.toString()))
        }
    }
    var pot by remember { mutableStateOf(current.pot.toString()) }
    var small by remember { mutableStateOf(current.smallBlind.toString()) }
    var big by remember { mutableStateOf(current.bigBlind.toString()) }
    var confirm by remember { mutableStateOf(false) }

    val total = rows.sumOf { it.chips.toIntOrNull() ?: 0 } + (pot.toIntOrNull() ?: 0)

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp)
            .imePadding(),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
                Text("Start from custom state", fontSize = 22.sp, fontWeight = FontWeight.Bold)
            }
        }
        item {
            Text(
                "Enter how many chips each player has right now. This starts a new game; the current " +
                    "one stays in history. Players rejoin from their phones with the same name.",
                color = TextSecondary,
                fontSize = 13.sp
            )
        }
        itemsIndexed(rows) { index, row ->
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = row.name,
                    onValueChange = { rows[index] = row.copy(name = it.take(GameManager.MAX_NAME_LENGTH)) },
                    label = { Text("Name") },
                    singleLine = true,
                    modifier = Modifier.weight(1.4f)
                )
                NumberField(row.chips, { rows[index] = row.copy(chips = it) }, "Chips", Modifier.weight(1f))
                IconButton(onClick = { rows.removeAt(index) }) {
                    Icon(Icons.Default.Close, contentDescription = "Remove ${row.name}")
                }
            }
        }
        item {
            TextButton(onClick = { rows.add(SetupRow("", current.startingChips.toString())) }) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(Modifier.width(4.dp))
                Text("Add player")
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                NumberField(pot, { pot = it }, "Pot", Modifier.weight(1f))
                NumberField(small, { small = it }, "Small blind", Modifier.weight(1f))
                NumberField(big, { big = it }, "Big blind", Modifier.weight(1f))
            }
        }
        item { Text("$total chips on the table", color = Gold, fontWeight = FontWeight.Medium) }
        item {
            Button(
                onClick = { confirm = true },
                colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(52.dp),
                shape = RoundedCornerShape(12.dp)
            ) { Text("Start game from this state", fontWeight = FontWeight.SemiBold) }
        }
        item { Spacer(Modifier.height(48.dp)) }
    }

    if (confirm) {
        ConfirmDialog(
            title = "Start this game?",
            text = "${rows.size} players, pot ${pot.ifEmpty { "0" }}, blinds ${small.ifEmpty { "?" }}/${big.ifEmpty { "?" }}.",
            confirmLabel = "Start",
            onConfirm = {
                val players = rows.map { it.name to (it.chips.toIntOrNull() ?: 0) }
                runAction(
                    { gameManager.startFromState(players, pot.toIntOrNull() ?: 0, small.toIntOrNull() ?: 0, big.toIntOrNull() ?: 0) },
                    onStarted
                )
            },
            onDismiss = { confirm = false }
        )
    }
}

