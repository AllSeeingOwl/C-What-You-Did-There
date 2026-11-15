import { TesterFeedback } from '../components/TesterFeedback';
import { findTape, useStore } from '../model/store';
import { href } from '../router';
import { NotFound } from './NotFound';

export function Feedback({ id }: { id: string }) {
  const item = useStore((s) => findTape(s, id));
  if (!item || item.origin !== 'sample') return <NotFound what="tape" />;
  return (
    <div className="page" style={{ maxWidth: 760 }}>
      <a href={href(`/tape/${id}`)} className="small">← Back to the tape</a>
      <h1>{item.tape.title}: tester questions</h1>
      <p className="muted">Answer whatever applies so far. If you stopped partway, question 4 (when did it start to feel like a chore?) is the most useful one.</p>
      <TesterFeedback tape={item.tape} />
    </div>
  );
}
