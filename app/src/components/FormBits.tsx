import { useEffect, useState } from 'react';
import { COSTS } from '../model/constants';
import { formatTime, parseTime } from '../model/time';
import type { Cost, Fallback } from '../model/types';
import { Field } from './bits';
import { RegionPicker } from './RegionSelect';

// Form pieces shared by the mixtape and sync tape editors.

export function TimeInput({ id, seconds, onChange }: { id: string; seconds: number; onChange: (s: number) => void }) {
  const [text, setText] = useState(formatTime(seconds));
  const [bad, setBad] = useState(false);
  useEffect(() => setText(formatTime(seconds)), [seconds]);
  return (
    <>
      <input
        id={id}
        className="time"
        type="text"
        inputMode="numeric"
        value={text}
        aria-invalid={bad}
        onChange={(e) => {
          setText(e.target.value);
          const v = parseTime(e.target.value);
          setBad(v === null);
          if (v !== null) onChange(v);
        }}
        onBlur={() => { if (!bad) setText(formatTime(seconds)); }}
      />
      {bad && <span className="small error-text">Write it as minutes:seconds, e.g. 0:45</span>}
    </>
  );
}

export function CostSelect({ id, value, onChange }: { id: string; value: Cost; onChange: (c: Cost) => void }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value as Cost)}>
      {Object.entries(COSTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
    </select>
  );
}

export function FallbackEditor({ id, f, onChange, onRemove, label }: { id: string; f: Fallback; onChange: (f: Fallback) => void; onRemove: () => void; label: string }) {
  return (
    <fieldset className="stack">
      <legend>{label}</legend>
      <Field label="What to find instead" htmlFor={`${id}-find`}>
        <textarea id={`${id}-find`} rows={2} value={f.find} onChange={(e) => onChange({ ...f, find: e.target.value })} maxLength={500} />
      </Field>
      <div className="grid-2">
        <Field label="Where to look" htmlFor={`${id}-where`}>
          <input id={`${id}-where`} type="text" value={f.where} onChange={(e) => onChange({ ...f, where: e.target.value })} maxLength={200} />
        </Field>
        <Field label="Link" hint="optional, official sources only" htmlFor={`${id}-link`}>
          <input id={`${id}-link`} type="url" value={f.link ?? ''} placeholder="https://" onChange={(e) => onChange({ ...f, link: e.target.value || undefined })} />
        </Field>
        <Field label="Cost" htmlFor={`${id}-cost`}>
          <CostSelect id={`${id}-cost`} value={f.cost} onChange={(cost) => onChange({ ...f, cost })} />
        </Field>
        <div className="field">
          <span style={{ fontWeight: 500, fontSize: 14 }}>Available in</span>
          <RegionPicker id={`${id}-region`} value={f.regions} onChange={(regions) => onChange({ ...f, regions })} />
        </div>
      </div>
      <button type="button" className="btn btn-small btn-danger" style={{ alignSelf: 'flex-start' }} onClick={onRemove}>Remove {label.toLowerCase()}</button>
    </fieldset>
  );
}
