# Promo 2: the loud cut

`easypoker-loud-silent.mp4` is 1080×1920, 30 fps, 16 s, H.264, with **no audio stream**,
for the same reason as promo 1: music is attached at posting time from TikTok's
Commercial Music Library. Otherwise the post can never be promoted.

**Style:** absurd, over-the-top "miracle product" advertising, in the genre of the
2012 Vytautas mineral water ads by Tadas Vidmantas. Every claim is shouted. Spinning
starburst backgrounds in saturated colours, all-caps italic text stamped in with white
flashes and camera shake, and the real app screens slammed, spun and pushed into
frame. It imitates the genre only. No footage, lines or branding come from those ads.

## Beats

| s | Text | Screen |
|---|---|---|
| 0.0 | FORGOT THE CHIPS?! | red burst, no phone |
| 1.7 | EASYPOKER! | home page slams down |
| 3.5 | ONE LINK! EVERYONE JOINS! | invite QR slides in |
| 5.4 | NO APP! NO SIGN-UP! NO MERCY! | players list fills up |
| 7.4 | IT COUNTS THE POT! NO ARGUING!! | pot counts 0 → 300 live |
| 9.6 | TAKE WHOLE POT! ONE TAP!!! | the tap, chips jump to 1,240 |
| 11.6 | WORKS ON EVERY PHONE / EVEN GRANDMA'S | phone spins in |
| 13.2 | EASYPOKER.CC FREE! FREE!! FREE!!! | the chip logo spins |

## Sound

- **Music, Commercial Music Library:** "Final Game Showdown" by ProdByLucK, clip
  `7462757141536884753` (59 s, so it covers the whole cut). Alternatives from the same
  listing: "Big Boo Party! (Dance Your Life Away)" (clip `7144252540467546113`) and
  "theclubrock" (clip `7539344381936011280`). The listing was read on 2026-11-12
  through WeGoWhen's Zernio connection. Re-check it on @easypoker.cc before posting.
- **Voice:** this genre lives on a narrator shouting every line. Either record yourself
  reading the "Text" column too loudly, or use TikTok's text-to-speech on the captions.
  A voice you record yourself is original audio and does not block promotion. Only
  non-commercial *music* does.

## Caption

> FORGOT THE CHIPS?! 🃏 EasyPoker turns every phone into a chip stack. One link. No app.
> NO MERCY. easypoker.cc
>
> #poker #pokernight #homegame #texasholdem #fyp

Cover: `cover.jpg`.

## Rebuild

`work/comp.html` holds the scenes (the `SCENES` table) and `work/render.mjs` renders
them. They reuse promo 1's recording: run promo 1's `record.mjs` to get `rec/`, put
`icon.png` next to it, then `node render.mjs stills 0.8 8.8` and `node render.mjs video`.
