// The shape of a Side C tape. A tape is instructions only: descriptions,
// lengths, where to look and (optionally) a link to an official source.
// It never holds the media itself, transcripts or lyrics.

export type MediaType = 'radio' | 'tv' | 'film' | 'video' | 'podcast';
/**
 * 'song' and 'scene' are only used in sync tapes: the song is the soundtrack,
 * and each scene is a muted clip cut in over it. Room scenes use 'between'.
 */
export type SlotType = MediaType | 'between' | 'interference' | 'song' | 'scene';
/** A normal tape, or a sync tape (a home-made music video). */
export type TapeKind = 'mixtape' | 'sync';
/** 'any' means the collector chooses, and says which when they record their find. */
export type SceneMedium = 'film' | 'tv' | 'video' | 'any';
export type SceneStyle = 'drama' | 'animation' | 'real' | 'any';
export type SceneMode = 'literal' | 'mood' | 'clash';
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

export interface SongSection {
  name: string;
  /** Not every song has one (a bridge, say). Scenes cued to a missing section are skipped. */
  optional: boolean;
}

/** Details of the soundtrack, on the sync tape's song slot. */
export interface SongInfo {
  /** 'fixed': the creator names the song. 'open': the collector picks one that fits the brief. */
  mode: 'fixed' | 'open';
  /** Fixed songs: the exact version, e.g. "album version, 3:34". */
  version: string;
  /** Open songs: how long the chosen song may be. Fixed songs use the slot's length. */
  minSeconds: number;
  maxSeconds: number;
  /** Open songs: the parts the collector maps, in order. */
  sections: SongSection[];
}

/** Where a sync tape scene sits in the song, and what kind of clip it needs. */
export interface SceneInfo {
  /** Open songs: the name of the section it plays during. Fixed songs: a short label, e.g. "First chorus". */
  cue: string;
  /** Fixed songs: when it starts on the song's clock, in seconds. */
  at?: number;
  medium: SceneMedium;
  style: SceneStyle;
  mode: SceneMode;
  /** Id of an earlier scene this one must differ from in medium and style. */
  differentFrom?: string;
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
  /** Sync tapes only. */
  song?: SongInfo;
  scene?: SceneInfo;
}

export interface Warnings {
  flashing: boolean;
  loudNoises: boolean;
  upsettingThemes: boolean;
}

export interface Tape {
  format: 'side-c-tape';
  version: 1;
  kind: TapeKind;
  id: string;
  title: string;
  creator: string;
  /** Free text: what the tape is about. */
  theme: string;
  liner: string;
  /** Mixtapes only: sync tapes are as long as their song. */
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
  /** Sync tapes: the film, programme, series or channel it came from, for the variety rules. */
  source?: string;
  /** Sync tapes: what the collector picked, for scenes where the tape says "your choice". */
  medium?: Exclude<SceneMedium, 'any'>;
  style?: Exclude<SceneStyle, 'any'>;
  /** Sync tapes: the collector's song has no such section, so this scene is skipped. */
  skipped?: boolean;
  /** Sync tapes, song slot: when each section starts in the collector's song ("0:42"), in order. */
  sectionTimes?: string[];
  /** Sync tapes, song slot: when the song ends. */
  songEnd?: string;
}

export type TapeProgress = Record<string, SlotProgress>;

export interface Settings {
  region: RegionCode;
  plainText: boolean;
  welcomed: boolean;
  /** Creator name used to prefill new tapes. */
  creatorName: string;
}
