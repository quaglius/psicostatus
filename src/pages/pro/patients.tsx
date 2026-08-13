import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/avatar';
import { adherenceCopy } from '@/lib/labels';

interface PatientRow {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  lastEntryAt: string | null;
  adherence: { expected: number; filled: number };
}

export function PatientsPage() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const workspace = me?.workspaceMemberships[0];
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (me && !workspace && me.patientMemberships.length === 0 && me.user.platformRole !== 'global_admin') {
      navigate('/pro/onboarding');
    }
  }, [me, workspace, navigate]);

  const load = async () => {
    if (!workspace) return;
    const res = await apiFetch<{ patients: PatientRow[] }>(`workspaces/${workspace.workspace.id}/patients`);
    setPatients(res.patients);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [workspace?.workspace.id]);

  const copyLink = async () => {
    if (!workspace) return;
    const res = await apiFetch<{ token: string }>('invites', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: workspace.workspace.id, kind: 'patient' }),
    });
    const url = `${window.location.origin}/i/${res.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase()),
  );

  if (!workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <Link to="/pro/onboarding">
          <Button>Crear tu espacio</Button>
        </Link>
      </div>
    );
  }

  return (
    <ProLayout workspaceName={workspace.workspace.name}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Pacientes</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
            Acá están las personas que invitaste. El texto a la derecha dice cuántos días cargaron de los que se esperaban esta semana.
          </p>
        </div>
        <Button onClick={copyLink}>
          <UserPlus size={18} />
          {copied ? 'Link copiado' : 'Invitar pacientes'}
        </Button>
      </div>

      {patients.length > 3 ? (
        <input
          className="mb-4 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-2"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar pacientes"
        />
      ) : null}

      {loading ? (
        <p className="text-[var(--ink-soft)]">Cargando...</p>
      ) : filtered.length === 0 ? (
        <Card className="text-center">
          <p className="mb-2 font-display text-xl">Todavía no hay nadie</p>
          <p className="mb-4 text-[var(--ink-soft)]">
            Copiá el link y mandáselo por WhatsApp o mail. Cuando la persona cree su cuenta, aparece acá.
          </p>
          <Button onClick={copyLink}>Copiar link de invitación</Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Link key={p.id} to={`/pro/pacientes/${p.id}`} className="block hover:no-underline">
              <Card className="flex items-center justify-between gap-3 transition-colors hover:border-[var(--sage)]">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={`${p.firstName} ${p.lastName}`} src={p.photoUrl} />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {p.firstName} {p.lastName}
                    </p>
                    <p className="text-sm text-[var(--ink-soft)]">
                      {p.lastEntryAt
                        ? `Última carga: ${new Date(p.lastEntryAt).toLocaleDateString('es-AR')}`
                        : 'Todavía no cargó nada'}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-right text-sm text-[var(--sage)]">
                  {adherenceCopy(p.adherence.filled, p.adherence.expected)}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </ProLayout>
  );
}
