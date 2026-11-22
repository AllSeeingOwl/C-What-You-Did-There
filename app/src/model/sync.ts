import { CHOICE_COLOUR, LANES, SCENE_MEDIUMS, SCENE_STYLES, SYNC } from './constants';
import { parseTime } from './time';
import type { SceneMedium, SceneStyle, Slot, SlotProgress, Tape, TapeProgress } from './types';

// Sync tapes: one song as the soundtrack, with muted scenes cut in over it.
// The song is always the first slot; every slot after it is a scene (a clip
// to find, or a room scene of type 'between'). See docs/design-spec.md.

export type Medium = Exclude<SceneMedium, 'any'>;
export type Style = Exclude<SceneStyle, 'any'>;

export function isSync(tape: Pick<Tape, 'kind'>): boolean {
  return tape.kind === 'sync';
}

export function songSlot(tape: Pick<Tape, 'slots'>): Slot | undefined {
  const first = tape.slots[0];
  return first?.type === 'song' ? first : undefined;
}

export function isOpenSong(tape: Pick<Tape, 'slots'>): boolean {
  return songSlot(tape)?.song?.mode === 'open';
}

/** Everything after the song. */
export function scenes(tape: Pick<Tape, 'slots'>): Slot[] {
  return tape.slots.filter((s) => s.type !== 'song');
}

/** "Song", "Scene 3" for sync tapes; "Slot 3" for mixtapes. */
export function slotName(tape: Pick<Tape, 'kind' | 'slots'>, slot: Slot): string {
  const i = tape.slots.indexOf(slot);
  if (!isSync(tape)) return `Slot ${i + 1}`;
  return slot.type === 'song' ? 'Song' : `Scene ${songSlot(tape) ? i : i + 1}`;
}

/** The medium a scene uses: the tape's, or the collector's pick when the tape says "your choice". */
export function sceneMedium(slot: Slot, p?: SlotProgress): SceneMedium {
  const m = slot.scene?.medium ?? 'any';
  return m === 'any' && p?.medium ? p.medium : m;
}

export function sceneStyle(slot: Slot, p?: SlotProgress): SceneStyle {
  const s = slot.scene?.style ?? 'any';
  return s === 'any' && p?.style ? p.style : s;
}

export function sceneColour(slot: Slot, p?: SlotProgress): string {
  if (slot.type === 'between') return LANES.between.colour;
  if (slot.type === 'song') return LANES.song.colour;
  const m = sceneMedium(slot, p);
  return m === 'any' ? CHOICE_COLOUR : LANES[m].colour;
}

/** e.g. "TV · Animation", or "Your choice" when both are open. */
export function sceneKindLabel(slot: Slot, p?: SlotProgress): string {
  if (slot.type === 'between') return 'In the room';
  const m = sceneMedium(slot, p);
  const s = sceneStyle(slot, p);
  if (m === 'any' && s === 'any') return 'Your choice';
  return `${SCENE_MEDIUMS[m]} · ${SCENE_STYLES[s]}`;
}

// ---------- The song's clock ----------

/** How long the song runs: the tape's for a fixed song, the collector's for an open one. */
export function songLength(tape: Pick<Tape, 'slots'>, progress: TapeProgress = {}): number | null {
  const song = songSlot(tape);
  if (!song) return null;
  if (song.song?.mode !== 'open') return song.seconds;
  const end = progress[song.id]?.songEnd;
  return end ? parseTime(end) : null;
}

