import { type ReactNode } from 'react';
import {
  BookOpen,
  History,
  LayoutDashboard,
  PanelLeft,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'wouter';

export function AppShell({
  children,
  currentPath,
}: {
  children: ReactNode;
  currentPath: string;
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-mark" data-testid="link-brand">
          A
        </Link>
        <div className="brand-copy" style={{ marginTop: 12 }}>
          <div className="brand-title">Academic lens</div>
          <div className="brand-subtitle">AI interaction review</div>
        </div>
        <div className="nav-section">Workspace</div>
        <nav aria-label="Primary navigation">
          <Link
            href="/"
            className={`nav-link ${currentPath === '/' ? 'active' : ''}`}
            data-testid="link-dashboard"
          >
            <LayoutDashboard size={17} />
            <span>Review desk</span>
          </Link>
          <Link
            href="/history"
            className={`nav-link ${currentPath === '/history' ? 'active' : ''}`}
            data-testid="link-history"
          >
            <History size={17} />
            <span>Interaction history</span>
          </Link>
          <Link
            href="/comparison"
            className={`nav-link ${currentPath === '/comparison' ? 'active' : ''}`}
            data-testid="link-comparison"
          >
            <PanelLeft size={17} />
            <span>Side-by-side review</span>
          </Link>
        </nav>
        <div className="sidebar-note">
          <ShieldCheck size={16} />
          <p>
            For authorised teaching staff. Findings are review signals, never
            automated verdicts.
          </p>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <div className="crumb">
            <BookOpen size={14} />
            <span>ENV302</span>
            <span>/</span>
            <strong>Lane 2 review desk</strong>
          </div>
          <div className="prototype-notice" data-testid="notice-prototype-mode">
            <span className="prototype-badge">Prototype mode</span>
            <span>Uses synthetic sample data · no real student information</span>
          </div>
          <div className="user-chip">
            <span>Dr. Samira Holt</span>
            <span className="avatar">SH</span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
