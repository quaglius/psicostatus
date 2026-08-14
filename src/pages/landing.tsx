import { Link } from 'react-router-dom';
import { ClipboardList, Heart, Pill, Smartphone, Monitor } from 'lucide-react';
import { Mark } from '@/components/brand/Mark';
import { Button } from '@/components/ui/Button';
import { APP_NAME, APP_NAME_MEANING } from '@/lib/labels';
import { useAuth } from '@/contexts/AuthContext';
import { appHomePath, sessionLabel } from '@/lib/session';
import './landing.css';

function HeaderCta() {
  const { firebaseUser, me, loading, logout } = useAuth();
  if (loading) return <span className="text-sm text-[var(--ink-soft)]">Cargando...</span>;
  if (firebaseUser) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden text-sm text-[var(--ink-soft)] sm:inline">Hola, {sessionLabel(me, firebaseUser.email)}</span>
        <Link to={appHomePath(me)}>
          <Button>Entrar a mi cuenta</Button>
        </Link>
        <button type="button" className="text-sm text-[var(--ink-soft)]" onClick={() => void logout()}>
          Salir
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to="/ingresar">
        <Button variant="secondary">Soy paciente</Button>
      </Link>
      <Link to="/registro/profesional" className="hidden sm:inline">
        <Button>Soy profesional</Button>
      </Link>
      <Link to="/ingresar" className="text-sm text-[var(--ink-soft)] sm:hidden">
        Ingresar
      </Link>
    </div>
  );
}

function HeroCta() {
  const { firebaseUser, me, loading } = useAuth();
  if (loading) return null;
  if (firebaseUser) {
    const patient = Boolean(me?.patientMemberships.length);
    return (
      <div className="space-y-3">
        <p className="text-[var(--ink-soft)]">
          Ya estás dentro, {sessionLabel(me, firebaseUser.email)}. No hace falta volver a ingresar.
        </p>
        <Link to={appHomePath(me)}>
          <Button>{patient ? 'Cargar cómo estoy hoy' : 'Ir a mi consultorio'}</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/registro/profesional">
          <Button>Crear mi espacio</Button>
        </Link>
        <Link to="/ingresar">
          <Button variant="ghost">Ya tengo cuenta</Button>
        </Link>
      </div>
      <div className="rounded-[var(--radius-card)] border border-[var(--sage)] bg-[var(--sage-soft)] px-4 py-3">
        <p className="font-medium">¿Sos paciente?</p>
        <p className="text-sm text-[var(--ink-soft)]">
          Si tu profesional te pasó un link, abrilo. Si ya te registraste, tocá ingresar: te reconocemos y no te pedimos la clave de nuevo.
        </p>
        <Link to="/ingresar" className="mt-2 inline-block">
          <Button variant="secondary">Ingresar como paciente</Button>
        </Link>
      </div>
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
          <HeaderCta />
        </div>
      </header>

      <main>
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
            <HeroCta />
          </div>
        </div>
        <img
          src="/brand/phone-hoy.png"
          alt="Un teléfono con la pantalla de carga diaria: caritas y una pregunta de cómo se siente"
          className="landing-still"
        />
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-16">
        <h2 className="font-display mb-3 text-3xl">Qué puede cargar el paciente</h2>
        <p className="mb-8 max-w-2xl text-[var(--ink-soft)]">
          El profesional arma plantillas: formularios que se pueden cambiar. Preguntas, cada cuánto se pide una carga, y una nota de ayuda si hace falta. Por ejemplo, una plantilla puede incluir cosas como estas:
        </p>
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
          <div className="mt-5">
            <Link to="/ingresar">
              <Button variant="secondary">Ingresar como paciente</Button>
            </Link>
          </div>
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
              t: 'El profesional arma el espacio',
              d: 'Le pone un nombre al consultorio. Ya hay un formulario listo, y se puede crear otros: cada cuánto cargar, qué preguntar, y cuál usan las personas nuevas.',
            },
            {
              n: '02',
              t: 'Se comparte un link',
              d: 'Se copia y se manda por WhatsApp o mail. Si es la primera vez, la persona crea cuenta. Si ya tiene, entra con la misma. El profesional que abre su propio link vuelve a su espacio.',
            },
            {
              n: '03',
              t: 'Cada quien ve lo suyo',
              d: 'El paciente carga el día en el teléfono y puede mirar su historial. El profesional ve la lista, la cinta de la semana, gráficos y el texto completo, para llegar a la sesión con contexto.',
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
          De lunes a domingo, con el número del día. La tilde marca que ese día ya hay una carga. El círculo vacío, que se esperaba y no llegó. El anillo señala el día de hoy. Se toca un día para leerlo entero —sin recortes— y, si faltaba, se puede completar.
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
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <HeroCta />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-20" aria-labelledby="faq-title">
        <h2 id="faq-title" className="font-display mb-8 text-3xl">Preguntas frecuentes</h2>
        <dl className="grid gap-6 md:grid-cols-3">
          <div>
            <dt className="font-display text-xl">¿Qué es Shanti?</dt>
            <dd className="mt-2 text-[var(--ink-soft)]">
              Una herramienta web de seguimiento diario para psicólogos y psiquiatras. El paciente anota cómo está; vos
              lo ves en el tablero antes de la sesión.
            </dd>
          </div>
          <div>
            <dt className="font-display text-xl">¿Reemplaza la historia clínica?</dt>
            <dd className="mt-2 text-[var(--ink-soft)]">
              No. No es historia clínica ni diagnóstico. El profesional es responsable del uso clínico.
            </dd>
          </div>
          <div>
            <dt className="font-display text-xl">¿Cómo entra el paciente?</dt>
            <dd className="mt-2 text-[var(--ink-soft)]">
              Compartís un link. Si es la primera vez, crea cuenta. Si ya tiene, entra con la misma y no le pedimos la
              clave de nuevo si ya está en el teléfono.
            </dd>
          </div>
        </dl>
      </section>
      </main>

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
          <div className="flex flex-wrap gap-5 text-sm text-[var(--ink-soft)]">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <Link to="/ingresar">Soy paciente</Link>
            <Link to="/registro/profesional">Soy profesional</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
