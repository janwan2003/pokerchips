package com.pokerchips

import android.app.Application
import com.pokerchips.game.GameManager
import com.pokerchips.game.GameStore
import java.io.File

class PokerChipsApplication : Application() {

    /**
     * One game for the whole process, independent of the server service's lifetime, and
     * loaded back from disk on start so a crash or a force-stop resumes where it was.
     */
    val gameManager: GameManager by lazy {
        GameManager(GameStore(File(filesDir, "games")))
    }
}
