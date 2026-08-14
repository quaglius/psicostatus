import { Link } from 'react-router-dom';
import { Mark } from '@/components/brand/Mark';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { APP_NAME } from '@/lib/labels';

export function PatientAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--paper)] px-4">
      <Card className="w-full max-w-md space-y-5">
        <div className="flex items-center gap-3">
          <Mark size={36} />
          <p className="font-display text-xl">{APP_NAME}</p>
        </div>
        <div>
          <h1 className="font-display text-2xl text-[var(--ink)]">Soy paciente</h1>
          <p className="mt-2 text-[var(--ink-soft)]">
            Tu psicólogo o psiquiatra te invita con un link. Abrilo en el celular o en la computadora: ahí creás tu
            cuenta o ingresás si ya la tenés. Así quedás vinculado a tu consultorio.
          </p>
        </div>
        <div className="rounded-[var(--radius-input)] border border-[var(--sage)] bg-[var(--sage-soft)] px-4 py-3 text-sm text-[var(--ink-soft)]">
          <p className="font-medium text-[var(--ink)]">¿Todavía no te pasaron el link?</p>
          <p className="mt-1">Pedíselo a tu profesional, con tranquilidad. Es la forma de empezar a usar {APP_NAME}.</p>
        </div>
        <Link to="/ingresar" className="block hover:no-underline">
          <Button variant="secondary" fullWidth>
            Ya tengo cuenta — ingresar
          </Button>
        </Link>
        <p className="text-center text-sm text-[var(--ink-soft)]">
          <Link to="/">Volver al inicio</Link>
        </p>
      </Card>
    </div>
  );
}
