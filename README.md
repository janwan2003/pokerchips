# PokerChips

Poker chips on phones. One Android phone hosts the game (this app); everyone else scans
the QR code and plays in the browser on the same Wi-Fi.

**Install:** download [`release/pokerchips.apk`](release/pokerchips.apk) on the host phone.

## What it does

- **Blinds like a real table** — 10/20 by default, presets from 1/2 to 1000/2000 or any
  custom level. Players' quick buttons are sized from them: SB, BB, 2/3/5 BB, ½ pot, pot,
  all-in, and − / + step by one small blind.
- **Every action is saved on the host phone as it happens** (`files/games/<id>.jsonl`,
  append-only, one full snapshot of chips, pot and blinds per line). If the app crashes
  or the phone dies, reopening it brings the game back as it was. A torn last line is
  skipped, so at worst the single action being written is lost.
- **Game history & restore** — every past game is listed; open one to resume it, or tap
  any entry to rewind to that moment. A rewind is itself recorded, so it can be undone.
  "Share" sends the balances and full log as text (e.g. to a chat) as an off-phone copy.
- **Start from custom state** — type in everyone's chips, the pot and the blinds and
  start a new game from there. Pre-filled with the current game. Players rejoin with the
  same name (case does not matter) and get the typed-in balance.
- **Host corrections** — tap a player to set their chips or remove them; tap the pot to
  correct it. All recorded in the history.

Nothing ever deletes a game. Uninstalling the app does, so updates must be installed
over the old version: every build is signed with the key in `keystore/`, which is what
makes that possible.

## Build

```bash
./gradlew testDebugUnitTest assembleRelease
cp app/build/outputs/apk/release/app-release.apk release/pokerchips.apk
```

Needs JDK 17+ and an Android SDK with platform 35 (`local.properties`: `sdk.dir=...`).
