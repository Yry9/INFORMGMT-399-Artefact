import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import type { PublicSubmissionInfo } from '@/lib/api';

type Props = { token: string };
type Draft = { declaration: 'USED' | 'NOT_USED'; prompt: string; aiOutput: string; aiTool: string; revision: string; reflection: string; finalWork: string };
const emptyDraft: Draft = { declaration: 'USED', prompt: '', aiOutput: '', aiTool: '', revision: '', reflection: '', finalWork: '' };

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message ?? body.detail ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function StudentSubmissionPage({ token }: Props) {
  const [info, setInfo] = useState<PublicSubmissionInfo | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/public/submissions/${encodeURIComponent(token)}`)
      .then(readJson<PublicSubmissionInfo>)
      .then(value => { if (active) { setInfo(value); setSubmitted(value.submitted); } })
      .catch(cause => { if (active) setError(cause instanceof Error ? cause.message : 'This submission link could not be opened.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  const set = (key: keyof Draft, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const loadTextFile = (key: 'aiOutput' | 'finalWork') => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) { setError('For file import, choose a .txt or .md file. You can paste text copied from Word or PDF into the box.'); event.target.value = ''; return; }
    try {
      const value = await file.text();
      if (value.length > 50000) throw new Error('This text is over the 50,000 character limit. Split it into smaller sections before submitting.');
      set(key, value); setError('');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not read this text file.'); }
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const csrf = await readJson<{ token: string }>(await fetch('/api/auth/csrf', { credentials: 'include' }));
      const response = await fetch(`/api/public/submissions/${encodeURIComponent(token)}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': csrf.token },
        body: JSON.stringify({
          aiUseDeclaration: draft.declaration,
          prompt: draft.prompt,
          aiOutput: draft.declaration === 'USED' ? draft.aiOutput : '',
          aiTool: draft.declaration === 'USED' ? draft.aiTool : '',
          revision: draft.revision,
          reflection: draft.reflection,
          finalWork: draft.finalWork,
        }),
      });
      await readJson<{ submittedAt: string }>(response);
      setSubmitted(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit. Please try again.'); }
    finally { setBusy(false); }
  }

  if (loading) return <main className="auth-loading"><div className="loading-mark">A</div><p>Opening the submission form…</p></main>;

  return <main className="auth-page student-submission-page">
    <section className="auth-story">
      <div className="auth-brand"><span className="brand-mark">A</span><span><strong>Academic lens</strong><small>Student submission</small></span></div>
      <div className="auth-story-copy">
        <div className="eyebrow">Assessment evidence</div>
        <h1>Submit your work<br/><em>with context.</em></h1>
        <p>Share the final work and, if you used AI, the relevant prompts and outputs. Your teacher will review the submitted records together.</p>
        <div className="auth-principles">
          <div><FileText size={17}/><span><strong>Your submission</strong><small>Final work and optional AI-use evidence.</small></span></div>
          <div><ShieldCheck size={17}/><span><strong>Human review</strong><small>A text-overlap signal is not a misconduct decision.</small></span></div>
        </div>
      </div>
      <div className="auth-footnote"><ShieldCheck size={14}/> This private link is intended for the named student. Do not forward it.</div>
    </section>

    <section className="auth-form-wrap">
      <div className="auth-form-card student-submit-card">
        <div className="auth-card-icon"><BookOpenCheck size={20}/></div>
        {error && !info ? <><div className="eyebrow">Link unavailable</div><h2>We could not open this form</h2><div className="form-error" role="alert">{error}</div><p className="card-copy">Ask your teacher to create a new submission link.</p></> : info && submitted ? <>
          <div className="eyebrow">Submission received</div><h2>Thank you, {info.studentName}.</h2><p className="card-copy">Your work for <strong>{info.assessmentTitle}</strong> has been saved. This link can only be used once.</p>
          <div className="submission-success"><CheckCircle2 size={20}/><span>Submitted successfully · {info.courseCode}</span></div>
        </> : info ? <>
          <div className="eyebrow">{info.courseCode}</div><h2>Submit your work</h2>
          <p className="card-copy"><strong>{info.studentName}</strong> · {info.assessmentTitle}{info.studentNumber ? ` · ${info.studentNumber}` : ''}</p>
          <form className="auth-form student-submit-form" onSubmit={submit}>
            <label><span className="field-label">Did you use AI for this assessment?</span><select className="text-input" value={draft.declaration} onChange={event => set('declaration', event.target.value as Draft['declaration'])}><option value="USED">Yes — I will provide relevant AI evidence</option><option value="NOT_USED">No — I did not use AI</option></select></label>
            {draft.declaration === 'USED' && <>
              <label><span className="field-label">AI tool · optional</span><input className="text-input" value={draft.aiTool} onChange={event => set('aiTool', event.target.value)} maxLength={120} placeholder="e.g. ChatGPT, Claude"/></label>
              <label><span className="field-label">Prompt or question · optional</span><textarea className="text-input text-area" value={draft.prompt} onChange={event => set('prompt', event.target.value)} maxLength={50000} placeholder="Paste a relevant prompt or a short conversation summary"/></label>
              <label><span className="field-label">AI output · required if you used AI</span><textarea className="text-input text-area" value={draft.aiOutput} onChange={event => set('aiOutput', event.target.value)} required maxLength={50000} placeholder="Paste the relevant AI response or transcript"/><small className="file-hint">Or load a .txt/.md file: <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={loadTextFile('aiOutput')}/></small></label>
            </>}
            <label><span className="field-label">Your revisions · optional</span><textarea className="text-input text-area" value={draft.revision} onChange={event => set('revision', event.target.value)} maxLength={50000} placeholder="Describe important edits you made to the AI output"/></label>
            <label><span className="field-label">Your reflection · optional</span><textarea className="text-input text-area" value={draft.reflection} onChange={event => set('reflection', event.target.value)} maxLength={50000} placeholder="How did you use or decide not to use AI? What did you verify?"/></label>
            <label><span className="field-label">Final submitted work · required</span><textarea className="text-input text-area large" value={draft.finalWork} onChange={event => set('finalWork', event.target.value)} required maxLength={50000} placeholder="Paste your final assignment text"/><small className="file-hint">Or load a .txt/.md file: <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={loadTextFile('finalWork')}/></small></label>
            <div className="entry-hint">Word/PDF files can be opened and their text pasted here. Each text field allows up to 50,000 characters. This link accepts one submission.</div>
            {error && <div className="form-error" role="alert">{error}</div>}
            <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit to teacher'} <ArrowRight size={15}/></button>
          </form>
        </> : null}
      </div>
      <div className="auth-bottom-note">Your submission is associated with the named student and assessment shown above.</div>
    </section>
  </main>;
}
