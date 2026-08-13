import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ProLayoutProps {
  children: ReactNode;
  workspaceName?: string;
}

export function ProLayout({ children, workspaceName }: ProLayoutProps) {
  const nav = [
    { to: '/pro/pacientes', label: 'Pacientes' },
    { to: '/pro/plantillas', label: 'Plantillas' },
    { to: '/pro/equipo', label: 'Equipo' },
    { to: '/pro/espacio', label: 'Espacio' },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="font-display text-xl text-[var(--ink)]">Psicostatus</p>
            {workspaceName ? <p className="text-sm text-[var(--ink-soft)]">{workspaceName}</p> : null}
          </div>
          <nav className="flex flex-wrap gap-2">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-full px-4 py-2 text-sm text-[var(--ink-soft)] transition-colors hover:bg-[var(--sage-soft)] hover:text-[var(--ink)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1080px] px-4 py-8">{children}</main>
    </div>
  );
}
