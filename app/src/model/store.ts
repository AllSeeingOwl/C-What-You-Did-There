import { useSyncExternalStore } from 'react';
import { parseTape } from './parse';
import { SAMPLE_TAPES } from './sampleTapes';
import type { Settings, SlotProgress, Tape, TapeProgress } from './types';

// Everything is saved in this browser only (localStorage). There are no
// accounts yet, so nothing leaves the device unless you share a tape.

export type Origin = 'sample' | 'mine' | 'imported';
export interface ShelfTape {
  tape: Tape;
  origin: Origin;
  /** Your own tapes stay drafts until they pass every check. */
  draft: boolean;
}

interface State {
  tapes: ShelfTape[]; // yours and imported (samples are added on read)
  progress: Record<string, TapeProgress>;
  settings: Settings;
}

const KEY = 'sidec:v1';
const DEFAULT_SETTINGS: Settings = { region: 'GB', plainText: false, welcomed: false, creatorName: '' };

function load(): State {
  const empty: State = { tapes: [], progress: {}, settings: { ...DEFAULT_SETTINGS } };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    const data = JSON.parse(raw);
    const tapes: ShelfTape[] = [];
    for (const t of Array.isArray(data.tapes) ? data.tapes : []) {
      try {
        tapes.push({ tape: parseTape(t.tape), origin: t.origin === 'imported' ? 'imported' : 'mine', draft: t.draft === true });
      } catch {
        // Skip anything unreadable rather than lose the rest.
      }
    }
    return {
      tapes,
      progress: typeof data.progress === 'object' && data.progress ? data.progress : {},
      settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    };
  } catch {
    return empty;
  }
}

let state: State = load();
const listeners = new Set<() => void>();

function commit(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private browsing or full storage: keep working in memory.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(select: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

// Memoise the merged shelf so useSyncExternalStore sees a stable value.
let shelfCache: { from: ShelfTape[]; value: ShelfTape[] } | null = null;
export function allTapes(s: State): ShelfTape[] {
  if (shelfCache?.from === s.tapes) return shelfCache.value;
  const samples = SAMPLE_TAPES.map((tape) => ({ tape, origin: 'sample' as const, draft: false }));
  const value = [...s.tapes, ...samples];
  shelfCache = { from: s.tapes, value };
  return value;
}

export function findTape(s: State, id: string): ShelfTape | undefined {
  return allTapes(s).find((t) => t.tape.id === id);
}

export const EMPTY_PROGRESS: TapeProgress = {};

export const actions = {
  saveTape(tape: Tape, draft: boolean, origin: Origin = 'mine') {
    const updated = { ...tape, updatedAt: new Date().toISOString() };
    const rest = state.tapes.filter((t) => t.tape.id !== tape.id);
    commit({ ...state, tapes: [{ tape: updated, origin, draft }, ...rest] });
  },
  deleteTape(id: string) {
    const progress = { ...state.progress };
    delete progress[id];
    commit({ ...state, tapes: state.tapes.filter((t) => t.tape.id !== id), progress });
  },
  setSlotProgress(tapeId: string, slotId: string, value: SlotProgress) {
    const tapeProgress = { ...(state.progress[tapeId] ?? {}), [slotId]: value };
    commit({ ...state, progress: { ...state.progress, [tapeId]: tapeProgress } });
  },
  resetProgress(tapeId: string) {
    const progress = { ...state.progress };
    delete progress[tapeId];
    commit({ ...state, progress });
  },
  updateSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },
  clearEverything() {
    commit({ tapes: [], progress: {}, settings: { ...DEFAULT_SETTINGS } });
  },
};

export function getState(): State {
  return state;
}
