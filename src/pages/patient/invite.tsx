import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/pages/auth';
import { Card } from '@/components/ui/Card';
import { ScreenSkeleton } from '@/components/skeleton';
import { MEMBER_ROLE } from '@/lib/labels';
import type { WorkspaceMemberRole } from '@shared/types';

interface InviteInfo {
  workspaceId: string;
  workspaceName: string;
  kind: string;
  role: string | null;
}

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { firebaseUser, me, loading: authLoading, refreshMe } = useAuth();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch<InviteInfo>(`invite/${token}`)
      .then(setInvite)
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (!token || !invite || authLoading || !firebaseUser || !me || joining) return;

    const staffHere = me.workspaceMemberships.some((m) => m.workspace.id === invite.workspaceId);
    const patientHere = me.patientMemberships.some((m) => m.workspace.id === invite.workspaceId);

    if (staffHere) {
      navigate('/pro/espacio', { replace: true });
      return;
    }
    if (patientHere && invite.kind === 'patient') {
      navigate('/paciente/hoy', { replace: true });
      return;
    }

    const accept = async () => {
      setJoining(true);
      try {
        const names = me.user.displayName?.trim().split(/\s+/) ?? [];
        const firstName = names[0] || me.patientMemberships[0]?.firstName;
        const lastName = names.slice(1).join(' ') || me.patientMemberships[0]?.lastName;
        const res = await apiFetch<{ type: string }>(`invites/accept`, {
          method: 'POST',
          body: JSON.stringify({ token, firstName, lastName }),
        });
        await refreshMe();
        if (res.type === 'already_professional' || res.type === 'already_staff' || res.type === 'staff') {
          navigate('/pro/espacio', { replace: true });
          return;
        }
        navigate('/paciente/hoy', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No pudimos unirte con este link');
        setJoining(false);
      }
    };

    void accept();
  }, [token, invite, authLoading, firebaseUser, me, joining, navigate, refreshMe]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
        <Card className="max-w-md text-center">
          <h1 className="font-display mb-3 text-xl">Este link ya no vale</h1>
          <p className="text-[var(--ink-soft)]">{error}</p>
          <p className="mt-4 text-sm text-[var(--ink-soft)]">Pedile uno nuevo a tu profesional.</p>
        </Card>
      </div>
    );
  }

  if (authLoading || !invite || firebaseUser) {
    return <ScreenSkeleton />;
  }

  if (!firebaseUser) {
    return (
      <AuthForm
        mode="login"
        allowSwitch
        allowGoogle
        title={`Te invita ${invite.workspaceName}`}
        subtitle={
          invite.kind === 'staff'
            ? `${MEMBER_ROLE[(invite.role as WorkspaceMemberRole) || 'professional'].label}. Si ya tenés cuenta, ingresá. Si es la primera vez, creá una.`
            : 'Este es el único lugar donde podés crear tu cuenta como paciente. Si ya tenés cuenta, ingresá y seguimos.'
        }
        redirectTo={`/i/${token}`}
      />
    );
  }

  return <ScreenSkeleton />;
}
