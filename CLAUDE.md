# CLAUDE.md

Briefing for Claude Code. Read this first, then `docs/design-spec.md`.

## What this project is

**Side C** *(What You Did There)* is a website (and later an app) for "mixtapes made of everything". A tape is a set of **instructions, never the clips themselves**: a creator lists short moments from radio, TV, film, video and podcasts, with timestamps, notes and small things to do in between. Collectors hunt each piece down from official sources over days or weeks, play the tape back in one sitting, then read the creator's notes (the reveal: "see what they did there").

- Main name: **Side C**. Backup name: **C What You Did There** (this repo's name). "CWYDT" is fan shorthand only.
- Owner: GitHub user AllSeeingOwl, based in the UK. Write in British English.

## Current stage

Concept and design. There is **no app code yet**. What exists:

| Path | What it is |
| --- | --- |
| `README.md` | Public summary of the concept and the repo |
| `docs/design-spec.md` | **Source of truth** for every rule: slot types, lane colours, tiers, lengths, fallbacks, Interference, regions, vibes, handwriting, core screens |
| `docs/community-guidelines.md` | Draft rules for creators and collectors; has `[AGE]`, `[TIME]`, `[CONTACT]` placeholders and open questions for a solicitor |
| `docs/sample-tape-rain-on-a-tuesday.md` | A real, playable sample tape used for testing the idea with friends |
| `mockups/*.html` | Ten clickable screen mockups; `mockups/index.html` links them |
| `mockups/runtime.js` | Tiny renderer the mockups use (see below) |
| `mockups/canvas-source/` | Original files from the Claude design canvas (`.dc.html` + `canvas.json`). Archive only: they need the canvas runtime and don't open on their own |

If the files are all at the top level instead of in `docs/` and `mockups/` (an earlier web upload flattened them), move them into the layout above first. File contents don't need changing.

## Rules that must hold in anything we build

- **Point, don't copy.** Never host, upload, embed, download or transcribe the source media. Tapes store descriptions, timestamps and links to official sources only. No transcripts or lyrics.
- **Official sources only.** No pirated or unofficial links; no instructions for ripping or recording.
- **Private people stay out.** No clips of private individuals; in-between slots never involve recording others.
- **Unsettling, never harmful.** Interference pairs a muted picture with separate sound to clash or merge uncannily, but never with graphic, violent, hateful or flashing material.
- **Lengths:** tiers C5 (2–5 min, 3–6 slots), C15 (5–15 min, up to 12), C30 (15–30 min, up to 20), each with a **10% margin** either way. Clips 5 s–2 min, in-between 3 s–1 min, Interference 10–45 s (max two per tape). At least 3 slots.
- **Fallbacks:** up to three per slot; a fallback counts as collected.
- **Regions:** a tape is Worldwide only if every slot, or one of its fallbacks, works anywhere.
- **Vibes:** up to three from a fixed list of 14, plus an optional vibe arc (start → middle → end). "Theme" is a separate free-text field.
- **Handwriting** (Permanent Marker for J-card titles, Patrick Hand for creator notes) only for the creator's own words; everything functional uses Inter / Space Grotesk / JetBrains Mono. Always offer a plain-text setting.

## Design and accessibility

- Dark editing-suite look; exact colours and the lane palette are in `docs/design-spec.md`.
- Touch targets at least 44 px, text contrast at least 4.5:1, real buttons/links/labels, no colour-only meaning.
- Layouts must work at phone width; the collecting timeline becomes a vertical list on phones.

## How the mockups work

Each mockup page holds its markup in `<template id="tpl">` and defines `class Component extends DCLogic` with `renderVals()`, then calls `mountComponent(Component)`. `runtime.js` renders the template:

- `{{ path }}` is a dotted lookup into what `renderVals()` returns (no expressions).
- `attr="{{ fn }}"` passes the raw value; `on*` attributes become event listeners.
- `<sc-for list="{{ items }}" as="item">` repeats; `<sc-if value="{{ cond }}">` shows children when truthy.
- `setState()` re-renders the whole page.

They are throwaway prototypes for showing the design, not the basis of the real app. Open them straight in a browser; there is no build step.

## Next steps (agreed so far)

1. Test the sample tape with a few friends; let their feedback reshape the design.
2. Design the remaining screens: logo and app icon, settings, sign in, the "I made this" form, problem states (dead links, no results, 404), review queue, reporting, notifications, info pages.
3. Write the legal pages with a solicitor: terms, privacy, takedowns, minimum age.
4. Decide funding and the tech stack, then start the real build (likely a simple website first, an app later).

## Working conventions

- Explain choices in plain language; the owner is not a professional developer.
- Keep `docs/design-spec.md` up to date whenever a rule changes, and keep the README's status list current.
- Use placeholders like `[CREATOR]` or `[N]` rather than invented data, and fictional examples rather than real programmes or people.
- Commit in small, clearly described steps.
