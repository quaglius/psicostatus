import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { WorkspaceMemberRole } from '@shared/types';

interface MemberRow {
  id: string;
  email: string;
  displayName: string | null;
  role: WorkspaceMemberRole;
}

export function TeamPage() {
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [role, setRole] = useState<WorkspaceMemberRole>('professional');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [singleUse, setSingleUse] = useState(false);
  const [assignedEmail, setAssignedEmail] = useState('');

  const load = async () => {
    if (!workspace) return;
    const res = await apiFetch<{ members: MemberRow[] }>(`workspaces/${workspace.workspace.id}/members`);
    setMembers(res.members);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [workspace?.workspace.id]);

  const inviteStaff = async () => {
    if (!workspace) return;
    const res = await apiFetch<{ token: string }>('invites', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: workspace.workspace.id,
        kind: 'staff',
        role,
        singleUse,
        assignedEmail: assignedEmail || null,
        seeAllPatients: role === 'read_only',
      }),
    });
    const url = `${window.location.origin}/i/${res.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isAdmin = workspace?.role === 'admin' || me?.user.platformRole === 'global_admin';

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <h1 className="font-display mb-6 text-3xl">Equipo</h1>

      <div className="mb-8 space-y-2">
        {members.map((m) => (
          <Card key={m.id} className="flex justify-between">
            <div>
              <p className="font-medium">{m.displayName ?? m.email}</p>
              <p className="text-sm text-[var(--ink-soft)]">{m.email}</p>
            </div>
            <span className="text-sm capitalize text-[var(--sage)]">{m.role.replace('_', ' ')}</span>
          </Card>
        ))}
      </div>

      {isAdmin ? (
        <Card className="space-y-4">
          <h2 className="font-display text-xl">Invitar al equipo</h2>
          <fieldset className="space-y-2">
            {(['admin', 'professional', 'read_only'] as WorkspaceMemberRole[]).map((r) => (
              <label key={r} className="flex items-center gap-2">
                <input type="radio" checked={role === r} onChange={() => setRole(r)} />
                <span className="capitalize">{r.replace('_', ' ')}</span>
              </label>
            ))}
          </fieldset>

          <button type="button" className="text-sm text-[var(--sage)]" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? 'Ocultar opciones' : 'Más opciones'}
          </button>

          {showAdvanced ? (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={singleUse} onChange={(e) => setSingleUse(e.target.checked)} />
                Un solo uso
              </label>
              <input
                className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
                placeholder="Restringir a este mail (opcional)"
                value={assignedEmail}
                onChange={(e) => setAssignedEmail(e.target.value)}
              />
            </div>
          ) : null}

          <Button onClick={inviteStaff}>{copied ? 'Link copiado' : 'Copiar link de invitación'}</Button>
        </Card>
      ) : (
        <p className="text-[var(--ink-soft)]">Solo los administradores pueden invitar al equipo.</p>
      )}
    </ProLayout>
  );
}
