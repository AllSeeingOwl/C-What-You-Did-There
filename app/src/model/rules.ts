import { MAX_FALLBACKS, MAX_INTERFERENCE, MAX_VIBES, MIN_SLOTS, SLOT_LIMITS, TIERS, VIBES } from './constants';
import { tierRange, totalSeconds } from './tape';
import { formatTime } from './time';
import type { Slot, Tape } from './types';

// Checks a tape against the rules in docs/design-spec.md and
// docs/community-guidelines.md. Errors block publishing; warnings don't.

export interface Issue {
  level: 'error' | 'warning';
  /** 'tape' for the whole tape, otherwise the slot id. */
  where: string;
  message: string;
}

export function slotLimits(slot: Pick<Slot, 'type'>): { min: number; max: number } {
  if (slot.type === 'between') return SLOT_LIMITS.between;
  if (slot.type === 'interference') return SLOT_LIMITS.interference;
  return SLOT_LIMITS.clip;
}

/** Links must be ordinary web pages: no file downloads, torrents or magnet links. */
export function checkLink(link: string | undefined): string | null {
  if (!link || !link.trim()) return null;
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return 'This link isn’t a full web address. It should start with https://';
  }
  if (url.protocol !== 'https:') return 'Links must start with https://';
  if (/\.(mp3|mp4|m4a|wav|flac|ogg|mkv|avi|mov|webm|torrent|zip|rar)$/i.test(url.pathname)) {
    return 'Link to the official page, not to a media file or download.';
  }
  return null;
}

/** A long passage in quotation marks probably copies a transcript or lyric. */
export function looksLikeQuotation(text: string): boolean {
  const quoted = text.match(/["“”'‘’][^"“”]{70,}["“”'‘’]/);
  return quoted !== null;
}

function checkSlot(slot: Slot, index: number, tape: Tape, issues: Issue[]) {
  const n = index + 1;
  const err = (message: string) => issues.push({ level: 'error', where: slot.id, message: `Slot ${n}: ${message}` });
  const warn = (message: string) => issues.push({ level: 'warning', where: slot.id, message: `Slot ${n}: ${message}` });

  const { min, max } = slotLimits(slot);
  if (!Number.isFinite(slot.seconds) || slot.seconds < min || slot.seconds > max) {
    const kind = slot.type === 'between' ? 'In-between slots' : slot.type === 'interference' ? 'Interference' : 'Clips';
    err(`${kind} run ${formatTime(min)} to ${formatTime(max)}.`);
  } else if (slot.type !== 'between' && slot.type !== 'interference' && slot.seconds > 60) {
    warn('most clips work best under a minute.');
  }

  if (slot.type === 'interference') {
    const i = slot.interference;
    if (!i) err('Interference needs a picture, a sound and a sync cue.');
    else {
      if (!i.picture.find.trim()) err('describe the muted picture.');
      if (!i.sound.find.trim()) err('describe the sound.');
      if (!i.syncCue.trim()) err('add a sync cue: when should the sound start?');
      for (const part of [i.picture, i.sound]) {
        const bad = checkLink(part.link);
        if (bad) err(bad);
      }
    }
  } else if (!slot.find.trim()) {
    err(slot.type === 'between' ? 'say what to do in the room.' : slot.mystery ? 'write the clue.' : 'say what to find.');
  }

  if (slot.type !== 'between') {
    if (slot.type !== 'interference' && !slot.where.trim()) warn('say where to look.');
    if (slot.regions.length === 0) err('choose where it’s available (Worldwide or one or more countries).');
    const bad = checkLink(slot.link);
    if (bad) err(bad);
  }

  if (slot.fallbacks.length > MAX_FALLBACKS) err(`up to ${MAX_FALLBACKS} fallbacks.`);
  slot.fallbacks.forEach((f, fi) => {
    const label = `fallback ${String.fromCharCode(65 + fi)}`;
    if (!f.find.trim()) err(`${label} needs a description.`);
    if (f.regions.length === 0) err(`${label}: choose where it’s available.`);
    const bad = checkLink(f.link);
    if (bad) err(`${label}: ${bad}`);
  });

  if (slot.lockedUntil) {
    const keyIndex = tape.slots.findIndex((s) => s.id === slot.lockedUntil);
    if (keyIndex < 0 || keyIndex >= index) err('a locked slot must unlock from an earlier slot.');
    else if (tape.slots[keyIndex].type === 'between') err('a locked slot must unlock from a slot you find, not an in-between.');
  }

  const texts = [slot.find, slot.where, slot.note, slot.interference?.picture.find ?? '', slot.interference?.sound.find ?? ''];
  if (texts.some(looksLikeQuotation)) {
    warn('this looks like a long quotation. Describe the moment in your own words instead of copying what’s said or sung.');
  }
}

export function validateTape(tape: Tape): Issue[] {
  const issues: Issue[] = [];
  const err = (message: string) => issues.push({ level: 'error', where: 'tape', message });
  const warn = (message: string) => issues.push({ level: 'warning', where: 'tape', message });

  if (!tape.title.trim()) err('Give the tape a title.');
  if (tape.title.length > 60) err('Keep the title to 60 characters or fewer.');
  if (!tape.creator.trim()) err('Add a creator name.');

  const tier = TIERS[tape.tier];
  if (!tier) err('Choose a tier: C5, C15 or C30.');
  else {
    const count = tape.slots.length;
    if (count < MIN_SLOTS) err(`A tape needs at least ${MIN_SLOTS} slots.`);
    if (count > tier.maxSlots) err(`A ${tier.id} holds up to ${tier.maxSlots} slots.`);
    const { min, max } = tierRange(tape.tier);
    const total = totalSeconds(tape);
    if (total < min || total > max) {
      err(`A ${tier.id} runs ${formatTime(tier.minSeconds)} to ${formatTime(tier.maxSeconds)} (${formatTime(min)} to ${formatTime(max)} is close enough). This one runs ${formatTime(total)}.`);
    }
  }

  if (tape.vibes.length > MAX_VIBES) err(`Pick up to ${MAX_VIBES} vibes.`);
  if (tape.vibes.some((v) => !VIBES.includes(v))) err('Vibes must come from the list.');
  if (tape.arc && tape.arc.some((v) => !VIBES.includes(v))) err('Each step of the vibe arc must be a vibe from the list.');

  const interference = tape.slots.filter((s) => s.type === 'interference').length;
  if (interference > MAX_INTERFERENCE) err(`At most ${MAX_INTERFERENCE} Interference slots per tape.`);

  const ids = new Set<string>();
  tape.slots.forEach((slot, i) => {
    if (ids.has(slot.id)) err(`Slot ${i + 1} has a duplicate id.`);
    ids.add(slot.id);
    checkSlot(slot, i, tape, issues);
  });

  if (!tape.liner.trim()) warn('Liner notes help collectors decide to start: a line or two is plenty.');
  if (looksLikeQuotation(tape.liner)) warn('The liner notes look like a long quotation. Use your own words.');

  return issues;
}

export function isPublishable(tape: Tape): boolean {
  return validateTape(tape).every((i) => i.level !== 'error');
}
