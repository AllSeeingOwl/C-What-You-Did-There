# Side C design spec

Last updated 22 November 2026

The rules and building blocks behind every Side C screen. When a mockup and this spec disagree, this spec wins.

## The concept

A Side C tape is a set of instructions for a mixtape, never the clips themselves. A creator picks short moments from radio, TV, film, video and podcasts, puts them in order with notes and in-between instructions, and publishes the instructions. Collectors hunt down each piece from official sources over days or weeks, then play the whole tape back and read the creator's notes: the reveal, where they "see what you did there".

## Names

| Use | Name |
| --- | --- |
| Main name | **Side C** (the secret third side of a cassette) |
| Full lockup | **Side C** *(What You Did There)*, with the bracketed words smaller and lighter |
| Backup name | **C What You Did There**, used as this repo's name. CWYDT is fan shorthand only, never the official name |

## Slot types and lane colours

Each slot sits in a lane, like a track in an editing suite. Block width (or height on a phone) matches running time.

| Slot type | Colour | Hex |
| --- | --- | --- |
| Radio | Amber | `#E9A23B` |
| TV | Blue | `#4C8DF6` |
| Film | Red | `#F06A6E` |
| YouTube and other video | Green | `#3DBE7A` |
| Podcast | Purple | `#A68BF5` |
| In-between (things you do in the room) | Grey | `#A7ABB3` |
| Interference | Split block: picture colour on top, sound colour underneath | — |

## Slot states

| State | Look |
| --- | --- |
| Collected | Solid colour |
| Still to find | Hatched, with a dashed outline in the lane colour |
| Locked | Dark grey with a grey dashed outline; unlocks when an earlier slot is collected |
| Mystery | Marked "?": a clue instead of an exact timestamp, so every collector's tape is a little different |

Each slot also has a rarity: Common, Uncommon, Rare, or "You" for do-it-yourself slots.

## Tape lengths

Tiers are named after real cassette lengths.

| Tier | Running time | Slots |
| --- | --- | --- |
| C5 | 2 to 5 minutes | 3 to 6 |
| C15 | 5 to 15 minutes | up to 12 |
| C30 | 15 to 30 minutes | up to 20 |

- **Close enough:** a tape counts if it lands within 10% either side of its tier (a C15 can run 4:30 to 16:30). Flow matters more than the stopwatch.
- **Minimum:** 3 slots per tape.
- A C60 tier could come later for events or collaborative tapes.

## Slot lengths

| Slot type | Shortest | Longest |
| --- | --- | --- |
| Clip | 5 seconds | 2 minutes (most work best under 1) |
| In-between | 3 seconds | 1 minute |
| Interference | 10 seconds | 45 seconds |

## Fallbacks

Every slot can carry up to three fallbacks, alternatives for when a source is hard to find, region-locked or gone. A fallback counts as collected, and a few seconds longer or shorter is fine.

## Interference

An optional slot where a muted picture from one source plays under sound from another.

- **Modes:** *Clash* (picture and sound fight each other) or *Uncanny merge* (they almost fit, which is what makes it unsettling).
- **Sync cue:** tells the collector when to start the sound, e.g. "the moment the singer first smiles at the camera".
- **Limits:** 10 to 45 seconds, at most two per tape.
- **Labelling:** any tape with Interference shows "contains an unsettling interlude".
- **Rule:** unsettling through the pairing, never graphic, violent or flashing.

## Regions

- Each slot is marked with where it's available: Worldwide, or one or more countries.
- A tape is **Worldwide** only if every slot, or one of its fallbacks, works anywhere.
- Otherwise it shows its best region, e.g. "Best in the UK · 9 of 12 slots worldwide".
- Collectors set where they're collecting from. Tapes not fully available there are dimmed and flagged.

| Region badge | Look |
| --- | --- |
| Worldwide | Green, globe icon |
| Regional, works where you are | Blue, pin icon |
| Regional, doesn't work where you are | Grey, pin icon |

## Vibes

Creators pick up to three vibes, shown with a small wave icon so they're never confused with media colours or other tags.

Tranquil · Dreamy · Cosy · Nostalgic · Melancholy · Hopeful · Joyful · Funny · Strange · Eerie · Tense · Frantic · Chaotic · Experimental

An optional **vibe arc** sets how the mood moves: Starts → Middle → Ends, e.g. Tranquil → Strange → Hopeful. "Theme" is separate, for what a tape is about (e.g. "weather, rain, staying in").

## Handwriting

Anything in the creator's own voice is handwritten, like a real cassette. Everything functional stays in the interface typeface.

| Style | Font | Used for |
| --- | --- | --- |
| Marker | Permanent Marker | Tape titles on J-cards and shelf spines |
| Neat hand | Patrick Hand | Track lists, liner notes, creator notes, the reveal, "by [creator]" |
| Interface | Inter, Space Grotesk headings, JetBrains Mono for times | Buttons, labels, timings, instructions, filters |

- Handwritten text is set larger than regular text to stay readable.
- Collectors can switch to **plain text** in settings (offered during sign-up).

## Sync tapes (proposed)

**Status: a proposal for testing, not yet in the app.** Nothing here changes the rules for normal tapes. The sample [*Last Train Out*](sample-tape-last-train-out.md) tests it.

A sync tape is a set of instructions for a home-made music video. One song plays from start to finish as the soundtrack, and the collector cuts muted clips over it, picked so the pictures "explain" the song, often far too literally. It is Interference stretched across a whole tape: picture from one place, sound from another.

### The song

