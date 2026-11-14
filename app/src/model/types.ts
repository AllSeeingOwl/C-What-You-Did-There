// The shape of a Side C tape. A tape is instructions only: descriptions,
// lengths, where to look and (optionally) a link to an official source.
// It never holds the media itself, transcripts or lyrics.

export type MediaType = 'radio' | 'tv' | 'film' | 'video' | 'podcast';
export type SlotType = MediaType | 'between' | 'interference';
export type Cost = 'free' | 'subscription' | 'rent-buy' | 'archive' | 'diy';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'you';
export type TierId = 'C5' | 'C15' | 'C30';
export type Difficulty = 'quick' | 'medium' | 'deep';

/** 'WORLD' means it works anywhere; otherwise ISO country codes such as 'GB'. */
export type RegionCode = string;

export interface Fallback {
  find: string;
  where: string;
  link?: string;
  regions: RegionCode[];
  cost: Cost;
}

export interface InterferencePart {
  media: MediaType;
  find: string;
  where: string;
  link?: string;
}

export interface Interference {
  mode: 'clash' | 'merge';
  picture: InterferencePart; // played muted
  sound: InterferencePart;
  syncCue: string;
}

export interface Slot {
  id: string;
  type: SlotType;
  seconds: number;
  /** What to find, or the instruction for an in-between slot. For a mystery slot, the clue. */
  find: string;
  where: string;
  link?: string;
  regions: RegionCode[];
  cost: Cost;
  rarity: Rarity;
  mystery: boolean;
  /** Id of an earlier slot that must be collected first. */
  lockedUntil?: string;
  spoiler: boolean;
  /** The creator's note, hidden until the reveal. */
  note: string;
  fallbacks: Fallback[];
  interference?: Interference;
}

export interface Warnings {
  flashing: boolean;
  loudNoises: boolean;
  upsettingThemes: boolean;
}

export interface Tape {
  format: 'side-c-tape';
  version: 1;
  id: string;
  title: string;
  creator: string;
  /** Free text: what the tape is about. */
  theme: string;
  liner: string;
  tier: TierId;
  difficulty: Difficulty;
  vibes: string[];
  arc?: [string, string, string];
  warnings: Warnings;
  slots: Slot[];
  createdAt: string;
  updatedAt: string;
}

export interface SlotProgress {
  collected: boolean;
  /** -1 for the main slot, 0–2 for a fallback. */
  via: number;
  myFind: string;
  start: string;
  end: string;
}

export type TapeProgress = Record<string, SlotProgress>;

export interface Settings {
  region: RegionCode;
  plainText: boolean;
  welcomed: boolean;
  /** Creator name used to prefill new tapes. */
  creatorName: string;
}
