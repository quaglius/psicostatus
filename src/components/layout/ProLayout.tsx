import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '@/lib/labels';
import { Avatar } from '@/components/avatar';
import { useAuth } from '@/contexts/AuthContext';

interface ProLayoutProps {
  children: ReactNode;
  workspaceName?: string;
}

const NAV = [
  { to: '/pro/espacio', label: 'Espacio', help: 'El tablero de tu consultorio' },
  { to: '/pro/pacientes', label: 'Pacientes', help: 'Quiénes están a tu cargo' },
  { to: '/pro/plantillas', label: 'Plantillas', help: 'Qué les pedís cargar' },
  { to: '/pro/equipo', label: 'Equipo', help: 'Quién trabaja acá' },
];

export function ProLayout({ children, workspaceName }: ProLayoutProps) {
  const location = useLocation();
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0]?.workspace;

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto flex max-w-[1080px] flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="flex items-center gap-3 no-underline hover:no-underline">
            <Avatar name={workspaceName ?? APP_NAME} src={workspace?.imageUrl} size={40} />
            <div>
              <p className="font-display text-xl text-[var(--ink)]">{APP_NAME}</p>
              {workspaceName ? <p className="text-sm text-[var(--ink-soft)]">{workspaceName}</p> : null}
            </div>
          </Link>
          <nav className="flex flex-wrap gap-2">
            {NAV.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  title={item.help}
                  className={[
                    'rounded-full px-4 py-2 text-sm transition-colors hover:bg-[var(--sage-soft)] hover:text-[var(--ink)] hover:no-underline',
                    active ? 'bg-[var(--sage-soft)] text-[var(--ink)]' : 'text-[var(--ink-soft)]',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="anim-in mx-auto max-w-[1080px] px-4 py-8">{children}</main>
    </div>
  );
}
