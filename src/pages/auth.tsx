import { useState } from 'react';
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

export interface AuthFormProps {
  mode: 'login' | 'register';
  redirectTo?: string;
  title?: string;
  subtitle?: string;
}

export function AuthForm({ mode, redirectTo = '/app', title, subtitle }: AuthFormProps) {
  const navigate = useNavigate();
  const { refreshMe } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
        await sendEmailVerification(cred.user);
      } else {
        await signInWithEmailAndPassword(firebaseAuth, email, password);
      }
      await refreshMe();
      navigate(redirectTo);
    } catch {
      setError(mode === 'register' ? 'No pudimos crear tu cuenta. Probá de nuevo.' : 'Correo o contraseña incorrectos.');
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
    } catch {
      setError('No pudimos ingresar con Google.');
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

        <Button variant="secondary" fullWidth onClick={handleGoogle} disabled={loading}>
          Continuar con Google
        </Button>

        {mode === 'login' ? (
          <button type="button" className="text-sm text-[var(--sage)]" onClick={handleReset}>
            No me acuerdo la contraseña
          </button>
        ) : null}

        <p className="text-center text-sm text-[var(--ink-soft)]">
          <Link to="/">Volver al inicio</Link>
        </p>
      </Card>
    </div>
  );
}

export function LoginPage() {
  return <AuthForm mode="login" redirectTo="/app" />;
}

export function RegisterProfessionalPage() {
  return <AuthForm mode="register" redirectTo="/pro/onboarding" title="Crear cuenta profesional" />;
}
