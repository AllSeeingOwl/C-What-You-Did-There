# Side C design spec

Last updated 7 November 2026

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
