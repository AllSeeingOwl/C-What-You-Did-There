import { useSyncExternalStore } from 'react';

// Hash-based addresses (#/tape/abc) work on any static host, including
// GitHub Pages, with no server set-up.

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function usePath(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash.replace(/^#/, '') || '/');
}

export function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

export function href(path: string): string {
  return `#${path}`;
}

/** Matches "/tape/:id/collect" against a path and returns the params, or null. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/');
  const a = path.split('?')[0].split('/');
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(a[i]);
    else if (p[i] !== a[i]) return null;
  }
  return params;
}
