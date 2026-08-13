import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/pages/auth';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { firebaseUser, refreshMe } = useAuth();
  const [invite, setInvite] = useState<{ workspaceName: string; kind: string; role: string | null } | null>(null);
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (!token) return;
    apiFetch<{ workspaceName: string; kind: string; role: string | null }>(`invite/${token}`)
      .then(setInvite)
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    if (firebaseUser && invite) {
      if (invite.kind !== 'patient') {
        acceptStaff();
      }
    }
  }, [firebaseUser, invite]);

  const acceptStaff = async () => {
    if (!token) return;
    await apiFetch('invites/accept', { method: 'POST', body: JSON.stringify({ token }) });
    await refreshMe();
    navigate('/pro/pacientes');
  };

  const acceptPatient = async () => {
    if (!token || !firstName.trim() || !lastName.trim()) return;
    await apiFetch('invites/accept', {
      method: 'POST',
      body: JSON.stringify({ token, firstName, lastName }),
    });
    await refreshMe();
    navigate('/paciente/hoy');
  };

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

  if (!invite) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--ink-soft)]">Cargando...</p>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <AuthForm
        mode="login"
        title={`Te invita ${invite.workspaceName}`}
        subtitle={invite.kind === 'staff' ? `Rol: ${invite.role}` : 'Creá tu cuenta para empezar'}
        redirectTo={`/i/${token}`}
      />
    );
  }

  if (invite.kind === 'staff') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Button onClick={acceptStaff}>Unirme al espacio</Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="font-display text-2xl">Bienvenido/a a {invite.workspaceName}</h1>
        <p className="text-sm text-[var(--ink-soft)]">Contanos cómo te llamás.</p>
        <Input label="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <Input label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <Button fullWidth onClick={acceptPatient} disabled={!firstName.trim() || !lastName.trim()}>
          Empezar
        </Button>
      </Card>
    </div>
  );
}
