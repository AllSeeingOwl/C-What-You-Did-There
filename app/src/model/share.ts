import { parseTape } from './parse';
import type { Tape } from './types';

// A share link carries the whole tape inside the address, after "#/t/",
// so no server is needed. The part after # is never sent to a web server.

function toBase64Url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function encodeTape(tape: Tape): string {
  return toBase64Url(new TextEncoder().encode(JSON.stringify(tape)));
}

export function decodeTape(code: string): Tape {
  const json = new TextDecoder().decode(fromBase64Url(code));
  return parseTape(JSON.parse(json));
}

export function shareUrl(tape: Tape, base: string): string {
  return `${base.split('#')[0]}#/t/${encodeTape(tape)}`;
}

export function tapeFileName(tape: Tape): string {
  const slug = tape.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tape';
  return `${slug}.sidec.json`;
}
