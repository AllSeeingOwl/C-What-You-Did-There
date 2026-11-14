import { describe, expect, it } from 'vitest';
import { availabilityLabel, tapeAvailability } from './availability';
import { parseTape, TapeFormatError } from './parse';
import { collectedCount, isComplete, isLocked } from './progress';
import { checkLink, isPublishable, validateTape } from './rules';
import { RAIN_ON_A_TUESDAY } from './sampleTapes';
import { decodeTape, encodeTape } from './share';
import { mediaMix, tierRange, totalSeconds } from './tape';
import { formatTime, parseTime } from './time';
import type { Slot, Tape } from './types';

const clip = (id: string, seconds: number, extra: Partial<Slot> = {}): Slot => ({
  id, type: 'video', seconds, find: 'Something', where: 'Somewhere', regions: ['WORLD'], cost: 'free',
  rarity: 'common', mystery: false, spoiler: false, note: '', fallbacks: [], ...extra,
});

const tape = (slots: Slot[], extra: Partial<Tape> = {}): Tape => ({
  ...RAIN_ON_A_TUESDAY, id: 't', tier: 'C5', vibes: [], arc: undefined, liner: 'Hi', slots, ...extra,
});

const errors = (t: Tape) => validateTape(t).filter((i) => i.level === 'error').map((i) => i.message);

describe('time', () => {
  it('formats and parses', () => {
    expect(formatTime(42)).toBe('0:42');
    expect(formatTime(480)).toBe('8:00');
    expect(formatTime(3725)).toBe('1:02:05');
    expect(parseTime('0:42')).toBe(42);
    expect(parseTime('42')).toBe(42);
    expect(parseTime('1:75')).toBeNull();
    expect(parseTime('abc')).toBeNull();
  });
});

describe('the sample tape', () => {
  it('passes every rule and runs 8:00', () => {
    expect(errors(RAIN_ON_A_TUESDAY)).toEqual([]);
    expect(totalSeconds(RAIN_ON_A_TUESDAY)).toBe(480);
  });

  it('is best in the UK, with 11 of 12 slots worldwide', () => {
    const a = tapeAvailability(RAIN_ON_A_TUESDAY, 'US');
    expect(a.worldwide).toBe(false);
    expect(a.worldwideCount).toBe(11);
    expect(a.best).toBe('GB');
    expect(a.worksHere).toBe(false);
    expect(availabilityLabel(a)).toBe('Best in the UK · 11 of 12 slots worldwide');
    expect(tapeAvailability(RAIN_ON_A_TUESDAY, 'GB').worksHere).toBe(true);
  });
});

describe('tiers', () => {
  it('applies the 10% margin', () => {
    expect(tierRange('C15')).toEqual({ min: 270, max: 990 });
    expect(tierRange('C5')).toEqual({ min: 108, max: 330 });
  });

  it('rejects a tape outside the margin', () => {
    const t = tape([clip('a', 30), clip('b', 30), clip('c', 30)]); // 1:30 is under 1:48
    expect(errors(t).join()).toMatch(/C5 runs/);
    expect(errors(tape([clip('a', 40), clip('b', 40), clip('c', 40)]))).toEqual([]);
  });

  it('needs at least 3 slots and at most the tier maximum', () => {
    expect(errors(tape([clip('a', 60), clip('b', 60)])).join()).toMatch(/at least 3/);
    const seven = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((id) => clip(id, 30));
    expect(errors(tape(seven)).join()).toMatch(/up to 6 slots/);
  });
});

