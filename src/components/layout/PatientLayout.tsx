import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '@/lib/labels';

interface PatientLayoutProps {
  children: ReactNode;
  workspaceName?: string;
  workspaces?: Array<{ id: string; name: string }>;
  activeWorkspaceId?: string;
  onWorkspaceChange?: (id: string) => void;
}

export function PatientLayout({
  children,
  workspaceName,
  workspaces,
  activeWorkspaceId,
  onWorkspaceChange,
}: PatientLayoutProps) {
  const location = useLocation();
  const tabs = [
    { to: '/paciente/hoy', label: 'Hoy' },
    { to: '/paciente/semana', label: 'Semana' },
    { to: '/paciente/cuenta', label: 'Cuenta' },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <div className="mx-auto w-full max-w-[420px] px-4 py-6">
        {workspaces && workspaces.length > 1 ? (
          <div className="mb-4">
            <label className="text-sm text-[var(--ink-soft)]" htmlFor="workspace-select">
              Consultorio
            </label>
            <select
              id="workspace-select"
              className="mt-1 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
              value={activeWorkspaceId}
              onChange={(e) => onWorkspaceChange?.(e.target.value)}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        ) : workspaceName ? (
          <p className="mb-2 text-sm text-[var(--ink-soft)]">{workspaceName}</p>
        ) : (
          <Link to="/" className="mb-2 inline-block text-sm text-[var(--ink-soft)]">
            {APP_NAME}
          </Link>
        )}

        <nav className="mb-6 flex gap-1 rounded-full bg-[var(--empty)] p-1">
          {tabs.map((tab) => {
            const active = location.pathname.startsWith(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={[
                  'flex-1 rounded-full py-2 text-center text-sm transition-colors',
                  active ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]',
                ].join(' ')}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </div>
  );
}
