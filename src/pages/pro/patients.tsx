import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, UserPlus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/avatar';
import { PageSkeleton } from '@/components/skeleton';
import { ListToolbar, Pagination, SortHeader, usePagedSort, type SortDir } from '@/components/paged-list';
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
  const [inviteUrl, setInviteUrl] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    if (me && !workspace && me.patientMemberships.length === 0 && me.user.platformRole !== 'global_admin') {
      navigate('/pro/onboarding');
    }
  }, [me, workspace, navigate]);

  const load = async () => {
    if (!workspace) return;
    const [res, invite] = await Promise.all([
      apiFetch<{ patients: PatientRow[] }>(`workspaces/${workspace.workspace.id}/patients`),
      apiFetch<{ token: string }>(`workspaces/${workspace.workspace.id}/patient-invite`),
    ]);
    setPatients(res.patients);
    setInviteUrl(`${window.location.origin}/i/${invite.token}`);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [workspace?.workspace.id]);

  const copyLink = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const { pageItems, page, setPage, pageCount, total } = usePagedSort(patients, {
    search,
    match: (p, q) => `${p.firstName} ${p.lastName}`.toLowerCase().includes(q),
    sortKey,
    sortDir,
    value: (p, key) => {
      if (key === 'last') return p.lastEntryAt ?? '';
      if (key === 'adherence') return p.adherence.expected ? p.adherence.filled / p.adherence.expected : 0;
      return `${p.lastName} ${p.firstName}`.toLowerCase();
    },
  });

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
        <Button onClick={() => void copyLink()} disabled={!inviteUrl}>
          <UserPlus size={18} />
          {copied ? 'Link copiado' : 'Copiar link'}
        </Button>
      </div>

      <Card className="mb-8 space-y-3">
        <p className="font-display text-lg">Link de invitación</p>
        <p className="text-sm text-[var(--ink-soft)]">
          Mandáselo por WhatsApp o mail. Si es alguien nuevo, se registra y empieza a cargar. Si ya tiene cuenta, el sistema lo reconoce y no le pide registrarse otra vez. Si lo abrís vos, te lleva a tu espacio.
        </p>
        {inviteUrl ? (
          <p className="break-all rounded-[var(--radius-input)] bg-[var(--empty)] px-3 py-2 text-sm">{inviteUrl}</p>
        ) : (
          <p className="text-sm text-[var(--ink-soft)]">Preparando el link…</p>
        )}
        <Button variant="secondary" onClick={() => void copyLink()} disabled={!inviteUrl}>
          <Copy size={16} />
          {copied ? 'Copiado' : 'Copiar'}
        </Button>
      </Card>

      {loading ? (
        <PageSkeleton />
      ) : patients.length === 0 ? (
        <Card className="text-center">
          <p className="mb-2 font-display text-xl">Todavía no hay nadie</p>
          <p className="text-[var(--ink-soft)]">Cuando acepten el link, aparecen acá.</p>
        </Card>
      ) : (
        <>
          <ListToolbar search={search} onSearch={setSearch} placeholder="Buscar por nombre..." />
          <SortHeader
            columns={[
              { key: 'name', label: 'Nombre' },
              { key: 'last', label: 'Última carga' },
              { key: 'adherence', label: 'Adherencia' },
            ]}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={toggleSort}
          />
          <div className="space-y-2">
            {pageItems.map((p) => (
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
          <Pagination page={page} pageCount={pageCount} total={total} onPage={setPage} />
        </>
      )}
    </ProLayout>
  );
}
