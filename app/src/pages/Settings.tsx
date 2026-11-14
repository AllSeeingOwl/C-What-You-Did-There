import { useState } from 'react';
import { Field } from '../components/bits';
import { RegionSelect } from '../components/RegionSelect';
import { actions, useStore } from '../model/store';

export function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const count = useStore((s) => s.tapes.length);
  const [cleared, setCleared] = useState(false);

  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <h1>Settings</h1>
      <section className="panel stack">
        <h2>Collecting</h2>
        <Field label="Where you’re collecting from" hint="tapes that don’t fully work here are dimmed and flagged" htmlFor="s-region">
          <RegionSelect id="s-region" value={settings.region} onChange={(region) => actions.updateSettings({ region })} />
        </Field>
      </section>
      <section className="panel stack">
        <h2>Reading</h2>
        <label className="check">
          <input type="checkbox" checked={settings.plainText} onChange={(e) => actions.updateSettings({ plainText: e.target.checked })} />
          <span>Plain text: show creators’ words in the normal typeface instead of handwriting</span>
        </label>
      </section>
      <section className="panel stack">
        <h2>Writing</h2>
        <Field label="Creator name" hint="filled in for you on new tapes" htmlFor="s-creator">
          <input id="s-creator" type="text" value={settings.creatorName} onChange={(e) => actions.updateSettings({ creatorName: e.target.value })} maxLength={60} />
        </Field>
      </section>
      <section className="panel stack">
        <h2>Your data</h2>
        <p className="muted small">
          There are no accounts yet. Your tapes, collecting progress and settings are saved in this browser only, on this device.
          Clearing your browser’s site data will remove them, so download a tape file of anything you’ve written that you want to keep.
        </p>
        <p className="small">{count} {count === 1 ? 'tape' : 'tapes'} saved here (not counting the sample).</p>
        <button
          type="button"
          className="btn btn-danger"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            if (window.confirm('Delete every tape, all progress and your settings from this browser? This can’t be undone.')) {
              actions.clearEverything();
              setCleared(true);
            }
          }}
        >
          Delete everything from this browser
        </button>
        {cleared && <p className="small" role="status">Done. Everything has been cleared.</p>}
      </section>
    </div>
  );
}
