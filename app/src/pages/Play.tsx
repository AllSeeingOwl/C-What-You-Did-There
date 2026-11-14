import { useEffect, useRef, useState } from 'react';
import { Hand, LaneSwatch, slotTypeLabel } from '../components/bits';
import { LANES } from '../model/constants';
import { isComplete } from '../model/progress';
import { EMPTY_PROGRESS, findTape, useStore } from '../model/store';
import { formatTime } from '../model/time';
import type { Slot, SlotProgress, Tape } from '../model/types';
import { href } from '../router';
import { NotFound } from './NotFound';

function useTimer(seconds: number) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const base = useRef({ startedAt: 0, before: 0 });

  useEffect(() => {
    if (!running) return;
    base.current.startedAt = Date.now();
    const tick = () => {
      const e = base.current.before + (Date.now() - base.current.startedAt) / 1000;
      setElapsed(Math.min(e, seconds));
      if (e >= seconds) setRunning(false);
    };
    const t = window.setInterval(tick, 200);
    return () => {
      window.clearInterval(t);
      // startedAt is 0 after a restart, so a stale run doesn't add its time back.
      if (base.current.startedAt) base.current.before += (Date.now() - base.current.startedAt) / 1000;
      base.current.startedAt = 0;
    };
  }, [running, seconds]);

  const reset = () => {
    setRunning(false);
    base.current = { startedAt: 0, before: 0 };
    setElapsed(0);
  };
  return { elapsed, running, done: elapsed >= seconds, start: () => setRunning(true), pause: () => setRunning(false), reset };
}

function yourFind(slot: Slot, p: SlotProgress | undefined): string {
  if (!p) return '';
  const what = p.via >= 0 ? `Fallback ${String.fromCharCode(65 + p.via)}${p.myFind ? `: ${p.myFind}` : ''}` : p.myFind;
  const times = p.start || p.end ? ` · from ${p.start || '?'} to ${p.end || '?'}` : '';
  return slot.type === 'between' ? '' : `${what || 'Your find'}${times}`;
}

function SlotStep({ tape, index, onNext }: { tape: Tape; index: number; onNext: () => void }) {
  const slot = tape.slots[index];
  const progress = useStore((s) => s.progress[tape.id]?.[slot.id]);
  const timer = useTimer(slot.seconds);
  const next = tape.slots[index + 1];
  const remaining = slot.seconds - timer.elapsed;
  const i = slot.interference;

  return (
    <div className="stack-lg">
      <div className="stack">
        <span className="row small" style={{ gap: 8, fontWeight: 600 }}><LaneSwatch slot={slot} />Slot {index + 1} of {tape.slots.length} · {slotTypeLabel(slot)}</span>
        {slot.type === 'between' ? (
          <>
            <span className="eyebrow">In the room</span>
            <h1 style={{ fontSize: 30 }}>{slot.find}</h1>
          </>
        ) : slot.type === 'interference' && i ? (
          <>
            <h1 style={{ fontSize: 30 }}>Interference</h1>
            <div className="split">
              <div className="tile" style={{ borderTop: `4px solid ${LANES[i.picture.media].colour}` }}>
                <span>Picture, sound off</span>
                <span>{i.picture.find}</span>
              </div>
              <div className="tile" style={{ borderTop: `4px solid ${LANES[i.sound.media].colour}` }}>
                <span>Sound</span>
                <span>{i.sound.find}</span>
              </div>
            </div>
            <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
              <li>Start the picture with the sound off.</li>
              <li>Watch for the sync cue: <strong>{i.syncCue}</strong></li>
              <li>Start the sound at that moment, then start the timer. Let both run for {formatTime(slot.seconds)}.</li>
            </ol>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: 30 }}>{slot.find}</h1>
          </>
        )}
        {yourFind(slot, progress) && <p className="muted">You found: {yourFind(slot, progress)}</p>}
      </div>

      <div className="panel stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <div className="timer" role="timer" aria-live="off">{formatTime(Math.ceil(remaining))}</div>
        <div className="meter" style={{ width: '100%' }}><div style={{ width: `${(timer.elapsed / slot.seconds) * 100}%` }} /></div>
        <p className="small" role="status">{timer.done ? 'Time. Stop this one and move on.' : timer.running ? 'Playing…' : `Start the timer as you start the ${slot.type === 'between' ? 'instruction' : 'clip'}.`}</p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {!timer.done && (timer.running
            ? <button type="button" className="btn" onClick={timer.pause}>Pause</button>
            : <button type="button" className="btn btn-primary" onClick={timer.start}>{timer.elapsed > 0 ? 'Resume' : 'Start timer'}</button>)}
          {timer.elapsed > 0 && <button type="button" className="btn" onClick={timer.reset}>Restart</button>}
          <button type="button" className={`btn ${timer.done ? 'btn-primary' : ''}`} onClick={onNext}>{next ? 'Next slot →' : 'Finish the tape'}</button>
        </div>
      </div>

      {next && (
        <p className="small muted">
          Up next: slot {index + 2}, {slotTypeLabel(next)}, {formatTime(next.seconds)}.
          {next.type !== 'between' && ' Have it cued up.'}
        </p>
      )}
    </div>
  );
}

