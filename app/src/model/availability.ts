import { regionName, WORLD } from './constants';
import type { RegionCode, Slot, Tape } from './types';

// A slot "works" somewhere if the slot itself, or any of its fallbacks,
// is available there. In-between slots are done in the room, so they
// always work.

function optionRegions(slot: Slot): RegionCode[][] {
  if (slot.type === 'between') return [[WORLD]];
  return [slot.regions, ...slot.fallbacks.map((f) => f.regions)];
}

export function slotWorksWorldwide(slot: Slot): boolean {
  return optionRegions(slot).some((r) => r.includes(WORLD));
}

export function slotWorksIn(slot: Slot, region: RegionCode): boolean {
  return optionRegions(slot).some((r) => r.includes(WORLD) || r.includes(region));
}

export interface TapeAvailability {
  worldwide: boolean;
  worldwideCount: number;
  total: number;
  /** Country where the most slots work (only set when the tape isn't worldwide). */
  best?: RegionCode;
  /** How many slots work in the collector's own region. */
  hereCount: number;
  worksHere: boolean;
}

export function tapeAvailability(tape: Pick<Tape, 'slots'>, here: RegionCode): TapeAvailability {
  const total = tape.slots.length;
  const worldwideCount = tape.slots.filter(slotWorksWorldwide).length;
  const worldwide = total > 0 && worldwideCount === total;
  const hereCount = here === WORLD ? worldwideCount : tape.slots.filter((s) => slotWorksIn(s, here)).length;

  let best: RegionCode | undefined;
  if (!worldwide) {
    const counts = new Map<string, number>();
    for (const slot of tape.slots) {
      const places = new Set(optionRegions(slot).flat().filter((r) => r !== WORLD));
      for (const p of places) counts.set(p, (counts.get(p) ?? 0) + 1);
    }
    let bestCount = -1;
    for (const [code, n] of counts) {
      if (n > bestCount) {
        best = code;
        bestCount = n;
      }
    }
  }
  return { worldwide, worldwideCount, total, best, hereCount, worksHere: hereCount === total };
}

/** e.g. "Worldwide" or "Best in the UK · 9 of 12 slots worldwide" */
export function availabilityLabel(a: TapeAvailability): string {
  if (a.worldwide) return 'Worldwide';
  const best = a.best ? `Best in ${regionName(a.best)} · ` : '';
  return `${best}${a.worldwideCount} of ${a.total} slots worldwide`;
}
