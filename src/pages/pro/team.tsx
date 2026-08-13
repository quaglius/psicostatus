import { useEffect, useState } from 'react';
import { UserMinus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/avatar';
import { MEMBER_ROLE } from '@/lib/labels';
import type { WorkspaceMemberRole } from '@shared/types';

interface MemberRow {
  id: string;
  userId: string;
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
        seeAllPatients: role === 'read_only',
      }),
    });
    const url = `${window.location.origin}/i/${res.token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const removeMember = async (id: string) => {
    if (!workspace) return;
    if (!confirm('¿Sacar a esta persona del espacio? No borra su cuenta, solo deja de ver este consultorio.')) return;
    await apiFetch(`workspaces/${workspace.workspace.id}/members/${id}/remove`, { method: 'POST', body: '{}' });
    await load();
  };

  const isAdmin = workspace?.role === 'admin' || me?.user.platformRole === 'global_admin';

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <h1 className="font-display text-3xl">Equipo</h1>
      <p className="mb-6 mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
        Quién trabaja en este espacio. Cada persona tiene un rol: qué puede ver y qué puede cambiar.
      </p>

      <div className="mb-8 space-y-2">
        {members.length === 0 ? (
          <Card>
            <p className="text-[var(--ink-soft)]">Todavía no hay nadie en la lista. Invitá con el link de abajo.</p>
          </Card>
        ) : (
          members.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={m.displayName ?? m.email} />
                <div className="min-w-0">
                  <p className="font-medium">{m.displayName ?? m.email}</p>
                  <p className="text-sm text-[var(--ink-soft)]">{m.email}</p>
                  <p className="text-sm text-[var(--sage)]">{MEMBER_ROLE[m.role].label}</p>
                </div>
              </div>
              {isAdmin && m.userId !== me?.user.id ? (
                <Button variant="ghost" onClick={() => removeMember(m.id)}>
                  <UserMinus size={16} />
                  Sacar
                </Button>
              ) : null}
            </Card>
          ))
        )}
      </div>

      {isAdmin ? (
        <Card className="space-y-4">
          <h2 className="font-display text-xl">Invitar a alguien</h2>
          <p className="text-sm text-[var(--ink-soft)]">Elegí qué va a poder hacer y copiá el link. Se lo pasás por WhatsApp o mail.</p>
          <fieldset className="space-y-3">
            {(Object.keys(MEMBER_ROLE) as WorkspaceMemberRole[]).map((r) => (
              <label key={r} className="flex items-start gap-2">
                <input type="radio" className="mt-1" checked={role === r} onChange={() => setRole(r)} />
                <span>
                  <span className="font-medium">{MEMBER_ROLE[r].label}</span>
                  <span className="block text-sm text-[var(--ink-soft)]">{MEMBER_ROLE[r].help}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <Button onClick={inviteStaff}>{copied ? 'Link copiado' : 'Copiar link de invitación'}</Button>
        </Card>
      ) : (
        <p className="text-[var(--ink-soft)]">Solo quien administra el espacio puede invitar o sacar gente.</p>
      )}
    </ProLayout>
  );
}
