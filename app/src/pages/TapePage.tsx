import { Hand, JCard, LaneSwatch, RegionBadge, regionList, slotTypeLabel, TapeWarnings, Vibes } from '../components/bits';
import { ShareTools } from '../components/ShareTools';
import { slotWorksIn, tapeAvailability } from '../model/availability';
import { COSTS, DIFFICULTIES, SCENE_MODES } from '../model/constants';
import { collectedCount, hasStarted, isCollected, isComplete, isLocked } from '../model/progress';
import { actions, EMPTY_PROGRESS, findTape, useStore } from '../model/store';
import { isSync, sceneKindLabel, slotName } from '../model/sync';
import { lengthLabel, slotNumber } from '../model/tape';
import { formatTime } from '../model/time';
import type { Cost, Slot, Tape, TapeProgress } from '../model/types';
import { href, navigate } from '../router';
import { NotFound } from './NotFound';

/** "3" for slot 3 of a mixtape; "song" or "3" (scene 3) for a sync tape. */
function shortName(tape: Tape, slot: Slot): string {
  return slotName(tape, slot).replace(/^(Slot|Scene) /, '').toLowerCase();
}

function needs(tape: Tape): { cost: Cost; slots: string[] }[] {
  const by = new Map<Cost, string[]>();
  tape.slots.forEach((s) => {
    by.set(s.cost, [...(by.get(s.cost) ?? []), shortName(tape, s)]);
  });
  return [...by.entries()].map(([cost, slots]) => ({ cost, slots }));
}

