import { useMemo, useState } from 'react';
import { JCard, KindBadge, RegionBadge, TapeWarnings, Vibes } from '../components/bits';
import { RegionSelect } from '../components/RegionSelect';
import { tapeAvailability } from '../model/availability';
import { KINDS, TIER_IDS, VIBES } from '../model/constants';
import { collectedCount, hasStarted, isComplete } from '../model/progress';
import { actions, allTapes, type ShelfTape, useStore } from '../model/store';
import { isSync } from '../model/sync';
import { href } from '../router';

function Welcome() {
  const settings = useStore((s) => s.settings);
  return (
    <section className="panel stack-lg" aria-labelledby="welcome-title">
      <div className="stack">
        <span className="eyebrow">Welcome</span>
        <h1 id="welcome-title">Mixtapes made of everything.</h1>
        <p className="muted" style={{ maxWidth: 680 }}>
          A Side C tape is a set of instructions, not a playlist. Someone picks short moments from radio, TV, film, video and
          podcasts and puts them in order with notes and little things to do in between. You hunt each piece down from official
          sources, play the whole thing back in one sitting, then read the creator’s notes to see what they did there.
        </p>
      </div>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="welcome-region">Where are you collecting from?</label>
          <RegionSelect id="welcome-region" value={settings.region} onChange={(region) => actions.updateSettings({ region })} />
          <span className="hint small muted">We use this to flag tapes with pieces that aren’t available where you are.</span>
        </div>
        <fieldset>
          <legend>Reading style</legend>
          <p className="small muted">Creators’ own words appear handwritten, like a real J-card.</p>
          <label className="check">
            <input type="radio" name="style" checked={!settings.plainText} onChange={() => actions.updateSettings({ plainText: false })} />
            <span><span className="hand-neat" style={{ fontFamily: 'var(--neat)' }}>Handwritten</span> (the full look)</span>
          </label>
          <label className="check">
            <input type="radio" name="style" checked={settings.plainText} onChange={() => actions.updateSettings({ plainText: true })} />
            <span>Plain text (easier to read)</span>
          </label>
        </fieldset>
      </div>
      <div className="row">
        <a className="btn btn-primary" href={href('/tape/sample-rain-on-a-tuesday')} onClick={() => actions.updateSettings({ welcomed: true })}>
          Try a first tape: Rain on a Tuesday
        </a>
        <a className="btn" href={href('/tape/sample-last-train-out')} onClick={() => actions.updateSettings({ welcomed: true })}>
          Or make a music video: Last Train Out
        </a>
        <button type="button" className="btn" onClick={() => actions.updateSettings({ welcomed: true })}>Just browse</button>
      </div>
    </section>
  );
}

function TapeCard({ item, region }: { item: ShelfTape; region: string }) {
  const progress = useStore((s) => s.progress[item.tape.id]);
  const a = tapeAvailability(item.tape, region);
  const t = item.tape;
  let status = '';
  if (item.draft) status = 'Draft · only you can see this';
  else if (progress && isComplete(t, progress)) status = 'Collected · ready to play';
  else if (progress && hasStarted(t, progress)) status = `Collecting · ${collectedCount(t, progress)} of ${t.slots.length}`;
  else if (item.origin === 'sample') status = 'Sample tape';
  else if (item.origin === 'mine') status = 'Your tape';
  const to = item.draft ? `/write/${t.id}` : `/tape/${t.id}`;
  return (
    <a className={`card ${a.worksHere ? '' : 'dimmed'}`} href={href(to)}>
      <JCard tape={t} />
      <div className="stack" style={{ gap: 6 }}>
        <Vibes tape={t} />
        <div className="row" style={{ gap: 6 }}>
          <KindBadge tape={t} />
          <RegionBadge a={a} />
          <TapeWarnings tape={t} />
        </div>
        {status && <span className="small muted">{status}</span>}
      </div>
    </a>
  );
}

