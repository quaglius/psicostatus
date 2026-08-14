import { Link } from 'react-router-dom';
import { ClipboardList, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { apiFetch, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { PageSkeleton } from '@/components/skeleton';
import { PeriodicityIcon } from '@/lib/field-icons';
import { PERIODICITY } from '@/lib/labels';
import { ListToolbar, Pagination, SortHeader, usePagedSort, type SortDir } from '@/components/paged-list';
import { GuidedTour, TourReplay } from '@/components/guided-tour';
import { TEMPLATES_TOUR_STEPS, TOUR_TEMPLATES } from '@/lib/tours';
import type { TemplateDoc, TemplateVersionDoc } from '@shared/types';

type TemplateRow = TemplateDoc & { id: string; latestVersion?: (TemplateVersionDoc & { id: string }) | null };

export function TemplatesPage() {
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  const load = () => {
    if (!workspace) return;
    apiFetch<{ templates: TemplateRow[] }>(`workspaces/${workspace.workspace.id}/templates`)
      .then((res) => setTemplates(res.templates))
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, [workspace?.workspace.id]);

  const setDefault = async (id: string) => {
    setBusyId(id);
    try {
      const res = await apiFetch<{ name: string; assignedCount: number; skippedCount: number }>(
        `templates/${id}/default`,
        { method: 'POST', body: '{}' },
      );
      load();
      const assigned =
        res.assignedCount === 1
          ? `Se asignó «${res.name}» a 1 persona activa.`
          : `Se asignó «${res.name}» a ${res.assignedCount} personas activas.`;
      const skipped =
        res.skippedCount === 0
          ? ''
          : res.skippedCount === 1
            ? ' 1 ya la tenía.'
            : ` ${res.skippedCount} ya la tenían.`;
      setNotice({
        title: 'Plantilla por defecto',
        body: `${assigned}${skipped} Lo ya cargado se conserva. A partir de hoy usan esta plantilla. Si querés otra en alguien, entrá a su ficha y cambiá el cuestionario.`,
      });
    } catch (err) {
      setNotice({
        title: 'No se pudo cambiar',
        body: err instanceof ApiClientError ? err.message : 'Algo falló. Probá de nuevo.',
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <GuidedTour
        tourId={TOUR_TEMPLATES}
        userId={me?.user.id}
        steps={TEMPLATES_TOUR_STEPS}
        autoStartPath="/pro/plantillas"
      />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div data-tour="templates-intro">
          <h1 className="font-display text-3xl">Plantillas</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
            Una plantilla es el cuestionario del paciente: ánimo, medicación, notas, lo que armes. Podés tener varias y asignar una distinta a cada persona.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TourReplay tourId={TOUR_TEMPLATES} label="Ver guía" />
          <Link to="/pro/plantillas/nueva" className="hover:no-underline" data-tour="templates-new">
            <Button>
              <Plus size={18} /> Nueva plantilla
            </Button>
          </Link>
        </div>
      </div>

      <p className="mb-4 max-w-2xl text-sm text-[var(--ink-soft)]" data-tour="templates-default">
        “Usar por defecto” asigna esa plantilla a todas las personas activas y la dejan recibiendo los pacientes nuevos. Después podés cambiarla persona por persona en su ficha.
      </p>
      <p className="mb-6 max-w-2xl text-sm text-[var(--ink-soft)]" data-tour="templates-per-patient">
        En la ficha de cada paciente, en “Cambiar el cuestionario”, elegís qué formulario usa esa persona.
      </p>

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
          <TemplatePagedList
            templates={templates}
            search={search}
            sortKey={sortKey}
            sortDir={sortDir}
            onSetDefault={setDefault}
            busyId={busyId}
          />
        </>
      )}
      <Sheet open={!!notice} title={notice?.title ?? ''} onClose={() => setNotice(null)}>
        <p>{notice?.body}</p>
      </Sheet>
    </ProLayout>
  );
}

function TemplatePagedList({
  templates,
  search,
  sortKey,
  sortDir,
  onSetDefault,
  busyId,
}: {
  templates: TemplateRow[];
  search: string;
  sortKey: string;
  sortDir: SortDir;
  onSetDefault: (id: string) => void;
  busyId: string | null;
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
      <div className="space-y-3" data-tour="templates-list">
        {pageItems.map((t) => (
          <Card key={t.id} className="flex flex-wrap items-center justify-between gap-3 transition-transform duration-200 hover:-translate-y-0.5">
            <Link to={`/pro/plantillas/${t.id}`} className="flex min-w-0 flex-1 items-start gap-3 hover:no-underline">
              <ClipboardList className="mt-1 text-[var(--sage)]" size={22} />
              <div>
                <p className="font-medium">{t.name}</p>
                {t.isDefault ? <p className="text-xs text-[var(--sage)]">Por defecto: activas y pacientes nuevos</p> : null}
                {t.latestVersion ? (
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-[var(--ink-soft)]">
                    <PeriodicityIcon type={t.latestVersion.periodicityType} size={16} />
                    {PERIODICITY[t.latestVersion.periodicityType].label} · {t.latestVersion.fields.length} preguntas
                  </p>
                ) : null}
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {t.isDefault ? (
                <span className="text-sm text-[var(--sage)]">Por defecto</span>
              ) : (
                <Button variant="secondary" type="button" disabled={busyId === t.id} onClick={() => onSetDefault(t.id)}>
                  {busyId === t.id ? 'Asignando…' : 'Usar por defecto'}
                </Button>
              )}
              <Link to={`/pro/plantillas/${t.id}`} className="text-sm text-[var(--sage)] hover:no-underline">
                Editar
              </Link>
            </div>
          </Card>
        ))}
      </div>
      <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
    </>
  );
}
