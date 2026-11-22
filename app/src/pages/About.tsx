import { TIER_IDS, TIERS } from '../model/constants';
import { formatTime } from '../model/time';
import { href } from '../router';

export function About() {
  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <div className="stack">
        <span className="eyebrow">How it works</span>
        <h1>Side C <span className="muted" style={{ fontSize: '0.5em', fontWeight: 500 }}>(What You Did There)</span></h1>
        <p className="muted">The secret third side of a cassette. A tape is a set of instructions, not a playlist: no clips are hosted or shared, the tape only points to them.</p>
      </div>

      <section className="panel stack">
        <h2>Four steps</h2>
        <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>Pick a tape.</strong> Browse by length, vibe or region. Every tape shows what you’ll need and where it works.</li>
          <li><strong>Hunt the pieces.</strong> Each slot says what to find, where to look and how long it runs. Mystery slots give a clue instead, and fallbacks help when something’s hard to get.</li>
          <li><strong>Play it back.</strong> Play-along walks you through the tape slot by slot, in one sitting, including Interference: a muted picture from one source under sound from another.</li>
          <li><strong>The reveal.</strong> The creator’s notes for every slot, saved for the end.</li>
        </ol>
      </section>

      <section className="panel stack">
        <h2>Tape lengths</h2>
        <ul className="stack" style={{ margin: 0, paddingLeft: 20 }}>
          {TIER_IDS.map((t) => (
            <li key={t}><strong className="mono">{t}</strong>: {formatTime(TIERS[t].minSeconds)} to {formatTime(TIERS[t].maxSeconds)}, {t === 'C5' ? '3 to 6' : `up to ${TIERS[t].maxSlots}`} slots</li>
          ))}
        </ul>
        <p className="small muted">Close enough counts: a tape can land 10% either side of its tier. Clips run 5 seconds to 2 minutes, in-between slots 3 seconds to a minute, and Interference 10 to 45 seconds, at most two per tape.</p>
      </section>

      <section className="panel stack" id="sync">
        <h2>Sync tapes: home-made music videos</h2>
        <p className="muted">A sync tape is one song, played with the sound on, while you cut muted clips in over it so the pictures “explain” the song, often far too literally. The creator either names the song, with each scene timed on its clock, or gives a brief, so you pick a song yourself and note when each part of it starts.</p>
        <ul className="stack" style={{ margin: 0, paddingLeft: 20 }}>
          <li>Songs run 1:30 to 6:00, with 3 to 24 scenes of 4 seconds to a minute each (up to 3 of them things to do in the room).</li>
          <li>Keep it varied: never the same clip twice, at most 2 scenes from one film, programme, series or channel, and no medium (film, TV, online video) or style (drama, animation, real life) in more than half the scenes.</li>
          <li>Lyrics are never written into a tape, not even one line. Cues describe what the song is doing instead.</li>
        </ul>
      </section>

      <section className="panel stack" id="guidelines">
        <h2>Community guidelines: the short version</h2>
        <ol className="stack" style={{ margin: 0, paddingLeft: 20 }}>
          <li><strong>Point, don’t copy.</strong> Tapes describe and link to pieces. They never contain the pieces themselves: no uploads, transcripts, scripts or lyrics.</li>
          <li><strong>Official sources only.</strong> Every slot must be findable legally: no pirated copies, unofficial re-uploads, or instructions for ripping or recording.</li>
          <li><strong>Leave private people out.</strong> Only clips of people who chose to be public. In-between slots never involve recording or approaching anyone.</li>
          <li><strong>Unsettling is fine; harmful isn’t.</strong> Strange and eerie, yes. Graphic, violent, hateful, cruel, flashing or dangerous, no.</li>
          <li><strong>Be honest and kind.</strong> Label tapes accurately, flag spoilers, and treat other collectors well.</li>
        </ol>
        <p className="small muted">These are a draft and will be checked by a solicitor before Side C opens to the public.</p>
      </section>

      <section className="panel stack">
        <h2>Your data</h2>
        <p className="muted">This early version has no accounts. Everything you write or collect is saved in your browser, on your device, and isn’t sent anywhere. Share a tape by sending its link or file.</p>
      </section>

      <div className="row">
        <a className="btn btn-primary" href={href('/tape/sample-rain-on-a-tuesday')}>Try the sample tape</a>
        <a className="btn" href={href('/tape/sample-last-train-out')}>Try the sample sync tape</a>
        <a className="btn" href={href('/write')}>Write a tape</a>
      </div>
    </div>
  );
}
