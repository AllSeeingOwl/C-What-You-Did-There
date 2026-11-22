# Side C *(What You Did There)*

**Mixtapes made of everything.**

A Side C tape is a set of instructions, not a playlist. Someone picks short moments from radio, TV, film, video and podcasts, puts them in order with notes and little things to do in between, and shares the instructions. You hunt down each piece from official sources, over an evening or a few weeks, then play the whole thing back and read the creator's notes, to see what they did there.

No clips are hosted or shared. The tape only points to them.

## How it works

1. **Pick a tape.** Browse by length, vibe or region. Every tape shows what you'll need and where it works.
2. **Hunt the pieces.** Each slot says what to find, where to look and how long it runs. Mystery slots give a clue instead of a timestamp, and fallbacks help when something's hard to get.
3. **Play it back.** Play-along mode walks you through the tape slot by slot, including Interference: a muted picture from one source under sound from another.
4. **The reveal.** The creator's notes for every slot, saved for the end.

## What makes it different

- **An editing-suite timeline,** colour-coded by medium, that fills in as you collect.
- **Cassette tiers:** C5, C15 and C30, with a 10% margin either way.
- **Vibes and vibe arcs,** e.g. Tranquil → Strange → Hopeful.
- **Regions:** tapes are Worldwide or tied to the countries their sources come from.
- **Handwriting** for anything in the creator's own voice, like a real cassette J-card.

## Try it

**Live at https://allseeingowl.github.io/C-What-You-Did-There/** · the code is in [`app/`](app/). It runs entirely in your browser: browse, collect, play along and write tapes, then share them as a link or file. There are no accounts yet, so everything is saved on your own device. See [`docs/building.md`](docs/building.md) for how to run it and put it online.

## What's in this repo

| Folder | Contents |
| --- | --- |
| [`app/`](app/) | The working website (stage 1: no accounts, saved in your browser) |
| [`docs/building.md`](docs/building.md) | How the website is built, how to run it, and what stage 2 needs |
| [`docs/tester-message.md`](docs/tester-message.md) | A ready-to-send message for friends testing the sample tape |
| [`docs/tester-message-sync-tape.md`](docs/tester-message-sync-tape.md) | The same for the sample sync tape, *Last Train Out* |
| [`docs/design-spec.md`](docs/design-spec.md) | The rules behind every screen: slot types, colours, tiers, lengths, fallbacks, Interference, regions, vibes, handwriting |
| [`docs/community-guidelines.md`](docs/community-guidelines.md) | Draft guidelines for creators and collectors (to be checked by a solicitor) |
| [`docs/sample-tape-rain-on-a-tuesday.md`](docs/sample-tape-rain-on-a-tuesday.md) | A real, playable sample tape, with questions for testers |
| [`docs/sample-tape-last-train-out.md`](docs/sample-tape-last-train-out.md) | A sample *sync tape* (a home-made music video), the second tape format; also playable on the website |
| [`mockups/`](mockups/) | Ten clickable screen mockups that open in any browser (the original designs) |
| [`mockups/canvas-source/`](mockups/canvas-source/) | The original design files, kept so they can be reopened in the design canvas |

## Viewing the mockups

Download or clone the repo and open `mockups/index.html` in a browser. Each screen is a single page, and most are clickable: filters, slot details, the welcome steps and play-along all work.

The pages load their fonts from Google Fonts, so they look their best with an internet connection.

## Status

First working version (stage 1): a website that runs in the browser, with no accounts. Next up:

- [x] Working website: browse, tape page, collecting timeline, play-along and reveal, write a tape, share by link or file
- [x] Put it online: https://allseeingowl.github.io/C-What-You-Did-There/
- [ ] Test the sample tape with a few friends
- [x] Sync tapes (home-made music videos) on the website: write, collect, map your song, play along to a song clock
- [ ] Test sync tapes with the *Last Train Out* sample
- [ ] Profile page
- [ ] Review queue, reporting and notifications
- [ ] Legal pages: terms, privacy, takedowns, minimum age
- [ ] Decide how stage 2 is funded and hosted: accounts and a shared catalogue

## Names

**Side C** is the main name: the secret third side of a cassette, and "see what you did there". **C What You Did There** is the backup name, and this repo's name.
