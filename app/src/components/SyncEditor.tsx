import { useState } from 'react';
import { MAX_FALLBACKS, RARITIES, SCENE_MEDIUMS, SCENE_MODES, SCENE_STYLE_HINTS, SCENE_STYLES, SYNC, WORLD } from '../model/constants';
import type { Issue } from '../model/rules';
import { foundScenes, songSlot } from '../model/sync';
import { newId } from '../model/tape';
import { formatTime } from '../model/time';
import type { Rarity, SceneMedium, SceneMode, SceneStyle, Slot, SongInfo, Tape } from '../model/types';
import { Field, LaneSwatch, slotTypeLabel } from './bits';
import { CostSelect, FallbackEditor, TimeInput } from './FormBits';
import { RegionPicker } from './RegionSelect';

// The write-a-tape form for sync tapes: the song, then the scenes.

export const DEFAULT_SECTIONS = ['Intro', 'Verse 1', 'Chorus 1', 'Verse 2', 'Chorus 2', 'Final chorus', 'Outro'];

export function newSong(): Slot {
  return {
    id: newId('s'), type: 'song', seconds: 210, find: '', where: '', regions: [], cost: 'free', rarity: 'common',
    mystery: false, spoiler: false, note: '', fallbacks: [],
    song: { mode: 'fixed', version: '', minSeconds: 150, maxSeconds: 270, sections: DEFAULT_SECTIONS.map((name) => ({ name, optional: false })) },
  };
}

/** A new scene goes after the last one: at the next unused part (open song) or 15 seconds on (fixed song). */
export function newScene(tape: Tape, room: boolean): Slot {
  const song = songSlot(tape);
  const pictures = tape.slots.filter((s) => s.type !== 'song');
  const last = pictures.at(-1)?.scene;
  let cue = '';
  let at: number | undefined;
  if (song?.song?.mode === 'open') {
    const sections = song.song.sections;
    const i = last ? sections.findIndex((x) => x.name === last.cue) : -1;
    cue = sections[i + 1]?.name ?? '';
  } else {
    at = last?.at !== undefined ? last.at + 15 : 0;
  }
  const base: Slot = {
    id: newId('s'), type: room ? 'between' : 'scene', seconds: 0, find: '', where: '', regions: room ? [WORLD] : [],
    cost: room ? 'diy' : 'free', rarity: room ? 'you' : 'common', mystery: false, spoiler: false, note: '', fallbacks: [],
    scene: { cue, at, medium: room ? 'any' : 'film', style: room ? 'any' : 'drama', mode: 'mood' },
  };
  if (room) base.where = 'You, in the room';
  return base;
}

function Issues({ issues, prefix }: { issues: Issue[]; prefix: RegExp }) {
  if (issues.length === 0) return null;
  return (
    <ul className="issues">
      {issues.map((x, k) => <li key={k} className={`issue-${x.level}`}>{x.message.replace(prefix, '')}</li>)}
    </ul>
  );
}

