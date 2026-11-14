import { href } from '../router';

export function NotFound({ what = 'page' }: { what?: 'page' | 'tape' }) {
  return (
    <div className="page" style={{ maxWidth: 640 }}>
      <span className="eyebrow">Nothing on this side</span>
      <h1>{what === 'tape' ? 'We can’t find that tape' : 'We can’t find that page'}</h1>
      <p className="muted">
        {what === 'tape'
          ? 'Tapes are saved in the browser they were added in. If someone shared it with you, open their link again or add their tape file.'
          : 'The address may be mistyped, or the page has moved.'}
      </p>
      <div className="row">
        <a className="btn btn-primary" href={href('/')}>Browse tapes</a>
        {what === 'tape' && <a className="btn" href={href('/import')}>Add a tape</a>}
      </div>
    </div>
  );
}
