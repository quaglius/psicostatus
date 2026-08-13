import { Card } from '@/components/ui/Card';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display mb-6 text-3xl">Política de privacidad</h1>
        <Card className="prose space-y-4 text-[var(--ink-soft)]">
          <p>
            Psicostatus trata datos personales y datos sensibles relacionados con el bienestar emocional de
            acuerdo con la Ley 25.326 de Protección de Datos Personales (Argentina).
          </p>
          <p>
            Los datos son utilizados exclusivamente para permitir el seguimiento entre pacientes y sus
            profesionales de salud mental. No vendemos ni compartimos datos con terceros con fines comerciales.
          </p>
          <p>
            Responsable: daniel.quagliano@gmail.com. Podés solicitar acceso, rectificación o eliminación de tus
            datos escribiendo a ese correo.
          </p>
          <p>Esta herramienta no constituye historia clínica ni dispositivo médico.</p>
        </Card>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display mb-6 text-3xl">Términos de uso</h1>
        <Card className="space-y-4 text-[var(--ink-soft)]">
          <p>
            Psicostatus es una herramienta de seguimiento subjetivo del estado de ánimo y bienestar. No
            reemplaza la consulta profesional ni constituye diagnóstico o tratamiento médico.
          </p>
          <p>
            Los profesionales son responsables del uso clínico de la información registrada por sus pacientes.
          </p>
          <p>
            Al usar la plataforma, aceptás que tus datos serán procesados según nuestra política de privacidad.
          </p>
        </Card>
      </div>
    </div>
  );
}
