import { describe, expect, it } from 'vitest';
import { tapeAvailability } from './availability';
import { parseTape } from './parse';
import { validateTape } from './rules';
import { LAST_TRAIN_OUT, RAIN_ON_A_TUESDAY } from './sampleTapes';
import { decodeTape, encodeTape } from './share';
import { cueSheet, sectionMissing, songMapProblems, varietyIssues } from './sync';
import { lengthLabel, mediaMix, totalSeconds } from './tape';
import type { SceneInfo, Slot, SlotProgress, Tape, TapeProgress } from './types';

// Sync tapes: docs/design-spec.md, "Sync tapes".

const errors = (t: Tape) => validateTape(t).filter((i) => i.level === 'error').map((i) => i.message);
const got = (extra: Partial<SlotProgress> = {}): SlotProgress => ({ collected: true, via: -1, myFind: '', start: '', end: '', ...extra });

const fixedSong: Slot = {
  id: 'song', type: 'song', seconds: 120, find: '[SONG] by [ARTIST]', where: 'Streaming services', regions: ['WORLD'], cost: 'free',
  rarity: 'common', mystery: false, spoiler: false, note: '', fallbacks: [],
  song: { mode: 'fixed', version: 'album version, 2:00', minSeconds: 0, maxSeconds: 0, sections: [] },
};
const scene = (id: string, info: Partial<SceneInfo>): Slot => ({
  id, type: 'scene', seconds: 0, find: 'Something', where: 'Somewhere', regions: ['WORLD'], cost: 'free', rarity: 'common',
  mystery: false, spoiler: false, note: '', fallbacks: [], scene: { cue: '', medium: 'film', style: 'drama', mode: 'mood', ...info },
});
const syncTape = (slots: Slot[]): Tape => ({ ...LAST_TRAIN_OUT, id: 'x', slots });
/** Four scenes over a two-minute song: 0:00, 0:20, 0:40, 1:20. */
const fixedTape = (extra: Partial<SceneInfo>[] = []) =>
  syncTape([
    fixedSong,
    scene('a', { at: 0, medium: 'film', style: 'drama', ...extra[0] }),
    scene('b', { at: 20, medium: 'tv', style: 'animation', ...extra[1] }),
    scene('c', { at: 40, medium: 'video', style: 'real', ...extra[2] }),
    scene('d', { at: 80, medium: 'film', style: 'real', ...extra[3] }),
  ]);

/** A full map of the sample's song, with or without a bridge. */
function mapped(bridge: boolean): TapeProgress {
  const times = ['0:00', '0:12', '0:30', '0:48', '1:10', '1:30', '1:36', bridge ? '2:00' : '', '2:20', '2:50'];
  return { song: got({ sectionTimes: times, songEnd: '3:10' }) };
}

describe('the sample sync tape', () => {
  it('passes every rule, and works worldwide', () => {
    expect(errors(LAST_TRAIN_OUT)).toEqual([]);
    expect(tapeAvailability(LAST_TRAIN_OUT, 'US').worldwide).toBe(true);
  });

  it('is labelled as an open-song sync tape', () => {
    expect(lengthLabel(LAST_TRAIN_OUT)).toBe('Music video · open song · 10 scenes');
    expect(lengthLabel(RAIN_ON_A_TUESDAY)).toBe('C15 · 8:00 · 12 slots');
    expect(totalSeconds(LAST_TRAIN_OUT)).toBe(270);
  });

  it('survives a share link', () => {
    expect(decodeTape(encodeTape(LAST_TRAIN_OUT))).toEqual(LAST_TRAIN_OUT);
  });

  it('has a media mix that adds up', () => {
    expect(mediaMix(LAST_TRAIN_OUT).reduce((a, m) => a + m.share, 0)).toBeCloseTo(1);
  });
});

describe('mapping an open song', () => {
  it('needs every part that isn’t optional, and the end', () => {
    const problems = songMapProblems(LAST_TRAIN_OUT, {});
    expect(problems).toContain('Add when “Intro” starts.');
    expect(problems.join()).not.toMatch(/Bridge/);
    expect(problems).toContain('Add when the song ends.');
    expect(songMapProblems(LAST_TRAIN_OUT, mapped(false))).toEqual([]);
  });

  it('wants parts in order and a song that fits the brief', () => {
    const p = mapped(true);
    p.song.sectionTimes![2] = '0:05';
    expect(songMapProblems(LAST_TRAIN_OUT, p).join()).toMatch(/after the part before/);
    expect(songMapProblems(LAST_TRAIN_OUT, { song: got({ ...mapped(true).song, songEnd: '5:00' }) }).join()).toMatch(/2:30 to 4:30/);
  });

  it('builds the cue sheet from the map, skipping a missing bridge', () => {
    const bridge = LAST_TRAIN_OUT.slots.find((s) => s.id === 'p8')!;
    expect(cueSheet(LAST_TRAIN_OUT, {})).toBeNull();
    expect(sectionMissing(LAST_TRAIN_OUT, bridge, mapped(false))).toBe(true);
    expect(sectionMissing(LAST_TRAIN_OUT, bridge, mapped(true))).toBe(false);

    const withBridge = cueSheet(LAST_TRAIN_OUT, mapped(true))!;
    expect(withBridge).toHaveLength(10);
    expect(withBridge[0]).toMatchObject({ at: 0, seconds: 12 });
    expect(withBridge.at(-1)).toMatchObject({ at: 170, seconds: 20 });

    const noBridge = cueSheet(LAST_TRAIN_OUT, { ...mapped(false), p8: got({ skipped: true }) })!;
    expect(noBridge.map((c) => c.slot.id)).not.toContain('p8');
    expect(noBridge.find((c) => c.slot.id === 'p7')).toMatchObject({ at: 96, seconds: 44 });
  });
});

