import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, LayoutGrid, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImagePicker } from '@/components/image-picker';
import { Avatar } from '@/components/avatar';
import { AdherenceRing, BarChart } from '@/components/charts';
import { WORKSPACE_KIND } from '@/lib/labels';
import type { WorkspaceKind } from '@shared/types';

interface InactivePatient {
  id: string;
  firstName: string;
  lastName: string;
  lastEntryAt: string | null;
  photoUrl?: string | null;
}

export function WorkspacePage() {
  const { me, refreshMe } = useAuth();
  const membership = me?.workspaceMemberships[0];
  const workspace = membership?.workspace;
  const [overview, setOverview] = useState<{
    activePatients: number;
    entriesThisWeek: number;
    adherencePercent: number;
    inactivePatients: InactivePatient[];
    weekdayLoads: Array<{ label: string; value: number }>;
  } | null>(null);
  const [name, setName] = useState(workspace?.name ?? '');
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(workspace?.name ?? '');
  }, [workspace?.name]);

  useEffect(() => {
    if (!workspace) return;
    apiFetch<typeof overview>(`workspaces/${workspace.id}/overview`).then(setOverview);
  }, [workspace?.id]);

  const save = async () => {
    if (!workspace) return;
    await apiFetch(`workspaces/${workspace.id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
    if (pendingImage) {
      await apiFetch('uploads', {
        method: 'POST',
        body: JSON.stringify({ purpose: 'workspace', targetId: workspace.id, dataUrl: pendingImage }),
      });
      setPendingImage(null);
    }
    await refreshMe();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
          <Button onClick={save}>{saved ? 'Guardado' : 'Guardar cambios'}</Button>
        </Card>
      ) : null}

      {overview ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card>
              <p className="font-display text-3xl">{overview.activePatients}</p>
              <p className="text-sm text-[var(--ink-soft)]">Personas a cargo. Las que invitaste y ya entraron.</p>
            </Card>
            <Card>
              <p className="font-display text-3xl">{overview.entriesThisWeek}</p>
              <p className="text-sm text-[var(--ink-soft)]">Cargas de esta semana (lunes a domingo).</p>
            </Card>
            <Card>
              <AdherenceRing
                percent={overview.adherencePercent}
                label="De los días que se esperaba una carga, este porcentaje se completó."
              />
            </Card>
          </div>

          <Card className="mb-8">
            <BarChart
              title="Cargas de esta semana"
              help="Cada barra es un día. Si está baja, ese día casi nadie cargó."
              points={overview.weekdayLoads ?? []}
            />
          </Card>

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
      ) : (
        <p className="text-[var(--ink-soft)]">Cargando el tablero...</p>
      )}

      <h2 className="font-display mb-3 text-xl">Qué hay en cada sección</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/pro/pacientes" className="hover:no-underline">
          <Card className="h-full transition-colors hover:border-[var(--sage)]">
            <Users className="mb-2 text-[var(--sage)]" />
            <p className="font-display text-lg">Pacientes</p>
            <p className="text-sm text-[var(--ink-soft)]">Lista, invitar con un link, entrar a la ficha de cada persona.</p>
          </Card>
        </Link>
        <Link to="/pro/plantillas" className="hover:no-underline">
          <Card className="h-full transition-colors hover:border-[var(--sage)]">
            <ClipboardList className="mb-2 text-[var(--sage)]" />
            <p className="font-display text-lg">Plantillas</p>
            <p className="text-sm text-[var(--ink-soft)]">Armá qué pregunta: ánimo, medicación, notas, escalas.</p>
          </Card>
        </Link>
        <Link to="/pro/equipo" className="hover:no-underline">
          <Card className="h-full transition-colors hover:border-[var(--sage)]">
            <LayoutGrid className="mb-2 text-[var(--sage)]" />
            <p className="font-display text-lg">Equipo</p>
            <p className="text-sm text-[var(--ink-soft)]">Invitá colegas y definí si administran, atienden o solo miran.</p>
          </Card>
        </Link>
      </div>
    </ProLayout>
  );
}
