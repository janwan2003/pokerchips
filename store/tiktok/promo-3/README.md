# Promo 3: the voiced deadpan-to-screaming cut

`easypoker-voiced.mp4` is 1080×1920, 30 fps, 60.3 s, H.264 with AAC 48 kHz. **The only
audio is the voice, and there is no music in the file.** Attach a Commercial Music
Library track when posting (see promo 2's README: "Final Game Showdown", clip
`7462757141536884753`). TikTok ducks the music under the voice.

**Style:** in the genre of the 2012 Vytautas mineral water ads, but none of their lines.
Their jokes work through mechanics, and the script uses the same mechanics with our
own content: a dead-serious logic chain that ends somewhere stupid (clay → dirt →
caveman), fake research ("Numbers never run out. We checked. WE STOPPED AT FOUR MILLION!"), an absurd test subject (we gave it to a dog; the dog is up 40 chips; NOBODY KNOWS HOW), a list that
swerves into the hyper-specific (Marek's new girlfriend), a flat aside after a big
claim ("Probably. We did not test that."), and macho gatekeeping that deflates ("not
for everyone… FOR PEOPLE WITH A PHONE!").

Visually, deadpan lines are small plain text on a flat colour with nothing moving.
Shouted lines get the starburst, stamped capitals, a flash and camera shake.

## Voice

- **ElevenLabs:** voice "Xavier - Dominating, Metalic Announcer", model Eleven v4,
  stability 19 %, similarity 75 %. Generated 2026-11-12 on the owner's account (second script, take 1
  of 2). The transcriber heard "Marek" as "modick", so check the pronunciation by ear. The file is `work/voice.mp3`, and the full script with tags is below.
- **Licence:** the account was on ElevenLabs' **Free** plan, where the pricing page lists
  commercial use as "Limited use". The cheapest plan with a commercial licence is
  Starter ($6 a month, read 2026-11-12). **Upgrade before this runs as an ad or is
  promoted.**
- **Timing:** scene times come from word timestamps (`work/words.json`, faster-whisper
  `small.en`), so captions land on the spoken word.

Script as sent to ElevenLabs:

> [deadpan] Real poker chips are made of clay. [pause] Clay is dirt. [shouting] YOU ARE
> GAMBLING WITH DIRT! LIKE A CAVEMAN! [screaming] EASYPOKER!!! [shouting] CHIPS MADE OF
> NUMBERS! [calm] Numbers never run out. We checked. [shouting] WE STOPPED AT FOUR
> MILLION! [calm] It counts the pot for you. For your friends. For Marek. For Marek's new
> girlfriend, who does not know the rules... [shouting] AND NEVER WILL! ONE LINK!
> EVERYONE JOINS! NO APP! [calm] It is so simple, a dog can use it. [deadpan] We gave it
> to a dog. [pause] The dog is up forty chips. [shouting] NOBODY KNOWS HOW! [calm] It
> works on iPhone. It works on Android. It works on the phone you dropped in the lake in
> 2019. [deadpan] Probably. We did not test that. [shouting] ONE TAP! WHOLE POT!
> [screaming] THE WHOLE POT!!! [calm] EasyPoker is not for everyone. [shouting] IT IS FOR
> PEOPLE WITH A PHONE! [calm] EasyPoker dot C C. It's free. Why is it free? [screaming]
> DON'T ASK QUESTIONS!!!

## Caption

> real poker chips are made of clay. clay is dirt. think about it. 🃏 easypoker.cc
>
> #poker #pokernight #homegame #texasholdem #fyp

## Rebuild

`work/comp.html` (the `S` scene list, times in voice seconds) and `work/render.mjs`
reuse promo 1's recording (`rec/`). Then `node render.mjs video` renders the picture
and `ffmpeg -i video.mp4 -i voice.mp3 -map 0:v -map 1:a -c:a aac -ar 48000 …` adds
the voice. Length is 60 s. To shorten it, cut lines in ElevenLabs, re-run the
transcription, and re-time `S`.
