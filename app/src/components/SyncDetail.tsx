import { useState } from 'react';
import { slotWorksIn } from '../model/availability';
import { COSTS, RARITIES, SCENE_MEDIUMS, SCENE_MODES, SCENE_STYLE_HINTS, SCENE_STYLES, WORLD } from '../model/constants';
import { EMPTY_SLOT_PROGRESS, isLocked } from '../model/progress';
import { actions } from '../model/store';
import { cueSheet, type Medium, sceneKindLabel, sectionMissing, slotName, songMapProblems, songSlot, type Style, varietyIssues } from '../model/sync';
import { formatTime } from '../model/time';
import type { Slot, SlotProgress, Tape, TapeProgress } from '../model/types';
import { LaneSwatch, regionList, slotTypeLabel, SourceLink } from './bits';

// Details for one piece of a sync tape, on the collecting screen: the song
// (with the collector's map of an open song) or a scene.

const letter = (i: number) => String.fromCharCode(65 + i);
const MEDIUMS = (['film', 'tv', 'video'] as const);
const STYLES = (['drama', 'animation', 'real'] as const);

function Fallbacks({ slot }: { slot: Slot }) {
  if (slot.fallbacks.length === 0) return null;
  return (
    <div className="stack" style={{ gap: 8 }}>
      <h3>Fallbacks <span className="small muted">· any of these counts as collected</span></h3>
      {slot.fallbacks.map((f, i) => (
        <div key={i} className="tile" style={{ gap: 4 }}>
          <span>Fallback {letter(i)} · {regionList(f.regions)} · {COSTS[f.cost]}</span>
          <span>{f.find}</span>
          {f.where && <span className="small muted">Where to look: {f.where}</span>}
          <SourceLink link={f.link} />
        </div>
      ))}
    </div>
  );
}

function ViaChoice({ slot, idp, via, onChange }: { slot: Slot; idp: string; via: number; onChange: (via: number) => void }) {
  if (slot.fallbacks.length === 0) return null;
  return (
    <fieldset>
      <legend>I found it using</legend>
      <label className="check">
        <input type="radio" name={`${idp}-via`} checked={via === -1} onChange={() => onChange(-1)} />
        <span>The main {slot.type === 'song' ? 'song' : 'scene'}</span>
      </label>
      {slot.fallbacks.map((_, i) => (
        <label className="check" key={i}>
          <input type="radio" name={`${idp}-via`} checked={via === i} onChange={() => onChange(i)} />
          <span>Fallback {letter(i)}</span>
        </label>
      ))}
    </fieldset>
  );
}

