import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PageSkeleton } from '@/components/skeleton';
import { PeriodicityIcon } from '@/lib/field-icons';
import { PERIODICITY } from '@/lib/labels';
import { ListToolbar, Pagination, SortHeader, usePagedSort, type SortDir } from '@/components/paged-list';
import type { TemplateDoc, TemplateVersionDoc } from '@shared/types';

type TemplateRow = TemplateDoc & { id: string; latestVersion?: (TemplateVersionDoc & { id: string }) | null };

export function TemplatesPage() {
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    if (!workspace) return;
    apiFetch<{ templates: TemplateRow[] }>(`workspaces/${workspace.workspace.id}/templates`)
      .then((res) => setTemplates(res.templates))
      .catch(console.error);
  }, [workspace?.workspace.id]);

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Plantillas</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
            Una plantilla es el cuestionario del paciente: ánimo, medicación, notas, lo que armes. Podés tener varias y asignar una distinta a cada persona.
          </p>
        </div>
        <Link to="/pro/plantillas/nueva" className="hover:no-underline">
          <Button>
            <Plus size={18} /> Nueva plantilla
          </Button>
        </Link>
      </div>

      {templates === null ? (
        <PageSkeleton />
      ) : (
        <>
          <ListToolbar search={search} onSearch={setSearch} placeholder="Buscar plantilla..." />
          <SortHeader
            columns={[
              { key: 'name', label: 'Nombre' },
              { key: 'fields', label: 'Preguntas' },
              { key: 'period', label: 'Periodicidad' },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={(key) => {
              if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              else {
                setSortKey(key);
                setSortDir('asc');
              }
            }}
          />
          <TemplatePagedList templates={templates} search={search} sortKey={sortKey} sortDir={sortDir} />
        </>
      )}
    </ProLayout>
  );
}

function TemplatePagedList({
  templates,
  search,
  sortKey,
  sortDir,
}: {
  templates: TemplateRow[];
  search: string;
  sortKey: string;
  sortDir: SortDir;
}) {
  const { pageItems, page, setPage, pageCount, total } = usePagedSort(templates, {
    search,
    match: (t, q) => t.name.toLowerCase().includes(q),
    sortKey,
    sortDir,
    value: (t, key) => {
      if (key === 'fields') return t.latestVersion?.fields.length ?? 0;
      if (key === 'period') return t.latestVersion ? PERIODICITY[t.latestVersion.periodicityType].label : '';
      return t.name.toLowerCase();
    },
  });

  return (
    <>
      <div className="space-y-3">
        {pageItems.map((t) => (
          <Link key={t.id} to={`/pro/plantillas/${t.id}`} className="block hover:no-underline">
            <Card className="flex items-center justify-between gap-3 transition-transform duration-200 hover:-translate-y-0.5">
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-1 text-[var(--sage)]" size={22} />
                <div>
                  <p className="font-medium">{t.name}</p>
                  {t.isDefault ? <p className="text-xs text-[var(--sage)]">La que se usa al invitar, si no elegís otra</p> : null}
                  {t.latestVersion ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-soft)]">
                      <PeriodicityIcon type={t.latestVersion.periodicityType} size={16} />
                      {PERIODICITY[t.latestVersion.periodicityType].label} · {t.latestVersion.fields.length} preguntas
                    </p>
                  ) : null}
                </div>
              </div>
              <span className="text-sm text-[var(--sage)]">Editar</span>
            </Card>
          </Link>
        ))}
      </div>
      <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
    </>
  );
}
