# CLAUDE.md

Briefing for Claude Code. Read this first, then `docs/design-spec.md`.

## What this project is

**Side C** *(What You Did There)* is a website (and later an app) for "mixtapes made of everything". A tape is a set of **instructions, never the clips themselves**: a creator lists short moments from radio, TV, film, video and podcasts, with timestamps, notes and small things to do in between. Collectors hunt each piece down from official sources over days or weeks, play the tape back in one sitting, then read the creator's notes (the reveal: "see what they did there").

- Main name: **Side C**. Backup name: **C What You Did There** (this repo's name). "CWYDT" is fan shorthand only.
- Owner: GitHub user AllSeeingOwl, based in the UK. Write in British English.

## Current stage

Stage 1 of the real build: a working website in `app/` that runs entirely in the browser (no server, no accounts; data in localStorage; tapes shared as a link or file). What exists:

| Path | What it is |
| --- | --- |
| `app/` | The website: React + TypeScript + Vite, tests with Vitest. `app/src/model/` holds the rules and data, independent of the screens |
| `docs/building.md` | How the app is built and run, decisions made while building, and what stage 2 needs |
| `.github/workflows/deploy.yml` | Tests, builds and publishes the site to GitHub Pages on every push to `main` |
| `README.md` | Public summary of the concept and the repo |
| `docs/design-spec.md` | **Source of truth** for every rule: slot types, lane colours, tiers, lengths, fallbacks, Interference, regions, vibes, handwriting, core screens |
| `docs/community-guidelines.md` | Draft rules for creators and collectors; has `[AGE]`, `[TIME]`, `[CONTACT]` placeholders and open questions for a solicitor |
| `docs/sample-tape-rain-on-a-tuesday.md` | A real, playable sample tape used for testing the idea with friends |
| `docs/sample-tape-last-train-out.md` | A playable sample *sync tape* (home-made music video) for the proposed format in the spec's "Sync tapes" section. Not in the app yet |
| `docs/tester-message.md`, `docs/tester-message-sync-tape.md` | Ready-to-send messages for friends testing each sample tape |
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

## How the app works

- Run `npm install`, then `npm run dev`, `npm test` or `npm run build`, from `app/`.
- Every number from the spec lives in `app/src/model/constants.ts`; checks live in `rules.ts`. Change the spec first, then those files, then the tests in `model.test.ts`.
- Anything read from a share link or file goes through `parse.ts`, which rebuilds it field by field. Only links that pass `checkLink` become clickable.
- The sample tape in `sampleTapes.ts` mirrors `docs/sample-tape-rain-on-a-tuesday.md`; keep them in step.
- Addresses use `#/...` so the site works on any static host.

## Next steps (agreed so far)

1. Test the sample tape with a few friends; let their feedback reshape the design.
2. Design the remaining screens: logo and app icon, settings, sign in, the "I made this" form, problem states (dead links, no results, 404), review queue, reporting, notifications, info pages.
3. Write the legal pages with a solicitor: terms, privacy, takedowns, minimum age.
4. ~~Start the real build~~ Stage 1 done (browser-only website). Next: put it online, then decide funding and hosting for stage 2 (accounts, shared catalogue, review queue, reporting).

## Working conventions

- Explain choices in plain language; the owner is not a professional developer.
- Keep `docs/design-spec.md` up to date whenever a rule changes, and keep the README's status list current.
- Use placeholders like `[CREATOR]` or `[N]` rather than invented data, and fictional examples rather than real programmes or people.
- Commit in small, clearly described steps.
