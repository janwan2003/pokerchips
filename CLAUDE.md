# PokerChips — working notes

This repo is maintained by AI. The owner uses the app; they do not review diffs.

## Rules — the owner's standing instructions

- **Always push straight to `main`.** No pull requests, no waiting for approval.
- **Always build the app before pushing.** Every change that touches the app ships with
  a fresh `release/pokerchips.apk` in the same commit, so `main` always carries an APK
  that matches its source. Bump `versionCode` (and `versionName`) in
  `app/build.gradle.kts` each time, or Android refuses the install as a downgrade/same
  version.
- **Run the unit tests before pushing.** No CI exists; `testDebugUnitTest` is the only gate.
- **Never lose game history.** It lives on the host phone in `files/games/*.jsonl` and
  is the most valuable thing the app has. So:
  - never change the signing key in `keystore/` — a different key forces an uninstall,
    and uninstalling deletes the history;
  - never make a journal format change that cannot read existing files (add fields with
    defaults; `ignoreUnknownKeys` is on);
  - nothing in the app deletes a game, and nothing should start to.
- Also send the APK to the owner (SendUserFile) when a session has that tool.

## Build

```bash
./gradlew testDebugUnitTest assembleRelease
cp app/build/outputs/apk/release/app-release.apk release/pokerchips.apk
~/android-sdk/build-tools/35.0.0/apksigner verify --print-certs release/pokerchips.apk
```

The signer must be `CN=PokerChips`, SHA-256
`78c45875d1d1c5a54c0cf1c00f464c16c3e8ade58414a7af0dd0e6bbd0f3d617`.

In a fresh cloud container there is no Android SDK. What worked on 2026-09-28:

- Download `commandlinetools-linux-11076708_latest.zip` from `dl.google.com`, unpack to
  `~/android-sdk/cmdline-tools/latest`, accept licences, install
  `platforms;android-35`, `build-tools;35.0.0`, `platform-tools`; write
  `sdk.dir=...` to `local.properties` (gitignored).
- `repo.maven.apache.org` answered **429** to every burst. `repo1.maven.org` works, but
  also 429s under parallel load. A `~/.gradle/init.d` script rewriting the central URL
  to `repo1.maven.org`, plus `--max-workers=1` and a retry loop, got the dependency cache
  filled on the third attempt. After that, `--offline` builds are fine.

## Layout

- `game/GameManager.kt` — all game rules; every change goes through `record()`, which
  appends a full snapshot to the journal. `game/GameStore.kt` — the append-only files.
- `server/` — Ktor on port 8080: REST for actions, a WebSocket that broadcasts state.
- `assets/web/` — the players' browser client (plain JS, no build step).
- `ui/screens/` — the host's Compose screens: dashboard, history, custom-state setup.
- Unit tests in `app/src/test` are plain JVM (no Android needed).

The host Compose screens have never been run on an emulator here (no KVM). The web
client can be checked: boot `PokerServer` from a throwaway JVM test pointing at
`src/main/assets/web` and drive it with Playwright (`/opt/node22/lib/node_modules/playwright`).
