import { useEffect, useState } from 'react';
import { LaneSwatch, slotTypeLabel } from '../components/bits';
import { SlotDetail } from '../components/SlotDetail';
import { LANES, SLOT_TYPES } from '../model/constants';
import { collectedCount, isCollected, isComplete, isLocked } from '../model/progress';
import { EMPTY_PROGRESS, findTape, useStore } from '../model/store';
import { slotOffsets, totalSeconds } from '../model/tape';
import { formatTime } from '../model/time';
import type { Slot, SlotType, Tape, TapeProgress } from '../model/types';
import { href } from '../router';
import { NotFound } from './NotFound';

const LABEL_W = 140;
const DARK = '#101216';

function laneOf(slot: Slot): SlotType {
  return slot.type;
}

function blockLook(slot: Slot, tape: Tape, progress: TapeProgress): React.CSSProperties {
  const locked = isLocked(slot, tape, progress);
  const got = isCollected(slot, progress);
  if (locked) return { background: '#1B1E24', borderColor: '#3A3F48', borderStyle: 'dashed', color: '#A7ABB3' };
  const top = slot.type === 'interference' && slot.interference ? LANES[slot.interference.picture.media].colour : LANES[slot.type].colour;
  const bottom = slot.type === 'interference' && slot.interference ? LANES[slot.interference.sound.media].colour : top;
  if (got) return { background: `linear-gradient(${top} 0 50%, ${bottom} 50% 100%)`, color: DARK };
  return {
    background: `repeating-linear-gradient(135deg, ${top}33 0 4px, transparent 4px 8px)`,
    borderColor: top,
    borderStyle: 'dashed',
    color: '#E8E9EC',
  };
}

function stateWord(slot: Slot, tape: Tape, progress: TapeProgress): string {
  if (isLocked(slot, tape, progress)) return 'locked';
  if (slot.type === 'between') return 'nothing to find';
  return isCollected(slot, progress) ? 'collected' : 'still to find';
}

function shortTitle(slot: Slot, locked: boolean): string {
  if (locked) return 'Locked';
  const text = slot.type === 'interference' ? 'Interference' : slot.find;
  return (slot.mystery ? '? ' : '') + text;
}

