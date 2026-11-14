import { useState } from 'react';
import { shareUrl, tapeFileName } from '../model/share';
import type { Tape } from '../model/types';

export function ShareTools({ tape }: { tape: Tape }) {
  const [message, setMessage] = useState('');
  const url = shareUrl(tape, window.location.href);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Link copied. Anyone who opens it can add this tape to their shelf.');
    } catch {
      setMessage('Couldn’t copy automatically. Select the link below and copy it.');
    }
  }

  function download() {
    const blob = new Blob([JSON.stringify(tape, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tapeFileName(tape);
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMessage('Tape file saved. Send it to someone and they can add it with “Add a tape”.');
  }

  return (
    <div className="stack">
      <div className="row">
        <button type="button" className="btn" onClick={copy}>Copy share link</button>
        <button type="button" className="btn" onClick={download}>Download tape file</button>
      </div>
      {message && <p className="small" role="status">{message}</p>}
      <details>
        <summary className="small muted" style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>Show the link</summary>
        <textarea readOnly value={url} aria-label="Share link" rows={3} onFocus={(e) => e.target.select()} className="mono small" />
      </details>
      <p className="small muted">The link carries the whole tape (just the instructions, never any clips) so it works without an account.</p>
    </div>
  );
}
