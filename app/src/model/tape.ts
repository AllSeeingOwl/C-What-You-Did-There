import { LANES, TIER_MARGIN, TIERS } from './constants';
import { formatTime } from './time';
import type { SlotType, Tape, TierId } from './types';

/** A sync tape runs as long as its song (for an open song, the longest the brief allows). */
export function totalSeconds(tape: Pick<Tape, 'slots'>): number {
  const song = tape.slots.find((s) => s.type === 'song');
  if (song) return song.song?.mode === 'open' ? song.song.maxSeconds : song.seconds;
  return tape.slots.reduce((sum, s) => sum + (Number.isFinite(s.seconds) ? s.seconds : 0), 0);
}

/** Where each slot starts in the running order, in seconds. */
export function slotOffsets(tape: Pick<Tape, 'slots'>): number[] {
  let at = 0;
  return tape.slots.map((s) => {
    const start = at;
    at += s.seconds;
    return start;
  });
}

/** The tier's running time with the 10% "close enough" margin applied. */
export function tierRange(tier: TierId): { min: number; max: number } {
  const t = TIERS[tier];
  return {
    min: Math.round(t.minSeconds * (1 - TIER_MARGIN)),
    max: Math.round(t.maxSeconds * (1 + TIER_MARGIN)),
  };
}

export function hasInterference(tape: Pick<Tape, 'slots'>): boolean {
  return tape.slots.some((s) => s.type === 'interference');
}

/** "C15 · 8:00 · 12 slots", "Music video · 3:34 · 10 scenes" or "Music video · open song · 10 scenes". */
export function lengthLabel(tape: Pick<Tape, 'kind' | 'tier' | 'slots'>): string {
  if (tape.kind !== 'sync') return `${tape.tier} · ${formatTime(totalSeconds(tape))} · ${tape.slots.length} slots`;
  const song = tape.slots.find((s) => s.type === 'song');
  const count = tape.slots.filter((s) => s.type !== 'song').length;
  const length = !song ? 'no song yet' : song.song?.mode === 'open' ? 'open song' : formatTime(song.seconds);
  return `Music video · ${length} · ${count} ${count === 1 ? 'scene' : 'scenes'}`;
}

/** Share of running time for each colour, for the J-card stripe. */
export function mediaMix(tape: Pick<Tape, 'slots'>): { type: SlotType; colour: string; share: number }[] {
  if (tape.slots.some((s) => s.type === 'song')) return syncMix(tape);
  const total = totalSeconds(tape) || 1;
  const byType = new Map<string, { type: SlotType; colour: string; seconds: number }>();
  for (const s of tape.slots) {
    // Interference splits its time between picture and sound colours.
    const parts: [SlotType, number][] =
      s.type === 'interference' && s.interference
        ? [[s.interference.picture.media, s.seconds / 2], [s.interference.sound.media, s.seconds / 2]]
        : [[s.type, s.seconds]];
    for (const [type, secs] of parts) {
      const entry = byType.get(type) ?? { type, colour: LANES[type].colour, seconds: 0 };
      entry.seconds += secs;
      byType.set(type, entry);
    }
  }
  return [...byType.values()].map((e) => ({ type: e.type, colour: e.colour, share: e.seconds / total }));
}

export function slotNumber(tape: Pick<Tape, 'slots'>, slotId: string): number {
  return tape.slots.findIndex((s) => s.id === slotId) + 1;
}

export function newId(prefix = ''): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return prefix + rand;
}

/**
 * Sync tapes: a quarter for the song, the rest shared between scenes by
 * medium. Scenes where the collector chooses show as "your choice".
 */
function syncMix(tape: Pick<Tape, 'slots'>): { type: SlotType; colour: string; share: number }[] {
  const pictures = tape.slots.filter((s) => s.type !== 'song');
  const songShare = pictures.length ? 0.25 : 1;
  const counts = new Map<SlotType, number>();
  for (const s of pictures) {
    const type: SlotType = s.type === 'between' ? 'between' : s.scene && s.scene.medium !== 'any' ? s.scene.medium : 'scene';
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [
    { type: 'song' as SlotType, colour: LANES.song.colour, share: songShare },
    ...[...counts].map(([type, n]) => ({ type, colour: LANES[type].colour, share: ((1 - songShare) * n) / pictures.length })),
  ];
}