function Timeline({ tape, progress, selected, onPick }: { tape: Tape; progress: TapeProgress; selected: string; onPick: (id: string) => void }) {
  const total = totalSeconds(tape);
  const pps = Math.min(4, Math.max(1.2, 1100 / Math.max(total, 1)));
  const offsets = slotOffsets(tape);
  const lanes = SLOT_TYPES.filter((t) => tape.slots.some((s) => laneOf(s) === t));
  const width = LABEL_W + total * pps + 24;
  const ticks: { at: number; major: boolean }[] = [];
  for (let t = 0; t <= total; t += 30) ticks.push({ at: t, major: t % 60 === 0 });

  return (
    <div className="timeline" role="region" aria-label="Timeline" tabIndex={0}>
      <div className="timeline-inner" style={{ width }}>
        <div className="ruler">
          <div style={{ position: 'sticky', left: 0, top: 0, width: LABEL_W, height: 30, background: 'var(--panel)', zIndex: 2 }} />
          {ticks.map((t) => (
            <span key={t.at}>
              <span className="tick" style={{ left: LABEL_W + t.at * pps, height: t.major ? 12 : 6 }} />
              {t.major && <span className="tick-label" style={{ left: LABEL_W + t.at * pps + 4 }}>{formatTime(t.at)}</span>}
            </span>
          ))}
        </div>
        {lanes.map((lane) => (
          <div className="lane" key={lane}>
            <div className="lane-label" style={{ width: LABEL_W }}>
              <span className="swatch" style={{ background: LANES[lane].colour }} />
              {LANES[lane].label}
            </div>
            {tape.slots.map((s, i) => {
              if (laneOf(s) !== lane) return null;
              const locked = isLocked(s, tape, progress);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`block ${selected === s.id ? 'selected' : ''}`}
                  style={{ left: LABEL_W + offsets[i] * pps, width: Math.max(24, s.seconds * pps - 3), ...blockLook(s, tape, progress) }}
                  onClick={() => onPick(s.id)}
                  aria-pressed={selected === s.id}
                  aria-label={`Slot ${i + 1}, ${slotTypeLabel(s)}, ${formatTime(s.seconds)}, ${stateWord(s, tape, progress)}`}
                >
                  <span className="n">{i + 1}</span>
                  <span className="t">{shortTitle(s, locked)}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotList({ tape, progress, selected, onPick }: { tape: Tape; progress: TapeProgress; selected: string; onPick: (id: string) => void }) {
  return (
    <ol className="slotlist" aria-label="Slots">
      {tape.slots.map((s, i) => {
        const locked = isLocked(s, tape, progress);
        const look = blockLook(s, tape, progress);
        return (
          <li key={s.id}>
            <button type="button" className={`slotrow ${selected === s.id ? 'selected' : ''}`} onClick={() => onPick(s.id)}>
              <span className="bar" style={{ ...look, borderWidth: 1.5, minHeight: Math.min(80, 24 + s.seconds * 0.6) }} aria-hidden="true" />
              <span className="mono small" style={{ width: 22 }}>{i + 1}</span>
              <span className="body">
                <span className="title">{shortTitle(s, locked)}</span>
                <span className="small muted">{slotTypeLabel(s)} · {formatTime(s.seconds)} · {stateWord(s, tape, progress)}</span>
              </span>
              <span aria-hidden="true" className="muted">›</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function Collect({ id }: { id: string }) {
  const item = useStore((s) => findTape(s, id));
  const progress = useStore((s) => s.progress[id] ?? EMPTY_PROGRESS);
  const region = useStore((s) => s.settings.region);
  const [selected, setSelected] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheetOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  if (!item) return <NotFound what="tape" />;
  const { tape } = item;
  const current = tape.slots.find((s) => s.id === selected) ?? tape.slots.find((s) => !isCollected(s, progress) && !isLocked(s, tape, progress)) ?? tape.slots[0];
  const got = collectedCount(tape, progress);
  const complete = isComplete(tape, progress);
  const pct = Math.round((got / Math.max(1, tape.slots.length)) * 100);

  const pickWide = (sid: string) => setSelected(sid);
  const pickNarrow = (sid: string) => { setSelected(sid); setSheetOpen(true); };

  return (
    <div className="page">
      <div className="row between" style={{ alignItems: 'flex-end' }}>
        <div className="stack" style={{ gap: 6 }}>
          <a href={href(`/tape/${tape.id}`)} className="small">← Back to the tape</a>
          <span className="eyebrow">{tape.tier} · {formatTime(totalSeconds(tape))} · {tape.slots.length} slots · {complete ? 'all collected' : 'collecting'}</span>
          <h1>{tape.title}</h1>
        </div>
        <div className="row" style={{ gap: 16 }}>
          <div className="stack" style={{ gap: 6, width: 220 }}>
            <div className="row between small"><span className="muted">Collected</span><span className="mono">{got} / {tape.slots.length}</span></div>
            <div className="meter" role="progressbar" aria-label="Collected" aria-valuenow={got} aria-valuemin={0} aria-valuemax={tape.slots.length}><div style={{ width: `${pct}%` }} /></div>
          </div>
          {complete ? (
            <a className="btn btn-primary" href={href(`/tape/${tape.id}/play`)}>▶ Start play-along</a>
          ) : (
            <button type="button" className="btn" disabled>Play-along unlocks at {tape.slots.length}/{tape.slots.length}</button>
          )}
        </div>
      </div>

      <div className="collect-layout">
        <div className="stack">
          <div className="panel only-wide" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="row between" style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: 15 }}>Timeline</h2>
              <span className="small muted">Choose any block to see what to find</span>
            </div>
            <Timeline tape={tape} progress={progress} selected={current.id} onPick={pickWide} />
          </div>
          <div className="legend only-wide" aria-label="Key">
            <span><i style={{ background: '#3DBE7A' }} />Collected</span>
            <span><i style={{ border: '1.5px dashed #3DBE7A', background: 'repeating-linear-gradient(135deg, #3DBE7A33 0 4px, transparent 4px 8px)' }} />Still to find</span>
            <span><i style={{ border: '1.5px dashed #3A3F48', background: '#1B1E24' }} />Locked until an earlier slot is found</span>
            <span><i style={{ background: 'linear-gradient(#3DBE7A 0 50%, #E9A23B 50% 100%)' }} />Interference: picture on top, sound underneath</span>
            <span><span className="mono" style={{ color: 'var(--text)' }}>?</span>Mystery: a clue, not a timestamp</span>
          </div>
          <div className="only-narrow">
            <SlotList tape={tape} progress={progress} selected={sheetOpen ? current.id : ''} onPick={pickNarrow} />
          </div>
        </div>
        <aside className="panel inspector only-wide" aria-label="Slot details">
          <SlotDetail key={current.id} tape={tape} slot={current} progress={progress} region={region} />
        </aside>
      </div>

      {sheetOpen && (
        <div className="sheet-backdrop only-narrow" onClick={() => setSheetOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Slot details" onClick={(e) => e.stopPropagation()}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="row small muted" style={{ gap: 8 }}><LaneSwatch slot={current} />Slot details</span>
              <button type="button" className="btn btn-small" onClick={() => setSheetOpen(false)} autoFocus>Close</button>
            </div>
            <SlotDetail key={current.id} tape={tape} slot={current} progress={progress} region={region} />
          </div>
        </div>
      )}
    </div>
  );
}
