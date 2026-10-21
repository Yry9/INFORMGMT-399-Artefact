import { useState, type FormEvent } from 'react';
import { ArrowRight, BookOpenCheck, Fingerprint, LockKeyhole, ShieldCheck } from 'lucide-react';
import type { User } from '@/lib/api';

export function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-XSRF-TOKEN': await fetch('/api/auth/csrf', { credentials: 'include' }).then(async r => (await r.json()).token) },
        body: JSON.stringify(mode === 'register' ? { displayName, email, password } : { email, password }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message ?? body.detail ?? (response.status === 401 ? 'Email or password is incorrect.' : 'Could not connect to the service.'));
      }
      onAuthenticated(await response.json());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page">
    <section className="auth-story">
      <div className="auth-brand"><span className="brand-mark">A</span><span><strong>Academic lens</strong><small>AI interaction review</small></span></div>
      <div className="auth-story-copy">
        <div className="eyebrow">Marker workspace · Lane 2</div>
        <h1>Review the trail,<br/><em>not a verdict.</em></h1>
        <p>Bring AI interaction records and submitted work into one focused review. The dashboard helps markers inspect evidence and document their own decisions.</p>
        <div className="auth-principles">
          <div><Fingerprint size={17}/><span><strong>Evidence first</strong><small>Compare saved AI outputs with the final work.</small></span></div>
          <div><ShieldCheck size={17}/><span><strong>Human judgement</strong><small>Similarity is a review signal, never a misconduct verdict.</small></span></div>
        </div>
      </div>
      <div className="auth-footnote"><LockKeyhole size={14}/> Each account has a private workspace. Create one to get started.</div>
    </section>
    <section className="auth-form-wrap">
      <div className="auth-form-card">
        <div className="auth-card-icon"><BookOpenCheck size={20}/></div>
        <div className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</div>
        <h2>{mode === 'login' ? 'Sign in to continue' : 'Set up an account'}</h2>
        <p className="card-copy">{mode === 'login' ? 'Sign in to open your marker workspace.' : 'Your students and assessment records are private to this account.'}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label><span className="field-label">Your name</span><input className="text-input" value={displayName} onChange={e => setDisplayName(e.target.value)} required maxLength={120} autoComplete="name" placeholder="e.g. Samira Holt"/></label>}
          <label><span className="field-label">Email address</span><input className="text-input" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="name@university.ac.nz"/></label>
          <label><span className="field-label">Password</span><input className="text-input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 10 : 1} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'At least 10 characters' : 'Enter your password'}/></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={15}/></button>
        </form>
        <div className="auth-switch">{mode === 'login' ? 'New to Academic lens?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}> {mode === 'login' ? 'Create an account' : 'Sign in'}</button></div>
        {mode === 'register' && <p className="auth-security-note">Use a strong password. Passwords are stored as one-way hashes.</p>}
      </div>
      <div className="auth-bottom-note">Decision-support for teaching staff · Similarity does not determine academic misconduct</div>
    </section>
  </main>;
}
