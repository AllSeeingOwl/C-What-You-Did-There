import { TesterFeedback } from '../components/TesterFeedback';
import { TESTERS } from '../model/sampleTapes';
import { findTape, useStore } from '../model/store';
import { href } from '../router';
import { NotFound } from './NotFound';

export function Feedback({ id }: { id: string }) {
  const item = useStore((s) => findTape(s, id));
  if (!item || item.origin !== 'sample' || !TESTERS[id]) return <NotFound what="tape" />;
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <a href={href(`/tape/${id}`)} className="small">← Back to the tape</a>
      <h1>{item.tape.title}: tester questions</h1>
      <p className="muted">Answer whatever applies so far. {TESTERS[id].partwayHint}</p>
      <TesterFeedback tape={item.tape} />
    </div>
  );
}
