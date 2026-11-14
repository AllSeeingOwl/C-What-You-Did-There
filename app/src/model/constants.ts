import type { Cost, Difficulty, MediaType, Rarity, SlotType, TierId } from './types';

// Every number here comes from docs/design-spec.md. Change the spec first.

export interface Tier {
  id: TierId;
  minSeconds: number;
  maxSeconds: number;
  maxSlots: number;
}

export const TIERS: Record<TierId, Tier> = {
  C5: { id: 'C5', minSeconds: 120, maxSeconds: 300, maxSlots: 6 },
  C15: { id: 'C15', minSeconds: 300, maxSeconds: 900, maxSlots: 12 },
  C30: { id: 'C30', minSeconds: 900, maxSeconds: 1800, maxSlots: 20 },
};
export const TIER_IDS: TierId[] = ['C5', 'C15', 'C30'];

/** "Close enough": 10% either side of the tier. */
export const TIER_MARGIN = 0.1;
export const MIN_SLOTS = 3;
export const MAX_FALLBACKS = 3;
export const MAX_INTERFERENCE = 2;
export const MAX_VIBES = 3;

export const SLOT_LIMITS = {
  clip: { min: 5, max: 120 },
  between: { min: 3, max: 60 },
  interference: { min: 10, max: 45 },
} as const;

export const VIBES = [
  'Tranquil', 'Dreamy', 'Cosy', 'Nostalgic', 'Melancholy', 'Hopeful', 'Joyful',
  'Funny', 'Strange', 'Eerie', 'Tense', 'Frantic', 'Chaotic', 'Experimental',
];

export const MEDIA_TYPES: MediaType[] = ['radio', 'tv', 'film', 'video', 'podcast'];
export const SLOT_TYPES: SlotType[] = [...MEDIA_TYPES, 'between', 'interference'];

export const LANES: Record<SlotType, { label: string; colour: string }> = {
  radio: { label: 'Radio', colour: '#E9A23B' },
  tv: { label: 'TV', colour: '#4C8DF6' },
  film: { label: 'Film', colour: '#F06A6E' },
  video: { label: 'Video', colour: '#3DBE7A' },
  podcast: { label: 'Podcast', colour: '#A68BF5' },
  between: { label: 'In-between', colour: '#A7ABB3' },
  interference: { label: 'Interference', colour: '#A7ABB3' },
};

export const COSTS: Record<Cost, string> = {
  free: 'Free',
  subscription: 'Subscription',
  'rent-buy': 'Rent or buy',
  archive: 'Archive digging',
  diy: 'Do it yourself',
};

export const RARITIES: Record<Rarity, string> = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  you: 'You',
};

export const DIFFICULTIES: Record<Difficulty, string> = {
  quick: 'Quick: mostly free and easy to find',
  medium: 'Medium: some digging',
  deep: 'Deep dig: archives and patience',
};

export const WORLD = 'WORLD';

/** A short list for now; easy to extend. */
export const COUNTRIES: Record<string, string> = {
  GB: 'the UK',
  IE: 'Ireland',
  US: 'the US',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  FR: 'France',
  DE: 'Germany',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'the Netherlands',
  BE: 'Belgium',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  PT: 'Portugal',
  JP: 'Japan',
  KR: 'South Korea',
  IN: 'India',
  BR: 'Brazil',
  MX: 'Mexico',
  ZA: 'South Africa',
};

export function regionName(code: string): string {
  if (code === WORLD) return 'Worldwide';
  return COUNTRIES[code] ?? code;
}

/** Country name without "the", for use in a list ("UK, Ireland"). */
export function regionShort(code: string): string {
  return regionName(code).replace(/^the /, '');
}
