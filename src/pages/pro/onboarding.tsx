import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { WorkspaceKind } from '@shared/types';

export function OnboardingPage() {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<WorkspaceKind>('solo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ patientInviteToken: string }>('workspaces', {
        method: 'POST',
        body: JSON.stringify({ name, kind }),
      });
      await refreshMe();
      const url = `${window.location.origin}/i/${res.patientInviteToken}`;
      setInviteUrl(url);
      await navigator.clipboard.writeText(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear el espacio');
    } finally {
      setLoading(false);
    }
  };

  if (inviteUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
        <Card className="w-full max-w-md space-y-4 text-center">
          <h1 className="font-display text-2xl">¡Listo!</h1>
          <p className="text-[var(--ink-soft)]">Tu espacio está creado. Copiamos el link de invitación para pacientes.</p>
          <p className="break-all text-xs text-[var(--ink-soft)]">{inviteUrl}</p>
          <Button fullWidth onClick={() => navigate('/pro/pacientes')}>Ir a pacientes</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <Card className="w-full max-w-md space-y-5">
        <div>
          <h1 className="font-display text-2xl">Tu espacio de trabajo</h1>
          <p className="text-sm text-[var(--ink-soft)]">Un paso y ya podés invitar pacientes.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Nombre del espacio" value={name} onChange={(e) => setName(e.target.value)} required />

          <fieldset className="space-y-2">
            <legend className="text-sm text-[var(--ink-soft)]">Tipo</legend>
            {(['solo', 'grupo', 'clinica'] as WorkspaceKind[]).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
                <span className="capitalize">{k}</span>
              </label>
            ))}
          </fieldset>

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

          <Button type="submit" fullWidth disabled={loading || !name.trim()}>
            Crear espacio
          </Button>
        </form>
      </Card>
    </div>
  );
}
