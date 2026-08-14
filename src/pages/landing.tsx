import { Link } from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  Link2,
  MessageSquare,
  Monitor,
  Smartphone,
  Users,
} from 'lucide-react';
import { Mark } from '@/components/brand/Mark';
import { Button } from '@/components/ui/Button';
import { FieldTypeIcon, PeriodicityIcon } from '@/lib/field-icons';
import { APP_NAME, APP_NAME_MEANING, FIELD_TYPE, PERIODICITY } from '@/lib/labels';
import { useAuth } from '@/contexts/AuthContext';
import { appHomePath, sessionLabel } from '@/lib/session';
import type { FieldType, PeriodicityType } from '@shared/types';
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
      <Link to="/paciente">
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

function AccountButtons() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link to="/registro/profesional">
        <Button>Crear mi espacio</Button>
      </Link>
      <Link to="/ingresar">
        <Button variant="ghost">Ya tengo cuenta</Button>
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
          Hola de nuevo, {sessionLabel(me, firebaseUser.email)}. Podés seguir desde acá.
        </p>
        <Link to={appHomePath(me)}>
          <Button>{patient ? 'Ir a mi carga de hoy' : 'Ir a mi consultorio'}</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <AccountButtons />
      <div className="rounded-[var(--radius-card)] border border-[var(--sage)] bg-[var(--sage-soft)] px-4 py-3">
        <p className="font-medium">Si sos paciente</p>
        <p className="text-sm text-[var(--ink-soft)]">
          Tu profesional te invita con un link: ahí creás tu cuenta o ingresás si ya la tenés. Así quedás vinculado a tu
          consultorio. Si todavía no te lo pasó, pedíselo con tranquilidad.
        </p>
        <Link to="/paciente" className="mt-2 inline-block">
          <Button variant="secondary">Cómo entro como paciente</Button>
        </Link>
      </div>
    </div>
  );
}

function BottomCta() {
  const { firebaseUser, me, loading } = useAuth();
  if (loading) return null;
  if (firebaseUser) {
    return (
      <Link to={appHomePath(me)}>
        <Button>Entrar a mi cuenta</Button>
      </Link>
    );
  }
  return (
    <div className="flex flex-col items-center gap-4">
      <AccountButtons />
      <p className="text-sm text-[var(--ink-soft)]">
        ¿Sos paciente?{' '}
        <Link to="/paciente" className="text-[var(--sage)]">
          Entrá con el link de tu profesional
        </Link>
        .
      </p>
    </div>
  );
}

const PRO_CAPABILITIES = [
  {
    icon: ClipboardList,
    title: 'Plantillas a medida',
    body: 'Armás el formulario: ánimo, medicación, sueño, lo que haga falta. Podés tener varias y cambiarlas cuando quieras. Lo ya cargado se conserva.',
  },
  {
    icon: CalendarDays,
    title: 'Cada cuánto se carga',
    body: 'Todos los días, una vez por semana, cada tantos días o días puntuales. Vos elegís el ritmo de cada cuestionario.',
  },
  {
    icon: Link2,
    title: 'Invitar con un link',
    body: 'Lo copiás y lo mandás por WhatsApp o mail. La persona crea su cuenta ahí y queda vinculada a tu espacio. Sin listas para cargar a mano.',
  },
  {
    icon: BarChart3,
    title: 'Tablero y reportería',
    body: 'Ves quién cargó, quién no, y gráficos según el tipo de pregunta. Filtrás por persona o plantilla y, si hace falta, descargás un CSV.',
  },
  {
    icon: MessageSquare,
    title: 'Ficha completa, con notas tuyas',
    body: 'En cada carga ves las respuestas enteras. Podés dejar un comentario privado: queda en el historial y la persona no lo ve.',
  },
  {
    icon: Users,
    title: 'Solo, en grupo o en clínica',
    body: 'Si trabajás con colegas, los invitás con roles: quien administra, quien atiende, o quien solo mira. Cada uno ve lo que le corresponde.',
  },
];

const WEEK_DEMO = [
  { d: 'Lun', n: '10', state: 'filled' },
  { d: 'Mar', n: '11', state: 'missed' },
  { d: 'Mié', n: '12', state: 'filled' },
  { d: 'Jue', n: '13', state: 'today' },
  { d: 'Vie', n: '14', state: 'future' },
  { d: 'Sáb', n: '15', state: 'future' },
  { d: 'Dom', n: '16', state: 'future' },
] as const;

