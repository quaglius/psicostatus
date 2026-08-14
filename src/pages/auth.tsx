import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  googleProvider,
  requireAuth,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { GoogleIcon } from '@/components/brand/GoogleIcon';

export interface AuthFormProps {
  mode: 'login' | 'register';
  allowSwitch?: boolean;
  allowGoogle?: boolean;
  redirectTo?: string;
  title?: string;
  subtitle?: string;
  footerNote?: ReactNode;
}

function authErrorMessage(
  err: unknown,
  fallback: string,
  ctx: { mode: 'login' | 'register'; allowSwitch: boolean },
): string {
  const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : '';
  const map: Record<string, string> = {
    'auth/email-already-in-use': ctx.allowSwitch
      ? 'Ese correo ya tiene cuenta. Tocá «Ya tengo cuenta» e ingresá.'
      : 'Ese correo ya tiene cuenta. Entrá desde Ingresar.',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña tiene que tener al menos 6 caracteres.',
    'auth/invalid-credential':
      ctx.allowSwitch && ctx.mode === 'login'
        ? 'Correo o contraseña incorrectos. Si es tu primera vez, tocá «Crear cuenta».'
        : ctx.mode === 'login'
          ? 'Correo o contraseña incorrectos. Si sos paciente nuevo, entrá con el link que te mandó tu profesional.'
          : 'Correo o contraseña incorrectos.',
    'auth/user-not-found': ctx.allowSwitch
      ? 'No hay una cuenta con ese correo. Tocá «Crear cuenta».'
      : 'No hay una cuenta con ese correo. Si sos paciente, pedile a tu profesional que te invite con un link.',
    'auth/wrong-password': 'Correo o contraseña incorrectos.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google. Probá de nuevo.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana de Google. Permití popups.',
    'auth/cancelled-popup-request': 'Se canceló el ingreso con Google.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase.',
    'auth/operation-not-allowed': 'Este método de ingreso no está habilitado en Firebase.',
    'auth/too-many-requests': 'Demasiados intentos. Esperá un rato.',
    'auth/network-request-failed': 'No hay conexión con Google. Revisá red o bloqueadores.',
    'auth/internal-error': 'Google rechazó el pedido. Suele ser un bloqueo del navegador o CSP.',
  };
  if (code && map[code]) return map[code];
  if (err instanceof Error && err.message && !err.message.startsWith('Firebase:')) return err.message;
  return fallback;
}

export function AuthForm({
  mode: initialMode,
  allowSwitch = false,
  allowGoogle = true,
  redirectTo = '/app',
  title,
  subtitle,
  footerNote,
}: AuthFormProps) {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const switchMode = (next: 'login' | 'register') => {
    setMode(next);
    setError('');
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && !consent) {
      setError('Tenés que aceptar los términos para continuar');
      return;
    }
    setLoading(true);
    try {
      const firebaseAuth = requireAuth();
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        try {
          await sendEmailVerification(cred.user);
        } catch {
          // La cuenta ya existe; el mail de verificación no debe frenar el alta.
        }
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      await refreshMe();
      navigate(redirectTo);
    } catch (err) {
      setError(
        authErrorMessage(
          err,
          mode === 'register' ? 'No pudimos crear tu cuenta. Probá de nuevo.' : 'Correo o contraseña incorrectos.',
          { mode, allowSwitch },
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (mode === 'register' && !consent) {
      setError('Tenés que aceptar los términos para continuar');
      return;
    }
    setLoading(true);
    try {
      await signInWithPopup(requireAuth(), googleProvider);
      await refreshMe();
      navigate(redirectTo);
    } catch (err) {
      setError(authErrorMessage(err, 'No pudimos ingresar con Google.', { mode, allowSwitch }));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!email) {
      setError('Ingresá tu correo primero');
      return;
    }
    await sendPasswordResetEmail(requireAuth(), email);
    setResetSent(true);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <Card className="w-full max-w-md space-y-5">
        <div>
          <h1 className="font-display text-2xl text-[var(--ink)]">
            {title ?? (mode === 'register' ? 'Crear cuenta' : 'Ingresar')}
          </h1>
          {subtitle ? <p className="mt-1 text-sm text-[var(--ink-soft)]">{subtitle}</p> : null}
        </div>

        {allowSwitch ? (
          <div className="grid grid-cols-2 rounded-full bg-[var(--line)] p-1" role="tablist" aria-label="Crear cuenta o ingresar">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={[
                'rounded-full py-2 text-sm transition-colors',
                mode === 'register' ? 'bg-[var(--paper)] font-medium text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]',
              ].join(' ')}
              onClick={() => switchMode('register')}
            >
              Crear cuenta
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={[
                'rounded-full py-2 text-sm transition-colors',
                mode === 'login' ? 'bg-[var(--paper)] font-medium text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]',
              ].join(' ')}
              onClick={() => switchMode('login')}
            >
              Ya tengo cuenta
            </button>
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />

          {mode === 'register' ? (
            <label className="flex items-start gap-2 text-sm text-[var(--ink-soft)]">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
              <span>
                Acepto los{' '}
                <Link to="/terminos" className="text-[var(--sage)]">
                  términos
                </Link>{' '}
                y la{' '}
                <Link to="/privacidad" className="text-[var(--sage)]">
                  política de privacidad
                </Link>
                .
              </span>
            </label>
          ) : null}

          {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
          {resetSent ? <p className="text-sm text-[var(--sage)]">Te enviamos un correo para restablecer la contraseña.</p> : null}

          <Button type="submit" fullWidth disabled={loading}>
            {mode === 'register' ? 'Crear cuenta' : 'Ingresar'}
          </Button>
        </form>

        {allowGoogle ? (
          <Button variant="secondary" fullWidth onClick={handleGoogle} disabled={loading}>
            <GoogleIcon />
            Continuar con Google
          </Button>
        ) : null}

        {mode === 'login' ? (
          <button type="button" className="text-sm text-[var(--sage)]" onClick={handleReset}>
            No me acuerdo la contraseña
          </button>
        ) : null}

        {footerNote ? <p className="text-center text-sm text-[var(--ink-soft)]">{footerNote}</p> : null}

        <p className="text-center text-sm text-[var(--ink-soft)]">
          <Link to="/">Volver al inicio</Link>
        </p>
      </Card>
    </div>
  );
}

export function LoginPage() {
  return (
    <AuthForm
      mode="login"
      allowGoogle={false}
      redirectTo="/app"
      title="Ingresar"
      subtitle="Si ya tenés cuenta (por invitación de tu profesional o como consultorio), ingresá acá. Los pacientes nuevos entran solo con el link que les mandan."
      footerNote={
        <>
          ¿Sos profesional y no tenés cuenta?{' '}
          <Link to="/registro/profesional" className="text-[var(--sage)]">
            Crear espacio profesional
          </Link>
          . ¿Sos paciente sin link?{' '}
          <Link to="/paciente" className="text-[var(--sage)]">
            Pedile la invitación a tu profesional
          </Link>
          .
        </>
      }
    />
  );
}

export function RegisterProfessionalPage() {
  return <AuthForm mode="register" redirectTo="/app" title="Crear cuenta profesional" />;
}
