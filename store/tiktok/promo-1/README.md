# Promo 1: "we always forget the poker chips"

`easypoker-promo-silent.mp4` is 1080×1920, 30 fps, 28.5 s, H.264, and has **no audio
stream on purpose**. It is the same lo-fi "person showing the tool" format as WeGoWhen's
reel: one real phone-sized session with plain first-person captions, no motion graphics
and no end card.

## Music: attach it at posting time, never bake it in

TikTok will only let you boost (Promote) a post whose audio comes from its **Commercial
Music Library** (CML). WeGoWhen's first reel had a CC BY track baked into the file, so
its Promote was rejected and it had to be posted again. So the file stays silent, and a
CML track is attached when posting:

- **Track:** "Lucky Thing (Lofi)" by Muspace Lofi. A 59 s clip covers the whole 28.5 s.
- **Ids:** clip `7177809413976918017` (pass this as `musicSoundId`). Track id and
  commercial music id are in the Zernio listing below.
- **Source:** `GET https://zernio.com/api/v1/accounts/<tiktok id>/tiktok/commercial-music`,
  read 2026-11-12 through WeGoWhen's TikTok connection, because EasyPoker's account
  is not connected yet. Re-list it on EasyPoker's account before posting: the library
  can differ by account or region.
- **Through Zernio:** in `tiktokSettings`, set `musicSoundInfo.musicSoundId` to the
  clip id and set `commercialContentType: "brand_organic"`.
- **In the TikTok app:** add sound, then open the "Commercial sounds" tab and search
  "Lucky Thing". Do not use the normal sound library, which is not cleared for ads.
- Other CML tracks that fit, from the same listing: "Dinner Table" (clip
  `7144133684730284034`), "Floating" (clip `7142916558829701122`, 27 s, slightly
  shorter than the video).

## Caption and pinned comment

Caption:

> we never have enough poker chips so i made every phone a chip stack 🃏 one link,
> everyone joins, the app keeps the pot
>
> #poker #pokernight #homegame #texasholdem #sideproject

Pinned comment:

> it's easypoker.cc, free and no sign up. what should i add next?

Cover: `cover.jpg` (the home page with the first caption).

## How it was made (re-runnable)

The pipeline is in `work/`. It needs `npm i playwright-core` and Playwright's Chromium,
plus a local `npx wrangler dev --port 8788` from `web/`. Production is never touched.

1. `node record.mjs` drives the real table page at 390×693 @3x through Chrome's
   screencast. Host "Ann" creates a table, copies the link, Tom, Kasia, Leo and Maya
   join and bet through the public API, Ann bets 3 BB and takes the whole pot (300).
   The invite link is shown as `easypoker.cc/…` instead of `127.0.0.1:8788/…`, so the
   QR code in the frame points at localhost; nobody can scan a phone screen in a video
   anyway.
2. `node render.mjs stills 1.5 7.5 21` renders check frames. `node render.mjs video`
   renders `video.mp4`. Captions and their screen positions are the `CAPS` list in
   `comp.html`. Each caption sits where it hides nothing that matters: the pot, the
   chips and the invite link stay visible.
