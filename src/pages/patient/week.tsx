import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { Card } from '@/components/ui/Card';
import { EntryReadout } from '@/components/entry-readout';
import { formatDateAR } from '@shared/periodicity';
import type { EntryDoc, TemplateVersionDoc } from '@shared/types';

export function PatientWeekPage() {
  const { me } = useAuth();
  const memberships = me?.patientMemberships ?? [];
  const [activeWsId, setActiveWsId] = useState('');
  const [entries, setEntries] = useState<Array<EntryDoc & { id: string }>>([]);
  const [templateVersion, setTemplateVersion] = useState<TemplateVersionDoc | null>(null);

  useEffect(() => {
    if (memberships.length && !activeWsId) setActiveWsId(memberships[0]!.workspace.id);
  }, [memberships]);

  const membership = memberships.find((m) => m.workspace.id === activeWsId);

  useEffect(() => {
    if (!membership) return;
    apiFetch<{ entries: Array<EntryDoc & { id: string }> }>(`patients/${membership.id}/entries`).then((res) =>
      setEntries(res.entries),
    );
    apiFetch<{ templateVersion: TemplateVersionDoc }>(`patients/${membership.id}`).then((res) =>
      setTemplateVersion(res.templateVersion),
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
      <h1 className="font-display mb-2 text-2xl">Tu historial</h1>
      <p className="mb-6 text-sm text-[var(--ink-soft)]">Todo lo que fuiste cargando, completo. Los días viejos no se editan.</p>
      <div className="space-y-3">
        {entries.length === 0 ? (
          <Card>
            <p className="text-[var(--ink-soft)]">Todavía no hay registros. Cuando cargues el día, aparece acá.</p>
          </Card>
        ) : (
          entries.map((entry) => (
            <Card key={entry.id}>
              <p className="mb-2 text-sm font-medium">{formatDateAR(entry.entryDate)}</p>
              <EntryReadout fields={templateVersion?.fields} entry={entry} />
            </Card>
          ))
        )}
      </div>
    </PatientLayout>
  );
}
