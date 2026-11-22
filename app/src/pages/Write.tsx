import { useEffect, useMemo, useState } from 'react';
import { Field, JCard, LaneSwatch, slotTypeLabel } from '../components/bits';
import { CostSelect, FallbackEditor, TimeInput } from '../components/FormBits';
import { RegionPicker } from '../components/RegionSelect';
import { newScene, newSong, SceneEditor, SongEditor, VarietySummary } from '../components/SyncEditor';
import { availabilityLabel, tapeAvailability } from '../model/availability';
import {
  DIFFICULTIES, KINDS, LANES, SYNC, MAX_FALLBACKS, MAX_INTERFERENCE, MAX_VIBES, MEDIA_TYPES, RARITIES, SLOT_TYPES, TIER_IDS, TIERS, VIBES, WORLD,
} from '../model/constants';
import { type Issue, slotLimits, validateTape } from '../model/rules';
import { actions, findTape, getState, useStore } from '../model/store';
import { isSync, songSlot } from '../model/sync';
import { lengthLabel, newId, tierRange, totalSeconds } from '../model/tape';
import { formatTime } from '../model/time';
import type { Difficulty, MediaType, Rarity, Slot, SlotType, Tape, TierId } from '../model/types';
import { href, navigate } from '../router';
import { NotFound } from './NotFound';

function blankTape(creator: string): Tape {
  const now = new Date().toISOString();
  return {
    format: 'side-c-tape', version: 1, kind: 'mixtape', id: newId('t'), title: '', creator, theme: '', liner: '', tier: 'C5',
    difficulty: 'medium', vibes: [], warnings: { flashing: false, loudNoises: false, upsettingThemes: false },
    slots: [], createdAt: now, updatedAt: now,
  };
}

function newSlot(type: SlotType): Slot {
  const base: Slot = {
    id: newId('s'), type, seconds: 45, find: '', where: '', regions: [], cost: 'free', rarity: 'common',
    mystery: false, spoiler: false, note: '', fallbacks: [],
  };
  return retype(base, type);
}

/** Changing a slot's type keeps what still makes sense and fills in the rest. */
function retype(slot: Slot, type: SlotType): Slot {
  const s: Slot = { ...slot, type };
  const { min, max } = slotLimits(s);
  if (type === 'between') {
    Object.assign(s, { where: 'You, in the room', regions: [WORLD], cost: 'diy', rarity: 'you', mystery: false, link: undefined, fallbacks: [], lockedUntil: undefined, interference: undefined });
    s.seconds = Math.min(Math.max(s.seconds, min), max) === s.seconds ? s.seconds : 10;
  } else {
    if (slot.type === 'between') Object.assign(s, { where: '', regions: [], cost: 'free', rarity: 'common' });
    if (type === 'interference') {
      s.mystery = false;
      s.interference = slot.interference ?? {
        mode: 'clash',
        picture: { media: 'video', find: '', where: '' },
        sound: { media: 'radio', find: '', where: '' },
        syncCue: '',
      };
      if (s.seconds > max) s.seconds = 30;
    } else s.interference = undefined;
    if (s.seconds < min || s.seconds > max) s.seconds = Math.min(Math.max(s.seconds, min), max);
  }
  return s;
}

function MediaSelect({ id, value, onChange }: { id: string; value: MediaType; onChange: (m: MediaType) => void }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as MediaType)}>
      {MEDIA_TYPES.map((m) => <option key={m} value={m}>{LANES[m].label}</option>)}
    </select>
  );
}

interface SlotEditorProps {
  slot: Slot;
  index: number;
  tape: Tape;
  issues: Issue[];
  onChange: (s: Slot) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}