export function Home() {
  const state = useStore((s) => s);
  const tapes = allTapes(state);
  const region = state.settings.region;
  const [query, setQuery] = useState('');
  const [tiers, setTiers] = useState<string[]>([]);
  const [kind, setKind] = useState<'' | 'mixtape' | 'sync'>('');
  const [vibe, setVibe] = useState('');
  const [hereOnly, setHereOnly] = useState(false);

  const shelf = tapes.filter((t) => t.draft || t.origin !== 'sample' || hasStarted(t.tape, state.progress[t.tape.id] ?? {}));
  const published = tapes.filter((t) => !t.draft);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return published.filter(({ tape }) => {
      if (kind && (isSync(tape) ? 'sync' : 'mixtape') !== kind) return false;
      // Lengths are mixtape tiers: picking one leaves music videos out.
      if (tiers.length && (isSync(tape) || !tiers.includes(tape.tier))) return false;
      if (vibe && !tape.vibes.includes(vibe) && !tape.arc?.includes(vibe)) return false;
      if (hereOnly && !tapeAvailability(tape, region).worksHere) return false;
      if (q && ![tape.title, tape.creator, tape.theme, tape.liner].some((f) => f.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [published, query, kind, tiers, vibe, hereOnly, region]);

  const toggleTier = (t: string) => setTiers((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="page">
      {!state.settings.welcomed && <Welcome />}

      {shelf.length > 0 && (
        <section className="stack" aria-labelledby="shelf-title">
          <h2 id="shelf-title">My shelf</h2>
          <div className="cards">
            {shelf.map((item) => <TapeCard key={item.tape.id} item={item} region={region} />)}
          </div>
        </section>
      )}

      <section className="stack" aria-labelledby="browse-title">
        <div className="row between">
          <h2 id="browse-title">Browse tapes and music videos</h2>
          <a className="btn" href={href('/write')}>Write a tape</a>
        </div>
        <div className="panel panel-tight stack">
          <div className="field">
            <label htmlFor="search">Search</label>
            <input id="search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Title, creator or theme" />
          </div>
          <div className="row">
            <span className="small muted" id="kind-label">Kind</span>
            <div className="row" role="group" aria-labelledby="kind-label" style={{ gap: 6 }}>
              {([['', 'All'], ['mixtape', KINDS.mixtape.plural], ['sync', KINDS.sync.plural]] as const).map(([k, label]) => (
                <button key={k || 'all'} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="row">
            <span className="small muted" id="tier-label">Mixtape length</span>
            <div className="row" role="group" aria-labelledby="tier-label" style={{ gap: 6 }}>
              {TIER_IDS.map((t) => (
                <button key={t} type="button" className="chip mono" aria-pressed={tiers.includes(t)} onClick={() => toggleTier(t)}>{t}</button>
              ))}
            </div>
            <label htmlFor="vibe" className="small muted" style={{ marginLeft: 8 }}>Vibe</label>
            <select id="vibe" value={vibe} onChange={(e) => setVibe(e.target.value)} style={{ width: 'auto' }}>
              <option value="">Any vibe</option>
              {VIBES.map((v) => <option key={v}>{v}</option>)}
            </select>
            <label className="check" style={{ marginLeft: 8 }}>
              <input type="checkbox" checked={hereOnly} onChange={(e) => setHereOnly(e.target.checked)} />
              <span>Only tapes that fully work where I am</span>
            </label>
          </div>
        </div>
        {results.length === 0 ? (
          <div className="empty">No tapes match those filters. Try fewer filters, or <a href={href('/write')}>write one yourself</a>.</div>
        ) : (
          <div className="cards">
            {results.map((item) => <TapeCard key={item.tape.id} item={item} region={region} />)}
          </div>
        )}
        <p className="small muted">
          There’s no shared catalogue yet: this list holds the sample tapes, your own tapes and any shared with you.
          Got a link or file from a friend? <a href={href('/import')}>Add a tape</a>.
        </p>
      </section>
    </div>
  );
}
