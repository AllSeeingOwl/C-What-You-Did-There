# Building Side C

Last updated 22 November 2026

How the working website in `app/` is put together, how to run it, and what comes next.

## What works now (stage 1)

A real website that runs entirely in the visitor's browser. It needs no server, no accounts and has no running costs.

| Screen | Address | What it does |
| --- | --- | --- |
| Welcome and browse | `#/` | First-visit welcome (region, reading style), My shelf, search and filters by tier, vibe and "works where I am" |
| Tape page | `#/tape/[ID]` | J-card, liner notes, vibes and arc, region badge, warnings, what you'll need, running order, share and delete |
| Collecting | `#/tape/[ID]/collect` | The editing-suite timeline (vertical list and bottom sheet on phones); record your find, fallback used and times |
| Play-along | `#/tape/[ID]/play` | Set-up, a timer per slot, the Interference split screen and sync cue, then the reveal |
| Write a tape | `#/write` | The full form with every rule from the design spec checked live, plus the publishing checklist |
| Tester questions | `#/tape/[ID]/feedback` | The questions from each sample tape's doc, also shown after its reveal; answers save as you type and are copied or downloaded to send back |
| Add a tape | `#/import` and `#/t/[CODE]` | Open a share link or a tape file from someone else |
| Settings, How it works, 404 | `#/settings`, `#/about` | Region, plain text, creator name, delete all data; the short guidelines |

**Sync tapes** (home-made music videos, see the design spec) use the same screens. The tape page shows a sync running order; collecting has a pictures-and-song timeline, a form for mapping an open song, and variety warnings; play-along is one song clock that counts down to each cut; and Write a tape has a "Kind of tape" choice that swaps the tier and slots for a song and scenes. The sample is *Last Train Out*.

**How sharing works without a server:** a share link carries the whole tape (instructions only) inside the address after `#`. The part after `#` is never sent to any web server. Tapes can also be downloaded and sent as a `.sidec.json` file.

**Where data lives:** in the browser's local storage, on that device only. Clearing site data removes it.

## Decisions made while building

These fill gaps the spec didn't cover. They should be added to `docs/design-spec.md` if they become firm rules.

- **In-between slots count as collected from the start,** because there's nothing to find.
- **Play-along unlocks only when every slot is collected** (as in the mockups).
- **A locked slot hides its content** until the slot it depends on is collected, and can't depend on an in-between slot.
- **Links must be `https://` web pages.** Links to media files (`.mp4`, `.mp3` and so on), torrents and magnet links are refused. The app can't tell whether a site is official, so the creator confirms it in the publishing checklist.
- **A long passage in quotation marks gets a warning,** as a nudge against pasting transcripts or lyrics.
- **"Best in [COUNTRY]"** is the country where the most slots, or one of their fallbacks, work.
- **Collector region "Somewhere else"** only counts slots that work worldwide.
- **A sync tape is stored like any other tape,** with `kind: 'sync'`. Its song is always the first slot (type `song`) and every slot after it is a scene (type `scene`) or a room scene (type `between`), so collecting, fallbacks, regions and sharing all work unchanged. Older tapes with no `kind` are read as mixtapes.
- **Sync scenes have no length of their own.** A scene runs from its cue to the next scene's cue, or to the end of the song.
- **Open songs:** parts can be optional, and a scene cued to a missing part is skipped. The song counts as collected only once the collector's map is complete.
- **Variety rules** stop a creator publishing when the scenes they've fixed already break them. For collectors, they only warn.
- **Clash scenes don't add the "unsettling interlude" label automatically** until there's a review queue to check which ones are comic.

## Running it on your own computer

You need [Node.js](https://nodejs.org) version 22 or later. In a terminal, from the `app` folder:

```bash
npm install
```

```bash
npm run dev
```

Then open the address it prints (usually `http://localhost:5173`). Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Checks the rules (tiers, lengths, regions, sharing, sync tapes) with automatic tests |
| `npm run build` | Makes the finished website in `app/dist` |

## Putting it online (free, with GitHub Pages)

The workflow in `.github/workflows/deploy.yml` tests, builds and publishes the site every time the `main` branch changes.

The site is live at https://allseeingowl.github.io/C-What-You-Did-There/. Anything merged into `main` appears there a minute or two later.

- The repo's **Settings → Pages → Source** must be **GitHub Actions**. If it's set to "Deploy from a branch", the address shows the README instead of the website.
- To publish again without changing anything, open the **Actions** tab, choose **Publish website**, then **Run workflow**.

## How the code is laid out

| Path | What it is |
| --- | --- |
| `app/src/model/` | The rules and data, with no screens: tape format (`types.ts`), numbers from the spec (`constants.ts`), checks (`rules.ts`), sync tapes (`sync.ts`: cue times, song maps, variety), regions (`availability.ts`), sharing (`share.ts`, `parse.ts`), saving (`store.ts`) and the sample tapes |
| `app/src/pages/` | One file per screen |
| `app/src/components/` | Shared pieces: J-card, badges, slot details, region pickers, share buttons, form inputs, and the sync tape editor and details |
| `app/src/styles.css` | All styling; colours match the design spec |

The `model` folder is the part worth keeping whatever happens next: the same rules will apply when there's a server or a phone app.

Tools: [React](https://react.dev) for the screens, [TypeScript](https://www.typescriptlang.org) (JavaScript with checks that catch mistakes), [Vite](https://vite.dev) to build, and [Vitest](https://vitest.dev) for tests. All are free and widely used.

## What stage 2 needs (accounts and a shared catalogue)

Some features need a server: accounts, a public catalogue where anyone can browse everyone's tapes, "I made this" responses, the review queue, reporting and notifications. That means decisions that are yours to make:

- **Hosting and cost.** For example, a hosted database service with a free tier (such as Supabase or Firebase) can get started for little or nothing, with costs growing as people use it.
- **Moderation.** Who reviews tapes before they go public, and how reports reach you.
- **Legal pages first.** Terms, privacy, takedowns and minimum age (see `docs/community-guidelines.md`) should be ready before strangers can publish.

A phone app can come later: the website can first be made installable on a phone's home screen (a "progressive web app") without app stores.
