import type { Fallback, SceneInfo, Slot, Tape } from './types';

// "Rain on a Tuesday", from docs/sample-tape-rain-on-a-tuesday.md.
// Keep the two in step if either changes.

const room = (id: string, seconds: number, find: string, note: string): Slot => ({
  id, type: 'between', seconds, find, where: 'You, in the room', regions: ['WORLD'], cost: 'diy',
  rarity: 'you', mystery: false, spoiler: false, note, fallbacks: [],
});

export const RAIN_ON_A_TUESDAY: Tape = {
  format: 'side-c-tape',
  version: 1,
  kind: 'mixtape',
  id: 'sample-rain-on-a-tuesday',
  title: 'Rain on a Tuesday',
  creator: 'The Side C team',
  theme: 'Weather, rain, staying in',
  liner: 'I made this on a wet afternoon when everything sounded like rain. It starts calm, gets strange in the middle, and ends somewhere hopeful.',
  tier: 'C15',
  difficulty: 'medium',
  vibes: ['Tranquil', 'Strange', 'Hopeful'],
  arc: ['Tranquil', 'Strange', 'Hopeful'],
  warnings: { flashing: false, loudNoises: false, upsettingThemes: false },
  createdAt: '2026-11-07T12:00:00.000Z',
  updatedAt: '2026-11-07T12:00:00.000Z',
  slots: [
    room('s1', 8, 'Count down from five, out loud, slowly, as if the tape is about to start broadcasting.', 'Sets the tone. Don’t rush it.'),
    {
      id: 's2', type: 'radio', seconds: 42,
      find: 'Any station’s overnight or late-night weather bulletin. Start where the presenter takes a breath before the first region.',
      where: 'Radio catch-up apps or archives', regions: ['GB', 'IE'], cost: 'free', rarity: 'common',
      mystery: false, spoiler: false, note: 'The calmer the voice, the better.',
      fallbacks: [
        { find: 'Any slow, calm shipping or travel bulletin.', where: 'Radio catch-up apps', regions: ['WORLD'], cost: 'free' },
        { find: 'A sleep or relaxation track with a spoken weather report.', where: 'Podcast or music apps', regions: ['WORLD'], cost: 'free' },
      ],
    },
    {
      id: 's3', type: 'video', seconds: 45, find: 'Any long video of rain on a tin or metal roof. Pick a stretch with no thunder.',
      where: 'Video sites', regions: ['WORLD'], cost: 'free', rarity: 'common', mystery: false, spoiler: false,
      note: 'Let it fade in under the end of the bulletin if you can.', fallbacks: [],
    },
    {
      id: 's4', type: 'film', seconds: 55,
      find: 'A character waits at a bus stop in the rain, the bus doesn’t come, and nobody speaks for at least ten seconds. Any film.',
      where: 'Any film service, rental or DVD', regions: ['WORLD'], cost: 'rent-buy', rarity: 'uncommon', mystery: true,
      spoiler: false, note: 'Everyone’s tape will be different here. That’s the point.', fallbacks: [],
    },
    room('s5', 10, 'Turn the lights off. Ten seconds of silence.', 'Halfway point. Breathe.'),
    {
      id: 's6', type: 'podcast', seconds: 55, find: 'Someone explaining why rain smells the way it does (petrichor).',
      where: 'Podcast apps, science shows', regions: ['WORLD'], cost: 'free', rarity: 'common', mystery: false, spoiler: false,
      note: 'I wanted something that explains the feeling, not just the sound.', fallbacks: [],
    },
    {
      id: 's7', type: 'tv', seconds: 45, find: 'A live weather forecast where the presenter can’t stop laughing, or the map goes wrong. Any year, any channel.',
      where: 'Official broadcaster channels, clip collections', regions: ['WORLD'], cost: 'free', rarity: 'uncommon', mystery: true,
      spoiler: false, note: 'The tape needs a laugh right here, just before it gets strange.',
      fallbacks: [
        { find: 'Any live TV moment where a presenter corpses on air.', where: 'Official broadcaster channels', regions: ['WORLD'], cost: 'free' },
        { find: 'A newsreader trying to keep a straight face over a silly story.', where: 'Official broadcaster channels', regions: ['WORLD'], cost: 'free' },
      ],
    },
    {
      id: 's8', type: 'radio', seconds: 60, find: 'A late-night phone-in where a caller describes strange lights in the sky during a storm.',
      where: 'Radio archives and off-air recording collections', regions: ['GB'], cost: 'archive', rarity: 'rare', mystery: false,
      spoiler: false, note: 'The hardest find on the tape. Worth it.',
      fallbacks: [
        { find: 'Any radio drama or podcast scene about lights in the sky.', where: 'Podcast apps, radio catch-up', regions: ['WORLD'], cost: 'free' },
        { find: 'A documentary interview with someone describing a sighting.', where: 'Documentary services, video sites', regions: ['WORLD'], cost: 'free' },
        { find: 'Read a short eyewitness-style account aloud yourself.', where: 'You, in the room', regions: ['WORLD'], cost: 'diy' },
      ],
    },
    {
      id: 's9', type: 'interference', seconds: 40, find: 'A cheerful pop video under a severe weather warning.',
      where: 'See picture and sound', regions: ['WORLD'], cost: 'free', rarity: 'uncommon', mystery: false, spoiler: false,
      note: 'Everything outside is falling apart, and nobody in the video has noticed.',
      interference: {
        mode: 'clash',
        picture: { media: 'video', find: 'Any bright, cheerful pop music video.', where: 'Artists’ official video channels' },
        sound: { media: 'radio', find: 'Any radio or online severe weather warning.', where: 'Radio catch-up or weather service recordings' },
        syncCue: 'Start the sound the moment the singer first smiles at the camera.',
      },
      fallbacks: [
        { find: 'Sound: any calm shipping-style forecast over the same video.', where: 'Radio catch-up', regions: ['WORLD'], cost: 'free' },
        { find: 'Picture: any upbeat holiday advert, muted.', where: 'Advertisers’ official channels', regions: ['WORLD'], cost: 'free' },
      ],
    },
    {
      id: 's10', type: 'tv', seconds: 50, find: 'A children’s TV segment about jumping in puddles, wellies or splashing.',
      where: 'TV catch-up or archives', regions: ['GB'], cost: 'archive', rarity: 'rare', mystery: false, spoiler: false,
      note: 'Rain stops being sad here.', fallbacks: [],
    },
    room('s11', 10, 'Open a window if it’s raining where you are. If it isn’t, imagine it.', 'The only slot that changes depending on the day you play it.'),
    {
      id: 's12', type: 'film', seconds: 60, find: 'The final scene of any film where the end credits roll over the sound of rain. One minute, starting as the credits begin.',
      where: 'Any film service, rental or DVD', regions: ['WORLD'], cost: 'rent-buy', rarity: 'uncommon', mystery: false,
      lockedUntil: 's10', spoiler: false, note: 'End on the sound, not the picture.', fallbacks: [],
    },
  ],
};

