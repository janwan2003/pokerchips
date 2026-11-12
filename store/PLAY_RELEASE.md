# Releasing EasyPoker on Google Play

Everything that could be prepared without a Play Console account is done. This file is the
checklist for the rest, plus the text to paste into each Console form.

**App:** EasyPoker · package `cc.easypoker.app` · version 1.7 (versionCode 8) · targets Android 16 (API 36)
**Upload this:** `release/easypoker-play.aab` (signed with the upload key below)

Facts checked on 2026-11-12 against Google's help pages:
new apps must target API 36 ([target API page](https://support.google.com/googleplay/android-developer/answer/11926878));
personal accounts created after 13 Nov 2023 must run a closed test with **12 testers opted in for
14 days in a row** before production ([testing page](https://support.google.com/googleplay/android-developer/answer/14151465)).

## What is already done

| Item | Where |
|---|---|
| App bundle for Play, new package name, API 36 | `release/easypoker-play.aab` |
| Private upload key | `~/.config/easypoker/upload.jks` + `upload.properties` (outside git, mode 600) |
| App icon (adaptive, with themed-icon layer) | `app/src/main/res/mipmap-anydpi-v26/` |
| Store icon 512×512, feature graphic 1024×500 | `store/icon-512.png`, `store/feature-1024x500.png` |
| 4 phone screenshots, 1080×1920 | `store/screenshot-*.png` |
| Privacy policy (now covers the app) | https://easypoker.cc/privacy |
| Battery-optimisation permission removed from the Play build (Play restricts it) | `app/src/play/AndroidManifest.xml` |
| Foreground-service purpose declared in the manifest | `PROPERTY_SPECIAL_USE_FGS_SUBTYPE` in `AndroidManifest.xml` |
| App links for `cc.easypoker.app` | https://easypoker.cc/.well-known/assetlinks.json |
| History export / import (to move games from the old app) | History screen → Export / Import |

## What you need to do

1. **Back up the upload key now.** Copy `~/.config/easypoker/upload.jks` and the password
   from `~/.config/easypoker/upload.properties` into your password manager. If both are lost,
   Google can reset the upload key, but it takes days.
2. **Create the developer account** at https://play.google.com/console ($25 once, ID check).
   Choose a personal account unless you have a company.
3. **Create the app:** name "EasyPoker", default language English, type *App*, *Free*.
4. **Upload `release/easypoker-play.aab`** to a closed testing track. When asked about app
   signing, keep the default: **Google generates the app signing key**.
5. **Send me the app signing key's SHA-256** (Play Console → Test and release → App
   integrity → App signing). It has to go into `assetlinks.json`, or easypoker.cc links will
   open the browser instead of the Play app.
6. **Fill in the forms** below, add 12+ testers (their Google account emails), and keep them
   opted in for 14 days. Friends from the poker table are fine; they just install from the
   opt-in link.
7. **Apply for production** after the 14 days. Google asks a few questions about the test.
8. **Move your own history:** in the old PokerChips app (update it first with
   `release/pokerchips.apk`, version 1.7), History → Export. In the Play app,
   History → Import. Keep the old app installed until you have checked the games are there.

## Store listing

**App name** (30 max): `EasyPoker: Poker Chip Counter`

**Short description** (80 max):
`Poker chips on every phone. Track bets, pots and buy-ins for your home game.`

**Full description:**

```
Bring the cards — EasyPoker brings the chips.

Every player keeps their stack on their own phone. Bet, take from the pot, or take the whole pot with one tap, and every phone at the table updates at once. No chips to count, no paper, no arguments about who put in what.

THREE WAYS TO PLAY
• Host on this phone: everyone on the same Wi-Fi joins by scanning a QR code. No internet needed, and the whole game history stays on your phone.
• Host online: open a table on easypoker.cc and players join from anywhere, in the app or in any browser.
• Join a game: scan the host's QR code or type the table code.

BUILT FOR A REAL HOME GAME
• Blinds like a real table, from 1/2 to 1000/2000 or your own, with quick bet buttons sized from them.
• Buy-ins: let players rebuy, and see who is up or down against everything they put in.
• The host can correct any stack or the pot, and remove players.
• Every action is saved as it happens. A crash or a dead battery loses nothing.
• Full history: rewind any game to any earlier moment, resume old games, and export your history to a file.

No accounts, no ads. EasyPoker only counts chips: there is no real money, betting or gambling in the app.
```

**Category:** Entertainment · **Tags:** Poker, Card games (pick what the Console offers)
**Contact email:** your choice (shown publicly) · **Website:** https://easypoker.cc
**Privacy policy:** https://easypoker.cc/privacy
**Graphics:** `store/icon-512.png`, `store/feature-1024x500.png`, `store/screenshot-1…4.png`

## App content forms

**Ads:** No ads.

**App access:** All functionality is available without special access (no login).

**Target audience:** 18 and over. (A poker theme aimed at younger users pulls in the
Families policy; there is no reason to.)

**Content rating (IARC questionnaire):** category *Utility, Productivity, Communication, or
Other*. Violence, sexuality, language, drugs: none. **Gambling:** no real-money gambling, no
simulated gambling (the app tracks chips for a card game played with real cards; it deals no
cards and has no chance element). **User interaction:** yes — players see each other's
chosen names at a table. Shares location: no. Digital purchases: no.

**Data safety** (what the Play build actually does):

| Question | Answer |
|---|---|
| Collects or shares user data? | Yes, collects (online tables and site statistics). Shares: **no** (Cloudflare is a service provider, which Play does not count as sharing). |
| Encrypted in transit? | Yes (online tables use HTTPS; games hosted on the phone never reach us). |
| Users can request deletion? | No accounts are created; answer that there is no account and data is tied to a table code. |
| **Personal info → Name** | Collected · optional (a nickname works) · purpose: App functionality · not processed ephemerally |
| **App activity → App interactions** | Collected · purpose: App functionality, Analytics (bets and other table actions, page views) |
| **Location → Approximate location** | Collected · purpose: Analytics (country/region/city that Cloudflare derives from the connection; no IP stored) |
| **Device or other IDs** | Not collected (a daily-changing hash, no persistent ID) |
| Camera / photos | Not collected (camera is only for scanning QR codes; nothing saved or sent) |

**Foreground service declaration** (Console → App content → Foreground service permissions):
type *Special use*. Description: "When the user taps Start server, the app runs a small web
server on the phone so other players on the same Wi-Fi can follow and play the game in their
browsers while the host's screen is off. It stops when the user taps Stop." Google may ask for
a short video: record Start server → a second phone joining → screen off → a bet still arriving.

**Financial features / health / news / government:** none.

## If something is rejected

- *Gambling policy*: point to the description line "no real money, betting or gambling" and
  the fact that it deals no cards.
- *Foreground service*: if "special use" is refused, the fallback is `dataSync`-style wording
  or dropping keep-alive in the Play build; ask before changing behaviour.
- *Name / impersonation*: "EasyPoker" is our own name and domain; no other brand is used.

## Rebuilding

```bash
export JAVA_HOME=~/.local/share/mise/installs/java/temurin-21.0.13+9.0.LTS   # needs jlink
./gradlew testLegacyDebugUnitTest assembleLegacyRelease bundlePlayRelease
cp app/build/outputs/bundle/playRelease/app-play-release.aab release/easypoker-play.aab
cp app/build/outputs/apk/legacy/release/app-legacy-release.apk release/pokerchips.apk
```

Every Play upload needs a higher `versionCode` than the last one. Store graphics are rendered
by `store/render-assets.mjs` against a local `wrangler dev` (see its header).