describe('fixed songs', () => {
  it('times scenes from the song’s clock', () => {
    expect(errors(fixedTape())).toEqual([]);
    expect(cueSheet(fixedTape())!.map((c) => c.seconds)).toEqual([20, 20, 40, 40]);
    expect(lengthLabel(fixedTape())).toBe('Music video · 2:00 · 4 scenes');
  });

  it('keeps scenes between 4 seconds and a minute', () => {
    expect(errors(fixedTape([{}, { at: 2 }])).join()).toMatch(/Scene 1: scenes run 4 seconds to 1:00\. This one runs 0:02/);
    expect(errors(fixedTape([{}, {}, { at: 10 }])).join()).toMatch(/must start after Scene 2/);
    const long = syncTape([fixedSong, scene('a', { at: 0 }), scene('b', { at: 10, medium: 'tv' }), scene('c', { at: 20, medium: 'video', style: 'real' })]);
    expect(errors(long).join()).toMatch(/This one runs 1:40/);
  });

  it('needs the version, and a song of 1:30 to 6:00', () => {
    const t = fixedTape();
    t.slots[0] = { ...fixedSong, seconds: 60, song: { ...fixedSong.song!, version: '' } };
    const e = errors(t).join();
    expect(e).toMatch(/which version/);
    expect(e).toMatch(/songs run 1:30 to 6:00/);
  });

  it('starts with exactly one song and holds scenes only', () => {
    expect(errors(syncTape([scene('a', { at: 0 })])).join()).toMatch(/starts with its song/);
    const inter = { ...scene('i', { at: 90 }), type: 'interference' as const };
    expect(errors(syncTape([...fixedTape().slots, inter])).join()).toMatch(/scenes and room scenes only/);
    expect(errors({ ...RAIN_ON_A_TUESDAY, slots: [...RAIN_ON_A_TUESDAY.slots, fixedSong] }).join()).toMatch(/sync tapes only/);
  });
});

describe('open-song cues', () => {
  it('play in song order, one per part', () => {
    const t = structuredClone(LAST_TRAIN_OUT);
    t.slots[3].scene!.cue = 'Intro';
    expect(errors(t).join()).toMatch(/Scene 3: scenes play in song order/);
    t.slots[3].scene!.cue = 'Middle eight';
    expect(errors(t).join()).toMatch(/Scene 3: choose which part/);
  });
});

describe('variety', () => {
  it('stops one medium or style filling more than half', () => {
    const allFilm = fixedTape([{}, { medium: 'film' }]);
    expect(errors(allFilm).join()).toMatch(/3 of the 4 found scenes are Film/);
    const allDrama = fixedTape([{}, { style: 'drama' }, { style: 'drama' }, { style: 'animation' }]);
    expect(errors(allDrama).join()).toMatch(/3 of the 4 found scenes are Drama/);
  });

  it('leaves room for the collector when they choose', () => {
    expect(errors(fixedTape([{}, { medium: 'any', style: 'any' }, { medium: 'any', style: 'any' }, { medium: 'any', style: 'any' }]))).toEqual([]);
  });

  it('warns collectors about their own picks', () => {
    const t = fixedTape([{}, { medium: 'any', style: 'any' }, { medium: 'any', style: 'any' }]);
    const p: TapeProgress = { b: got({ medium: 'film', style: 'animation' }), c: got({ medium: 'video', style: 'real' }) };
    expect(varietyIssues(t, p).map((i) => i.message).join()).toMatch(/3 of the 4 found scenes are Film/);
  });

  it('allows two scenes per source, and never the same clip twice', () => {
    const t = fixedTape();
    const same = (start: string) => got({ source: 'The Long Platform', start });
    const two = varietyIssues(t, { a: same('1:00'), b: same('2:00') });
    expect(two).toEqual([]);
    const three = varietyIssues(t, { a: same('1:00'), b: same('2:00'), c: same('3:00') });
    expect(three[0].message).toMatch(/Use one source for no more than 2 scenes/);
    const twice = varietyIssues(t, { a: same('1:00'), b: got({ source: ' the long  platform ', start: '1:00' }) });
    expect(twice[0].message).toMatch(/Scene 1 and Scene 2 look like the same clip/);
  });

  it('checks “must differ from” against the collector’s picks', () => {
    const p7 = LAST_TRAIN_OUT.slots.find((s) => s.id === 'p7')!;
    const p: TapeProgress = { p4: got({ medium: 'tv', style: 'real' }), p7: got({ medium: 'tv', style: 'animation' }) };
    expect(varietyIssues(LAST_TRAIN_OUT, p).find((i) => i.where === p7.id)?.message).toMatch(/Scene 7 should use a different medium from Scene 4/);
  });
});

describe('older tapes', () => {
  it('read as mixtapes', () => {
    const { kind: _, ...old } = RAIN_ON_A_TUESDAY;
    expect(parseTape(old).kind).toBe('mixtape');
  });
});
