import type {
  FieldType,
  PeriodicityType,
  PlatformRole,
  WorkspaceKind,
  WorkspaceMemberRole,
} from '@shared/types';

export const APP_NAME = 'Shanti';
export const APP_NAME_MEANING = 'Shanti significa paz.';

export const WORKSPACE_KIND: Record<WorkspaceKind, { label: string; help: string }> = {
  solo: {
    label: 'Consultorio (una persona)',
    help: 'Atendés vos. Un solo profesional.',
  },
  grupo: {
    label: 'Grupo',
    help: 'Varios profesionales que trabajan juntos.',
  },
  clinica: {
    label: 'Clínica',
    help: 'Un espacio más grande, con roles distintos.',
  },
};

export const MEMBER_ROLE: Record<WorkspaceMemberRole, { label: string; help: string }> = {
  admin: {
    label: 'Administra el espacio',
    help: 'Ve a todos, invita gente y cambia la configuración.',
  },
  professional: {
    label: 'Atiende pacientes',
    help: 'Ve y carga solo las personas que le asignaron.',
  },
  read_only: {
    label: 'Solo puede mirar',
    help: 'Ve información, no puede cambiar nada.',
  },
};

export const PLATFORM_ROLE: Record<PlatformRole, string> = {
  global_admin: 'Administración de la plataforma',
  user: 'Cuenta',
};

export const FIELD_TYPE: Record<FieldType, { label: string; help: string }> = {
  scale: {
    label: 'Escala',
    help: 'El paciente elige un número, por ejemplo del 0 al 10.',
  },
  faces: {
    label: 'Caritas',
    help: 'Elige una cara: triste, regular o bien.',
  },
  short_text: {
    label: 'Texto corto',
    help: 'Una línea, por ejemplo el nombre de un medicamento.',
  },
  long_text: {
    label: 'Texto largo',
    help: 'Un párrafo para contar cómo le fue.',
  },
  date: {
    label: 'Fecha',
    help: 'Elige un día en el calendario.',
  },
  time: {
    label: 'Hora',
    help: 'Elige una hora.',
  },
  datetime: {
    label: 'Fecha y hora',
    help: 'Elige día y hora juntos.',
  },
  number: {
    label: 'Número',
    help: 'Una cantidad, por ejemplo miligramos.',
  },
  select: {
    label: 'Lista para elegir',
    help: 'Elige una opción de una lista que vos armás.',
  },
  yes_no: {
    label: 'Sí / No',
    help: 'El paciente elige Sí o No con dos botones.',
  },
};

export const PERIODICITY: Record<PeriodicityType, { label: string; help: string }> = {
  daily: {
    label: 'Todos los días',
    help: 'Le vamos a pedir una carga por día.',
  },
  weekly: {
    label: 'Una vez por semana',
    help: 'Con una carga en la semana alcanza.',
  },
  every_n_days: {
    label: 'Cada tantos días',
    help: 'Por ejemplo cada 3 días. Vos elegís cada cuánto.',
  },
  weekdays: {
    label: 'Días puntuales',
    help: 'Elegís qué días de la semana (lunes, miércoles, etc.).',
  },
};

export const FACE_LABELS: Record<string, string> = {
  sad: 'Triste',
  ok: 'Regular',
  happy: 'Bien',
};

export const WEEKDAY_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;
export const WEEKDAY_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;

export function adherenceCopy(filled: number, expected: number): string {
  if (expected <= 0) return 'Todavía no hay días esperados.';
  if (filled === 0) return `No cargó ninguno de los ${expected} días que se esperaban.`;
  if (filled >= expected) return `Cargó todos los días que se esperaban (${filled} de ${expected}).`;
  return `Cargó ${filled} de ${expected} días esta semana.`;
}