/** The song: where you're playing it from and, for an open song, your map of it. */
function SongForm({ tape, slot, progress }: { tape: Tape; slot: Slot; progress: TapeProgress }) {
  const saved = progress[slot.id] ?? EMPTY_SLOT_PROGRESS;
  const sections = slot.song?.sections ?? [];
  const open = slot.song?.mode === 'open';
  const [draft, setDraft] = useState<SlotProgress>(() => ({ ...saved, sectionTimes: sections.map((_, i) => saved.sectionTimes?.[i] ?? (i === 0 ? '0:00' : '')) }));
  const [message, setMessage] = useState('');
  const idp = `c-${slot.id}`;
  const set = (patch: Partial<SlotProgress>) => setDraft((d) => ({ ...d, ...patch }));
  const problems = open ? songMapProblems(tape, { [slot.id]: draft }) : [];

  function save(collected: boolean) {
    actions.setSlotProgress(tape.id, slot.id, { ...draft, collected });
    setDraft((d) => ({ ...d, collected }));
    setMessage(collected ? (open ? 'Song mapped. Your scenes now have real timings.' : 'Got the song.') : open ? 'Saved. Finish the map when you can.' : 'Marked as still to find.');
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (problems.length === 0) save(true); }}>
      <h3>{open ? 'Your song' : 'Your copy'}</h3>
      <ViaChoice slot={slot} idp={idp} via={draft.via} onChange={(via) => set({ via })} />
      <div className="field">
        <label htmlFor={`${idp}-find`}>
          {open ? 'Which song did you pick?' : 'Where are you playing it from?'}
          <span className="hint"> · {open ? 'the song, who it’s by and the version, so you play the same one every time' : 'a note for yourself'}</span>
        </label>
        <input id={`${idp}-find`} type="text" value={draft.myFind} onChange={(e) => set({ myFind: e.target.value })} maxLength={200} />
      </div>
      {open && (
        <fieldset className="stack">
          <legend>Map your song</legend>
          <p className="small muted">Listen once and note when each part starts. Rough is fine, to the nearest second or two. Your scenes are timed from this.</p>
          {sections.map((sec, i) => (
            <div className="row between" key={sec.name} style={{ flexWrap: 'nowrap' }}>
              <label htmlFor={`${idp}-sec${i}`} style={{ flex: 1 }}>
                {sec.name}
                {sec.optional && <span className="hint small muted"> · if your song has one</span>}
              </label>
              <input
                id={`${idp}-sec${i}`}
                className="time"
                type="text"
                inputMode="numeric"
                placeholder={sec.optional ? 'none' : '0:00'}
                value={draft.sectionTimes?.[i] ?? ''}
                onChange={(e) => set({ sectionTimes: (draft.sectionTimes ?? []).map((t, k) => (k === i ? e.target.value : t)) })}
                maxLength={8}
              />
            </div>
          ))}
          <div className="row between" style={{ flexWrap: 'nowrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>
            <label htmlFor={`${idp}-end`} style={{ flex: 1 }}>The song ends</label>
            <input id={`${idp}-end`} className="time" type="text" inputMode="numeric" placeholder="3:34" value={draft.songEnd ?? ''} onChange={(e) => set({ songEnd: e.target.value })} maxLength={8} />
          </div>
          {problems.length > 0 && (
            <ul className="issues">
              {problems.map((p) => <li key={p} className="issue-warning">{p}</li>)}
            </ul>
          )}
        </fieldset>
      )}
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={problems.length > 0}>
          {saved.collected ? 'Save changes' : open ? 'Save my song' : 'Mark as collected'}
        </button>
        {open && problems.length > 0 && <button type="button" className="btn" onClick={() => save(false)}>Save for later</button>}
        {saved.collected && <button type="button" className="btn" onClick={() => save(false)}>Not collected after all</button>}
      </div>
      {message && <p className="small ok-text" role="status">{message}</p>}
    </form>
  );
}

