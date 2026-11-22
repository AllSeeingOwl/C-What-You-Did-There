import { useState } from 'react';
import { TESTERS } from '../model/sampleTapes';
import { actions, useStore } from '../model/store';
import type { Tape } from '../model/types';

const NONE: string[] = [];

/** Questions for friends testing the sample tape. Answers save as you type, then get copied or downloaded to send back. */
export function TesterFeedback({ tape }: { tape: Tape }) {
  const saved = useStore((s) => s.feedback[tape.id] ?? NONE);
  const TESTER_QUESTIONS = TESTERS[tape.id]?.questions ?? NONE;
  const [message, setMessage] = useState('');
  const answers = TESTER_QUESTIONS.map((_, i) => (typeof saved[i] === 'string' ? saved[i] : ''));
  const answered = answers.filter((a) => a.trim()).length;

  const setAnswer = (i: number, value: string) => actions.setFeedback(tape.id, answers.map((a, k) => (k === i ? value : a)));

  const asText = () =>
    [`Side C tester feedback: ${tape.title}`, '', ...TESTER_QUESTIONS.flatMap((q, i) => [`${i + 1}. ${q}`, answers[i].trim() || '(no answer)', ''])].join('\n');

  async function copy() {
    try {
      await navigator.clipboard.writeText(asText());
      setMessage('Copied. Paste your answers into a message to whoever sent you the tape.');
    } catch {
      setMessage('Couldn’t copy automatically. Try “Download as a file” instead.');
    }
  }

  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([asText()], { type: 'text/plain' }));
    a.download = 'side-c-feedback.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    setMessage('Saved. Attach the file to a message to whoever sent you the tape.');
  }

  if (TESTER_QUESTIONS.length === 0) return null;
  return (
    <section className="panel stack" aria-labelledby="feedback-title">
      <span className="eyebrow">Testing Side C</span>
      <h2 id="feedback-title">Tell us how it went</h2>
      <p className="small muted">
        Short, honest answers are the most useful. They save in this browser as you type, so you can come back to them.
        Nothing is sent anywhere until you send it yourself.
      </p>
      {TESTER_QUESTIONS.map((q, i) => (
        <div className="field" key={i}>
          <label htmlFor={`fb-${i}`}>{i + 1}. {q}</label>
          <textarea id={`fb-${i}`} rows={2} value={answers[i]} maxLength={2000} onChange={(e) => setAnswer(i, e.target.value)} />
        </div>
      ))}
      <div className="row">
        <button type="button" className="btn btn-primary" onClick={copy} disabled={answered === 0}>Copy my answers</button>
        <button type="button" className="btn" onClick={download} disabled={answered === 0}>Download as a file</button>
      </div>
      {message && <p className="small" role="status">{message}</p>}
    </section>
  );
}