export function SongEditor({ slot, issues, onChange, onRenameSection }: {
  slot: Slot;
  issues: Issue[];
  onChange: (s: Slot) => void;
  onRenameSection: (from: string, to: string) => void;
}) {
  const id = `song-${slot.id}`;
  const song = slot.song!;
  const set = (patch: Partial<Slot>) => onChange({ ...slot, ...patch });
  const setSong = (patch: Partial<SongInfo>) => set({ song: { ...song, ...patch } });
  const open = song.mode === 'open';
  const here = issues.filter((x) => x.where === slot.id);

  return (
    <section className="panel stack" aria-labelledby={`${id}-title`}>
      <div className="row" style={{ gap: 10 }}>
        <LaneSwatch slot={slot} />
        <h2 id={`${id}-title`}>The song</h2>
      </div>
      <p className="small muted">One song plays all the way through, with the sound on, from an official source. Never write any of its lyrics into the tape, not even one line.</p>
      <Issues issues={here} prefix={/^Song: /} />
      <fieldset>
        <legend>Who picks the song?</legend>
        <label className="check">
          <input type="radio" name={`${id}-mode`} checked={!open} onChange={() => setSong({ mode: 'fixed' })} />
          <span>I name the song <span className="small muted">· scenes are timed on the song’s clock</span></span>
        </label>
        <label className="check">
          <input type="radio" name={`${id}-mode`} checked={open} onChange={() => setSong({ mode: 'open' })} />
          <span>Collectors pick one that fits a brief <span className="small muted">· scenes are cued to parts of the song, and every video is different</span></span>
        </label>
      </fieldset>

      {open ? (
        <>
          <Field label="The brief" hint="what kind of song to pick" htmlFor={`${id}-find`}>
            <textarea id={`${id}-find`} rows={3} value={slot.find} placeholder="e.g. any song about leaving, with verses and at least two choruses" onChange={(e) => set({ find: e.target.value })} maxLength={600} />
          </Field>
          <div className="row">
            <Field label="Shortest" htmlFor={`${id}-min`}>
              <TimeInput id={`${id}-min`} seconds={song.minSeconds} onChange={(minSeconds) => setSong({ minSeconds })} />
            </Field>
            <Field label="Longest" hint={`${formatTime(SYNC.song.min)} to ${formatTime(SYNC.song.max)}`} htmlFor={`${id}-max`}>
              <TimeInput id={`${id}-max`} seconds={song.maxSeconds} onChange={(maxSeconds) => setSong({ maxSeconds })} />
            </Field>
          </div>
          <fieldset className="stack">
            <legend>Parts of the song</legend>
            <p className="small muted">Collectors note when each part starts in their song, in this order. Each scene plays during one part. Mark parts not every song has (like a bridge) as optional: scenes cued to them get skipped.</p>
            {song.sections.map((sec, i) => (
              <div key={i} className="row" style={{ flexWrap: 'nowrap', alignItems: 'center' }}>
                <span className="mono small" style={{ width: 20 }}>{i + 1}</span>
                <label className="visually-hidden" htmlFor={`${id}-sec${i}`}>Part {i + 1} name</label>
                <input
                  id={`${id}-sec${i}`}
                  type="text"
                  value={sec.name}
                  maxLength={60}
                  onChange={(e) => {
                    const sections = song.sections.map((x, k) => (k === i ? { ...x, name: e.target.value } : x));
                    onRenameSection(sec.name, e.target.value);
                    setSong({ sections });
                  }}
                />
                <label className="check" style={{ whiteSpace: 'nowrap' }}>
                  <input type="checkbox" checked={sec.optional} onChange={(e) => setSong({ sections: song.sections.map((x, k) => (k === i ? { ...x, optional: e.target.checked } : x)) })} />
                  <span className="small">Optional</span>
                </label>
                <button type="button" className="btn btn-small btn-danger" aria-label={`Remove part ${i + 1}`} onClick={() => setSong({ sections: song.sections.filter((_, k) => k !== i) })}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => setSong({ sections: [...song.sections, { name: `Part ${song.sections.length + 1}`, optional: false }] })}>
              + Add a part
            </button>
          </fieldset>
        </>
      ) : (
        <>
          <Field label="Song and artist" htmlFor={`${id}-find`}>
            <input id={`${id}-find`} type="text" value={slot.find} placeholder="[SONG] by [ARTIST]" onChange={(e) => set({ find: e.target.value })} maxLength={200} />
          </Field>
          <div className="grid-2">
            <Field label="Exact version" hint="so the timings line up" htmlFor={`${id}-version`}>
              <input id={`${id}-version`} type="text" value={song.version} placeholder="e.g. album version" onChange={(e) => setSong({ version: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Length" hint={`${formatTime(SYNC.song.min)} to ${formatTime(SYNC.song.max)}`} htmlFor={`${id}-len`}>
              <TimeInput id={`${id}-len`} seconds={slot.seconds} onChange={(seconds) => set({ seconds })} />
            </Field>
          </div>
        </>
      )}

      <div className="grid-2">
        <Field label="Where to listen" htmlFor={`${id}-where`}>
          <input id={`${id}-where`} type="text" value={slot.where} placeholder="e.g. streaming services, the artist’s own channel" onChange={(e) => set({ where: e.target.value })} maxLength={200} />
        </Field>
        {!open && (
          <Field label="Link" hint="optional, official sources only" htmlFor={`${id}-link`}>
            <input id={`${id}-link`} type="url" value={slot.link ?? ''} placeholder="https://" onChange={(e) => set({ link: e.target.value || undefined })} />
          </Field>
        )}
        <Field label="Cost" htmlFor={`${id}-cost`}>
          <CostSelect id={`${id}-cost`} value={slot.cost} onChange={(cost) => set({ cost })} />
        </Field>
        <div className="field">
          <span style={{ fontWeight: 500, fontSize: 14 }}>Available in</span>
          <RegionPicker id={`${id}-region`} value={slot.regions} onChange={(regions) => set({ regions })} />
        </div>
      </div>
      <Field label="Your note for the reveal" hint="optional; hidden until the end" htmlFor={`${id}-note`}>
        <textarea id={`${id}-note`} rows={2} value={slot.note} onChange={(e) => set({ note: e.target.value })} maxLength={600} />
      </Field>
      {!open && (
        <div className="stack">
          <p className="small muted">A fallback for a named song must be the same recording, from another official source.</p>
          {slot.fallbacks.map((f, fi) => (
            <FallbackEditor
              key={fi}
              id={`${id}-fb${fi}`}
              label={`Fallback ${String.fromCharCode(65 + fi)}`}
              f={f}
              onChange={(nf) => set({ fallbacks: slot.fallbacks.map((x, k) => (k === fi ? nf : x)) })}
              onRemove={() => set({ fallbacks: slot.fallbacks.filter((_, k) => k !== fi) })}
            />
          ))}
          {slot.fallbacks.length < MAX_FALLBACKS && (
            <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => set({ fallbacks: [...slot.fallbacks, { find: '', where: '', regions: [WORLD], cost: 'free' }] })}>
              + Add a fallback ({slot.fallbacks.length} of {MAX_FALLBACKS})
            </button>
          )}
        </div>
      )}
    </section>
  );
}

interface SceneEditorProps {
  slot: Slot;
  /** Scene number (the song isn't counted). */
  number: number;
  tape: Tape;
  issues: Issue[];
  first: boolean;
  last: boolean;
  onChange: (s: Slot) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

export function SceneEditor({ slot, number, tape, issues, first, last, onChange, onMove, onRemove }: SceneEditorProps) {
  const id = `scene-${slot.id}`;
  const scene = slot.scene!;
  const song = songSlot(tape)?.song;
  const room = slot.type === 'between';
  const set = (patch: Partial<Slot>) => onChange({ ...slot, ...patch });
  const setScene = (patch: Partial<typeof scene>) => set({ scene: { ...scene, ...patch } });
  const here = issues.filter((x) => x.where === slot.id);
  const earlier = tape.slots.slice(0, tape.slots.indexOf(slot)).filter((s) => s.type === 'scene');
  const [open, setOpen] = useState(() => slot.find === '');

  return (
    <details className="panel" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, listStyle: 'revert' }}>
        <span className="mono small">{number}</span>
        <LaneSwatch slot={slot} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {song?.mode === 'open' ? scene.cue || 'no part chosen' : <span className="mono">{scene.at !== undefined ? formatTime(scene.at) : '?:??'}</span>} · {slotTypeLabel(slot)} · {slot.find || 'not filled in yet'}
        </span>
        {here.some((x) => x.level === 'error') && <span className="badge" style={{ color: 'var(--error)' }}>Needs work</span>}
      </summary>

      <div className="stack" style={{ marginTop: 14 }}>
        <Issues issues={here} prefix={/^Scene \d+: /} />
        <div className="grid-2">
          {song?.mode === 'open' ? (
            <Field label="Plays during" htmlFor={`${id}-cue`}>
              <select id={`${id}-cue`} value={scene.cue} onChange={(e) => setScene({ cue: e.target.value })}>
                <option value="">Choose a part of the song</option>
                {song.sections.map((x) => <option key={x.name} value={x.name}>{x.name}{x.optional ? ' (optional)' : ''}</option>)}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Starts at" hint="on the song’s clock; it plays until the next scene" htmlFor={`${id}-at`}>
                <TimeInput id={`${id}-at`} seconds={scene.at ?? 0} onChange={(at) => setScene({ at })} />
              </Field>
              <Field label="Label" hint="optional, e.g. first chorus" htmlFor={`${id}-cue`}>
                <input id={`${id}-cue`} type="text" value={scene.cue} onChange={(e) => setScene({ cue: e.target.value })} maxLength={60} />
              </Field>
            </>
          )}
        </div>

        {!room && (
          <>
            <fieldset>
              <legend>Mode</legend>
              <div className="row">
                {(Object.keys(SCENE_MODES) as SceneMode[]).map((m) => (
                  <label key={m} className="check">
                    <input type="radio" name={`${id}-mode`} checked={scene.mode === m} onChange={() => setScene({ mode: m })} />
                    <span>{SCENE_MODES[m].label} <span className="small muted">· {SCENE_MODES[m].hint}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="grid-2">
              <Field label="Medium" htmlFor={`${id}-medium`}>
                <select id={`${id}-medium`} value={scene.medium} onChange={(e) => setScene({ medium: e.target.value as SceneMedium })}>
                  {(Object.keys(SCENE_MEDIUMS) as SceneMedium[]).map((m) => <option key={m} value={m}>{SCENE_MEDIUMS[m]}</option>)}
                </select>
              </Field>
              <Field label="Style" htmlFor={`${id}-style`}>
                <select id={`${id}-style`} value={scene.style} onChange={(e) => setScene({ style: e.target.value as SceneStyle })}>
                  {(Object.keys(SCENE_STYLES) as SceneStyle[]).map((st) => (
                    <option key={st} value={st}>{SCENE_STYLES[st]}{st !== 'any' ? ` (${SCENE_STYLE_HINTS[st]})` : ''}</option>
                  ))}
                </select>
              </Field>
            </div>
            {earlier.length > 0 && (
              <Field label="Must differ from" hint="optional: the collector uses a different medium and style from this scene" htmlFor={`${id}-diff`}>
                <select id={`${id}-diff`} value={scene.differentFrom ?? ''} onChange={(e) => setScene({ differentFrom: e.target.value || undefined })}>
                  <option value="">No</option>
                  {earlier.map((s) => <option key={s.id} value={s.id}>Scene {tape.slots.indexOf(s)}</option>)}
                </select>
              </Field>
            )}
            <label className="check">
              <input type="checkbox" checked={slot.mystery} onChange={(e) => set({ mystery: e.target.checked })} />
              <span>Mystery: a clue that depends on the song, so every collector finds something different</span>
            </label>
          </>
        )}

        <Field
          label={room ? 'What to do in the room' : slot.mystery ? 'The clue' : 'What to find'}
          hint={room ? 'safe, free, no flashing lights, no recording or approaching anyone; the song keeps playing' : 'your own words; never quote the lyrics, describe what the line is doing instead'}
          htmlFor={`${id}-find`}
        >
          <textarea id={`${id}-find`} rows={3} value={slot.find} onChange={(e) => set({ find: e.target.value })} maxLength={600} />
        </Field>

        {!room && (
          <div className="grid-2">
            <Field label="Where to look" htmlFor={`${id}-where`}>
              <input id={`${id}-where`} type="text" value={slot.where} placeholder="e.g. TV catch-up" onChange={(e) => set({ where: e.target.value })} maxLength={200} />
            </Field>
            <Field label="Link" hint="optional, official sources only" htmlFor={`${id}-link`}>
              <input id={`${id}-link`} type="url" value={slot.link ?? ''} placeholder="https://" onChange={(e) => set({ link: e.target.value || undefined })} />
            </Field>
            <Field label="Cost" htmlFor={`${id}-cost`}>
              <CostSelect id={`${id}-cost`} value={slot.cost} onChange={(cost) => set({ cost })} />
            </Field>
            <Field label="Rarity" htmlFor={`${id}-rarity`}>
              <select id={`${id}-rarity`} value={slot.rarity} onChange={(e) => set({ rarity: e.target.value as Rarity })}>
                {Object.entries(RARITIES).filter(([k]) => k !== 'you').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <div className="field">
              <span style={{ fontWeight: 500, fontSize: 14 }}>Available in</span>
              <RegionPicker id={`${id}-region`} value={slot.regions} onChange={(regions) => set({ regions })} />
            </div>
          </div>
        )}
        {!room && (
          <label className="check">
            <input type="checkbox" checked={slot.spoiler} onChange={(e) => set({ spoiler: e.target.checked })} />
            <span>This scene gives away a plot twist or ending</span>
          </label>
        )}

        <Field label="Your note for the reveal" hint="hidden until the collector has played the whole video" htmlFor={`${id}-note`}>
          <textarea id={`${id}-note`} rows={2} value={slot.note} onChange={(e) => set({ note: e.target.value })} maxLength={600} />
        </Field>

        {!room && (
          <div className="stack">
            {slot.fallbacks.map((f, fi) => (
              <FallbackEditor
                key={fi}
                id={`${id}-fb${fi}`}
                label={`Fallback ${String.fromCharCode(65 + fi)}`}
                f={f}
                onChange={(nf) => set({ fallbacks: slot.fallbacks.map((x, k) => (k === fi ? nf : x)) })}
                onRemove={() => set({ fallbacks: slot.fallbacks.filter((_, k) => k !== fi) })}
              />
            ))}
            {slot.fallbacks.length < MAX_FALLBACKS && (
              <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => set({ fallbacks: [...slot.fallbacks, { find: '', where: '', regions: [WORLD], cost: 'free' }] })}>
                + Add a fallback ({slot.fallbacks.length} of {MAX_FALLBACKS})
              </button>
            )}
          </div>
        )}

        <div className="row" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <button type="button" className="btn btn-small" disabled={first} onClick={() => onMove(-1)}>↑ Move up</button>
          <button type="button" className="btn btn-small" disabled={last} onClick={() => onMove(1)}>↓ Move down</button>
          <button type="button" className="btn btn-small btn-danger" onClick={onRemove}>Delete scene</button>
        </div>
      </div>
    </details>
  );
}

/** How the scenes mix, for the sidebar: counts by medium and style. */
export function VarietySummary({ tape }: { tape: Tape }) {
  const found = foundScenes(tape);
  if (found.length === 0) return <p className="small muted">Add scenes to see the mix.</p>;
  const limit = Math.ceil(found.length * SYNC.maxShare);
  const count = (key: 'medium' | 'style') => {
    const m = new Map<string, number>();
    for (const s of found) {
      const v = s.scene?.[key] ?? 'any';
      m.set(v, (m.get(v) ?? 0) + 1);
    }
    return [...m];
  };
  const label = (key: 'medium' | 'style', v: string) => (key === 'medium' ? SCENE_MEDIUMS[v as SceneMedium] : SCENE_STYLES[v as SceneStyle]);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <p className="small muted">{found.length} found scenes: up to {limit} of each medium and of each style.</p>
      {(['medium', 'style'] as const).map((key) => (
        <p key={key} className="small">
          <strong>{key === 'medium' ? 'Mediums' : 'Styles'}:</strong>{' '}
          {count(key).map(([v, n], i) => (
            <span key={v} className={v !== 'any' && n > limit ? 'error-text' : ''}>{i > 0 ? ' · ' : ''}{label(key, v)} {n}</span>
          ))}
        </p>
      ))}
    </div>
  );
}
