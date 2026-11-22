import { useEffect, useRef, useState } from 'react';
import { Hand, LaneSwatch, slotTypeLabel } from '../components/bits';
import { TesterFeedback } from '../components/TesterFeedback';
import { LANES } from '../model/constants';
import { isComplete } from '../model/progress';
import { EMPTY_PROGRESS, findTape, type ShelfTape, useStore } from '../model/store';
import { type Cue, cueSheet, isSync, sceneKindLabel, slotName, songLength, songSlot } from '../model/sync';
import { formatTime } from '../model/time';
import type { Slot, SlotProgress, Tape, TapeProgress } from '../model/types';
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
  const note = [p.source, p.myFind].filter((x) => x && x.trim()).join(': ');
  const what = p.via >= 0 ? `Fallback ${String.fromCharCode(65 + p.via)}${note ? `: ${note}` : ''}` : note;
  const times = p.start || p.end ? (p.end ? ` · from ${p.start || '?'} to ${p.end}` : ` · from ${p.start}`) : '';
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

/** The creator's notes, after the whole tape has played. */
function Reveal({ item }: { item: ShelfTape }) {
  const { tape } = item;
  const sync = isSync(tape);
  return (
    <section className="stack-lg" aria-labelledby="reveal-title">
      <div className="stack">
        <span className="eyebrow">The reveal</span>
        <h1 id="reveal-title">See what they did there</h1>
        <p className="muted">Why every piece is where it is, in <Hand kind="neat">{tape.creator}</Hand>’s words.</p>
      </div>
      <div>
        {tape.slots.filter((s) => !(sync && s.type === 'song' && !s.note)).map((s, i) => (
          <div key={s.id} className="reveal-item">
            <span className="mono muted">{sync ? (s.type === 'song' ? '♪' : slotName(tape, s).replace('Scene ', '')) : i + 1}</span>
            <div className="stack" style={{ gap: 4 }}>
              <span className="small muted">{slotTypeLabel(s)} · {s.type === 'interference' ? 'Interference' : s.find}</span>
              {s.note ? <Hand kind="neat" as="p">{s.note}</Hand> : <span className="muted small">No note for this one.</span>}
            </div>
          </div>
        ))}
      </div>
      {item.origin === 'sample' && <TesterFeedback tape={tape} />}
      <div className="row">
        <a className="btn" href={href(`/tape/${tape.id}`)}>Back to the tape</a>
        <a className="btn" href={href('/write')}>Write a tape of your own</a>
      </div>
    </section>
  );
}

/** Sync tapes: one clock for the whole song, telling you when to cut to each scene. */
function SongClock({ tape, cues, length, progress, onDone }: { tape: Tape; cues: Cue[]; length: number; progress: TapeProgress; onDone: () => void }) {
  const timer = useTimer(length);
  const t = timer.elapsed;
  let index = -1;
  cues.forEach((c, i) => { if (t >= c.at) index = i; });
  const now = cues[index];
  const next = cues[index + 1];
  const toNext = next ? Math.ceil(next.at - t) : 0;
  const started = t > 0;

  return (
    <div className="stack-lg">
      <div className="panel stack" style={{ alignItems: 'center', textAlign: 'center' }}>
        <span className="eyebrow">Song clock</span>
        <div className="timer" role="timer" aria-live="off">{formatTime(Math.floor(t))}</div>
        <div className="meter" style={{ width: '100%' }}><div style={{ width: `${(t / length) * 100}%`, background: 'var(--song)' }} /></div>
        <p className="small" role="status">
          {timer.done ? 'The song’s over. Hold the last picture for a moment.' : timer.running ? `Playing · ${formatTime(length - t)} to go` : started ? 'Paused. Pause the song too, then resume both together.' : 'Press play on the song and Start at the same moment.'}
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          {!timer.done && (timer.running
            ? <button type="button" className="btn" onClick={timer.pause}>Pause</button>
            : <button type="button" className="btn btn-primary" onClick={timer.start}>{started ? 'Resume' : 'Start'}</button>)}
          {started && <button type="button" className="btn" onClick={timer.reset}>Restart</button>}
          <button type="button" className={`btn ${timer.done ? 'btn-primary' : ''}`} onClick={onDone}>Finish the tape</button>
        </div>
      </div>

      <div className="stack" aria-live="polite">
        {now ? (
          <>
            <span className="row small" style={{ gap: 8, fontWeight: 600 }}>
              <LaneSwatch slot={now.slot} progress={progress[now.slot.id]} />Now: {slotName(tape, now.slot)} · {now.slot.scene?.cue} · {sceneKindLabel(now.slot, progress[now.slot.id])}
            </span>
            {now.slot.type === 'between' && <span className="eyebrow">In the room</span>}
            <h1 style={{ fontSize: 30 }}>{now.slot.find}</h1>
            {yourFind(now.slot, progress[now.slot.id]) && <p className="muted">You found: {yourFind(now.slot, progress[now.slot.id])}</p>}
          </>
        ) : (
          <p className="muted">{started ? 'Nothing on screen yet: the first scene starts at ' : 'The first scene starts at '}{cues[0] ? formatTime(cues[0].at) : '0:00'}.</p>
        )}
      </div>

      {next && (
        <div className="panel panel-tight stack" style={{ gap: 4 }}>
          <span className="small muted">Next{started ? ` in ${toNext} ${toNext === 1 ? 'second' : 'seconds'}` : ` at ${formatTime(next.at)}`}</span>
          <span style={{ fontSize: toNext <= 3 && started && !timer.done ? 22 : 16, fontWeight: 600 }}>
            {slotName(tape, next.slot)} · {next.slot.type === 'between' ? next.slot.find : next.slot.scene?.cue}
            {toNext <= 3 && started && !timer.done && <span className="mono"> · {toNext}</span>}
          </span>
          {next.slot.type !== 'between' && yourFind(next.slot, progress[next.slot.id]) && <span className="small muted">{yourFind(next.slot, progress[next.slot.id])}</span>}
        </div>
      )}
    </div>
  );
}

