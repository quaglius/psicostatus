import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { Card } from '@/components/ui/Card';
import { formatDateTimeAR, formatEntryPreview } from '@shared/periodicity';
import type { EntryDoc } from '@shared/types';

export function PatientWeekPage() {
  const { me } = useAuth();
  const memberships = me?.patientMemberships ?? [];
  const [activeWsId, setActiveWsId] = useState('');
  const [entries, setEntries] = useState<Array<EntryDoc & { id: string }>>([]);

  useEffect(() => {
    if (memberships.length && !activeWsId) setActiveWsId(memberships[0]!.workspace.id);
  }, [memberships]);

  const membership = memberships.find((m) => m.workspace.id === activeWsId);

  useEffect(() => {
    if (!membership) return;
    apiFetch<{ entries: Array<EntryDoc & { id: string }> }>(`patients/${membership.id}/entries`).then((res) =>
      setEntries(res.entries),
    );
  }, [membership?.id]);

  const workspaces = memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name }));

  return (
    <PatientLayout
      workspaceName={membership?.workspace.name}
      workspaces={workspaces.length > 1 ? workspaces : undefined}
      activeWorkspaceId={activeWsId}
      onWorkspaceChange={setActiveWsId}
    >
      <h1 className="font-display mb-6 text-2xl">Tu historial</h1>
      <div className="space-y-2">
        {entries.length === 0 ? (
          <Card>
            <p className="text-[var(--ink-soft)]">Todavía no hay registros.</p>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <p className="text-sm text-[var(--ink-soft)]">{entry.entryDate}</p>
              <p className="font-medium">{formatEntryPreview(entry.values)}</p>
              <p className="text-xs text-[var(--ink-soft)]">Cargado: {formatDateTimeAR(entry.createdAt)}</p>
            </Card>
          ))
        )}
      </div>
    </PatientLayout>
  );
}
