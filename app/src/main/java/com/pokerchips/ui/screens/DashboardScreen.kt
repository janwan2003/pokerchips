package com.pokerchips.ui.screens

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
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
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.SliderDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.pokerchips.model.GameState
import com.pokerchips.ui.theme.Accent
import com.pokerchips.ui.theme.AccentGreen
import com.pokerchips.ui.theme.BgCard
import com.pokerchips.ui.theme.BgSecondary
import com.pokerchips.ui.theme.Gold
import com.pokerchips.ui.theme.TextSecondary
import com.pokerchips.util.QrCodeGenerator
import kotlinx.coroutines.flow.StateFlow

@Composable
fun DashboardScreen(
    isRunning: StateFlow<Boolean>,
    serverUrl: StateFlow<String?>,
    gameState: StateFlow<GameState>,
    onStartServer: () -> Unit,
    onStopServer: () -> Unit,
    onResetGame: () -> Unit,
    onSetStartingChips: (Int) -> Unit
) {
    val running by isRunning.collectAsStateWithLifecycle()
    val url by serverUrl.collectAsStateWithLifecycle()
    val state by gameState.collectAsStateWithLifecycle()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { AppTitle() }
        item { ServerStatusCard(running, url) }
        item { StartStopButton(running, onStartServer, onStopServer) }

        if (!running || state.players.isEmpty()) {
            item { StartingChipsSlider(state.startingChips, onSetStartingChips) }
        }

        if (running) {
            item { PotDisplay(state.pot) }

            if (state.players.isNotEmpty()) {
                item {
                    Text(
                        "Players (${state.players.size})",
                        color = TextSecondary,
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
                items(state.players.values.toList(), key = { it.name }) { player ->
                    PlayerCard(player.name, player.chips)
                }
            }

            if (state.log.isNotEmpty()) {
                item {
                    Text("Recent Activity", color = TextSecondary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                }
                items(state.log.reversed().take(10)) { entry ->
                    Text(entry.message, color = TextSecondary, fontSize = 12.sp)
                }
            }

            item {
                Button(
                    onClick = onResetGame,
                    colors = ButtonDefaults.buttonColors(containerColor = BgCard),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Reset Game")
                }
            }
        }

        item { Spacer(Modifier.height(32.dp)) }
    }
}

@Composable
private fun AppTitle() {
    Text(
        text = "♠ PokerChips",
        fontSize = 28.sp,
        fontWeight = FontWeight.Bold,
        color = Accent
    )
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
private fun StartingChipsSlider(currentValue: Int, onValueChange: (Int) -> Unit) {
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
                Text("$currentValue", color = Gold, fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(8.dp))
            Slider(
                value = currentValue.toFloat(),
                onValueChange = { onValueChange(it.toInt()) },
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
private fun PotDisplay(pot: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
        }
    }
}

@Composable
private fun PlayerCard(name: String, chips: Int) {
    Card(
        modifier = Modifier.fillMaxWidth(),
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
            Text(
                "$chips chips",
                color = Gold,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp
            )
        }
    }
}