function SlotEditor({ slot, index, tape, issues, onChange, onMove, onRemove }: SlotEditorProps) {
  const id = `slot-${slot.id}`;
  const set = (patch: Partial<Slot>) => onChange({ ...slot, ...patch });
  const { min, max } = slotLimits(slot);
  const earlier = tape.slots.slice(0, index).filter((s) => s.type !== 'between');
  const interferenceCount = tape.slots.filter((s) => s.type === 'interference').length;
  const i = slot.interference;
  const errorsHere = issues.filter((x) => x.where === slot.id);
  // New, empty slots start open; filled-in ones start folded away.
  const [open, setOpen] = useState(() => slot.find === '' && !i?.picture.find);

  return (
    <details className="panel" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, listStyle: 'revert' }}>
        <span className="mono small">{index + 1}</span>
        <LaneSwatch slot={slot} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {slotTypeLabel(slot)} · <span className="mono">{formatTime(slot.seconds)}</span> · {slot.type === 'interference' ? i?.picture.find || 'not filled in yet' : slot.find || 'not filled in yet'}
        </span>
        {errorsHere.some((x) => x.level === 'error') && <span className="badge" style={{ color: 'var(--error)' }}>Needs work</span>}
      </summary>

      <div className="stack" style={{ marginTop: 14 }}>
        {errorsHere.length > 0 && (
          <ul className="issues">
            {errorsHere.map((x, k) => <li key={k} className={`issue-${x.level}`}>{x.message.replace(/^Slot \d+: /, '')}</li>)}
          </ul>
        )}
        <div className="grid-2">
          <Field label="Type" htmlFor={`${id}-type`}>
            <select id={`${id}-type`} value={slot.type} onChange={(e) => onChange(retype(slot, e.target.value as SlotType))}>
              {SLOT_TYPES.map((t) => (
                <option key={t} value={t} disabled={t === 'interference' && slot.type !== 'interference' && interferenceCount >= MAX_INTERFERENCE}>
                  {t === 'between' ? 'In-between (something to do in the room)' : LANES[t].label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Length" hint={`${formatTime(min)} to ${formatTime(max)}`} htmlFor={`${id}-len`}>
            <TimeInput id={`${id}-len`} seconds={slot.seconds} onChange={(seconds) => set({ seconds })} />
          </Field>
        </div>

        {slot.type === 'interference' && i ? (
          <>
            <p className="small muted">A muted picture from one source under sound from another. Unsettling through the pairing, never graphic, violent, hateful or flashing.</p>
            <Field label="Short title" hint="shown on the timeline" htmlFor={`${id}-find`}>
              <input id={`${id}-find`} type="text" value={slot.find} onChange={(e) => set({ find: e.target.value })} maxLength={120} />
            </Field>
            <fieldset>
              <legend>Mode</legend>
              <div className="row">
                {(['clash', 'merge'] as const).map((m) => (
                  <label key={m} className="check">
                    <input type="radio" name={`${id}-mode`} checked={i.mode === m} onChange={() => set({ interference: { ...i, mode: m } })} />
                    <span>{m === 'clash' ? 'Clash: they fight each other' : 'Uncanny merge: they almost fit'}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {(['picture', 'sound'] as const).map((part) => (
              <fieldset key={part} className="stack">
                <legend>{part === 'picture' ? 'Picture (played muted)' : 'Sound'}</legend>
                <div className="grid-2">
                  <Field label="Kind of source" htmlFor={`${id}-${part}-media`}>
                    <MediaSelect id={`${id}-${part}-media`} value={i[part].media} onChange={(media) => set({ interference: { ...i, [part]: { ...i[part], media } } })} />
                  </Field>
                  <Field label="Where to look" htmlFor={`${id}-${part}-where`}>
                    <input id={`${id}-${part}-where`} type="text" value={i[part].where} onChange={(e) => set({ interference: { ...i, [part]: { ...i[part], where: e.target.value } } })} maxLength={200} />
                  </Field>
                </div>
                <Field label="What to find" htmlFor={`${id}-${part}-find`}>
                  <textarea id={`${id}-${part}-find`} rows={2} value={i[part].find} onChange={(e) => set({ interference: { ...i, [part]: { ...i[part], find: e.target.value } } })} maxLength={500} />
                </Field>
                <Field label="Link" hint="optional, official sources only" htmlFor={`${id}-${part}-link`}>
                  <input id={`${id}-${part}-link`} type="url" placeholder="https://" value={i[part].link ?? ''} onChange={(e) => set({ interference: { ...i, [part]: { ...i[part], link: e.target.value || undefined } } })} />
                </Field>
              </fieldset>
            ))}
            <Field label="Sync cue" hint="when to start the sound" htmlFor={`${id}-sync`}>
              <input id={`${id}-sync`} type="text" value={i.syncCue} placeholder="e.g. the moment the singer first smiles at the camera" onChange={(e) => set({ interference: { ...i, syncCue: e.target.value } })} maxLength={300} />
            </Field>
          </>
        ) : (
          <>
            {slot.type !== 'between' && (
              <label className="check">
                <input type="checkbox" checked={slot.mystery} onChange={(e) => set({ mystery: e.target.checked })} />
                <span>Mystery slot: give a clue instead of an exact moment, so every collector’s tape is a little different</span>
              </label>
            )}
            <Field
              label={slot.type === 'between' ? 'What to do in the room' : slot.mystery ? 'The clue' : 'What to find'}
              hint={slot.type === 'between' ? 'safe, free, no recording or approaching anyone' : 'describe it in your own words; no transcripts or lyrics'}
              htmlFor={`${id}-find`}
            >
              <textarea id={`${id}-find`} rows={3} value={slot.find} onChange={(e) => set({ find: e.target.value })} maxLength={600} />
            </Field>
          </>
        )}

        {slot.type !== 'between' && (
          <div className="grid-2">
            {slot.type !== 'interference' && (
              <>
                <Field label="Where to look" htmlFor={`${id}-where`}>
                  <input id={`${id}-where`} type="text" value={slot.where} placeholder="e.g. radio catch-up apps" onChange={(e) => set({ where: e.target.value })} maxLength={200} />
                </Field>
                <Field label="Link" hint="optional, official sources only" htmlFor={`${id}-link`}>
                  <input id={`${id}-link`} type="url" value={slot.link ?? ''} placeholder="https://" onChange={(e) => set({ link: e.target.value || undefined })} />
                </Field>
              </>
            )}
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
            <Field label="Locked until" hint="optional" htmlFor={`${id}-lock`}>
              <select id={`${id}-lock`} value={slot.lockedUntil ?? ''} onChange={(e) => set({ lockedUntil: e.target.value || undefined })}>
                <option value="">Not locked</option>
                {earlier.map((s) => <option key={s.id} value={s.id}>Slot {tape.slots.indexOf(s) + 1} is collected</option>)}
              </select>
            </Field>
          </div>
        )}

        {slot.type !== 'between' && (
          <label className="check">
            <input type="checkbox" checked={slot.spoiler} onChange={(e) => set({ spoiler: e.target.checked })} />
            <span>This slot gives away a plot twist or ending</span>
          </label>
        )}

        <Field label="Your note for the reveal" hint="hidden until the collector has played the whole tape" htmlFor={`${id}-note`}>
          <textarea id={`${id}-note`} rows={2} value={slot.note} onChange={(e) => set({ note: e.target.value })} maxLength={600} />
        </Field>

        {slot.type !== 'between' && (
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
          <button type="button" className="btn btn-small" disabled={index === 0} onClick={() => onMove(-1)}>↑ Move up</button>
          <button type="button" className="btn btn-small" disabled={index === tape.slots.length - 1} onClick={() => onMove(1)}>↓ Move down</button>
          <button type="button" className="btn btn-small btn-danger" onClick={onRemove}>Delete slot</button>
        </div>
      </div>
    </details>
  );
}

const CHECKLIST = [
  'Every slot points to an official source: no pirated copies, unofficial re-uploads or instructions for ripping or recording.',
  'Everything is described in my own words: no transcripts, scripts or lyrics.',
  'No private individuals, and no in-between slot involves recording or approaching anyone.',
  'Nothing graphic, violent, hateful or flashing; anything unsettling comes from the pairing, and the warnings are set.',
];

const SYNC_CHECKLIST = [
  'The song and every scene come from official sources: no pirated copies, unofficial re-uploads or instructions for ripping or recording.',
  'No lyrics anywhere in the tape, not even one line: I describe what the song is doing in my own words.',
  'No private individuals, and no room scene involves recording or approaching anyone.',
  'Nothing graphic, violent, hateful, flashing or strobing in any scene, and the warnings are set.',
];

export function Write({ id }: { id?: string }) {
  const existing = useStore((s) => (id ? findTape(s, id) : undefined));
  const [tape, setTape] = useState<Tape>(() => existing?.tape ?? blankTape(getState().settings.creatorName));
  const [checks, setChecks] = useState<boolean[]>(CHECKLIST.map(() => false));
  const checklist = isSync(tape) ? SYNC_CHECKLIST : CHECKLIST;
  const [message, setMessage] = useState('');
  const wasPublished = existing ? !existing.draft : false;

  const issues = useMemo(() => validateTape(tape), [tape]);
  const errors = issues.filter((x) => x.level === 'error');
  const tapeIssues = issues.filter((x) => x.where === 'tape');
  const region = useStore((s) => s.settings.region);

  // Drafts save themselves as you type. A published tape only changes when you press Save.
  const touched = tape.title.trim() !== '' || tape.slots.length > 0;
  useEffect(() => {
    if (!touched || wasPublished) return;
    const t = window.setTimeout(() => actions.saveTape(tape, true), 500);
    return () => window.clearTimeout(t);
  }, [tape, touched, wasPublished]);

  if (id && (!existing || existing.origin !== 'mine')) {
    return existing ? (
      <div className="page"><h1>You can’t edit this tape</h1><p className="muted">Only tapes you wrote in this browser can be edited.</p></div>
    ) : <NotFound what="tape" />;
  }

  const set = (patch: Partial<Tape>) => setTape((t) => ({ ...t, ...patch }));
  const setSlot = (i: number, s: Slot) => setTape((t) => ({ ...t, slots: t.slots.map((x, k) => (k === i ? s : x)) }));
  const move = (i: number, dir: -1 | 1) =>
    setTape((t) => {
      const slots = [...t.slots];
      [slots[i], slots[i + dir]] = [slots[i + dir], slots[i]];
      return { ...t, slots };
    });
  const removeSlot = (i: number) =>
    setTape((t) => {
      const gone = t.slots[i].id;
      return { ...t, slots: t.slots.filter((_, k) => k !== i).map((s) => (s.lockedUntil === gone ? { ...s, lockedUntil: undefined } : s)) };
    });
  const setKind = (kind: Tape['kind']) => {
    if (kind === tape.kind) return;
    if (tape.slots.length > 0 && !window.confirm(`Switch to a ${kind === 'sync' ? 'music video' : 'mixtape'}? Your ${tape.kind === 'sync' ? 'song and scenes' : 'slots'} will be cleared.`)) return;
    set({ kind, slots: kind === 'sync' ? [newSong()] : [] });
    setChecks((cs) => cs.map(() => false));
  };
  const renameSection = (from: string, to: string) =>
    setTape((t) => ({ ...t, slots: t.slots.map((s) => (s.scene && s.scene.cue === from ? { ...s, scene: { ...s.scene, cue: to } } : s)) }));
  const toggleVibe = (v: string) =>
    set({ vibes: tape.vibes.includes(v) ? tape.vibes.filter((x) => x !== v) : tape.vibes.length < MAX_VIBES ? [...tape.vibes, v] : tape.vibes });

  const total = totalSeconds(tape);
  const range = tierRange(tape.tier);
  const tier = TIERS[tape.tier];
  const inRange = total >= range.min && total <= range.max;
  const interferenceCount = tape.slots.filter((s) => s.type === 'interference').length;
  const canPublish = errors.length === 0 && checks.every(Boolean);
  const sync = isSync(tape);
  const song = songSlot(tape);
  const pictures = tape.slots.filter((s) => s.type !== 'song');

  function publish() {
    if (!canPublish) return;
    actions.saveTape(tape, false);
    if (tape.creator) actions.updateSettings({ creatorName: tape.creator });
    navigate(`/tape/${tape.id}`);
  }
  function saveDraft() {
    actions.saveTape(tape, true);
    setMessage(wasPublished ? 'Saved as a draft. It’s off your shelf until you publish it again.' : 'Draft saved in this browser.');
    if (wasPublished) navigate(`/write/${tape.id}`);
  }

  return (
    <div className="page">
      <div className="stack">
        <span className="eyebrow">{existing ? (existing.draft ? 'Draft' : 'Editing') : 'New tape'}{tape.slots.length > 0 || existing ? ` · ${KINDS[sync ? 'sync' : 'mixtape'].label}` : ''}</span>
        <h1>{sync ? 'Make a music video' : 'Write a tape'}</h1>
        <p className="muted" style={{ maxWidth: 720 }}>
          A tape is instructions, never the clips: describe each moment, say where to find it and how long it runs.
          {!wasPublished && ' Your draft saves itself in this browser as you go.'}
        </p>
      </div>

      <div className="collect-layout">
        <div className="stack-lg">
          <section className="panel stack" aria-labelledby="details-title">
            <h2 id="details-title">Details</h2>
            <div className="grid-2">
              <Field label="Title" hint="up to 60 characters" htmlFor="w-title">
                <input id="w-title" type="text" value={tape.title} onChange={(e) => set({ title: e.target.value })} maxLength={80} />
              </Field>
              <Field label="Creator name" hint="how you want to be credited" htmlFor="w-creator">
                <input id="w-creator" type="text" value={tape.creator} onChange={(e) => set({ creator: e.target.value })} maxLength={60} />
              </Field>
            </div>
            <Field label="Theme" hint="what it’s about, e.g. weather, rain, staying in" htmlFor="w-theme">
              <input id="w-theme" type="text" value={tape.theme} onChange={(e) => set({ theme: e.target.value })} maxLength={120} />
            </Field>
            <Field label="Liner notes" hint="a line or two to draw collectors in" htmlFor="w-liner">
              <textarea id="w-liner" value={tape.liner} onChange={(e) => set({ liner: e.target.value })} maxLength={1000} />
            </Field>
            <fieldset>
              <legend>What are you making?</legend>
              <label className="check">
                <input type="radio" name="kind" checked={!sync} onChange={() => setKind('mixtape')} />
                <span><strong>{KINDS.mixtape.label}</strong> <span className="muted small">· {KINDS.mixtape.blurb}</span></span>
              </label>
              <label className="check">
                <input type="radio" name="kind" checked={sync} onChange={() => setKind('sync')} />
                <span><strong>{KINDS.sync.label}</strong> <span className="muted small">· {KINDS.sync.blurb}</span></span>
              </label>
            </fieldset>
            {!sync && (
            <fieldset>
              <legend>Tier</legend>
              <div className="row">
                {TIER_IDS.map((t: TierId) => (
                  <label key={t} className="check" style={{ marginRight: 12 }}>
                    <input type="radio" name="tier" checked={tape.tier === t} onChange={() => set({ tier: t })} />
                    <span><strong className="mono">{t}</strong> <span className="muted small">{formatTime(TIERS[t].minSeconds)}–{formatTime(TIERS[t].maxSeconds)}, up to {TIERS[t].maxSlots} slots</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            )}
            <div className="grid-2">
              <Field label="Difficulty" htmlFor="w-diff">
                <select id="w-diff" value={tape.difficulty} onChange={(e) => set({ difficulty: e.target.value as Difficulty })}>
                  {Object.entries(DIFFICULTIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <fieldset>
                <legend>Warnings</legend>
                {([['flashing', 'Flashing images'], ['loudNoises', 'Sudden loud noises'], ['upsettingThemes', 'Upsetting themes']] as const).map(([k, label]) => (
                  <label key={k} className="check" style={{ padding: '2px 0' }}>
                    <input type="checkbox" checked={tape.warnings[k]} onChange={(e) => set({ warnings: { ...tape.warnings, [k]: e.target.checked } })} />
                    <span>{label}</span>
                  </label>
                ))}
                {interferenceCount > 0 && <p className="small muted">Tapes with Interference always show “contains an unsettling interlude”.</p>}
              </fieldset>
            </div>
          </section>

          <section className="panel stack" aria-labelledby="vibes-title">
            <h2 id="vibes-title">Vibes</h2>
            <p className="small muted">Pick up to {MAX_VIBES} that describe how it feels ({tape.vibes.length} chosen).</p>
            <div className="row" style={{ gap: 6 }}>
              {VIBES.map((v) => (
                <button key={v} type="button" className="chip" aria-pressed={tape.vibes.includes(v)} disabled={!tape.vibes.includes(v) && tape.vibes.length >= MAX_VIBES} onClick={() => toggleVibe(v)}>
                  {v}
                </button>
              ))}
            </div>
            <label className="check">
              <input type="checkbox" checked={!!tape.arc} onChange={(e) => set({ arc: e.target.checked ? [tape.vibes[0] ?? 'Tranquil', tape.vibes[1] ?? 'Strange', tape.vibes[2] ?? 'Hopeful'] : undefined })} />
              <span>Add a vibe arc: how the mood moves from start to end</span>
            </label>
            {tape.arc && (
              <div className="row">
                {(['Starts', 'Middle', 'Ends'] as const).map((label, k) => (
                  <div className="field" key={label}>
                    <label htmlFor={`arc-${k}`}>{label}</label>
                    <select id={`arc-${k}`} value={tape.arc![k]} onChange={(e) => { const arc = [...tape.arc!] as [string, string, string]; arc[k] = e.target.value; set({ arc }); }} style={{ width: 'auto' }}>
                      {VIBES.map((v) => <option key={v}>{v}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>

          {sync && song && (
            <SongEditor slot={song} issues={issues} onChange={(ns) => setSlot(0, ns)} onRenameSection={renameSection} />
          )}
          {sync && (
            <section className="stack" aria-labelledby="scenes-title">
              <div className="row between">
                <h2 id="scenes-title">Scenes</h2>
                <span className="small muted">{pictures.length} of {SYNC.maxScenes} · at least {SYNC.minScenes} · up to {SYNC.maxRoomScenes} in the room</span>
              </div>
              <p className="small muted">Muted clips, in the order they play. Keep it varied: no medium or style in more than half the scenes, and never the same clip twice.</p>
              {!song && <div className="notice">This tape has no song. Switch to a mixtape and back to start again.</div>}
              {pictures.length === 0 && <div className="empty">No scenes yet. Add the first one below.</div>}
              {pictures.map((s, k) => {
                const i = tape.slots.indexOf(s);
                return (
                  <SceneEditor
                    key={s.id}
                    slot={s}
                    number={k + 1}
                    tape={tape}
                    issues={issues}
                    first={k === 0}
                    last={k === pictures.length - 1}
                    onChange={(ns) => setSlot(i, ns)}
                    onMove={(d) => move(i, d)}
                    onRemove={() => removeSlot(i)}
                  />
                );
              })}
              <div className="panel panel-tight row" style={{ gap: 6 }}>
                <span className="small muted">Add</span>
                <button type="button" className="btn btn-small" disabled={!song || pictures.length >= SYNC.maxScenes} onClick={() => set({ slots: [...tape.slots, newScene(tape, false)] })}>
                  + A scene to find
                </button>
                <button
                  type="button"
                  className="btn btn-small"
                  disabled={!song || pictures.length >= SYNC.maxScenes || pictures.filter((s) => s.type === 'between').length >= SYNC.maxRoomScenes}
                  onClick={() => set({ slots: [...tape.slots, newScene(tape, true)] })}
                >
                  + Something to do in the room
                </button>
              </div>
            </section>
          )}
          {!sync && (
          <section className="stack" aria-labelledby="slots-title">
            <div className="row between">
              <h2 id="slots-title">Slots</h2>
              <span className="small muted">{tape.slots.length} of {tier.maxSlots} · at least 3</span>
            </div>
            {tape.slots.length === 0 && <div className="empty">No slots yet. Add the first piece of your tape below.</div>}
            {tape.slots.map((s, i) => (
              <SlotEditor key={s.id} slot={s} index={i} tape={tape} issues={issues} onChange={(ns) => setSlot(i, ns)} onMove={(d) => move(i, d)} onRemove={() => removeSlot(i)} />
            ))}
            <div className="panel panel-tight stack">
              <span className="small muted">Add a slot</span>
              <div className="row" style={{ gap: 6 }}>
                {SLOT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn btn-small"
                    disabled={tape.slots.length >= TIERS.C30.maxSlots || (t === 'interference' && interferenceCount >= MAX_INTERFERENCE)}
                    onClick={() => set({ slots: [...tape.slots, newSlot(t)] })}
                  >
                    <span className="swatch" style={{ background: LANES[t].colour }} /> {t === 'between' ? 'In-between' : LANES[t].label}
                  </button>
                ))}
              </div>
            </div>
          </section>
          )}
        </div>

        <aside className="stack-lg inspector" aria-label="Checks and publishing">
          <JCard tape={tape} />
          {sync ? (
          <div className="panel stack">
            <h2 style={{ fontSize: 17 }}>Running time</h2>
            <p className="mono" style={{ fontSize: 18 }}>{lengthLabel(tape)}</p>
            <p className="small muted">{song?.song?.mode === 'open' ? 'As long as each collector’s song.' : 'As long as the song.'}</p>
            <h3 style={{ fontSize: 15 }}>Mix</h3>
            <VarietySummary tape={tape} />
            <p className="small muted">{tape.slots.length > 0 ? availabilityLabel(tapeAvailability(tape, region)) : ''}</p>
          </div>
          ) : (
          <div className="panel stack">
            <h2 style={{ fontSize: 17 }}>Running time</h2>
            <div className="row between"><span className="mono" style={{ fontSize: 22 }}>{formatTime(total)}</span><span className={inRange ? 'ok-text small' : 'small muted'}>{inRange ? `Fits a ${tape.tier}` : `${tape.tier}: ${formatTime(range.min)} to ${formatTime(range.max)}`}</span></div>
            <div className="meter"><div style={{ width: `${Math.min(100, (total / range.max) * 100)}%`, background: inRange ? 'var(--ok)' : 'var(--text)' }} /></div>
            <p className="small muted">{tape.slots.length > 0 ? availabilityLabel(tapeAvailability(tape, region)) : 'Add slots to see where it works.'}</p>
          </div>
          )}
          <div className="panel stack">
            <h2 style={{ fontSize: 17 }}>Checks</h2>
            {issues.length === 0 ? <p className="ok-text small">Everything checks out.</p> : (
              <ul className="issues">
                {[...tapeIssues, ...issues.filter((x) => x.where !== 'tape')].map((x, k) => <li key={k} className={`issue-${x.level}`}>{x.message}</li>)}
              </ul>
            )}
          </div>
          <div className="panel stack">
            <h2 style={{ fontSize: 17 }}>Before you publish</h2>
            {checklist.map((c, k) => (
              <label key={k} className="check">
                <input type="checkbox" checked={checks[k]} onChange={(e) => setChecks((cs) => cs.map((x, j) => (j === k ? e.target.checked : x)))} />
                <span className="small">{c}</span>
              </label>
            ))}
            <p className="small muted">See the <a href={href('/about')}>community guidelines</a>.</p>
            <button type="button" className="btn btn-primary" disabled={!canPublish} onClick={publish}>
              {wasPublished ? 'Save changes' : 'Publish to my shelf'}
            </button>
            {!canPublish && <p className="small muted">{errors.length > 0 ? `Fix ${errors.length} ${errors.length === 1 ? 'problem' : 'problems'} above first.` : 'Tick every box to publish.'}</p>}
            <button type="button" className="btn" onClick={saveDraft}>{wasPublished ? 'Save as draft instead' : 'Save draft'}</button>
            {message && <p className="small" role="status">{message}</p>}
            {existing && (
              <button type="button" className="linkbtn small" style={{ alignSelf: 'flex-start' }} onClick={() => { if (window.confirm('Delete this tape from this browser?')) { actions.deleteTape(tape.id); navigate('/'); } }}>
                Delete this tape
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