// "Last Train Out", from docs/sample-tape-last-train-out.md: an open-song
// sync tape. Keep the two in step if either changes.

const anywhere = (find: string, where: string, cost: Fallback['cost'] = 'free'): Fallback => ({ find, where, regions: ['WORLD'], cost });

const scene = (
  id: string, scene: SceneInfo, find: string, where: string, note: string,
  extra: Partial<Slot> = {},
): Slot => ({
  id, type: 'scene', seconds: 0, find, where, regions: ['WORLD'], cost: 'free', rarity: 'common',
  mystery: false, spoiler: false, note, fallbacks: [], scene, ...extra,
});

export const LAST_TRAIN_OUT: Tape = {
  format: 'side-c-tape',
  version: 1,
  kind: 'sync',
  id: 'sample-last-train-out',
  title: 'Last Train Out',
  creator: 'The Side C team',
  theme: 'Leaving, trains, going somewhere new',
  liner: 'Every song about leaving is secretly about a train. This tape makes that true.',
  tier: 'C5',
  difficulty: 'medium',
  vibes: ['Nostalgic', 'Funny', 'Hopeful'],
  arc: ['Nostalgic', 'Funny', 'Hopeful'],
  warnings: { flashing: false, loudNoises: false, upsettingThemes: false },
  createdAt: '2026-11-22T12:00:00.000Z',
  updatedAt: '2026-11-22T12:00:00.000Z',
  slots: [
    {
      id: 'song', type: 'song', seconds: 270,
      find: 'Any song about leaving, moving on or going away, in any genre and from any year. It needs verses and at least two choruses; a bridge (a different-sounding part near the end) is a bonus, not a must.',
      where: 'A streaming service, the artist’s own channel, radio catch-up or a copy you own',
      regions: ['WORLD'], cost: 'free', rarity: 'common', mystery: false, spoiler: false, note: '', fallbacks: [],
      song: {
        mode: 'open', version: '', minSeconds: 150, maxSeconds: 270,
        sections: [
          { name: 'Intro', optional: false },
          { name: 'Verse 1', optional: false },
          { name: 'Halfway through verse 1', optional: false },
          { name: 'Chorus 1', optional: false },
          { name: 'Verse 2', optional: false },
          { name: 'Last few seconds of verse 2', optional: false },
          { name: 'Chorus 2', optional: false },
          { name: 'Bridge', optional: true },
          { name: 'Final chorus', optional: false },
          { name: 'Outro', optional: false },
        ],
      },
    },
    scene('p1', { cue: 'Intro', medium: 'video', style: 'real', mode: 'mood' },
      'Any shot of an empty railway platform at night.',
      'Official railway, travel or webcam channels on video sites',
      'Every leaving song starts here, whether it knows it or not.'),
    scene('p2', { cue: 'Verse 1', medium: 'film', style: 'drama', mode: 'literal' },
      'Someone packing a suitcase badly: too full, won’t shut, something falls out. Any film.',
      'Any film service, rental or DVD',
      'The first laugh. You’ve got to be a bit of a mess to leave.',
      {
        cost: 'rent-buy',
        fallbacks: [
          anywhere('Any advert where someone sits on a suitcase to close it.', 'Advertisers’ official channels'),
          anywhere('Pack a bag yourself, badly, and do it live during the scene.', 'You, in the room', 'diy'),
        ],
      }),
    scene('p3', { cue: 'Halfway through verse 1', medium: 'any', style: 'any', mode: 'literal' },
      'Listen to this part of your verse and pick the most concrete thing in it (an object, a place, an animal). Find a clip of exactly that thing, taken completely literally.',
      'Anywhere official',
      'This is where it turns into a proper music video. The more literal, the better.',
      {
        mystery: true, rarity: 'uncommon',
        fallbacks: [
          anywhere('If your verse has nothing concrete in it, use a clip of the song’s title, taken literally.', 'Anywhere official'),
          anywhere('Any road sign pointing somewhere far away.', 'Anywhere official'),
        ],
      }),
    scene('p4', { cue: 'Chorus 1', medium: 'any', style: 'any', mode: 'literal' },
      'Pick the most important word in your chorus, the one that comes back again and again. Find a clip that acts it out as literally as possible: if it’s “fly”, a pigeon; if it’s “home”, a house.',
      'Anywhere official',
      'Your tape is now different from everyone else’s. That’s the point.',
      {
        mystery: true, rarity: 'uncommon',
        fallbacks: [
          anywhere('If the key word can’t be acted out (like “maybe”), use a clip of someone shrugging.', 'Anywhere official'),
          anywhere('Hold up a hand-written card with a drawing of the word.', 'You, in the room', 'diy'),
        ],
      }),
    scene('p5', { cue: 'Verse 2', medium: 'tv', style: 'real', mode: 'mood' },
      'Any nature documentary shot of animals on a long journey: geese flying in formation, herds crossing a river.',
      'TV catch-up, broadcasters’ official channels',
      'Everything’s migrating. You’re not the only one going.',
      {
        fallbacks: [
          anywhere('Any time-lapse of clouds moving across the sky.', 'Anywhere official'),
          anywhere('Any shot of an aeroplane taking off.', 'Anywhere official'),
        ],
      }),
    {
      id: 'p6', type: 'between', seconds: 0, find: 'Turn off one light. The song keeps playing.', where: 'You, in the room',
      regions: ['WORLD'], cost: 'diy', rarity: 'you', mystery: false, spoiler: false,
      note: 'You’ll only notice it was the turning point afterwards.', fallbacks: [],
      scene: { cue: 'Last few seconds of verse 2', medium: 'any', style: 'any', mode: 'mood' },
    },
    scene('p7', { cue: 'Chorus 2', medium: 'any', style: 'any', mode: 'literal', differentFrom: 'p4' },
      'The same key word as scene 4, acted out by a completely different clip. If scene 4 was a real pigeon, try a cartoon bird.',
      'Anywhere official',
      'Same joke, new picture. It’s funnier the second time because you can see it coming.',
      {
        mystery: true, rarity: 'uncommon',
        fallbacks: [
          anywhere('A clip of the opposite of your key word.', 'Anywhere official'),
          anywhere('The key word written on a sign, a shop front or a cake, in any clip.', 'Anywhere official'),
        ],
      }),
    scene('p8', { cue: 'Bridge', medium: 'tv', style: 'animation', mode: 'clash' },
      'Any cartoon character waving goodbye at the end of an episode, as cheerfully as possible.',
      'TV catch-up, official cartoon channels',
      'Far too cheerful. Goodbye shouldn’t look this easy.',
      {
        fallbacks: [
          anywhere('Any animated closing credits at the end of a children’s programme.', 'TV catch-up'),
          anywhere('Any puppet waving goodbye on children’s TV.', 'TV catch-up'),
        ],
      }),
    scene('p9', { cue: 'Final chorus', medium: 'film', style: 'drama', mode: 'mood' },
      'A train pulling away, seen from the platform, in any film. Start just as it begins to move.',
      'Any film service, rental or DVD',
      'The thing the whole song was building up to.',
      {
        cost: 'rent-buy',
        fallbacks: [
          anywhere('Any boat leaving a harbour.', 'Anywhere official'),
          anywhere('The back of any bus driving away down a street.', 'Anywhere official'),
        ],
      }),
    scene('p10', { cue: 'Outro', medium: 'video', style: 'real', mode: 'mood' },
      'A different empty platform from scene 1, ideally in daylight, from a different station and channel. Hold it until the song finishes.',
      'Official railway, travel or webcam channels on video sites',
      'It looks like the start, but it’s a different station. Someone’s arrived somewhere new.',
      {
        fallbacks: [
          anywhere('Any empty bus stop or ferry terminal.', 'Anywhere official'),
          anywhere('Any station clock, with nobody underneath it.', 'Anywhere official'),
        ],
      }),
  ],
};

