import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ClipboardList, LayoutGrid, Users } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImagePicker } from '@/components/image-picker';
import { Avatar } from '@/components/avatar';
import { AdherenceRing, BarChart, LineChart } from '@/components/charts';
import { DateRange } from '@/components/date-range';
import { FieldReports } from '@/components/field-reports';
import { PageSkeleton } from '@/components/skeleton';
import { WORKSPACE_KIND } from '@/lib/labels';
import { addDays, formatDateISO, todayInAR } from '@shared/periodicity';
import type { WorkspaceKind } from '@shared/types';
import type { FieldReport } from '@shared/report';

interface InactivePatient {
  id: string;
  firstName: string;
  lastName: string;
  lastEntryAt: string | null;
  photoUrl?: string | null;
}

interface Overview {
  from: string;
  to: string;
  activePatients: number;
  entriesThisWeek: number;
  entriesInRange: number;
  adherencePercent: number;
  inactivePatients: InactivePatient[];
  weekdayLoads: Array<{ label: string; value: number }>;
  dailyLoads: Array<{ label: string; value: number }>;
  fieldReports: FieldReport[];
}

export function WorkspacePage() {
  const { me, refreshMe } = useAuth();
  const membership = me?.workspaceMemberships[0];
  const workspace = membership?.workspace;
  const [searchParams, setSearchParams] = useSearchParams();
  const from = searchParams.get('desde') || formatDateISO(addDays(new Date(), -27));
  const to = searchParams.get('hasta') || todayInAR();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [name, setName] = useState(workspace?.name ?? '');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(workspace?.name ?? '');
  }, [workspace?.name]);

  useEffect(() => {
    if (!workspace) return;
    setLoadingOverview(true);
    apiFetch<Overview>(`workspaces/${workspace.id}/overview?from=${from}&to=${to}`)
      .then(setOverview)
      .catch(console.error)
      .finally(() => setLoadingOverview(false));
  }, [workspace?.id, from, to]);

  const save = async () => {
    if (!workspace) return;
    setSaving(true);
    setSaveError('');
    try {
      await apiFetch(`workspaces/${workspace.id}`, {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      if (pendingImage) {
        try {
          await apiFetch('uploads', {
            method: 'POST',
            body: JSON.stringify({ purpose: 'workspace', targetId: workspace.id, dataUrl: pendingImage }),
          });
          setPendingImage(null);
        } catch (err) {
          const msg =
            err instanceof ApiClientError
              ? err.message
              : 'El nombre se guardó, pero la foto no. Activá Storage en Firebase o probá otra imagen.';
          setSaveError(msg);
          await refreshMe();
          return;
        }
      }
      await refreshMe();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudieron guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const kind = (workspace?.kind ?? 'solo') as WorkspaceKind;

  return (
    <ProLayout workspaceName={workspace?.name}>
      <h1 className="font-display text-3xl">Tu espacio</h1>
      <p className="mb-6 mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
        El tablero del consultorio: cómo viene el grupo, y atajos a lo que usás todos los días.
      </p>

      {workspace ? (
        <Card className="mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={name || workspace.name} src={pendingImage ?? workspace.imageUrl} size={56} />
            <div>
              <p className="text-sm text-[var(--sage)]">{WORKSPACE_KIND[kind].label}</p>
              <p className="text-sm text-[var(--ink-soft)]">{WORKSPACE_KIND[kind].help}</p>
            </div>
          </div>
          <Input label="Nombre que ves vos y el paciente" value={name} onChange={(e) => setName(e.target.value)} />
          <ImagePicker
            label="Foto o logo"
            help="Opcional. Hace que el espacio se sienta propio."
            name={name || workspace.name}
            value={pendingImage ?? workspace.imageUrl}
            onChange={setPendingImage}
          />
          {saveError ? <p className="text-sm text-[var(--danger)]">{saveError}</p> : null}
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? 'Guardando…' : saved ? 'Guardado' : 'Guardar cambios'}
          </Button>
        </Card>
      ) : null}

      <Card className="mb-6">
        <p className="mb-3 font-display text-lg">Reportería</p>
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
      </Card>

      {loadingOverview || !overview ? (
        <PageSkeleton />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="font-display text-3xl">{overview.activePatients}</p>
              <p className="text-sm text-[var(--ink-soft)]">Personas a cargo. Las que invitaste y ya entraron.</p>
            </Card>
            <Card>
              <p className="font-display text-3xl">{overview.entriesInRange}</p>
              <p className="text-sm text-[var(--ink-soft)]">Cargas en el rango elegido. Esta semana: {overview.entriesThisWeek}.</p>
            </Card>
            <Card>
              <AdherenceRing
                percent={overview.adherencePercent}
                label="De los días que se esperaba una carga, este porcentaje se completó."
              />
            </Card>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <Card>
              <BarChart
                title="Cargas por día de la semana"
                help="Cada barra es un día. Si está baja, ese día casi nadie cargó."
                points={overview.weekdayLoads ?? []}
              />
            </Card>
            <Card>
              {overview.dailyLoads.length > 1 ? (
                <LineChart
                  title="Cargas en el tiempo"
                  help="Cuántas cargas hubo cada día del rango."
                  points={overview.dailyLoads.map((d) => ({
                    label: d.label.slice(5).replace('-', '/'),
                    value: d.value,
                  }))}
                />
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">Hace falta más de un día con cargas para ver la línea.</p>
              )}
            </Card>
          </div>

          <h2 className="font-display mb-3 text-xl">Puntuaciones y caritas</h2>
          <div className="mb-8">
            <FieldReports reports={overview.fieldReports ?? []} />
          </div>

          {overview.inactivePatients.length > 0 ? (
            <div className="mb-8">
              <h2 className="font-display mb-3 text-xl">Hace rato que no cargan</h2>
              <p className="mb-3 text-sm text-[var(--ink-soft)]">Conviene mirarlos antes de la próxima sesión.</p>
              <div className="space-y-2">
                {overview.inactivePatients.map((p) => (
                  <Link key={p.id} to={`/pro/pacientes/${p.id}`} className="block hover:no-underline">
                    <Card className="flex items-center gap-3 transition-colors hover:border-[var(--warn)]">
                      <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} />
                      <div>
                        <p className="font-medium">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-sm text-[var(--ink-soft)]">
                          {p.lastEntryAt
                            ? `Última carga: ${new Date(p.lastEntryAt).toLocaleDateString('es-AR')}`
                            : 'Nunca cargó'}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Card className="mb-8">
              <p className="text-[var(--ink-soft)]">Todas las personas cargaron hace poco. Bien.</p>
            </Card>
          )}
        </>
      )}

      <h2 className="font-display mb-3 text-xl">Qué hay en cada sección</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/pro/pacientes" className="hover:no-underline">
          <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--sage)]">
            <Users className="mb-2 text-[var(--sage)]" />
            <p className="font-display text-lg">Pacientes</p>
            <p className="text-sm text-[var(--ink-soft)]">Lista, invitar con un link, entrar a la ficha de cada persona.</p>
          </Card>
        </Link>
        <Link to="/pro/plantillas" className="hover:no-underline">
          <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--sage)]">
            <ClipboardList className="mb-2 text-[var(--sage)]" />
            <p className="font-display text-lg">Plantillas</p>
            <p className="text-sm text-[var(--ink-soft)]">Armá qué pregunta: ánimo, medicación, notas, escalas.</p>
          </Card>
        </Link>
        <Link to="/pro/equipo" className="hover:no-underline">
          <Card className="h-full transition-transform duration-200 hover:-translate-y-0.5 hover:border-[var(--sage)]">
            <LayoutGrid className="mb-2 text-[var(--sage)]" />
            <p className="font-display text-lg">Equipo</p>
            <p className="text-sm text-[var(--ink-soft)]">Invitá colegas y definí si administran, atienden o solo miran.</p>
          </Card>
        </Link>
      </div>
    </ProLayout>
  );
}
