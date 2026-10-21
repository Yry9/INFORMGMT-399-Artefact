import { useEffect, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import { AuthScreen } from '@/components/auth-screen';
import { Workspace } from '@/components/workspace';
import { StudentSubmissionPage } from '@/components/student-submission';
import { api, type User } from '@/lib/api';
import { Router as WouterRouter } from 'wouter';
import { useLocation } from 'wouter';

const queryClient = new QueryClient();

function AppGate() {
  const [location] = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const submissionMatch = location.match(/^\/submit\/([^/]+)\/?$/);
  useEffect(() => {
    if (submissionMatch) return;
    api.me().then(setUser).catch(() => setUser(null)).finally(() => setChecking(false));
  }, [submissionMatch?.[1]]);
  if (submissionMatch) return <StudentSubmissionPage token={decodeURIComponent(submissionMatch[1])}/>;
  if (checking) return <main className="auth-loading"><div className="loading-mark">A</div><p>Opening your private workspace…</p></main>;
  if (!user) return <AuthScreen onAuthenticated={setUser}/>;
  return <Workspace user={user} onLogout={async () => { try { await api.logout(); } finally { setUser(null); } }}/>;
}

function RootErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary resetKey={window.location.pathname}>{children}</ErrorBoundary>;
}

export default function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RootErrorBoundary><AppGate/></RootErrorBoundary></WouterRouter></TooltipProvider></QueryClientProvider>;
}