export function Play({ id }: { id: string }) {
  const item = useStore((s) => findTape(s, id));
  const progress = useStore((s) => s.progress[id] ?? EMPTY_PROGRESS);
  // -1: setting up. 0..n-1: playing a slot. n: the pause. n+1: the reveal.
  const [step, setStep] = useState(-1);

  if (!item) return <NotFound what="tape" />;
  const { tape } = item;
  const n = tape.slots.length;

  if (!isComplete(tape, progress)) {
    return (
      <div className="page play">
        <h1>Not quite yet</h1>
        <p className="muted">Play-along unlocks once you’ve collected every slot.</p>
        <a className="btn btn-primary" href={href(`/tape/${tape.id}/collect`)} style={{ alignSelf: 'flex-start' }}>Back to collecting</a>
      </div>
    );
  }

  const go = (s: number) => {
    setStep(s);
    window.scrollTo(0, 0);
  };

  return (
    <div className="page play">
      <div className="stack">
        <a href={href(`/tape/${tape.id}`)} className="small">← Leave play-along</a>
        <div className="play-progress" aria-hidden="true">
          {tape.slots.map((s, i) => <span key={s.id} className={i < step ? 'done' : i === step ? 'now' : ''} />)}
        </div>
      </div>

      {step === -1 && (
        <div className="stack-lg">
          <div className="stack">
            <span className="eyebrow">Play-along · {tape.title}</span>
            <h1>Set up first</h1>
            <p className="muted">Play all {n} slots in one sitting, in order, with as little gap as you can manage. Small gaps while you switch sources are fine: it’s about the flow, not split-second timing.</p>
          </div>
          <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
            <li>Open every source in its own tab or app, cued to your start time.</li>
            <li>Keep this page beside you: it times each slot and tells you what’s next.</li>
            <li>Dim the lights and sit somewhere you can see a screen and hear clearly.</li>
            <li>Don’t read the creator’s notes yet. They come at the end.</li>
          </ol>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => go(0)}>I’m ready: start slot 1</button>
        </div>
      )}

      {step >= 0 && step < n && <SlotStep key={step} tape={tape} index={step} onNext={() => go(step + 1)} />}

      {step === n && (
        <div className="stack-lg" style={{ textAlign: 'center', alignItems: 'center', padding: '40px 0' }}>
          <h1>That’s the tape.</h1>
          <p className="muted">Sit for a moment before reading on.</p>
          <button type="button" className="btn btn-primary" onClick={() => go(n + 1)}>See what they did there</button>
        </div>
      )}

      {step === n + 1 && (
        <section className="stack-lg" aria-labelledby="reveal-title">
          <div className="stack">
            <span className="eyebrow">The reveal</span>
            <h1 id="reveal-title">See what they did there</h1>
            <p className="muted">Why every piece is where it is, in <Hand kind="neat">{tape.creator}</Hand>’s words.</p>
          </div>
          <div>
            {tape.slots.map((s, i) => (
              <div key={s.id} className="reveal-item">
                <span className="mono muted">{i + 1}</span>
                <div className="stack" style={{ gap: 4 }}>
                  <span className="small muted">{slotTypeLabel(s)} · {s.type === 'interference' ? 'Interference' : s.find}</span>
                  {s.note ? <Hand kind="neat" as="p">{s.note}</Hand> : <span className="muted small">No note for this one.</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="row">
            <a className="btn" href={href(`/tape/${tape.id}`)}>Back to the tape</a>
            <a className="btn" href={href('/write')}>Write a tape of your own</a>
          </div>
        </section>
      )}
    </div>
  );
}
