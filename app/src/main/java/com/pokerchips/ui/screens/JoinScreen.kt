package com.pokerchips.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.journeyapps.barcodescanner.ScanContract
import com.journeyapps.barcodescanner.ScanOptions
import androidx.activity.compose.rememberLauncherForActivityResult
import com.pokerchips.ui.theme.Accent
import com.pokerchips.ui.theme.AccentGreen
import com.pokerchips.ui.theme.BgPrimary
import com.pokerchips.ui.theme.TextSecondary
import com.pokerchips.util.JoinTarget

/** Join a game in the app: scan the host's QR code, or type a code or link. */
@Composable
fun JoinScreen(onBack: () -> Unit, onOpen: (url: String) -> Unit) {
    var input by rememberSaveable { mutableStateOf("") }
    var error by rememberSaveable { mutableStateOf<String?>(null) }

    fun submit(text: String) {
        val url = JoinTarget.parse(text)
        if (url == null) {
            error = "That is not a table code or a game link."
        } else {
            error = null
            onOpen(url)
        }
    }

    val scanner = rememberLauncherForActivityResult(ScanContract()) { result ->
        val scanned = result.contents ?: return@rememberLauncherForActivityResult
        input = scanned
        submit(scanned)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(BgPrimary)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = onBack) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back") }
            Text("Join a game", fontSize = 22.sp, fontWeight = FontWeight.Bold)
        }

        Button(
            onClick = {
                scanner.launch(
                    ScanOptions()
                        .setDesiredBarcodeFormats(ScanOptions.QR_CODE)
                        .setPrompt("Point at the QR code on the host's screen")
                        .setBeepEnabled(false)
                        .setOrientationLocked(false)
                )
            },
            colors = ButtonDefaults.buttonColors(containerColor = Accent),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth().height(64.dp)
        ) {
            Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(26.dp))
            Spacer(Modifier.size(10.dp))
            Text("Scan QR code", fontSize = 18.sp, fontWeight = FontWeight.Bold)
        }

        Text("or type the table code", color = TextSecondary, fontSize = 14.sp, modifier = Modifier.align(Alignment.CenterHorizontally))

        OutlinedTextField(
            value = input,
            onValueChange = { input = it.take(200); error = null },
            label = { Text("Code or link, e.g. KAA29S") },
            singleLine = true,
            isError = error != null,
            supportingText = error?.let { { Text(it) } },
            keyboardOptions = KeyboardOptions(
                capitalization = KeyboardCapitalization.Characters,
                autoCorrectEnabled = false,
                imeAction = ImeAction.Go
            ),
            keyboardActions = KeyboardActions(onGo = { submit(input) }),
            modifier = Modifier.fillMaxWidth()
        )

        Button(
            onClick = { submit(input) },
            enabled = input.isNotBlank(),
            colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
            shape = RoundedCornerShape(14.dp),
            modifier = Modifier.fillMaxWidth().height(54.dp)
        ) { Text("Join", fontSize = 17.sp, fontWeight = FontWeight.Bold) }

        Spacer(Modifier.height(8.dp))
        Text(
            "Online tables (easypoker.cc) work from anywhere. A game hosted on another phone " +
                "needs you on the same Wi-Fi — scan the QR code on its screen.",
            color = TextSecondary,
            fontSize = 13.sp,
            lineHeight = 18.sp
        )
    }
}
