import type { Slot, Tape } from './types';

// "Rain on a Tuesday", from docs/sample-tape-rain-on-a-tuesday.md.
// Keep the two in step if either changes.

const room = (id: string, seconds: number, find: string, note: string): Slot => ({
  id, type: 'between', seconds, find, where: 'You, in the room', regions: ['WORLD'], cost: 'diy',
  rarity: 'you', mystery: false, spoiler: false, note, fallbacks: [],
});

export const RAIN_ON_A_TUESDAY: Tape = {
  format: 'side-c-tape',
  version: 1,
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

export const SAMPLE_TAPES: Tape[] = [RAIN_ON_A_TUESDAY];

/** Questions for friends testing the sample tape (from the "Tester feedback" section of the doc). */
export const TESTER_QUESTIONS = [
  'How long did collecting take, in days and roughly in hours?',
  'Which slot was hardest to find, and did you use a fallback for it?',
  'Were any instructions unclear: the descriptions, the lengths, the Interference sync cue?',
  'Did the hunting feel fun, or like a chore? At what point?',
  'Did the playback flow, or did switching between sources break the mood?',
  'Did the reveal change how you felt about the tape?',
  'Would you collect another tape? Would you write one?',
  'Anything you’d add, cut or change?',
];
