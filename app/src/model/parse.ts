import { MAX_FALLBACKS, MEDIA_TYPES, SLOT_TYPES, TIER_IDS } from './constants';
import type {
  Cost, Difficulty, Fallback, InterferencePart, MediaType, Rarity, SceneInfo, SceneMedium, SceneMode, SceneStyle, Slot, SlotType, SongInfo, Tape, TierId,
} from './types';

// Reads a tape from untrusted JSON (a shared link or an imported file) and
// rebuilds it field by field, so nothing unexpected gets through.

const COST_IDS: Cost[] = ['free', 'subscription', 'rent-buy', 'archive', 'diy'];
const RARITY_IDS: Rarity[] = ['common', 'uncommon', 'rare', 'you'];
const DIFFICULTY_IDS: Difficulty[] = ['quick', 'medium', 'deep'];
const SCENE_MEDIUM_IDS: SceneMedium[] = ['film', 'tv', 'video', 'any'];
const SCENE_STYLE_IDS: SceneStyle[] = ['drama', 'animation', 'real', 'any'];
const SCENE_MODE_IDS: SceneMode[] = ['literal', 'mood', 'clash'];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, max = 2000): string => (typeof v === 'string' ? v.slice(0, max) : '');
const optStr = (v: unknown, max = 2000): string | undefined => (typeof v === 'string' && v.trim() ? v.slice(0, max) : undefined);
const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : 0);
const oneOf = <T extends string>(v: unknown, options: readonly T[], fallback: T): T =>
  options.includes(v as T) ? (v as T) : fallback;
const strList = (v: unknown, maxItems: number): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, maxItems).map((x) => x.slice(0, 40)) : [];

function parsePart(v: unknown): InterferencePart {
  const o = isObj(v) ? v : {};
  return { media: oneOf<MediaType>(o.media, MEDIA_TYPES, 'video'), find: str(o.find), where: str(o.where, 400), link: optStr(o.link, 500) };
}

function parseFallback(v: unknown): Fallback {
  const o = isObj(v) ? v : {};
  return { find: str(o.find), where: str(o.where, 400), link: optStr(o.link, 500), regions: strList(o.regions, 30), cost: oneOf(o.cost, COST_IDS, 'free') };
}

function parseSong(v: unknown): SongInfo {
  const o = isObj(v) ? v : {};
  const sections = Array.isArray(o.sections) ? o.sections.slice(0, 30) : [];
  return {
    mode: o.mode === 'open' ? 'open' : 'fixed',
    version: str(o.version, 200),
    minSeconds: num(o.minSeconds),
    maxSeconds: num(o.maxSeconds),
    sections: sections.map((x) => {
      const sec = isObj(x) ? x : {};
      return { name: str(sec.name, 60), optional: sec.optional === true };
    }),
  };
}

function parseScene(v: unknown): SceneInfo {
  const o = isObj(v) ? v : {};
  return {
    cue: str(o.cue, 60),
    at: typeof o.at === 'number' && Number.isFinite(o.at) ? Math.round(o.at) : undefined,
    medium: oneOf(o.medium, SCENE_MEDIUM_IDS, 'any'),
    style: oneOf(o.style, SCENE_STYLE_IDS, 'any'),
    mode: oneOf(o.mode, SCENE_MODE_IDS, 'mood'),
    differentFrom: optStr(o.differentFrom, 40),
  };
}

function parseSlot(v: unknown, index: number): Slot {
  const o = isObj(v) ? v : {};
  const type = oneOf<SlotType>(o.type, [...SLOT_TYPES, 'song', 'scene'], 'video');
  const slot: Slot = {
    id: str(o.id, 40) || `s${index + 1}`,
    type,
    seconds: num(o.seconds),
    find: str(o.find),
    where: str(o.where, 400),
    link: optStr(o.link, 500),
    regions: strList(o.regions, 30),
    cost: oneOf(o.cost, COST_IDS, 'free'),
    rarity: oneOf(o.rarity, RARITY_IDS, 'common'),
    mystery: o.mystery === true,
    lockedUntil: optStr(o.lockedUntil, 40),
    spoiler: o.spoiler === true,
    note: str(o.note),
    fallbacks: Array.isArray(o.fallbacks) ? o.fallbacks.slice(0, MAX_FALLBACKS).map(parseFallback) : [],
  };
  if (type === 'interference') {
    const i = isObj(o.interference) ? o.interference : {};
    slot.interference = {
      mode: i.mode === 'merge' ? 'merge' : 'clash',
      picture: parsePart(i.picture),
      sound: parsePart(i.sound),
      syncCue: str(i.syncCue, 400),
    };
  }
  if (type === 'song') slot.song = parseSong(o.song);
  if ((type === 'scene' || type === 'between') && isObj(o.scene)) slot.scene = parseScene(o.scene);
  return slot;
}

export class TapeFormatError extends Error {}

export function parseTape(input: unknown): Tape {
  if (!isObj(input) || input.format !== 'side-c-tape') throw new TapeFormatError('This isn’t a Side C tape.');
  if (input.version !== 1) throw new TapeFormatError('This tape was made with a newer version of Side C.');
  const slots = Array.isArray(input.slots) ? input.slots.slice(0, 40).map(parseSlot) : [];
  const arc = strList(input.arc, 3);
  const w = isObj(input.warnings) ? input.warnings : {};
  const now = new Date().toISOString();
  return {
    format: 'side-c-tape',
    version: 1,
    // Tapes from before sync tapes existed have no kind: they're mixtapes.
    kind: input.kind === 'sync' ? 'sync' : 'mixtape',
    id: str(input.id, 40) || 'imported',
    title: str(input.title, 120),
    creator: str(input.creator, 60),
    theme: str(input.theme, 200),
    liner: str(input.liner, 2000),
    tier: oneOf<TierId>(input.tier, TIER_IDS, 'C15'),
    difficulty: oneOf(input.difficulty, DIFFICULTY_IDS, 'medium'),
    vibes: strList(input.vibes, 3),
    arc: arc.length === 3 ? [arc[0], arc[1], arc[2]] : undefined,
    warnings: { flashing: w.flashing === true, loudNoises: w.loudNoises === true, upsettingThemes: w.upsettingThemes === true },
    slots,
    createdAt: str(input.createdAt, 40) || now,
    updatedAt: str(input.updatedAt, 40) || now,
  };
}