/** A scene: what you found, where from, and (when it's your choice) its medium and style. */
function SceneForm({ tape, slot, progress }: { tape: Tape; slot: Slot; progress: TapeProgress }) {
  const saved = progress[slot.id] ?? EMPTY_SLOT_PROGRESS;
  const [draft, setDraft] = useState<SlotProgress>(saved);
  const [message, setMessage] = useState('');
  const idp = `c-${slot.id}`;
  const set = (patch: Partial<SlotProgress>) => setDraft((d) => ({ ...d, ...patch }));
  const pickMedium = slot.scene?.medium === 'any';
  const pickStyle = slot.scene?.style === 'any';
  const needsPick = (pickMedium && !draft.medium) || (pickStyle && !draft.style);
  const warnings = varietyIssues(tape, { ...progress, [slot.id]: { ...draft, collected: true } }).filter(
    (w) => w.where === slot.id || w.where === 'tape' || w.message.includes(slotName(tape, slot)),
  );

  function save(collected: boolean) {
    const value = { ...draft, collected, skipped: false };
    actions.setSlotProgress(tape.id, slot.id, value);
    setDraft(value);
    setMessage(collected ? 'Collected. Nice find.' : 'Marked as still to find.');
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); if (!needsPick) save(true); }}>
      <h3>Your find</h3>
      <ViaChoice slot={slot} idp={idp} via={draft.via} onChange={(via) => set({ via })} />
      <div className="field">
        <label htmlFor={`${idp}-source`}>Which film, programme, series or channel is it from?<span className="hint"> · for the variety rules</span></label>
        <input id={`${idp}-source`} type="text" value={draft.source ?? ''} onChange={(e) => set({ source: e.target.value })} maxLength={120} />
      </div>
      {pickMedium && (
        <fieldset>
          <legend>Medium</legend>
          <div className="row">
            {MEDIUMS.map((m) => (
              <label key={m} className="check">
                <input type="radio" name={`${idp}-medium`} checked={draft.medium === m} onChange={() => set({ medium: m as Medium })} />
                <span>{SCENE_MEDIUMS[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
      {pickStyle && (
        <fieldset>
          <legend>Style</legend>
          {STYLES.map((st) => (
            <label key={st} className="check">
              <input type="radio" name={`${idp}-style`} checked={draft.style === st} onChange={() => set({ style: st as Style })} />
              <span>{SCENE_STYLES[st]} <span className="small muted">· {SCENE_STYLE_HINTS[st]}</span></span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="field">
        <label htmlFor={`${idp}-find`}>What did you find? <span className="hint">· a note for yourself: episode, scene, what happens</span></label>
        <input id={`${idp}-find`} type="text" value={draft.myFind} onChange={(e) => set({ myFind: e.target.value })} maxLength={200} />
      </div>
      <div className="field">
        <label htmlFor={`${idp}-start`}>Start at <span className="hint">· where the clip sits in your source; it plays until the next scene</span></label>
        <input id={`${idp}-start`} className="time" type="text" inputMode="numeric" placeholder="12:34" value={draft.start} onChange={(e) => set({ start: e.target.value })} maxLength={10} />
      </div>
      {warnings.length > 0 && (
        <div className="notice">
          <ul className="issues">
            {warnings.map((w) => <li key={w.message} className="issue-warning">{w.message}</li>)}
          </ul>
          <p className="small muted" style={{ marginTop: 6 }}>You can still save it, but a different find keeps the video varied.</p>
        </div>
      )}
      <div className="row">
        <button type="submit" className="btn btn-primary" disabled={needsPick}>{saved.collected && !saved.skipped ? 'Save changes' : 'Mark as collected'}</button>
        {saved.collected && <button type="button" className="btn" onClick={() => save(false)}>Not collected after all</button>}
      </div>
      {needsPick && <p className="small muted">Choose the {pickMedium && !draft.medium ? 'medium' : 'style'} of your find to save it.</p>}
      {message && <p className="small ok-text" role="status">{message}</p>}
    </form>
  );
}

function SkipScene({ tape, slot, progress }: { tape: Tape; slot: Slot; progress: TapeProgress }) {
  const skipped = progress[slot.id]?.skipped === true;
  const missing = sectionMissing(tape, slot, progress);
  if (!missing && !skipped) return null;
  const cue = slot.scene?.cue ?? '';
  const save = (value: boolean) => actions.setSlotProgress(tape.id, slot.id, { ...EMPTY_SLOT_PROGRESS, collected: value, skipped: value });
  if (skipped && !missing) {
    return (
      <div className="notice notice-info stack" style={{ gap: 8 }}>
        <p>You skipped this scene, but your song map now has a {cue}.</p>
        <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => save(false)}>Collect it after all</button>
      </div>
    );
  }
  return (
    <div className="notice notice-info stack" style={{ gap: 8 }}>
      <p>{skipped ? `Skipped: your song has no ${cue}.` : `Your song has no ${cue}, so you can skip this scene. The scene before it keeps playing.`}</p>
      {!skipped && <button type="button" className="btn btn-small" style={{ alignSelf: 'flex-start' }} onClick={() => save(true)}>Skip this scene</button>}
    </div>
  );
}

export function SyncDetail({ tape, slot, progress, region }: { tape: Tape; slot: Slot; progress: TapeProgress; region: string }) {
  const locked = isLocked(slot, tape, progress);
  const song = songSlot(tape);
  const cues = cueSheet(tape, progress);
  const cue = cues?.find((c) => c.slot.id === slot.id);
  const worksHere = slotWorksIn(slot, region);
  const mainWorksHere = slot.regions.includes(WORLD) || slot.regions.includes(region);
  const other = slot.scene?.differentFrom ? tape.slots.find((s) => s.id === slot.scene!.differentFrom) : undefined;
  const p = progress[slot.id];

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <span className="row small" style={{ gap: 8, fontWeight: 600 }}><LaneSwatch slot={slot} progress={p} />{slotName(tape, slot)} · {slotTypeLabel(slot, p)}</span>
        <span className="badge" style={{ color: 'var(--muted)' }}>{RARITIES[slot.rarity]}</span>
      </div>

      {locked ? (
        <div className="stack">
          <h2>Locked</h2>
          <p className="muted">This unlocks once you’ve collected {slotName(tape, tape.slots.find((s) => s.id === slot.lockedUntil)!).toLowerCase()}.</p>
        </div>
      ) : slot.type === 'song' ? (
        <>
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">{slot.song?.mode === 'open' ? 'Choose your song' : 'The song'}</span>
            <h2 style={{ fontSize: 19 }}>{slot.find}</h2>
            {slot.song?.mode === 'open' ? (
              <p className="small muted">Any song that fits, {formatTime(slot.song.minSeconds)} to {formatTime(slot.song.maxSeconds)} long. Every collector’s video comes out different.</p>
            ) : (
              <p className="small muted">Play exactly this version: {slot.song?.version || 'the one named'}, {formatTime(slot.seconds)}. A different version moves every cue.</p>
            )}
          </div>
          <dl className="stack" style={{ margin: 0, gap: 6 }}>
            {slot.where && <div><dt className="small muted">Where to listen</dt><dd style={{ margin: 0 }}>{slot.where}</dd></div>}
            <div><dt className="small muted">Available</dt><dd style={{ margin: 0 }}>{regionList(slot.regions)} · {COSTS[slot.cost]}</dd></div>
          </dl>
          <SourceLink link={slot.link} />
          <p className="small muted">Lyrics are never written into a tape. Listen for the words yourself, and describe them in your own words if you need to.</p>
          <Fallbacks slot={slot} />
          <SongForm key={slot.id} tape={tape} slot={slot} progress={progress} />
        </>
      ) : (
        <>
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="tile"><span>Plays during</span><span>{slot.scene?.cue || '—'}</span></div>
            <div className="tile">
              <span>{cue ? 'Starts · runs' : 'Timing'}</span>
              <span className="mono">{cue ? `${formatTime(cue.at)} · ${formatTime(cue.seconds)}` : song?.song?.mode === 'open' ? 'map your song' : '—'}</span>
            </div>
          </div>
          <div className="stack" style={{ gap: 6 }}>
            <span className="eyebrow">{slot.type === 'between' ? 'In the room' : `${SCENE_MODES[slot.scene?.mode ?? 'mood'].label}: ${SCENE_MODES[slot.scene?.mode ?? 'mood'].hint}`}</span>
            <h2 style={{ fontSize: 19 }}>{slot.find}</h2>
            {slot.mystery && <p className="small muted">A clue, not an exact clip: it depends on your song, so every collector’s video is different here.</p>}
            {other && <p className="small">Use a different medium and a different style from {slotName(tape, other).toLowerCase()}.</p>}
          </div>
          <SkipScene tape={tape} slot={slot} progress={progress} />
          {slot.type !== 'between' && (
            <dl className="stack" style={{ margin: 0, gap: 6 }}>
              <div><dt className="small muted">Kind of clip</dt><dd style={{ margin: 0 }}>{sceneKindLabel(slot, p)}</dd></div>
              {slot.where && <div><dt className="small muted">Where to look</dt><dd style={{ margin: 0 }}>{slot.where}</dd></div>}
              <div><dt className="small muted">Available</dt><dd style={{ margin: 0 }}>{regionList(slot.regions)} · {COSTS[slot.cost]}</dd></div>
            </dl>
          )}
          <SourceLink link={slot.link} />
          {slot.spoiler && <p className="badge badge-warn">Spoiler warning for this scene</p>}
          {!mainWorksHere && slot.type !== 'between' && (
            <div className={`notice ${worksHere ? 'notice-info' : ''}`}>
              {worksHere ? 'This one may not be available where you are, but a fallback is.' : 'This scene isn’t available where you are, and neither are its fallbacks.'}
            </div>
          )}
          <Fallbacks slot={slot} />
          {slot.type === 'between' ? (
            <p className="muted small">Nothing to find: you’ll do this in the room during play-along, while the song keeps going.</p>
          ) : !p?.skipped && (
            <SceneForm key={slot.id} tape={tape} slot={slot} progress={progress} />
          )}
        </>
      )}
    </div>
  );
}