function SyncPlay({ item, progress }: { item: ShelfTape; progress: TapeProgress }) {
  const { tape } = item;
  // -1: setting up. 0: the song. 1: the pause. 2: the reveal.
  const [step, setStep] = useState(-1);
  const cues = cueSheet(tape, progress);
  const length = songLength(tape, progress);
  const song = songSlot(tape)!;
  const go = (s: number) => { setStep(s); window.scrollTo(0, 0); };

  if (!cues || length === null) {
    return (
      <div className="page play">
        <h1>Map your song first</h1>
        <p className="muted">Play-along needs to know when each part of your song starts.</p>
        <a className="btn btn-primary" href={href(`/tape/${tape.id}/collect`)} style={{ alignSelf: 'flex-start' }}>Back to collecting</a>
      </div>
    );
  }

  return (
    <div className="page play">
      <a href={href(`/tape/${tape.id}`)} className="small">← Leave play-along</a>
      {step === -1 && (
        <div className="stack-lg">
          <div className="stack">
            <span className="eyebrow">Play-along · {tape.title}</span>
            <h1>Set up first</h1>
            <p className="muted">Play the whole song in one go, without stopping, and cut to each scene as it comes. Being a second or two late is fine: a slightly wonky cut is part of the charm.</p>
          </div>
          <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
            <li>Put the song on one device (a phone, speaker or radio) and turn it up: {progress[song.id]?.myFind || song.find}.</li>
            <li>Open every clip on another screen, each <strong>muted</strong> and cued to your start time, in its own tab, in order.</li>
            <li>Keep this page where you can see it. Its clock tells you when to switch.</li>
            <li>Dim the lights. Don’t read the creator’s notes yet: they come at the end.</li>
          </ol>
          <div className="panel stack" style={{ gap: 0, padding: 0 }}>
            <h2 style={{ fontSize: 15, padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>Your cue sheet</h2>
            <ol className="slotlist" style={{ padding: 12 }}>
              {cues.map((c) => (
                <li key={c.slot.id} className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                  <span className="mono small" style={{ width: 48 }}>{formatTime(c.at)}</span>
                  <LaneSwatch slot={c.slot} progress={progress[c.slot.id]} />
                  <span className="stack" style={{ gap: 0 }}>
                    <span>{slotName(tape, c.slot)} · {c.slot.scene?.cue}</span>
                    <span className="small muted">{c.slot.type === 'between' ? c.slot.find : yourFind(c.slot, progress[c.slot.id]) || sceneKindLabel(c.slot, progress[c.slot.id])}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <button type="button" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={() => go(0)}>I’m ready</button>
        </div>
      )}
      {step === 0 && <SongClock tape={tape} cues={cues} length={length} progress={progress} onDone={() => go(1)} />}
      {step === 1 && (
        <div className="stack-lg" style={{ textAlign: 'center', alignItems: 'center', padding: '40px 0' }}>
          <h1>That’s the video.</h1>
          <p className="muted">Sit for a moment before reading on.</p>
          <button type="button" className="btn btn-primary" onClick={() => go(2)}>See what they did there</button>
        </div>
      )}
      {step === 2 && <Reveal item={item} />}
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

  if (isSync(tape)) return <SyncPlay item={item} progress={progress} />;

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

      {step === n + 1 && <Reveal item={item} />}
    </div>
  );
}
