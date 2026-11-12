package com.pokerchips.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.res.stringResource
import com.pokerchips.R
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.pokerchips.ui.theme.Accent
import com.pokerchips.ui.theme.AccentGreen
import com.pokerchips.ui.theme.BgCard
import com.pokerchips.ui.theme.BgPrimary
import com.pokerchips.ui.theme.BgSecondary
import com.pokerchips.ui.theme.Gold
import com.pokerchips.ui.theme.TextSecondary

/** The first screen: host on this phone, host online, or join someone else's game. */
@Composable
fun HomeScreen(
    serverRunning: Boolean,
    lastOnlineTable: String?,
    onHostHere: () -> Unit,
    onHostOnline: () -> Unit,
    onJoin: () -> Unit,
    onReopenTable: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 28.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text("♠ " + stringResource(R.string.app_name), color = Accent, fontSize = 32.sp, fontWeight = FontWeight.Bold)
        Text("Chips on everyone's phone.", color = TextSecondary, fontSize = 16.sp)
        Spacer(Modifier.height(10.dp))

        Choice(
            icon = Icons.Default.Wifi,
            tint = AccentGreen,
            title = "Host on this phone",
            text = if (serverRunning) "Your game is running. Players on this Wi-Fi join by QR code."
            else "Everyone on the same Wi-Fi. No internet needed; history stays on this phone.",
            badge = if (serverRunning) "Running" else null,
            onClick = onHostHere
        )
        Choice(
            icon = Icons.Default.Public,
            tint = Gold,
            title = "Host online",
            text = "A table on easypoker.cc. Players join from anywhere, in the app or a browser.",
            onClick = onHostOnline
        )
        Choice(
            icon = Icons.Default.QrCodeScanner,
            tint = Accent,
            title = "Join a game",
            text = "Scan the host's QR code, or type the table code.",
            onClick = onJoin
        )

        if (lastOnlineTable != null) {
            Spacer(Modifier.height(4.dp))
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(12.dp))
                    .clickable { onReopenTable(lastOnlineTable) }
                    .padding(vertical = 12.dp, horizontal = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(Modifier.weight(1f)) {
                    Text("Back to table $lastOnlineTable", fontWeight = FontWeight.SemiBold)
                    Text("The last online table you opened", color = TextSecondary, fontSize = 13.sp)
                }
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = TextSecondary)
            }
        }
    }
}

@Composable
private fun Choice(
    icon: ImageVector,
    tint: Color,
    title: String,
    text: String,
    onClick: () -> Unit,
    badge: String? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(18.dp))
            .background(BgSecondary)
            .clickable(onClick = onClick)
            .padding(18.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(BgCard),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(26.dp))
        }
        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                if (badge != null) {
                    Text(
                        badge,
                        color = BgPrimary,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        modifier = Modifier
                            .clip(RoundedCornerShape(50))
                            .background(AccentGreen)
                            .padding(horizontal = 8.dp, vertical = 2.dp)
                    )
                }
            }
            Text(text, color = TextSecondary, fontSize = 14.sp, lineHeight = 19.sp)
        }
    }
}
