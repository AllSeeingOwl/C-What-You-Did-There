import { useEffect } from 'react';
import { useStore } from './model/store';
import { href, match, usePath } from './router';
import { About } from './pages/About';
import { Collect } from './pages/Collect';
import { Feedback } from './pages/Feedback';
import { Home } from './pages/Home';
import { ImportTape, SharedTape } from './pages/Import';
import { NotFound } from './pages/NotFound';
import { Play } from './pages/Play';
import { SettingsPage } from './pages/Settings';
import { TapePage } from './pages/TapePage';
import { Write } from './pages/Write';

function route(path: string) {
  let p: Record<string, string> | null;
  if (path === '/' || path === '') return { page: <Home />, nav: '/', title: '' };
  if ((p = match('/tape/:id', path))) return { page: <TapePage id={p.id} />, nav: '/', title: 'Tape' };
  if ((p = match('/tape/:id/collect', path))) return { page: <Collect id={p.id} />, nav: '/', title: 'Collecting' };
  if ((p = match('/tape/:id/feedback', path))) return { page: <Feedback id={p.id} />, nav: '/', title: 'Tester questions' };
  if ((p = match('/tape/:id/play', path))) return { page: <Play id={p.id} />, nav: '/', title: 'Play-along' };
  if (path === '/write') return { page: <Write key="new" />, nav: '/write', title: 'Write a tape' };
  if ((p = match('/write/:id', path))) return { page: <Write key={p.id} id={p.id} />, nav: '/write', title: 'Write a tape' };
  if ((p = match('/t/:code', path))) return { page: <SharedTape code={p.code} />, nav: '', title: 'Shared tape' };
  if (path === '/import') return { page: <ImportTape />, nav: '/import', title: 'Add a tape' };
  if (path === '/settings') return { page: <SettingsPage />, nav: '/settings', title: 'Settings' };
  if (path === '/about') return { page: <About />, nav: '/about', title: 'How it works' };
  return { page: <NotFound />, nav: '', title: 'Not found' };
}

const NAV = [
  ['/', 'Browse'],
  ['/write', 'Write a tape'],
  ['/import', 'Add a tape'],
  ['/about', 'How it works'],
  ['/settings', 'Settings'],
] as const;

export function App() {
  const path = usePath();
  const plain = useStore((s) => s.settings.plainText);
  const { page, nav, title } = route(path);

  useEffect(() => {
    document.title = title ? `${title} · Side C` : 'Side C · mixtapes made of everything';
  }, [title]);

  return (
    <div className={plain ? 'plain' : ''}>
      <a href="#main" className="visually-hidden skip" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <header className="topbar">
        <a className="brand" href={href('/')}>
          <svg width="30" height="22" viewBox="0 0 30 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="1" y="1" width="28" height="20" rx="3" /><circle cx="10" cy="10" r="3" /><circle cx="20" cy="10" r="3" /><path d="M6 21l3-5h12l3 5" /></svg>
          <span className="brand-name">Side C</span>
          <span className="brand-sub">(What You Did There)</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map(([to, label]) => (
            <a key={to} href={href(to)} aria-current={nav === to ? 'page' : undefined}>{label}</a>
          ))}
        </nav>
      </header>
      <main id="main" tabIndex={-1} style={{ outline: 'none' }}>
        {page}
      </main>
      <footer className="footer">
        <span>Side C points to clips; it never hosts them. Find every piece from official sources.</span>
        <span>Your tapes and progress are saved in this browser only.</span>
      </footer>
    </div>
  );
}