const FAQ = [
  {
    q: '¿Qué es Shanti?',
    a: 'Una herramienta web para el seguimiento entre sesiones. La persona responde en el teléfono; el profesional ve el tablero en la computadora. Sirve para ánimo, medicación, notas y lo que armes en la plantilla.',
  },
  {
    q: '¿Qué puede hacer el profesional?',
    a: 'Crear el espacio, armar plantillas, invitar con un link, ver quién cargó, leer el historial completo, dejar notas privadas, mirar gráficos, descargar CSV y, si hay equipo, sumar colegas con distintos roles.',
  },
  {
    q: '¿Cómo entro si soy paciente?',
    a: 'Con el link que te manda tu profesional. Ahí creás la cuenta o ingresás si ya la tenés. Si todavía no te lo pasó, pedíselo: es la forma de quedar vinculado a tu consultorio.',
  },
  {
    q: '¿Reemplaza la historia clínica?',
    a: 'No. Es un complemento para el seguimiento cotidiano, no una historia clínica ni un diagnóstico. El uso clínico queda a cargo del profesional.',
  },
  {
    q: '¿Puedo usar una plantilla distinta para cada persona?',
    a: 'Sí. Hay una plantilla por defecto para quienes se suman y para las personas activas, y en la ficha de cada una podés elegir otro cuestionario.',
  },
  {
    q: '¿Cuánto cuesta?',
    a: 'Es gratis para empezar. Te registrás con mail o Google, en unos minutos tenés consultorio y un formulario listo para compartir.',
  },
];

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
            <p className="mb-3 text-sm tracking-[0.14em] text-[var(--clay)] uppercase">Seguimiento entre sesiones</p>
            <h1 className="font-display text-[2.2rem] leading-[1.15] text-[var(--ink)] sm:text-5xl">
              Cómo viene cada persona, día a día. Con calma.
            </h1>
            <p className="mt-5 text-lg text-[var(--ink-soft)]">
              {APP_NAME} es para psicólogos y psiquiatras: armás las preguntas, invitás con un link y ves las respuestas
              en el tablero, antes de la sesión. Si sos paciente, tu profesional te invita: abrís ese link y listo.
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
          <h2 className="font-display mb-3 text-3xl">Qué podés hacer como profesional</h2>
          <p className="mb-8 max-w-2xl text-[var(--ink-soft)]">
            Un espacio para el consultorio: formularios, invitaciones, historial y una mirada de conjunto. Sin jerga y
            sin que tengas que armar una planilla a mano.
          </p>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PRO_CAPABILITIES.map((item) => (
              <li
                key={item.title}
                className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <item.icon className="mb-3 text-[var(--clay)]" size={22} aria-hidden />
                <p className="font-display text-xl">{item.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 pb-16">
          <h2 className="font-display mb-3 text-3xl">Las preguntas las armás vos</h2>
          <p className="mb-6 max-w-2xl text-[var(--ink-soft)]">
            No es un formulario fijo. Elegís el tipo de cada pregunta y cómo se la mostramos a la persona. Estos son los
            que hay hoy:
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {(Object.keys(FIELD_TYPE) as FieldType[]).map((type) => (
              <li
                key={type}
                className="rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-3"
              >
                <p className="flex items-center gap-2 text-sm font-medium">
                  <FieldTypeIcon type={type} size={16} />
                  {FIELD_TYPE[type].label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--ink-soft)]">{FIELD_TYPE[type].help}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <p className="mb-3 text-sm font-medium">Y cada cuánto se pide una carga</p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(Object.keys(PERIODICITY) as PeriodicityType[]).map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-3"
                >
                  <PeriodicityIcon type={p} size={16} />
                  <div>
                    <p className="text-sm font-medium">{PERIODICITY[p].label}</p>
                    <p className="text-xs leading-relaxed text-[var(--ink-soft)]">{PERIODICITY[p].help}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto grid max-w-[1080px] items-center gap-8 px-5 pb-16 md:grid-cols-2">
          <img
            src="/brand/paciente-carga.png"
            alt="Una persona completando el registro del día en el teléfono, en su casa"
            className="landing-still"
          />
          <div>
            <Smartphone className="mb-3 text-[var(--sage)]" />
            <p className="text-sm tracking-[0.12em] text-[var(--sage)] uppercase">Si sos paciente</p>
            <h2 className="font-display mt-2 text-3xl">Unos minutos en el celular, cuando puedas.</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              Tu profesional te manda un link. Lo abrís, creás tu cuenta (o ingresás si ya la tenés) y respondés lo que te
              pidió: a veces una carita, a veces un sí o un no, a veces una nota. También podés mirar tu historial.
            </p>
            <p className="mt-3 text-[var(--ink-soft)]">
              Si no tenés el link todavía, pedíselo. No hay una inscripción abierta: es a propósito, para que tu carga
              quede en el consultorio correcto.
            </p>
            <div className="mt-5">
              <Link to="/paciente">
                <Button variant="secondary">Cómo entro como paciente</Button>
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
            <p className="text-sm tracking-[0.12em] text-[var(--sage)] uppercase">En el consultorio</p>
            <h2 className="font-display mt-2 text-3xl">Llegás a la sesión con contexto.</h2>
            <p className="mt-3 text-[var(--ink-soft)]">
              En el tablero ves el conjunto: cuántas cargas hubo, quién hace unos días que no responde, gráficos calmos.
              En la ficha, la semana día por día y cada respuesta completa.
            </p>
            <p className="mt-3 text-[var(--ink-soft)]">
              Si alguien necesita otro cuestionario, lo cambiás en su ficha. Si trabajás con un equipo, cada colega entra
              con el rol que le diste.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 pb-16">
          <h2 className="font-display mb-8 text-3xl">Cómo se empieza</h2>
          <ol className="grid gap-10 md:grid-cols-3">
            {[
              {
                n: '01',
                t: 'Armás el espacio',
                d: 'Le ponés nombre al consultorio. Ya hay un formulario listo, y podés crear otros: qué preguntar, cada cuánto, y cuál reciben las personas nuevas.',
              },
              {
                n: '02',
                t: 'Compartís un link',
                d: 'Lo mandás por WhatsApp o mail. Si es la primera vez, la persona crea cuenta ahí. Si ya tiene, entra con la misma. Vos también podés invitar colegas.',
              },
              {
                n: '03',
                t: 'Cada quien ve lo suyo',
                d: 'La persona carga el día en el teléfono y puede mirar su historial. Vos ves la lista, la semana, los gráficos y el texto entero, para llegar a la sesión con más contexto.',
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

        <section className="mx-auto max-w-[640px] px-5 pb-16">
          <h2 className="font-display text-center text-3xl">La semana, de un vistazo</h2>
          <p className="mt-3 text-center text-[var(--ink-soft)]">
            De lunes a domingo, con el número del día. Tocás un día para leerlo entero. Si faltaba una carga, se puede
            completar.
          </p>
          <div className="landing-week mx-auto mt-6 max-w-md" aria-hidden>
            {WEEK_DEMO.map((day) => (
              <span key={day.d} className={`landing-week-day is-${day.state}`}>
                <em>{day.d}</em>
                <strong>{day.n}</strong>
                {day.state === 'filled' ? <Check size={14} strokeWidth={2.5} /> : <i />}
              </span>
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
            <li className="flex items-center gap-1">
              <Check size={12} className="text-[var(--sage)]" /> Ya cargó
            </li>
            <li className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--clay)]" /> Faltó cargar
            </li>
            <li className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--clay)]" /> Hoy
            </li>
            <li className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--empty)]" /> Todavía no toca
            </li>
          </ul>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 pb-20">
          <div className="landing-cta-band px-6 py-12 text-center sm:px-12">
            <h2 className="font-display text-3xl sm:text-4xl">
              Cuando quieras, armá tu espacio.
              <br />
              El primer paciente entra con un link.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[var(--ink-soft)]">
              Gratis para empezar. Mail o Google. En unos minutos tenés consultorio y un cuestionario para compartir.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <BottomCta />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1080px] px-5 pb-20" aria-labelledby="faq-title">
          <h2 id="faq-title" className="font-display mb-4 text-3xl">
            Preguntas frecuentes
          </h2>
          <div className="landing-fold-list">
            {FAQ.map((item) => (
              <details key={item.q} className="landing-fold">
                <summary>{item.q}</summary>
                <p className="fold-body">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--line)] px-5 py-10">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-3">
            <Mark size={28} />
            <div>
              <p className="font-display text-lg">{APP_NAME}</p>
              <p className="max-w-xs text-sm text-[var(--ink-soft)]">
                {APP_NAME_MEANING} Herramienta de seguimiento para psicólogos y psiquiatras. Complementa la consulta: no
                es historia clínica ni diagnóstico.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 text-sm text-[var(--ink-soft)]">
            <Link to="/privacidad">Privacidad</Link>
            <Link to="/terminos">Términos</Link>
            <Link to="/paciente">Soy paciente</Link>
            <Link to="/registro/profesional">Soy profesional</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
