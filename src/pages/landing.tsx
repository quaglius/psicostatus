import { Link } from 'react-router-dom';
import { ClipboardList, Heart, Pill, Smartphone, Monitor } from 'lucide-react';
import { Mark } from '@/components/brand/Mark';
import { Button } from '@/components/ui/Button';
import { APP_NAME, APP_NAME_MEANING } from '@/lib/labels';
import './landing.css';

function Cta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-wrap items-center gap-3'}>
      <Link to="/registro/profesional">
        <Button>Crear mi espacio</Button>
      </Link>
      {!compact ? (
        <Link to="/ingresar">
          <Button variant="ghost">Ya tengo cuenta</Button>
        </Link>
      ) : (
        <Link to="/ingresar" className="hidden text-sm text-[var(--ink-soft)] sm:inline">
          Ingresar
        </Link>
      )}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="landing-nav">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-2 no-underline hover:no-underline">
            <Mark size={32} />
            <span className="font-display text-lg tracking-tight text-[var(--ink)]">{APP_NAME}</span>
          </Link>
          <Cta compact />
        </div>
      </header>

      <section className="mx-auto grid max-w-[1080px] items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-16">
        <div>
          <p className="mb-3 text-sm tracking-[0.14em] text-[var(--clay)] uppercase">Para psicólogos y psiquiatras</p>
          <h1 className="font-display text-[2.4rem] leading-[1.15] text-[var(--ink)] sm:text-5xl">
            Cómo viene tu paciente, día a día — sin pedirle un informe.
          </h1>
          <p className="mt-5 text-lg text-[var(--ink-soft)]">
            El paciente anota en el teléfono el ánimo, si tomó la medicación y cualquier nota del día. Vos lo ves en la
            computadora, de lo general a lo particular, antes de la sesión.
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{APP_NAME_MEANING}</p>
          <div className="mt-8">
            <Cta />
          </div>
        </div>
        <img
          src="/brand/phone-hoy.png"
          alt="Un teléfono con la pantalla de carga diaria: caritas y una pregunta de cómo se siente"
          className="landing-still"
        />
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-16">
        <h2 className="font-display mb-6 text-3xl">Qué puede cargar el paciente</h2>
        <ul className="grid gap-6 md:grid-cols-3">
          <li className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <Heart className="mb-3 text-[var(--clay)]" />
            <p className="font-display text-xl">Ánimo</p>
            <p className="mt-1 text-[var(--ink-soft)]">Una escala del 0 al 10 y una carita. Cómo se siente hoy, en segundos.</p>
          </li>
          <li className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <Pill className="mb-3 text-[var(--clay)]" />
            <p className="font-display text-xl">Medicación</p>
            <p className="mt-1 text-[var(--ink-soft)]">Sí, no, o no corresponde. Para el seguimiento entre consultas.</p>
          </li>
          <li className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5">
            <ClipboardList className="mb-3 text-[var(--clay)]" />
            <p className="font-display text-xl">Notas del día</p>
            <p className="mt-1 text-[var(--ink-soft)]">Lo que quiera dejar escrito. Un renglón o un párrafo. Opcional.</p>
          </li>
        </ul>
      </section>

      <section className="mx-auto grid max-w-[1080px] items-center gap-8 px-5 pb-16 md:grid-cols-2">
        <img
          src="/brand/paciente-carga.png"
          alt="Una persona completando el registro del día en el teléfono, en su casa"
          className="landing-still"
        />
        <div>
          <Smartphone className="mb-3 text-[var(--sage)]" />
          <p className="text-sm tracking-[0.12em] text-[var(--sage)] uppercase">Para el paciente</p>
          <h2 className="font-display mt-2 text-3xl">Tres toques y listo.</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            No tiene que entender el sistema. Abre el link, crea cuenta o entra, y carga el día. Cabe en el colectivo,
            después de una noche difícil, o a la mañana con el café.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1080px] items-center gap-8 px-5 pb-16 md:grid-cols-2">
        <div className="md:order-2">
          <img
            src="/brand/profesional-escritorio.png"
            alt="Un profesional de salud mental frente a la computadora, viendo el tablero de sus pacientes"
            className="landing-still"
          />
        </div>
        <div>
          <Monitor className="mb-3 text-[var(--sage)]" />
          <p className="text-sm tracking-[0.12em] text-[var(--sage)] uppercase">Para el consultorio</p>
          <h2 className="font-display mt-2 text-3xl">Entrá a la sesión sabiendo cómo viene.</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            Lista de pacientes, quién cargó y quién no, gráficos calmos y la ficha completa: todo el texto, no un recorte.
            Sirve si atendés solo o si hay un equipo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-16">
        <h2 className="font-display mb-8 text-3xl">Cómo se usa</h2>
        <ol className="grid gap-10 md:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Armás tu espacio',
              d: 'Le ponés un nombre. Consultorio, grupo o clínica. Ya hay un cuestionario listo: ánimo, medicación y notas.',
            },
            {
              n: '02',
              t: 'Le pasás un link',
              d: 'Lo copiás y lo mandás por WhatsApp o mail. La persona crea cuenta o entra. Pone su nombre. Empieza el mismo día.',
            },
            {
              n: '03',
              t: 'Ves la semana',
              d: 'Quién cargó, quién no, qué dijo. Números y gráficos para vos. El paciente solo ve su día.',
            },
          ].map((item) => (
            <li key={item.n}>
              <p className="font-display text-sm text-[var(--clay)]">{item.n}</p>
              <h3 className="font-display mt-2 text-2xl">{item.t}</h3>
              <p className="mt-2 text-[var(--ink-soft)]">{item.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[640px] px-5 pb-16 text-center">
        <h2 className="font-display text-3xl">La semana, de un vistazo</h2>
        <p className="mt-3 text-[var(--ink-soft)]">
          Lun a Dom. La tilde es “ya cargó”. El círculo vacío es “se esperaba y no llegó”. Tocás un día y leés todo.
        </p>
        <div className="landing-week mx-auto mt-6 max-w-md" aria-hidden>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d, i) => (
            <span key={d} className={i === 0 || i === 2 || i === 3 ? 'on' : ''}>
              {d}
            </span>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-20">
        <div className="landing-cta-band px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-3xl sm:text-4xl">
            Armá el espacio hoy.
            <br />
            El primer paciente entra con un link.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[var(--ink-soft)]">
            Gratis para empezar. Mail o Google. En un par de clics tenés consultorio y cuestionario.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/registro/profesional">
              <Button>Crear mi espacio</Button>
            </Link>
          </div>
          <p className="mt-4 text-sm">
            ¿Te invitaron?{' '}
            <Link to="/ingresar" className="text-[var(--ink)] underline decoration-[var(--clay)] underline-offset-4">
              Entrá por acá
            </Link>
          </p>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-5 py-10">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <Mark size={28} />
            <div>
              <p className="font-display text-lg">{APP_NAME}</p>
              <p className="max-w-xs text-sm text-[var(--ink-soft)]">
                {APP_NAME_MEANING} Herramienta de seguimiento para psicólogos y psiquiatras. No es historia clínica ni
                diagnóstico. El profesional es responsable del uso clínico.
              </p>
            </div>
          </div>
          <div className="flex gap-5 text-sm text-[var(--ink-soft)]">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <Link to="/registro/profesional">Empezar</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
