import { COUNTRIES, regionShort, WORLD } from '../model/constants';

/** One region: where the collector is. */
export function RegionSelect({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      {Object.keys(COUNTRIES).map((code) => <option key={code} value={code}>{regionShort(code)}</option>)}
      <option value={WORLD}>Somewhere else</option>
    </select>
  );
}

/** Several regions: where a slot is available. */
export function RegionPicker({ id, value, onChange }: { id: string; value: string[]; onChange: (v: string[]) => void }) {
  const worldwide = value.includes(WORLD);
  const countries = value.filter((c) => c !== WORLD);
  return (
    <div className="stack" style={{ gap: 6 }}>
      <label className="check" style={{ padding: 0 }}>
        <input type="checkbox" checked={worldwide} onChange={(e) => onChange(e.target.checked ? [WORLD] : [])} />
        <span>Works worldwide</span>
      </label>
      {!worldwide && (
        <div className="row" style={{ gap: 6 }}>
          <select
            id={id}
            aria-label="Add a country"
            value=""
            onChange={(e) => e.target.value && onChange([...countries, e.target.value])}
            style={{ width: 'auto' }}
          >
            <option value="">Add a country…</option>
            {Object.keys(COUNTRIES).filter((c) => !countries.includes(c)).map((code) => <option key={code} value={code}>{regionShort(code)}</option>)}
          </select>
          {countries.map((c) => (
            <button key={c} type="button" className="chip" onClick={() => onChange(countries.filter((x) => x !== c))} aria-label={`Remove ${regionShort(c)}`}>
              {regionShort(c)} <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