export const SAMPLE_TAPES: Tape[] = [RAIN_ON_A_TUESDAY, LAST_TRAIN_OUT];

export interface TesterInfo {
  /** The doc the questions come from, under docs/. */
  doc: string;
  questions: string[];
  /** Shown on the questions page for testers who stopped partway. */
  partwayHint: string;
}

/** Questions for friends testing each sample tape (from the "Tester feedback" section of its doc). */
export const TESTERS: Record<string, TesterInfo> = {
  [RAIN_ON_A_TUESDAY.id]: {
    doc: 'sample-tape-rain-on-a-tuesday.md',
    partwayHint: 'If you stopped partway, question 4 (when did it start to feel like a chore?) is the most useful one.',
    questions: [
      'How long did collecting take, in days and roughly in hours?',
      'Which slot was hardest to find, and did you use a fallback for it?',
      'Were any instructions unclear: the descriptions, the lengths, the Interference sync cue?',
      'Did the hunting feel fun, or like a chore? At what point?',
      'Did the playback flow, or did switching between sources break the mood?',
      'Did the reveal change how you felt about the tape?',
      'Would you collect another tape? Would you write one?',
      'Anything you’d add, cut or change?',
    ],
  },
  [LAST_TRAIN_OUT.id]: {
    doc: 'sample-tape-last-train-out.md',
    partwayHint: 'If you stopped partway, say where: picking a song, mapping it, finding clips, or playing it back. Please describe lyrics in your own words rather than writing them out.',
    questions: [
      'Which song did you pick, and was it easy to find one that fitted the brief?',
      'Was mapping your song (the section start times) easy or a chore?',
      'Which scene was hardest to find, and did you use a fallback?',
      'Were the three “literal” hunts (scenes 3, 4 and 7) fun? Did they make you laugh during playback?',
      'Could you keep up with the cuts while playing back, or was switching too fiddly?',
      'Did two devices help, or would you rather do it all on one screen?',
      'Did the reveal change how you felt about the video?',
      'Would you rather a creator picked the song for you, with exact timings?',
      'Did the variety rules (different films, shows and styles) make hunting harder, the video better, or both?',
      'Anything you’d add, cut or change?',
    ],
  },
};
