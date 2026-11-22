import { MAX_FALLBACKS, MAX_INTERFERENCE, MAX_VIBES, MIN_SLOTS, SLOT_LIMITS, SYNC, TIERS, VIBES } from './constants';
import { isSync, slotName, songSlot, varietyIssues } from './sync';
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
  if (slot.type === 'song') return SYNC.song;
  if (slot.type === 'scene') return SYNC.scene;
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
  const label = slotName(tape, slot);
  const err = (message: string) => issues.push({ level: 'error', where: slot.id, message: `${label}: ${message}` });
  const warn = (message: string) => issues.push({ level: 'warning', where: slot.id, message: `${label}: ${message}` });

  const { min, max } = slotLimits(slot);
  // Sync tape scenes take their length from the song; validateSync checks them.
  const timedHere = !isSync(tape);
  if (timedHere && (!Number.isFinite(slot.seconds) || slot.seconds < min || slot.seconds > max)) {
    const kind = slot.type === 'between' ? 'In-between slots' : slot.type === 'interference' ? 'Interference' : 'Clips';
    err(`${kind} run ${formatTime(min)} to ${formatTime(max)}.`);
  } else if (timedHere && slot.type !== 'between' && slot.type !== 'interference' && slot.seconds > 60) {
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
    if (slot.type === 'song') err(slot.song?.mode === 'open' ? 'write the brief: what kind of song to pick.' : 'name the song and who it’s by.');
    else err(slot.type === 'between' ? 'say what to do in the room.' : slot.mystery ? 'write the clue.' : 'say what to find.');
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
    if (keyIndex < 0 || keyIndex >= index) err(`it must unlock from an earlier ${isSync(tape) ? 'scene' : 'slot'}.`);
    else if (tape.slots[keyIndex].type === 'between') err(`it must unlock from something you find, not ${isSync(tape) ? 'a room scene' : 'an in-between'}.`);
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
  if (isSync(tape)) validateSync(tape, issues);
  else if (!tier) err('Choose a tier: C5, C15 or C30.');
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
  if (!isSync(tape) && tape.slots.some((s) => s.type === 'song' || s.type === 'scene')) err('Songs and scenes belong in sync tapes only.');

  const ids = new Set<string>();
  tape.slots.forEach((slot, i) => {
    if (ids.has(slot.id)) err(`${slotName(tape, slot)} has a duplicate id.`);
    ids.add(slot.id);
    checkSlot(slot, i, tape, issues);
  });

  if (!tape.liner.trim()) warn('Liner notes help collectors decide to start: a line or two is plenty.');
  if (looksLikeQuotation(tape.liner)) warn('The liner notes look like a long quotation. Use your own words.');

  return issues;
}

/** The rules for sync tapes: the song, the scenes' cues and lengths, and variety. */
function validateSync(tape: Tape, issues: Issue[]) {
  const err = (where: string, message: string) => issues.push({ level: 'error', where, message });
  const warn = (where: string, message: string) => issues.push({ level: 'warning', where, message });
  const song = songSlot(tape);
  if (!song) {
    err('tape', 'A sync tape starts with its song. Add the song first.');
    return;
  }
  if (tape.slots.filter((s) => s.type === 'song').length > 1) err('tape', 'A sync tape has exactly one song.');
  const info = song.song;
  if (!info) err(song.id, 'Song: choose whether you name the song or give a brief.');
  else if (info.mode === 'fixed') {
    if (!Number.isFinite(song.seconds) || song.seconds < SYNC.song.min || song.seconds > SYNC.song.max) {
      err(song.id, `Song: songs run ${formatTime(SYNC.song.min)} to ${formatTime(SYNC.song.max)}.`);
    }
    if (!info.version.trim()) err(song.id, 'Song: say which version (for example “album version, 3:34”), so the timings line up.');
  } else {
    const { minSeconds: lo, maxSeconds: hi } = info;
    if (lo < SYNC.song.min || hi > SYNC.song.max || lo > hi) {
      err(song.id, `Song: the brief’s length must sit between ${formatTime(SYNC.song.min)} and ${formatTime(SYNC.song.max)}, shortest first.`);
    }
    const names = info.sections.map((x) => x.name.trim());
    if (names.length < 2) err(song.id, 'Song: list at least two parts of the song for collectors to map (for example Verse 1, Chorus 1).');
    if (names.some((x) => !x)) err(song.id, 'Song: every part of the song needs a name.');
    if (new Set(names.map((x) => x.toLowerCase())).size !== names.length) err(song.id, 'Song: each part of the song needs a different name.');
  }

  const pictures = tape.slots.slice(1);
  const rooms = pictures.filter((s) => s.type === 'between').length;
  if (pictures.length < SYNC.minScenes) err('tape', `A sync tape needs at least ${SYNC.minScenes} scenes.`);
  if (pictures.length > SYNC.maxScenes) err('tape', `A sync tape holds up to ${SYNC.maxScenes} scenes.`);
  if (rooms > SYNC.maxRoomScenes) err('tape', `Up to ${SYNC.maxRoomScenes} room scenes per tape.`);

  let lastSection = -1;
  let lastAt = -1;
  pictures.forEach((slot, k) => {
    const label = slotName(tape, slot);
    if (slot.type !== 'scene' && slot.type !== 'between') {
      err(slot.id, `${label}: sync tapes hold scenes and room scenes only.`);
      return;
    }
    const scene = slot.scene;
    if (!scene) {
      err(slot.id, `${label}: say when it plays.`);
      return;
    }
    if (info?.mode === 'open') {
      const i = info.sections.findIndex((x) => x.name === scene.cue);
      if (i < 0) err(slot.id, `${label}: choose which part of the song it plays during.`);
      else if (i <= lastSection) err(slot.id, `${label}: scenes play in song order, one per part. It must come after the part ${slotName(tape, pictures[k - 1])} uses.`);
      else lastSection = i;
    } else if (info) {
      const at = scene.at;
      if (at === undefined || !Number.isFinite(at)) err(slot.id, `${label}: say when it starts on the song’s clock.`);
      else if (at >= song.seconds) err(slot.id, `${label}: it starts after the song ends (${formatTime(song.seconds)}).`);
      else if (at <= lastAt) err(slot.id, `${label}: it must start after ${slotName(tape, pictures[k - 1])}.`);
      else {
        const nextAt = pictures[k + 1]?.scene?.at;
        const end = nextAt !== undefined && nextAt > at ? nextAt : song.seconds;
        const length = end - at;
        if (length < SYNC.scene.min || length > SYNC.scene.max) {
          err(slot.id, `${label}: scenes run ${SYNC.scene.min} seconds to ${formatTime(SYNC.scene.max)}. This one runs ${formatTime(length)}.`);
        } else if (length < SYNC.sceneComfort.min) {
          warn(slot.id, `${label}: ${length} seconds is quick to switch by hand. ${SYNC.sceneComfort.min} to ${SYNC.sceneComfort.max} seconds works best.`);
        }
        lastAt = at;
      }
    }
  });
  if (info?.mode === 'fixed' && pictures[0]?.scene?.at !== undefined && pictures[0].scene.at > 0) {
    warn('tape', `Nothing plays over the first ${formatTime(pictures[0].scene.at)} of the song. That’s fine if you meant it.`);
  }
  issues.push(...varietyIssues(tape));
}

export function isPublishable(tape: Tape): boolean {
  return validateTape(tape).every((i) => i.level !== 'error');
}