/** Problems with the collector's map of an open song. Empty means it's ready to play. */
export function songMapProblems(tape: Pick<Tape, 'slots'>, progress: TapeProgress): string[] {
  const song = songSlot(tape);
  if (!song?.song || song.song.mode !== 'open') return [];
  const p = progress[song.id];
  const times = p?.sectionTimes ?? [];
  const problems: string[] = [];
  let last = -1;
  song.song.sections.forEach((section, i) => {
    const text = (times[i] ?? '').trim();
    if (!text) {
      if (!section.optional) problems.push(`Add when “${section.name}” starts.`);
      return;
    }
    const t = parseTime(text);
    if (t === null) problems.push(`“${section.name}”: write the time as minutes:seconds, e.g. 0:42.`);
    else if (t <= last) problems.push(`“${section.name}” must start after the part before it.`);
    else last = t;
  });
  const endText = (p?.songEnd ?? '').trim();
  const end = endText ? parseTime(endText) : null;
  if (!endText) problems.push('Add when the song ends.');
  else if (end === null) problems.push('The song’s end: write it as minutes:seconds, e.g. 3:34.');
  else {
    if (end <= last) problems.push('The song must end after its last part starts.');
    const { minSeconds, maxSeconds } = song.song;
    if (end < minSeconds || end > maxSeconds) problems.push(`The brief asks for a song ${fmt(minSeconds)} to ${fmt(maxSeconds)} long.`);
  }
  return problems;
}

/** Whether a scene's section exists in the collector's song (always true for fixed songs). */
export function sectionMissing(tape: Pick<Tape, 'slots'>, slot: Slot, progress: TapeProgress): boolean {
  const song = songSlot(tape);
  if (!song?.song || song.song.mode !== 'open' || !slot.scene) return false;
  const i = song.song.sections.findIndex((s) => s.name === slot.scene!.cue);
  if (i < 0) return false;
  return song.song.sections[i].optional && !(progress[song.id]?.sectionTimes?.[i] ?? '').trim();
}

export interface Cue {
  slot: Slot;
  /** Start on the song's clock, in seconds. */
  at: number;
  /** Until the next scene starts, or the song ends. */
  seconds: number;
}

/**
 * When each scene plays, in order, leaving out skipped scenes. For an open
 * song this needs the collector's song map; returns null until it's complete.
 */
export function cueSheet(tape: Pick<Tape, 'slots'>, progress: TapeProgress = {}): Cue[] | null {
  const song = songSlot(tape);
  if (!song) return null;
  const end = songLength(tape, progress);
  if (end === null) return null;
  let starts: { slot: Slot; at: number | null }[];
  if (song.song?.mode === 'open') {
    if (songMapProblems(tape, progress).length > 0) return null;
    const times = progress[song.id]?.sectionTimes ?? [];
    starts = scenes(tape).map((slot) => {
      const i = song.song!.sections.findIndex((s) => s.name === slot.scene?.cue);
      const text = i >= 0 ? (times[i] ?? '').trim() : '';
      return { slot, at: text ? parseTime(text) : null };
    });
  } else {
    starts = scenes(tape).map((slot) => ({ slot, at: slot.scene?.at ?? null }));
  }
  const playing = starts.filter((s): s is { slot: Slot; at: number } => s.at !== null && !progress[s.slot.id]?.skipped);
  return playing.map((s, i) => {
    const next = playing[i + 1]?.at ?? end;
    return { slot: s.slot, at: s.at, seconds: Math.max(0, next - s.at) };
  });
}

// ---------- Variety ----------

export interface VarietyIssue {
  level: 'error' | 'warning';
  /** The scene the issue is about, or 'tape'. */
  where: string;
  message: string;
}

