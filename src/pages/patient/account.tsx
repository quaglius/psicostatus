import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail, requireAuth } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ImagePicker } from '@/components/image-picker';
import { apiFetch } from '@/lib/api';
import { APP_NAME } from '@/lib/labels';

export function PatientAccountPage() {
  const { me, firebaseUser, logout, refreshMe } = useAuth();
  const membership = me?.patientMemberships[0];
  const [firstName, setFirstName] = useState(membership?.firstName ?? '');
  const [lastName, setLastName] = useState(membership?.lastName ?? '');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const save = async () => {
    if (!membership) return;
    await apiFetch(`patients/${membership.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ firstName, lastName }),
    });
    if (photo) {
      await apiFetch('uploads', {
        method: 'POST',
        body: JSON.stringify({ purpose: 'patient', targetId: membership.id, dataUrl: photo }),
      });
      setPhoto(null);
    }
    await refreshMe();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetPassword = async () => {
    if (!firebaseUser?.email) return;
    await sendPasswordResetEmail(requireAuth(), firebaseUser.email);
    setResetSent(true);
  };

  return (
    <PatientLayout>
      <h1 className="font-display mb-6 text-2xl">Tu cuenta</h1>

      <Card className="space-y-4">
        <p className="text-sm text-[var(--ink-soft)]">{firebaseUser?.email}</p>
        {firebaseUser && !firebaseUser.emailVerified ? (
          <p className="text-sm text-[var(--warn)]">Verificá tu correo para mayor seguridad.</p>
        ) : null}

        <ImagePicker
          label="Tu foto"
          help="Opcional. Si no cargás una, tu profesional ve las iniciales."
          name={`${firstName} ${lastName}`.trim() || 'Paciente'}
          value={photo ?? membership?.photoUrl}
          onChange={setPhoto}
        />

        <Input label="Nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Button onClick={save}>{saved ? 'Guardado' : 'Guardar datos'}</Button>

        <Button variant="secondary" onClick={resetPassword}>
          {resetSent ? 'Correo enviado' : 'Cambiar contraseña'}
        </Button>

        <Button variant="ghost" onClick={logout}>
          Cerrar sesión
        </Button>
      </Card>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">{APP_NAME}</p>
      <p className="mt-2 text-center text-sm">
        <Link to="/privacidad" className="text-[var(--sage)]">
          Privacidad
        </Link>
        {' · '}
        <Link to="/terminos" className="text-[var(--sage)]">
          Términos
        </Link>
      </p>
    </PatientLayout>
  );
}