- Exactly one song per tape, played once with the sound on, from an official source: the artist's own channel, a streaming service, radio catch-up or a copy the collector owns.
- **Fixed song:** the creator names the song and the exact version (for example "album version, 3:34"), because a radio edit or live version moves every timestamp. A fallback for the song must be the same recording from another official source.
- **Open song:** the creator gives a brief instead ("any song about leaving, 2:30 to 4:30, with at least two choruses"), and every collector's video is different. This is the sync version of a mystery slot.
- Song length 1:30 to 6:00. Sync tapes don't use the C5/C15/C30 tiers; they show as "Sync · 3:34" (or "Sync · open song").

### Lyrics: never quoted

Lyrics are never written into a tape, not even a single line. Cues point to the moment, and the creator describes what the line is doing in their own words, like this:

- **Allowed:** "0:42, first chorus: the singer says they're done waiting"
- **Allowed:** "the key word of your chorus"
- **Not allowed:** a direct quote, even a short one

Collectors hear the words in the song itself. The write-a-tape checklist asks creators to confirm there are no lyrics.

### Scenes

Each scene is a muted clip (or an in-room action) shown while part of the song plays.

| Rule | Limit |
| --- | --- |
| Scenes per tape | 3 to 24 |
| Scene length | 4 seconds to 1 minute (8 to 20 seconds works best when switching by hand) |
| In-room scenes | Up to 3 (for example "turn the lights off for the bridge"). The song never stops |
| Repeats | None. Every scene is a different clip, so a returning chorus gets a new clip, not the old one again |

- **Cues:** *timed* cues use the song's clock ("0:42") and need a fixed song. *Section* cues use the song's structure ("Chorus 2") and work for open songs. Before playback, collectors note the time each section starts, which turns a section cue sheet into a timed one.
- **Scene modes**, shown on each scene so collectors know what they're hunting for:
  - **Literal:** the picture acts out the words
  - **Mood:** the picture matches the feeling
  - **Clash:** the picture fights the song
- **Every scene needs a medium and a style**, shown on the scene, so collectors and the variety rules below can see them.
  - **Mediums:** Film, TV, Online video, In the room.
  - **Styles:** Drama (acted, live-action fiction), Animation, or Real life (documentary, news, nature, real footage).
- Scenes play back to back; if a clip runs short, hold its last frame until the next cue.
- Fallbacks (up to three per scene), slot states, rarity and the reveal work as for normal tapes. Regions follow the usual rule, with the song counting as a slot.

### Variety

A sync tape should pull its pictures from all over the place: the jokes come from the mix. A video made entirely from one cartoon series, or entirely from one kind of film, gets stale fast, however well it fits the song.

| Rule | Limit |
| --- | --- |
| Same clip | Never twice in one tape |
| Same source | At most 2 scenes from the same film, programme, series or channel |
| Mediums | At least 2 different mediums, and no medium in more than half the found scenes (rounded up) |
| Styles | At least 2 different styles, and no style in more than half the found scenes (rounded up) |

- "Found scenes" means scenes collectors have to hunt down. In-room scenes don't count towards the limits.
- Example: a 9-scene tape can have at most 5 animated scenes and at most 5 TV scenes, and no more than 2 from any one series.
- **Open scenes** ("any clip that acts out your chorus's key word") are checked when the collector records a find. The app asks for its medium, style and source, and warns if the find would break a limit, for example "You've already used this film twice". Before the app does this, tapes remind collectors in words.
- The write-a-tape form checks the creator's scenes as they go and explains which rule a tape breaks, rather than just refusing it.

### Safety

- The "unsettling, never harmful" rule applies to every scene: no graphic, violent, hateful or flashing material.
- No strobing: the 4-second minimum keeps cuts slow, no clip may contain flashing, and an in-room scene never asks anyone to flash lights.
- Tapes with Clash scenes show "contains an unsettling interlude" unless the creator marks them as comic, which a reviewer checks.

### On screen (later)

- The song sits in its own lane underneath the picture lane, like an editing suite's audio track. Its colour is an open question: a pink such as `#E879B9` would stay distinct from the five media colours.
- Play-along shows a large song clock. The collector taps Start at the same moment they press play on the song, and the screen counts down to each cue: "Next: scene 4 in 3, 2, 1".
- Tip shown before playback: play the song on one device and the pictures on another.

### Open questions

1. Do collectors find hand-syncing fun or fiddly? (The sample tests this.)
2. Should a fixed-song tape link to the song on one named service, or list several?
3. Do sync tapes need their own vibes, or is the existing list enough?
4. Are the variety limits right? Half per medium and style is a first guess; testers' videos will show whether it's too strict or too loose.
5. Should more styles be added (for example Archive, for old footage), or does that make tagging a chore?

## Core screens

| Screen | Purpose |
| --- | --- |
| Welcome and sign-up | Explains the idea, makes an account, sets region, vibes and reading style, suggests a first tape |
| Home and browse | Weekly prompt, explore by region, search and filters, tape cards with J-card thumbnails |
| Tape landing page | J-card, liner notes, vibes and arc, what you'll need, running order, availability, "I made this" responses |
| Tape timeline | The editing-suite view: collect slots, read clues and fallbacks, track progress |
| Timeline on a phone | The same, as a vertical stack with a bottom sheet for each slot |
| Play-along | Step-by-step playback with timers, the Interference split screen, then the reveal |
| Write a tape | The submission form: details, vibes, tier, slots, fallbacks, regions, checklist |

## Visual basics

- Dark, editing-suite look: background `#101216`, panels `#171A1F`, borders `#262A31`, text `#E8E9EC`.
- J-cards are cream (`#EDE9E0`) with a colour stripe showing the tape's media mix by running time, and ink-blue (`#1F2A44`) handwriting.
- Touch targets at least 44px; text contrast at least 4.5:1.