const cap = (n: number) => Math.ceil(n * SYNC.maxShare);
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
const norm = (s: string | undefined) => (s ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Scenes the collector has to find (not room scenes, and not skipped ones). */
export function foundScenes(tape: Pick<Tape, 'slots'>, progress: TapeProgress = {}): Slot[] {
  return tape.slots.filter((s) => s.type === 'scene' && !progress[s.id]?.skipped);
}

function countBy<T extends string>(values: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/**
 * The variety rules. Without progress, checks what the creator has fixed
 * (errors: the tape can't be published). With progress, checks the
 * collector's finds too (warnings: the app explains, it doesn't refuse).
 */
export function varietyIssues(tape: Pick<Tape, 'kind' | 'slots'>, progress?: TapeProgress): VarietyIssue[] {
  if (!isSync(tape)) return [];
  const issues: VarietyIssue[] = [];
  const collecting = progress !== undefined;
  const p = progress ?? {};
  const level = collecting ? 'warning' : 'error';
  const found = foundScenes(tape, p);
  const n = found.length;
  if (n === 0) return issues;
  const limit = cap(n);
  const name = (slot: Slot) => slotName(tape, slot);

  for (const [kind, labels, read] of [
    ['medium', SCENE_MEDIUMS, (s: Slot) => sceneMedium(s, collecting ? p[s.id] : undefined)],
    ['style', SCENE_STYLES, (s: Slot) => sceneStyle(s, collecting ? p[s.id] : undefined)],
  ] as const) {
    const values = found.map(read);
    const known = values.filter((v) => v !== 'any');
    const counts = countBy(known);
    for (const [value, count] of counts) {
      if (count > limit) {
        const last = found.filter((s) => read(s) === value).at(-1)!;
        issues.push({
          level,
          where: collecting ? last.id : 'tape',
          message: `${count} of the ${n} found scenes are ${labels[value as keyof typeof labels]}. No ${kind} can fill more than half (${limit} of ${n}).`,
        });
      }
    }
    const needed = kind === 'medium' ? SYNC.minMediums : SYNC.minStyles;
    if (known.length === n && counts.size < needed && n >= needed) {
      issues.push({ level, where: 'tape', message: `Use at least ${needed} different ${kind === 'medium' ? 'mediums' : 'styles'} across the scenes.` });
    }
  }

  // "Must differ from scene N": in medium and in style.
  for (const slot of found) {
    const other = slot.scene?.differentFrom;
    if (!other) continue;
    const target = tape.slots.find((s) => s.id === other);
    if (!target || target.type !== 'scene' || tape.slots.indexOf(target) >= tape.slots.indexOf(slot)) {
      if (!collecting) issues.push({ level: 'error', where: slot.id, message: `${name(slot)}: “must differ from” has to point to an earlier scene.` });
      continue;
    }
    const pick = collecting ? p : {};
    const sameMedium = sceneMedium(slot, pick[slot.id]) !== 'any' && sceneMedium(slot, pick[slot.id]) === sceneMedium(target, pick[target.id]);
    const sameStyle = sceneStyle(slot, pick[slot.id]) !== 'any' && sceneStyle(slot, pick[slot.id]) === sceneStyle(target, pick[target.id]);
    if (sameMedium || sameStyle) {
      issues.push({ level, where: slot.id, message: `${name(slot)} should use a different ${sameMedium ? 'medium' : 'style'} from ${name(target)}.` });
    }
  }

  if (!collecting) return issues;

  // Collector only: sources and clips.
  const collected = found.filter((s) => p[s.id]?.collected);
  const bySource = new Map<string, Slot[]>();
  for (const s of collected) {
    const key = norm(p[s.id]?.source);
    if (key) bySource.set(key, [...(bySource.get(key) ?? []), s]);
  }
  for (const list of bySource.values()) {
    if (list.length > SYNC.maxPerSource) {
      issues.push({
        level: 'warning',
        where: list.at(-1)!.id,
        message: `${list.map(name).join(', ')} all come from “${p[list[0].id]!.source!.trim()}”. Use one source for no more than ${SYNC.maxPerSource} scenes.`,
      });
    }
    const byClip = countBy(list.map((s) => norm(p[s.id]?.start)).filter(Boolean));
    for (const [start, count] of byClip) {
      if (count > 1) {
        const same = list.filter((s) => norm(p[s.id]?.start) === start);
        issues.push({ level: 'warning', where: same.at(-1)!.id, message: `${same.map(name).join(' and ')} look like the same clip. Never use the same clip twice.` });
      }
    }
  }
  return issues;
}
