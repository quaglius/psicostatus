import { Link } from 'react-router-dom';
import { Mark } from '@/components/brand/Mark';
import { Button } from '@/components/ui/Button';
import './landing.css';

function Cta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex flex-wrap items-center gap-3'}>
      <Link to="/registro/profesional">
        <Button>Empezar ahora</Button>
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

const FOLDS = [
  {
    title: 'Invitar es un link',
    body: 'Copiás un enlace y se lo pasás por WhatsApp o mail. El paciente entra con Google o correo, pone su nombre y ya puede cargar. El link puede ser reutilizable, de un solo uso, o restringido a un mail: lo simple va primero, lo puntual está ahí si lo necesitás.',
  },
  {
    title: 'Una plantilla por paciente, que puede cambiar',
    body: 'Por defecto: del 0 al 10, tres caritas y un espacio para escribir. Si querés otra cosa, armás campos (texto, fecha, escala, lista) y una periodicidad: todos los días, ciertos días, cada N días o una vez por semana. Cuando cambiás la plantilla, lo ya cargado se conserva tal cual se registró.',
  },
  {
    title: 'La semana se lee de un vistazo',
    body: 'Una cinta de lunes a domingo. El día sin carga queda apagado; el que sí se cargó, encendido. Un reborde marca qué días se esperaba registrar, según la plantilla. Si alguien carga de más en el mismo período, elige actualizar lo anterior o dejar un registro nuevo. Siempre queda la hora real de carga.',
  },
  {
    title: 'Consultorio, grupo o clínica',
    body: 'Un profesional solo, o un equipo. El administrador ve a todos; cada profesional ve a los suyos; hay un rol de solo lectura. Se invita al equipo con un link y un rol. Un paciente puede estar en más de un espacio: cada historial queda con quien corresponde.',
  },
  {
    title: 'Lo que no es',
    body: 'No es historia clínica, no diagnostica y no reemplaza la sesión. Es un cuaderno entre una consulta y la otra. Los datos se tratan como sensibles, según la Ley 25.326.',
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <header className="landing-nav">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between gap-4 px-5 py-3">
          <Link to="/" className="flex items-center gap-2 no-underline hover:no-underline">
            <Mark size={32} />
            <span className="font-display text-lg tracking-tight text-[var(--ink)]">Psicostatus</span>
          </Link>
          <Cta compact />
        </div>
      </header>

      <section className="relative">
        <img
          src="/brand/hero-journal.png"
          alt="Cuaderno abierto sobre un escritorio, con luz de mañana"
          className="landing-hero-img"
        />
        <div className="mx-auto max-w-[720px] px-5 py-12 text-center sm:py-16">
          <p className="mb-3 text-sm tracking-[0.14em] text-[var(--clay)] uppercase">
            Entre una sesión y la otra
          </p>
          <h1 className="font-display text-[2.4rem] leading-[1.15] text-[var(--ink)] sm:text-5xl">
            Cómo se siente tu paciente, día a día — sin pedirle un informe.
          </h1>
          <p className="mx-auto mt-5 max-w-[34rem] text-lg text-[var(--ink-soft)]">
            Un cuaderno digital, calmo, para psicólogos y psiquiatras. El paciente carga en segundos.
            Vos ves el hilo entre consultas.
          </p>
          <div className="mt-8 flex justify-center">
            <Cta />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-16">
        <ol className="grid gap-10 md:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Armás tu espacio',
              d: 'Consultorio, grupo o clínica. En un paso. Ya tenés una plantilla lista: escala, caritas y un renglón para escribir.',
            },
            {
              n: '02',
              t: 'Pasás el link',
              d: 'El paciente se registra solo. Google o mail. Pone su nombre. Empieza a cargar el mismo día.',
            },
            {
              n: '03',
              t: 'Leés la semana',
              d: 'Quién cargó, quién no, qué dijo. Sin tablas densas. Sin gamificar el malestar.',
            },
          ].map((item) => (
            <li key={item.n}>
              <p className="font-display text-sm text-[var(--clay)]">{item.n}</p>
              <h2 className="font-display mt-2 text-2xl">{item.t}</h2>
              <p className="mt-2 text-[var(--ink-soft)]">{item.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-16">
        <img
          src="/brand/week-windows.png"
          alt="Siete ventanas al atardecer, algunas con luz encendida"
          className="landing-break-img"
        />
        <div className="mx-auto mt-10 max-w-[640px]">
          <h2 className="font-display text-3xl">La semana, como una fila de ventanas.</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            Lunes a domingo. Lo gris es silencio; lo encendido, una carga. El reborde dice qué días se esperaba.
            No hay racha, no hay fuego, no hay “seguí así”. Solo presencia.
          </p>
          <div className="landing-week mt-6 max-w-xs" aria-hidden>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
              <span key={d} className={i === 0 || i === 2 || i === 3 ? 'on' : ''}>
                {d}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1080px] items-stretch gap-8 px-5 pb-16 md:grid-cols-2">
        <img
          src="/brand/faces-still.png"
          alt="Tres caras de cerámica sobre lino, junto a un lápiz"
          className="landing-still"
        />
        <div className="flex flex-col justify-center">
          <p className="text-sm tracking-[0.12em] text-[var(--sage)] uppercase">Para el paciente</p>
          <h2 className="font-display mt-2 text-3xl">Un gesto, no un formulario.</h2>
          <p className="mt-3 text-[var(--ink-soft)]">
            Del 0 al 10. Una cara. Si quiere, una frase. Cabe en el teléfono, en el colectivo, después de una
            noche difícil. Lo demás —plantillas, equipo, clínicas— no le aparece. No tiene que entender el
            sistema. Solo cómo está hoy.
          </p>
          <div className="mt-6">
            <Link to="/registro/profesional">
              <Button>Quiero dárselo a mis pacientes</Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[720px] px-5 pb-16">
        <p className="text-sm tracking-[0.12em] text-[var(--clay)] uppercase">Si querés el detalle</p>
        <h2 className="font-display mt-2 mb-2 text-3xl">Qué puede hacer, sin el ruido.</h2>
        <p className="mb-6 text-[var(--ink-soft)]">
          Lo esencial ya está arriba. Acá está el resto, plegado. Abrí solo lo que te interese.
        </p>
        {FOLDS.map((fold) => (
          <details key={fold.title} className="landing-fold">
            <summary>{fold.title}</summary>
            <p className="fold-body">{fold.body}</p>
          </details>
        ))}
      </section>

      <section className="mx-auto max-w-[1080px] px-5 pb-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm tracking-[0.12em] text-[var(--sage)] uppercase">Para el consultorio</p>
            <h2 className="font-display mt-2 text-3xl">Llegás a la sesión con el hilo, no con la amnesia de siete días.</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Una lista aireada. Una ficha. La misma cinta que ve el paciente. El texto que escribió el martes
              a las 21:04. Sirve para el que atiende solo y para la clínica que reparte roles.
            </p>
            <ul className="mt-5 space-y-2 text-[var(--ink-soft)]">
              <li>— Adherencia en un número chico: 4/7, no un gráfico de torta.</li>
              <li>— Equipo: admin, profesional, solo lectura.</li>
              <li>— Historial intacto aunque cambie la plantilla.</li>
            </ul>
            <div className="mt-6">
              <Cta />
            </div>
          </div>
          <img
            src="/brand/consultorio.png"
            alt="Consultorio vacío, dos sillas y un cuaderno sobre la mesa"
            className="landing-still"
          />
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
            Gratis para empezar. Mail o Google. En un par de clics tenés consultorio y plantilla.
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
              <p className="font-display text-lg">Psicostatus</p>
              <p className="max-w-xs text-sm text-[var(--ink-soft)]">
                Herramienta de seguimiento. No es historia clínica ni diagnóstico. El profesional es responsable
                del uso clínico.
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