function SyncOrder({ tape, progress, region }: { tape: Tape; progress: TapeProgress; region: string }) {
  return (
    <table className="order">
      <thead>
        <tr><th scope="col">#</th><th scope="col">Plays during</th><th scope="col">Mode</th><th scope="col">Medium · style</th><th scope="col">What to find</th><th scope="col">Available</th></tr>
      </thead>
      <tbody>
        {tape.slots.map((s) => {
          const locked = isLocked(s, tape, progress);
          const song = s.song;
          const fixed = song?.mode === 'fixed';
          return (
            <tr key={s.id}>
              <td className="num">{s.type === 'song' ? '♪' : shortName(tape, s)}</td>
              <td>
                {s.type === 'song' ? 'The whole tape, with the sound on' : (
                  <>
                    {s.scene?.at !== undefined && <span className="mono">{formatTime(s.scene.at)} </span>}
                    {s.scene?.cue}
                  </>
                )}
              </td>
              <td className="small">{s.type === 'song' ? '' : s.type === 'between' ? 'In the room' : `${SCENE_MODES[s.scene?.mode ?? 'mood'].label}${s.mystery ? ' (mystery)' : ''}`}</td>
              <td><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><LaneSwatch slot={s} />{s.type === 'song' ? 'Song' : sceneKindLabel(s)}</span></td>
              <td>
                {locked ? (
                  <span className="muted">Locked until you’ve found {slotName(tape, tape.slots.find((x) => x.id === s.lockedUntil)!).toLowerCase()}.</span>
                ) : (
                  <>
                    {s.type === 'song' && (fixed ? <strong>Song: </strong> : <strong>Choose a song: </strong>)}
                    {s.find}
                    {fixed && song.version && <span className="muted"> ({song.version})</span>}
                    {song?.mode === 'open' && <span className="muted"> It must run {formatTime(song.minSeconds)} to {formatTime(song.maxSeconds)}.</span>}
                    {s.scene?.differentFrom && (
                      <span className="muted"> Use a different medium and style from {slotName(tape, tape.slots.find((x) => x.id === s.scene!.differentFrom) ?? s).toLowerCase()}.</span>
                    )}
                    {s.spoiler && <span className="badge badge-warn" style={{ marginLeft: 6 }}>Spoiler</span>}
                  </>
                )}
                {isCollected(s, progress) && s.type !== 'between' && <span className="ok-text small"> · {progress[s.id]?.skipped ? 'skipped' : 'collected'}</span>}
              </td>
              <td className="small">
                {s.type === 'between' ? 'Anywhere' : regionList(s.regions)}
                {s.fallbacks.length > 0 && <span className="muted"> · {s.fallbacks.length} fallback{s.fallbacks.length > 1 ? 's' : ''}</span>}
                {!slotWorksIn(s, region) && <span className="error-text"> · not where you are</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export function TapePage({ id }: { id: string }) {
  const item = useStore((s) => findTape(s, id));
  const progress = useStore((s) => s.progress[id] ?? EMPTY_PROGRESS);
  const region = useStore((s) => s.settings.region);
  if (!item) return <NotFound what="tape" />;
  const { tape, origin } = item;
  const a = tapeAvailability(tape, region);
  const started = hasStarted(tape, progress);
  const complete = isComplete(tape, progress);

  function remove() {
    const verb = origin === 'mine' ? 'Delete' : 'Remove';
    if (window.confirm(`${verb} “${tape.title}” from this browser? Your collecting progress for it goes too.`)) {
      actions.deleteTape(tape.id);
      navigate('/');
    }
  }

  return (
    <div className="page">
      {item.draft && (
        <div className="notice">This is a draft. Finish it in <a href={href(`/write/${tape.id}`)}>Write a tape</a> before sharing it.</div>
      )}
      <div className="grid-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
        <JCard tape={tape} big />
        <div className="stack-lg">
          <div className="stack">
            <span className="eyebrow">{lengthLabel(tape)}</span>
            {isSync(tape) && <p className="muted">A sync tape: a home-made music video. One song plays with the sound on while you cut muted clips in over it.</p>}
            <h1>{tape.title}</h1>
            <Vibes tape={tape} />
            {tape.theme && <p className="muted">Theme: {tape.theme}</p>}
            <div className="row" style={{ gap: 6 }}>
              <RegionBadge a={a} />
              <TapeWarnings tape={tape} />
            </div>
          </div>
          {tape.liner && (
            <div className="stack" style={{ gap: 4 }}>
              <span className="eyebrow">Liner notes</span>
              <Hand kind="neat" as="p">{tape.liner}</Hand>
            </div>
          )}
          <div className="row">
            {complete ? (
              <a className="btn btn-primary" href={href(`/tape/${tape.id}/play`)}>▶ Start play-along</a>
            ) : (
              <a className="btn btn-primary" href={href(`/tape/${tape.id}/collect`)}>{started ? `Carry on collecting (${collectedCount(tape, progress)} of ${tape.slots.length})` : 'Start collecting'}</a>
            )}
            {complete && <a className="btn" href={href(`/tape/${tape.id}/collect`)}>View timeline</a>}
          </div>
          {origin === 'sample' && (
            <p className="small muted">
              Testing this for us? The questions come after the reveal, or <a href={href(`/tape/${tape.id}/feedback`)}>answer them now</a> if you’ve stopped partway. That’s useful too.
            </p>
          )}
        </div>
      </div>

      <div className="grid-2">
        <section className="panel stack" aria-labelledby="need-title">
          <h2 id="need-title">What you’ll need</h2>
          <p className="muted small">{DIFFICULTIES[tape.difficulty]}</p>
          <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
            {needs(tape).map((n) => (
              <li key={n.cost}>
                <strong>{COSTS[n.cost]}</strong>: {n.slots.length} {n.slots.length === 1 ? 'piece' : 'pieces'} <span className="muted small">({n.slots.join(', ')})</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel stack" aria-labelledby="share-title">
          <h2 id="share-title">Share this tape</h2>
          <ShareTools tape={tape} />
          <div className="row">
            {origin === 'mine' && <a className="btn" href={href(`/write/${tape.id}`)}>Edit tape</a>}
            {started && (
              <button type="button" className="btn" onClick={() => window.confirm('Start collecting this tape again from scratch?') && actions.resetProgress(tape.id)}>
                Reset my progress
              </button>
            )}
            {origin !== 'sample' && <button type="button" className="btn btn-danger" onClick={remove}>{origin === 'mine' ? 'Delete tape' : 'Remove from shelf'}</button>}
          </div>
        </section>
      </div>

      <section className="panel stack" aria-labelledby="order-title">
        <h2 id="order-title">Running order</h2>
        <p className="small muted">The creator’s notes stay hidden until you’ve played the whole tape.</p>
        {isSync(tape) && (
          <p className="small muted">Keep it varied: never the same clip twice, no more than two scenes from one film, programme or channel, and no medium or style in more than half the scenes.</p>
        )}
        <div style={{ overflowX: 'auto' }}>
          {isSync(tape) ? <SyncOrder tape={tape} progress={progress} region={region} /> : (
          <table className="order">
            <thead>
              <tr><th scope="col">#</th><th scope="col">Type</th><th scope="col">Length</th><th scope="col">What to find</th><th scope="col">Available</th></tr>
            </thead>
            <tbody>
              {tape.slots.map((s, i) => {
                const locked = isLocked(s, tape, progress);
                return (
                  <tr key={s.id}>
                    <td className="num">{i + 1}</td>
                    <td><span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}><LaneSwatch slot={s} />{slotTypeLabel(s)}</span></td>
                    <td className="len">{formatTime(s.seconds)}</td>
                    <td>
                      {locked ? (
                        <span className="muted">Locked until you’ve found slot {slotNumber(tape, s.lockedUntil!)}.</span>
                      ) : (
                        <>
                          {s.mystery && <span className="muted">Clue: </span>}
                          {s.type === 'interference' && s.interference ? `Picture (muted): ${s.interference.picture.find} Sound: ${s.interference.sound.find}` : s.find}
                          {s.spoiler && <span className="badge badge-warn" style={{ marginLeft: 6 }}>Spoiler</span>}
                        </>
                      )}
                      {isCollected(s, progress) && s.type !== 'between' && <span className="ok-text small"> · collected</span>}
                    </td>
                    <td className="small">
                      {s.type === 'between' ? 'Anywhere' : regionList(s.regions)}
                      {s.fallbacks.length > 0 && <span className="muted"> · {s.fallbacks.length} fallback{s.fallbacks.length > 1 ? 's' : ''}</span>}
                      {!slotWorksIn(s, region) && <span className="error-text"> · not where you are</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )}
        </div>
      </section>
    </div>
  );
}
