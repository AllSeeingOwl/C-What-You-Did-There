import { useState } from 'react';
import { slotWorksIn } from '../model/availability';
import { COSTS, LANES, RARITIES, WORLD } from '../model/constants';
import { EMPTY_SLOT_PROGRESS, isLocked } from '../model/progress';
import { actions } from '../model/store';
import { slotNumber } from '../model/tape';
import { formatTime } from '../model/time';
import type { Slot, Tape, TapeProgress } from '../model/types';
import { LaneSwatch, regionList, slotTypeLabel, SourceLink } from './bits';

const letter = (i: number) => String.fromCharCode(65 + i);

function CollectForm({ tape, slot, progress }: { tape: Tape; slot: Slot; progress: TapeProgress }) {
  const saved = progress[slot.id] ?? EMPTY_SLOT_PROGRESS;
  const [draft, setDraft] = useState(saved);
  const [message, setMessage] = useState('');
  const set = (patch: Partial<typeof draft>) => setDraft((d) => ({ ...d, ...patch }));
  const idp = `c-${slot.id}`;

  function save(collected: boolean) {
    actions.setSlotProgress(tape.id, slot.id, { ...draft, collected });
    setDraft((d) => ({ ...d, collected }));
    setMessage(collected ? 'Collected. Nice find.' : 'Marked as still to find.');
  }

  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save(true); }}>
      <h3>Your find</h3>
      {slot.fallbacks.length > 0 && (
        <fieldset>
          <legend>I found it using</legend>
          <label className="check">
            <input type="radio" name={`${idp}-via`} checked={draft.via === -1} onChange={() => set({ via: -1 })} />
            <span>The main slot</span>
          </label>
          {slot.fallbacks.map((_, i) => (
            <label className="check" key={i}>
              <input type="radio" name={`${idp}-via`} checked={draft.via === i} onChange={() => set({ via: i })} />
              <span>Fallback {letter(i)}</span>
            </label>
          ))}
        </fieldset>
      )}
      <div className="field">
        <label htmlFor={`${idp}-find`}>What did you find? <span className="hint">· a note for yourself: programme, episode, channel</span></label>
        <input id={`${idp}-find`} type="text" value={draft.myFind} onChange={(e) => set({ myFind: e.target.value })} maxLength={200} />
      </div>
      <div className="row">
        <div className="field">
          <label htmlFor={`${idp}-start`}>Start at</label>
          <input id={`${idp}-start`} className="time" type="text" inputMode="numeric" placeholder="12:34" value={draft.start} onChange={(e) => set({ start: e.target.value })} maxLength={10} />
        </div>
        <div className="field">
          <label htmlFor={`${idp}-end`}>End at</label>
          <input id={`${idp}-end`} className="time" type="text" inputMode="numeric" placeholder="13:16" value={draft.end} onChange={(e) => set({ end: e.target.value })} maxLength={10} />
        </div>
      </div>
      <p className="small muted">Times are where the moment sits in your source, so you can cue it up during play-along.</p>
      <div className="row">
        <button type="submit" className="btn btn-primary">{saved.collected ? 'Save changes' : 'Mark as collected'}</button>
        {saved.collected && <button type="button" className="btn" onClick={() => save(false)}>Not collected after all</button>}
      </div>
      {message && <p className="small ok-text" role="status">{message}</p>}
    </form>
  );
}

export function SlotDetail({ tape, slot, progress, region }: { tape: Tape; slot: Slot; progress: TapeProgress; region: string }) {
  const n = slotNumber(tape, slot.id);
  const locked = isLocked(slot, tape, progress);
  const offset = tape.slots.slice(0, n - 1).reduce((a, s) => a + s.seconds, 0);
  const worksHere = slotWorksIn(slot, region);
  const mainWorksHere = slot.regions.includes(WORLD) || slot.regions.includes(region);

  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <span className="row small" style={{ gap: 8, fontWeight: 600 }}><LaneSwatch slot={slot} />{slotTypeLabel(slot)} · Slot {n}</span>
        <span className="badge" style={{ color: 'var(--muted)' }}>{RARITIES[slot.rarity]}</span>
      </div>

      {locked ? (
        <div className="stack">
          <h2>Locked</h2>
          <p className="muted">This slot unlocks once you’ve collected slot {slotNumber(tape, slot.lockedUntil!)}.</p>
        </div>
      ) : (
        <>
          <div className="row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="tile"><span>In the tape</span><span className="mono">{formatTime(offset)}</span></div>
            <div className="tile"><span>Length</span><span className="mono">{formatTime(slot.seconds)}</span></div>
          </div>

          {slot.type === 'interference' && slot.interference ? (
            <div className="stack">
              <h2>{slot.find || 'Interference'}</h2>
              <p className="small muted">A muted picture from one source plays under sound from another. {slot.interference.mode === 'merge' ? 'Uncanny merge: they almost fit.' : 'Clash: they fight each other.'}</p>
              {(['picture', 'sound'] as const).map((part) => {
                const p = slot.interference![part];
                return (
                  <div key={part} className="tile" style={{ gap: 4 }}>
                    <span>{part === 'picture' ? 'Picture, muted' : 'Sound'} · {LANES[p.media].label}</span>
                    <span>{p.find}</span>
                    {p.where && <span className="small muted">Where to look: {p.where}</span>}
                    <SourceLink link={p.link} />
                  </div>
                );
              })}
              <div className="tile"><span>Sync cue</span><span>{slot.interference.syncCue}</span></div>
            </div>
          ) : (
            <div className="stack" style={{ gap: 6 }}>
              <span className="eyebrow">{slot.type === 'between' ? 'In the room' : slot.mystery ? 'Mystery clue' : 'What to find'}</span>
              <h2 style={{ fontSize: 19 }}>{slot.find}</h2>
              {slot.mystery && <p className="small muted">A clue, not a timestamp: every collector’s tape is a little different here.</p>}
            </div>
          )}

          {slot.type !== 'between' && (
            <dl className="stack" style={{ margin: 0, gap: 6 }}>
              {slot.type !== 'interference' && slot.where && <div><dt className="small muted">Where to look</dt><dd style={{ margin: 0 }}>{slot.where}</dd></div>}
              <div><dt className="small muted">Available</dt><dd style={{ margin: 0 }}>{regionList(slot.regions)} · {COSTS[slot.cost]}</dd></div>
            </dl>
          )}
          {slot.type !== 'interference' && <SourceLink link={slot.link} />}
          {slot.spoiler && <p className="badge badge-warn">Spoiler warning for this slot</p>}

          {!mainWorksHere && slot.type !== 'between' && (
            <div className={`notice ${worksHere ? 'notice-info' : ''}`}>
              {worksHere ? 'This one may not be available where you are, but a fallback is.' : 'This slot isn’t available where you are, and neither are its fallbacks.'}
            </div>
          )}

          {slot.fallbacks.length > 0 && (
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
          )}

          {slot.type === 'between' ? (
            <p className="muted small">Nothing to find: you’ll do this in the room during play-along.</p>
          ) : (
            <CollectForm key={slot.id} tape={tape} slot={slot} progress={progress} />
          )}
        </>
      )}
    </div>
  );
}
