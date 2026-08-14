import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { Card } from '@/components/ui/Card';
import { EntryReadout } from '@/components/entry-readout';
import { DateRange } from '@/components/date-range';
import { FieldReports } from '@/components/field-reports';
import { HelpTip } from '@/components/help-tip';
import { PageSkeleton } from '@/components/skeleton';
import { ListToolbar, Pagination, SortHeader, usePagedSort, type SortDir } from '@/components/paged-list';
import { addDays, formatDateAR, formatDateISO, todayInAR } from '@shared/periodicity';
import { buildFieldReports, filterEntriesByDate } from '@shared/report';
import type { EntryDoc, TemplateVersionDoc } from '@shared/types';

export function PatientWeekPage() {
  const { me } = useAuth();
  const memberships = me?.patientMemberships ?? [];
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeWsId, setActiveWsId] = useState('');
  const [entries, setEntries] = useState<Array<EntryDoc & { id: string }> | null>(null);
  const [templateVersion, setTemplateVersion] = useState<TemplateVersionDoc | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey] = useState('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const from = searchParams.get('desde') || formatDateISO(addDays(new Date(), -27));
  const to = searchParams.get('hasta') || todayInAR();

  useEffect(() => {
    if (memberships.length && !activeWsId) setActiveWsId(memberships[0]!.workspace.id);
  }, [memberships]);

  const membership = memberships.find((m) => m.workspace.id === activeWsId);

  useEffect(() => {
    if (!membership) return;
    setEntries(null);
    apiFetch<{ entries: Array<EntryDoc & { id: string }> }>(`patients/${membership.id}/entries`).then((res) =>
      setEntries(res.entries),
    );
    apiFetch<{ templateVersion: TemplateVersionDoc }>(`patients/${membership.id}`).then((res) =>
      setTemplateVersion(res.templateVersion),
    );
  }, [membership?.id]);

  const workspaces = memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name }));
  const filtered = filterEntriesByDate(entries ?? [], from, to);
  const reports = useMemo(
    () => (templateVersion ? buildFieldReports(filtered, templateVersion.fields) : []),
    [filtered, templateVersion],
  );
  const paged = usePagedSort(filtered, {
    search,
    match: (e, q) => `${e.entryDate} ${JSON.stringify(e.values)}`.toLowerCase().includes(q),
    sortKey,
    sortDir,
    value: (e) => e.entryDate,
  });

  return (
    <PatientLayout
      workspaceName={membership?.workspace.name}
      workspaceImageUrl={membership?.workspace.imageUrl}
      workspaces={workspaces.length > 1 ? workspaces : undefined}
      activeWorkspaceId={activeWsId}
      onWorkspaceChange={setActiveWsId}
    >
      <h1 className="font-display mb-2 flex items-center gap-2 text-2xl">
        Tu historial
        {templateVersion?.patientGuide ? (
          <HelpTip title="Qué te pedimos" text={templateVersion.patientGuide} />
        ) : null}
      </h1>
      <p className="mb-6 text-sm text-[var(--ink-soft)]">Todo lo que fuiste cargando, completo. Los días viejos no se editan.</p>

      <div className="mb-6">
        <DateRange
          from={from}
          to={to}
          onChange={(a, b) => {
            const next = new URLSearchParams(searchParams);
            next.set('desde', a);
            next.set('hasta', b);
            setSearchParams(next, { replace: true });
          }}
        />
      </div>

      {entries === null ? (
        <PageSkeleton />
      ) : (
        <>
          <div className="mb-6">
            <FieldReports reports={reports} />
          </div>
          <div className="mb-4">
            <ListToolbar search={search} onSearch={setSearch} placeholder="Buscar en tus cargas..." />
            <SortHeader
              columns={[{ key: 'date', label: 'Fecha' }]}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            />
          </div>
          <div className="space-y-3">
            {paged.total === 0 ? (
              <Card>
                <p className="text-[var(--ink-soft)]">No hay registros en ese rango.</p>
              </Card>
            ) : (
              paged.pageItems.map((entry) => (
                <Card key={entry.id} className="anim-in">
                  <p className="mb-2 text-sm font-medium">{formatDateAR(entry.entryDate)}</p>
                  <EntryReadout fields={templateVersion?.fields} entry={entry} />
                </Card>
              ))
            )}
          </div>
          <Pagination page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} />
        </>
      )}
    </PatientLayout>
  );
}