describe('slot rules', () => {
  const base = [clip('a', 60), clip('b', 60)];

  it('enforces slot lengths', () => {
    expect(errors(tape([...base, clip('c', 4)])).join()).toMatch(/Clips run 0:05 to 2:00/);
    expect(errors(tape([...base, clip('c', 2, { type: 'between' })])).join()).toMatch(/In-between/);
  });

  it('allows at most two Interference slots', () => {
    const inter = (id: string) =>
      clip(id, 20, {
        type: 'interference',
        interference: {
          mode: 'clash',
          picture: { media: 'video', find: 'x', where: 'y' },
          sound: { media: 'radio', find: 'x', where: 'y' },
          syncCue: 'now',
        },
      });
    expect(errors(tape([clip('a', 90), inter('b'), inter('c')]))).toEqual([]);
    expect(errors(tape([clip('a', 60), inter('b'), inter('c'), inter('d')])).join()).toMatch(/At most 2/);
  });

  it('allows up to three fallbacks', () => {
    const fb = { find: 'x', where: 'y', regions: ['WORLD'], cost: 'free' as const };
    expect(errors(tape([...base, clip('c', 60, { fallbacks: [fb, fb, fb, fb] })])).join()).toMatch(/up to 3 fallbacks/);
  });

  it('only unlocks from an earlier slot', () => {
    expect(errors(tape([clip('a', 60, { lockedUntil: 'c' }), clip('b', 60), clip('c', 60)])).join()).toMatch(/earlier slot/);
    expect(errors(tape([...base, clip('c', 60, { lockedUntil: 'a' })]))).toEqual([]);
  });

  it('limits vibes to three from the list', () => {
    expect(errors(tape([...base, clip('c', 60)], { vibes: ['Tranquil', 'Eerie', 'Funny', 'Tense'] })).join()).toMatch(/up to 3/);
    expect(errors(tape([...base, clip('c', 60)], { vibes: ['Spooky'] })).join()).toMatch(/from the list/);
  });
});

describe('links', () => {
  it('only allows https web pages', () => {
    expect(checkLink('https://example.org/programme')).toBeNull();
    expect(checkLink('http://example.org')).toMatch(/https/);
    expect(checkLink('magnet:?xt=abc')).toMatch(/https/);
    expect(checkLink('https://example.org/clip.mp4')).toMatch(/media file/);
    expect(checkLink('not a link')).toMatch(/full web address/);
  });
});

describe('regions', () => {
  it('is worldwide when every slot or one of its fallbacks works anywhere', () => {
    const fb = { find: 'x', where: 'y', regions: ['WORLD'], cost: 'free' as const };
    const t = tape([clip('a', 60, { regions: ['GB'], fallbacks: [fb] }), clip('b', 60), clip('c', 60)]);
    expect(tapeAvailability(t, 'FR').worldwide).toBe(true);
  });
});

describe('progress', () => {
  it('counts in-between slots as collected and handles locks', () => {
    const t = RAIN_ON_A_TUESDAY;
    expect(collectedCount(t, {})).toBe(3);
    const s12 = t.slots[11];
    expect(isLocked(s12, t, {})).toBe(true);
    const got = { collected: true, via: -1, myFind: '', start: '', end: '' };
    expect(isLocked(s12, t, { s10: got })).toBe(false);
    const all = Object.fromEntries(t.slots.map((s) => [s.id, got]));
    expect(isComplete(t, all)).toBe(true);
  });
});

describe('sharing', () => {
  it('round-trips a tape through a share code', () => {
    const decoded = decodeTape(encodeTape(RAIN_ON_A_TUESDAY));
    expect(decoded).toEqual(RAIN_ON_A_TUESDAY);
    expect(isPublishable(decoded)).toBe(true);
  });

  it('refuses things that are not tapes and drops unknown fields', () => {
    expect(() => parseTape({ hello: 1 })).toThrow(TapeFormatError);
    const sneaky = parseTape({ ...RAIN_ON_A_TUESDAY, extra: '<script>', slots: [{ type: 'nonsense', seconds: 'x' }] });
    expect('extra' in sneaky).toBe(false);
    expect(sneaky.slots[0].type).toBe('video');
    expect(sneaky.slots[0].seconds).toBe(0);
  });
});

describe('media mix', () => {
  it('adds up to the whole tape', () => {
    const sum = mediaMix(RAIN_ON_A_TUESDAY).reduce((a, m) => a + m.share, 0);
    expect(sum).toBeCloseTo(1);
  });
});
