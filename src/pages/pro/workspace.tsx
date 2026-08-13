import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Card } from '@/components/ui/Card';

interface InactivePatient {
  id: string;
  firstName: string;
  lastName: string;
  lastEntryAt: string | null;
}

export function WorkspacePage() {
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [overview, setOverview] = useState<{
    activePatients: number;
    entriesThisWeek: number;
    adherencePercent: number;
    inactivePatients: InactivePatient[];
  } | null>(null);

  useEffect(() => {
    if (!workspace) return;
    apiFetch<typeof overview>(`workspaces/${workspace.workspace.id}/overview`).then(setOverview);
  }, [workspace?.workspace.id]);

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <h1 className="font-display mb-6 text-3xl">Espacio</h1>

      {workspace ? (
        <Card className="mb-6">
          <p className="font-medium">{workspace.workspace.name}</p>
          <p className="text-sm capitalize text-[var(--ink-soft)]">{workspace.workspace.kind}</p>
        </Card>
      ) : null}

      {overview ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="font-display text-3xl">{overview.activePatients}</p>
              <p className="text-sm text-[var(--ink-soft)]">Pacientes activos</p>
            </Card>
            <Card>
              <p className="font-display text-3xl">{overview.entriesThisWeek}</p>
              <p className="text-sm text-[var(--ink-soft)]">Cargas esta semana</p>
            </Card>
            <Card>
              <p className="font-display text-3xl">{overview.adherencePercent}%</p>
              <p className="text-sm text-[var(--ink-soft)]">Adherencia promedio</p>
            </Card>
          </div>

          {overview.inactivePatients.length > 0 ? (
            <div>
              <h2 className="font-display mb-3 text-xl">Sin carga reciente</h2>
              <div className="space-y-2">
                {overview.inactivePatients.map((p) => (
                  <Link key={p.id} to={`/pro/pacientes/${p.id}`}>
                    <Card className="transition-colors hover:border-[var(--warn)]">
                      <p className="font-medium">{p.firstName} {p.lastName}</p>
                      <p className="text-sm text-[var(--ink-soft)]">
                        {p.lastEntryAt
                          ? `Última carga: ${new Date(p.lastEntryAt).toLocaleDateString('es-AR')}`
                          : 'Nunca cargó'}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Card>
              <p className="text-[var(--ink-soft)]">Todos los pacientes cargaron recientemente.</p>
            </Card>
          )}
        </>
      ) : (
        <p className="text-[var(--ink-soft)]">Cargando...</p>
      )}
    </ProLayout>
  );
}
