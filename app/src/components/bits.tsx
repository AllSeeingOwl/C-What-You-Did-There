import type { ReactNode } from 'react';
import { availabilityLabel, type TapeAvailability } from '../model/availability';
import { LANES, regionName } from '../model/constants';
import { checkLink } from '../model/rules';
import { mediaMix, totalSeconds } from '../model/tape';
import { formatTime } from '../model/time';
import type { Slot, Tape } from '../model/types';

/** Creator's own words. Plain-text mode is handled by the .plain class on the app. */
export function Hand({ kind, children, as = 'span', className = '' }: { kind: 'marker' | 'neat'; children: ReactNode; as?: 'span' | 'p' | 'div'; className?: string }) {
  const Tag = as;
  return <Tag className={`hand-${kind} ${className}`}>{children}</Tag>;
}

export function WaveIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M1 5c1.5-3 3-3 4.5 0s3 3 4.5 0 3-3 3 0" />
    </svg>
  );
}

export function Vibes({ tape }: { tape: Pick<Tape, 'vibes' | 'arc'> }) {
  if (tape.arc) {
    return (
      <span className="vibes">
        <WaveIcon />
        <span><span className="visually-hidden">Vibe arc: </span>{tape.arc.join(' → ')}</span>
      </span>
    );
  }
  if (tape.vibes.length === 0) return null;
  return (
    <span className="vibes">
      <WaveIcon />
      <span><span className="visually-hidden">Vibes: </span>{tape.vibes.join(' · ')}</span>
    </span>
  );
}

export function RegionBadge({ a }: { a: TapeAvailability }) {
  if (a.worldwide) {
    return (
      <span className="badge badge-world">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><circle cx="6" cy="6" r="5" /><path d="M1 6h10M6 1c2 2 2 8 0 10M6 1c-2 2-2 8 0 10" /></svg>
        Worldwide
      </span>
    );
  }
  const pin = <svg width="10" height="12" viewBox="0 0 10 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M5 11s4-4 4-6.5a4 4 0 0 0-8 0C1 7 5 11 5 11z" /><circle cx="5" cy="4.5" r="1.3" /></svg>;
  return (
    <span className={`badge ${a.worksHere ? 'badge-here' : 'badge-away'}`}>
      {pin}
      {availabilityLabel(a)}
      {!a.worksHere && ' · not all work where you are'}
    </span>
  );
}

export function JCard({ tape, big = false }: { tape: Tape; big?: boolean }) {
  const mix = mediaMix(tape);
  return (
    <div className={`jcard ${big ? 'jcard-big' : ''}`}>
      <div className="jcard-stripe" role="img" aria-label={`Media mix: ${mix.map((m) => `${LANES[m.type].label} ${Math.round(m.share * 100)}%`).join(', ')}`}>
        {mix.map((m) => <span key={m.type} style={{ flex: m.share, background: m.colour }} />)}
      </div>
      <div className="jcard-body">
        <span className="jcard-meta">{tape.tier} · {formatTime(totalSeconds(tape))} · {tape.slots.length} slots</span>
        <Hand kind="marker" className="jcard-title">{tape.title || 'Untitled tape'}</Hand>
        <Hand kind="neat">by {tape.creator || '[CREATOR]'}</Hand>
        {big && tape.theme && <span className="small" style={{ color: '#44506b' }}>{tape.theme}</span>}
      </div>
    </div>
  );
}

export function LaneSwatch({ slot }: { slot: Slot }) {
  if (slot.type === 'interference' && slot.interference) {
    return <span className="swatch" style={{ background: `linear-gradient(${LANES[slot.interference.picture.media].colour} 0 50%, ${LANES[slot.interference.sound.media].colour} 50% 100%)` }} />;
  }
  return <span className="swatch" style={{ background: LANES[slot.type].colour }} />;
}

export function slotTypeLabel(slot: Slot): string {
  if (slot.type === 'interference') return `Interference (${slot.interference?.mode === 'merge' ? 'uncanny merge' : 'clash'})`;
  return LANES[slot.type].label + (slot.mystery ? ' (mystery)' : '');
}

/** Only https links that pass our checks become clickable. */
export function SourceLink({ link }: { link?: string }) {
  if (!link || checkLink(link)) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer nofollow" className="small">
      Open the official source<span className="visually-hidden"> (opens in a new tab)</span> ↗
    </a>
  );
}

export function regionList(codes: string[]): string {
  if (codes.length === 0) return 'Not set';
  return codes.map((c) => regionName(c)).join(', ');
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>
        {label}
        {hint && <span className="hint"> · {hint}</span>}
      </label>
      {children}
    </div>
  );
}

export function TapeWarnings({ tape }: { tape: Tape }) {
  const items: string[] = [];
  if (tape.slots.some((s) => s.type === 'interference')) items.push('contains an unsettling interlude');
  if (tape.warnings.flashing) items.push('flashing images');
  if (tape.warnings.loudNoises) items.push('sudden loud noises');
  if (tape.warnings.upsettingThemes) items.push('upsetting themes');
  if (tape.slots.some((s) => s.spoiler)) items.push('some slots contain spoilers');
  if (items.length === 0) return null;
  return (
    <span className="badge badge-warn">
      <span aria-hidden="true">⚠</span> {items.join(' · ')}
    </span>
  );
}
