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

Gradle 8.9 cannot run on JDK 25 (fails with just the version string `25.0.x` as the error);
use JDK 21, e.g. `export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64`.

Two flavors (since 1.7): **legacy** = the sideloaded `com.pokerchips` "PokerChips" signed with
`keystore/` (keeps updating owners' phones in place), and **play** = `cc.easypoker.app`
"EasyPoker" for Google Play (`com.pokerchips` is taken there), signed with the private upload
key in `~/.config/easypoker/` (never in git). History moves between them with Export/Import.
Release steps and Console answers: `store/PLAY_RELEASE.md`.

```bash
./gradlew testLegacyDebugUnitTest assembleLegacyRelease bundlePlayRelease
cp app/build/outputs/apk/legacy/release/app-legacy-release.apk release/pokerchips.apk
cp app/build/outputs/bundle/playRelease/app-play-release.aab release/easypoker-play.aab
~/android-sdk/build-tools/35.0.0/apksigner verify --print-certs release/pokerchips.apk
```

compileSdk/targetSdk 36 need a JDK **with `jlink`**: the distro `java-21-openjdk` here is
JRE-only. Use `JAVA_HOME=~/.local/share/mise/installs/java/temurin-21.0.13+9.0.LTS`.

Gradle here cannot run on JDK 25 (it fails with just `What went wrong: 25.0.x`). On the
owner's machine the default `java` is 25, so prefix every Gradle command with the JDK 21
`JAVA_HOME` above.

The legacy APK's signer must be `CN=PokerChips`, SHA-256
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

## Web version (easypoker.cc)

`web/` is a separate, browser-only version: a Cloudflare Worker plus one Durable Object
per table (see `web/README.md`). It shares no code with the app; `web/src/game.js` is a
port of `GameManager.kt`, so a rule change in one should be mirrored in the other.

- Deploy with `cd web && npm test && npx wrangler deploy` (wrangler is logged in via
  OAuth on the owner's machine). Changing only `web/` needs no APK rebuild.
- Same history rule: table journals live in Durable Object SQLite. Never delete the
  `v1` migration or rename the `Room` class, and only add journal fields with defaults.
- The players' game view must stay identical to the app's player client:
  `web/public/css/game.css` is a verbatim copy of `assets/web/css/style.css`, and
  `web/public/table.html` embeds the app's join/game markup verbatim (`web/test/parity.test.js`
  fails if they drift — re-copy). Host features live in a separate Host tab styled by
  `web/public/css/site.css` (all `ep-` prefixed).
- SEO pages (`/guides/*`, `/about`, `/privacy`, `sitemap.xml`, `llms.txt`, `llms-full.txt`)
  are generated: edit `web/guides/pages.mjs` or `web/guides/pages-more.mjs` (the
  question-style pages written for AI answers), run `npm run guides`; `test/guides.test.js` fails if the output
  is stale. The home page only links to them from a small footer below the fold — keep
  the home page itself focused on hosting/joining. Table pages are `noindex`.
- Analytics: the Worker entry is `web/src/main.js`, which wraps `src/index.js`, writes
  Analytics Engine rows (dataset `easypoker_events`) and injects the Cloudflare Web
  Analytics beacon. Keep `wrangler.jsonc` `main` pointing at it, only append columns, and
  keep `guides/pages.mjs`'s privacy text in step with what is collected. See `web/README.md`.
- End-to-end check: `npx wrangler dev`, then drive two Playwright browser contexts
  (host + player) against it.

## Layout

- `game/GameManager.kt` — all game rules; every change goes through `record()`, which
  appends a full snapshot to the journal. `game/GameStore.kt` — the append-only files.
- `server/` — Ktor on port 8080: REST for actions, a WebSocket that broadcasts state.
- `assets/web/` — the players' browser client (plain JS, no build step).
- `ui/screens/` — the host's Compose screens: dashboard, history, custom-state setup.
- Unit tests in `app/src/test` are plain JVM (no Android needed). `server/WebSocketTest`
  boots the real Ktor server on a free port and talks to `/ws` with the Ktor client.
- Keep-alive: the host service holds a partial wake lock and a Wi-Fi lock while serving,
  and asks for a battery-optimisation exemption; the web client pings `/ws` every 10 s
  and reconnects after 25 s of silence or when the tab becomes visible again.

The host Compose screens have never been run on an emulator here (no KVM). The web
client can be checked: boot `PokerServer` from a throwaway JVM test pointing at
`src/main/assets/web` and drive it with Playwright (`/opt/node22/lib/node_modules/playwright`).
