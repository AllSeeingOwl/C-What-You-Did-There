import { LANES, TIER_MARGIN, TIERS } from './constants';
import type { SlotType, Tape, TierId } from './types';

export function totalSeconds(tape: Pick<Tape, 'slots'>): number {
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

/** Share of running time for each colour, for the J-card stripe. */
export function mediaMix(tape: Pick<Tape, 'slots'>): { type: SlotType; colour: string; share: number }[] {
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
