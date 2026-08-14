export const TOUR_PRO = 'pro';
export const TOUR_TEMPLATES = 'templates';

export interface TourStep {
  selector: string;
  title: string;
  body: string;
  path: string;
}

export const PRO_TOUR_STEPS: TourStep[] = [
  {
    path: '/pro/espacio',
    selector: '[data-tour="espacio-tablero"]',
    title: 'Este es tu espacio',
    body: 'Acá ves el tablero del consultorio: cómo viene el grupo, y atajos a pacientes, plantillas y equipo.',
  },
  {
    path: '/pro/espacio',
    selector: '[data-tour="nav-pacientes"]',
    title: 'Pacientes',
    body: 'Ahí está la lista de quienes invitaste. El siguiente paso te lleva a esa pantalla.',
  },
  {
    path: '/pro/pacientes',
    selector: '[data-tour="invite-link"]',
    title: 'Cómo invitar',
    body: 'Copiá este link y mandalo por WhatsApp o mail. Si es alguien nuevo, se registra y empieza a cargar. Si ya tiene cuenta, entra sin registrarse otra vez.',
  },
  {
    path: '/pro/pacientes',
    selector: '[data-tour="patient-list"]',
    title: 'Ver a tus pacientes',
    body: 'Cuando acepten el link, aparecen acá. Tocá una ficha para ver cargas y reportería. Podés activar o desactivar a alguien, y filtrar para ver solo los activos.',
  },
  {
    path: '/pro/pacientes',
    selector: '[data-tour="nav-plantillas"]',
    title: 'Después, las plantillas',
    body: 'En Plantillas armás el formulario que completa el paciente. La primera vez que entres, te mostramos otro recorrido corto.',
  },
];

export const TEMPLATES_TOUR_STEPS: TourStep[] = [
  {
    path: '/pro/plantillas',
    selector: '[data-tour="templates-intro"]',
    title: 'Qué es una plantilla',
    body: 'Es el formulario del paciente: ánimo, medicación, notas, lo que armes. Vos definís las preguntas y cada cuánto se las pedimos.',
  },
  {
    path: '/pro/plantillas',
    selector: '[data-tour="templates-new"]',
    title: 'Crear la tuya',
    body: 'Podés crear formularios propios: escala, caritas, texto, fecha, lista. Elegís si es todos los días, una vez por semana, cada tantos días o días puntuales.',
  },
  {
    path: '/pro/plantillas',
    selector: '[data-tour="templates-default"]',
    title: 'Plantilla por defecto',
    body: 'Con “Usar por defecto”, los pacientes nuevos reciben esa plantilla al aceptar el link.',
  },
  {
    path: '/pro/plantillas',
    selector: '[data-tour="templates-list"]',
    title: 'Varias plantillas',
    body: 'Podés tener más de una. Tocá una para editarla. Lo que ya cargaron no se borra: el cambio vale para adelante.',
  },
  {
    path: '/pro/plantillas',
    selector: '[data-tour="templates-per-patient"]',
    title: 'Una por persona',
    body: 'En la ficha de cada paciente, en “Cambiar el cuestionario”, elegís qué plantilla usa esa persona. No hace falta que todos usen la misma.',
  },
];

export function tourStorageKey(tourId: string, userId: string) {
  return `shanti.tour.${tourId}.${userId}`;
}

export function isTourDone(tourId: string, userId: string) {
  try {
    return localStorage.getItem(tourStorageKey(tourId, userId)) === 'done';
  } catch {
    return true;
  }
}

export function markTourDone(tourId: string, userId: string) {
  try {
    localStorage.setItem(tourStorageKey(tourId, userId), 'done');
  } catch {
    /* ignore */
  }
}
