import { useMemo, useState } from 'react';
import { Hand, JCard, RegionBadge, TapeWarnings, Vibes } from '../components/bits';
import { tapeAvailability } from '../model/availability';
import { parseTape } from '../model/parse';
import { isPublishable } from '../model/rules';
import { actions, findTape, getState, useStore } from '../model/store';
import { decodeTape } from '../model/share';
import type { Tape } from '../model/types';
import { href, navigate } from '../router';

function addToShelf(tape: Tape) {
  const existing = findTape(getState(), tape.id);
  if (existing?.origin === 'mine') {
    // It's your own tape coming back: just open it.
    navigate(`/tape/${tape.id}`);
    return;
  }
  actions.saveTape(tape, false, existing?.origin === 'sample' ? 'sample' : 'imported');
  navigate(`/tape/${tape.id}`);
}

function Preview({ tape }: { tape: Tape }) {
  const region = useStore((s) => s.settings.region);
  const valid = isPublishable(tape);
  const already = useStore((s) => findTape(s, tape.id));
  return (
    <div className="grid-2">
      <JCard tape={tape} big />
      <div className="stack">
        <h2>{tape.title || 'Untitled tape'}</h2>
        <Vibes tape={tape} />
        <div className="row" style={{ gap: 6 }}>
          <RegionBadge a={tapeAvailability(tape, region)} />
          <TapeWarnings tape={tape} />
        </div>
        {tape.liner && <Hand kind="neat" as="p">{tape.liner}</Hand>}
        {!valid && (
          <div className="notice">This tape doesn’t pass all of Side C’s checks (it may have been made with an older version or edited by hand). You can still add it, but some parts may not work.</div>
        )}
        <div className="row">
          {already ? (
            <a className="btn btn-primary" href={href(`/tape/${tape.id}`)}>It’s on your shelf: open it</a>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => addToShelf(tape)}>Add to my shelf</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function SharedTape({ code }: { code: string }) {
  const result = useMemo(() => {
    try {
      return { tape: decodeTape(code) };
    } catch {
      return { error: 'This share link is broken or incomplete. Ask whoever sent it for the link again, or for the tape file.' };
    }
  }, [code]);
  return (
    <div className="page">
      <div className="stack">
        <span className="eyebrow">Someone shared a tape with you</span>
        <h1>A tape for you</h1>
      </div>
      {'tape' in result && result.tape ? <Preview tape={result.tape} /> : <div className="notice">{result.error}</div>}
    </div>
  );
}

export function ImportTape() {
  const [tape, setTape] = useState<Tape | null>(null);
  const [error, setError] = useState('');
  const [text, setText] = useState('');

  function read(raw: string) {
    setError('');
    setTape(null);
    const t = raw.trim();
    try {
      const hashAt = t.indexOf('#/t/');
      if (hashAt >= 0) setTape(decodeTape(t.slice(hashAt + 4)));
      else setTape(parseTape(JSON.parse(t)));
    } catch (e) {
      setError(e instanceof Error && e.name === 'TapeFormatError' ? e.message : 'That doesn’t look like a Side C tape link or file.');
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 500_000) {
      setError('That file is too big to be a tape.');
      return;
    }
    read(await file.text());
  }

  return (
    <div className="page">
      <div className="stack">
        <h1>Add a tape</h1>
        <p className="muted">Got a share link or a tape file from someone? Add it to your shelf here.</p>
      </div>
      <div className="grid-2">
        <div className="panel stack">
          <label htmlFor="paste">Paste a share link</label>
          <textarea id="paste" rows={3} value={text} onChange={(e) => setText(e.target.value)} className="mono small" />
          <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => read(text)} disabled={!text.trim()}>Read link</button>
        </div>
        <div className="panel stack">
          <label htmlFor="file">Or choose a tape file (.sidec.json)</label>
          <input id="file" type="file" accept=".json,application/json" onChange={(e) => onFile(e.target.files?.[0])} style={{ minHeight: 44 }} />
        </div>
      </div>
      {error && <div className="notice" role="alert">{error}</div>}
      {tape && <Preview tape={tape} />}
    </div>
  );
}
