import type { Slot, SlotProgress, Tape, TapeProgress } from './types';

export const EMPTY_SLOT_PROGRESS: SlotProgress = { collected: false, via: -1, myFind: '', start: '', end: '' };

/** In-between slots need nothing finding, so they count as collected from the start. */
export function isCollected(slot: Slot, progress: TapeProgress): boolean {
  return slot.type === 'between' || progress[slot.id]?.collected === true;
}

export function isLocked(slot: Slot, tape: Tape, progress: TapeProgress): boolean {
  if (!slot.lockedUntil) return false;
  const key = tape.slots.find((s) => s.id === slot.lockedUntil);
  return key ? !isCollected(key, progress) : false;
}

export function collectedCount(tape: Tape, progress: TapeProgress): number {
  return tape.slots.filter((s) => isCollected(s, progress)).length;
}

export function isComplete(tape: Tape, progress: TapeProgress): boolean {
  return tape.slots.length > 0 && collectedCount(tape, progress) === tape.slots.length;
}

/** True once the collector has collected anything that needed finding. */
export function hasStarted(tape: Tape, progress: TapeProgress): boolean {
  return tape.slots.some((s) => s.type !== 'between' && progress[s.id]?.collected);
}
