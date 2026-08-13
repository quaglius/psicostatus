import type { PeriodicityConfig, PeriodicityType } from './types';

const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export function todayInAR(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function getWeekDays(fromDate: Date): Array<{ date: string; label: string; dayIndex: number }> {
  const monday = startOfWeekMonday(fromDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i);
    return {
      date: formatDateISO(d),
      label: DAY_LABELS[i],
      dayIndex: i === 6 ? 0 : i + 1,
    };
  });
}

export function isFutureDate(iso: string, today = formatDateISO(new Date())): boolean {
  return iso > today;
}

export function daysBetween(from: string, to: string): number {
  const a = parseISODate(from);
  const b = parseISODate(to);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function computePeriodKey(
  periodicityType: PeriodicityType,
  entryDate: string,
  config: PeriodicityConfig,
  assignmentStartsAt: string,
): string {
  switch (periodicityType) {
    case 'daily':
      return `daily:${entryDate}`;
    case 'weekly':
      return `weekly:${getISOWeek(parseISODate(entryDate))}`;
    case 'weekdays':
      return `weekdays:${entryDate}`;
    case 'every_n_days': {
      const n = config.n ?? 2;
      const diff = daysBetween(assignmentStartsAt, entryDate);
      const anchorDiff = diff >= 0 ? Math.floor(diff / n) * n : 0;
      const anchor = formatDateISO(addDays(parseISODate(assignmentStartsAt), anchorDiff));
      return `every_n_days:${anchor}`;
    }
    default:
      return `daily:${entryDate}`;
  }
}

export function isExpectedDay(
  periodicityType: PeriodicityType,
  dateIso: string,
  config: PeriodicityConfig,
  assignmentStartsAt: string,
): boolean {
  if (dateIso < assignmentStartsAt) return false;
  const date = parseISODate(dateIso);
  const jsDay = date.getDay();

  switch (periodicityType) {
    case 'daily':
      return true;
    case 'weekly':
      return true;
    case 'weekdays': {
      const weekdays = config.weekdays ?? [1, 2, 3, 4, 5];
      return weekdays.includes(jsDay);
    }
    case 'every_n_days': {
      const n = config.n ?? 2;
      const diff = daysBetween(assignmentStartsAt, dateIso);
      return diff >= 0 && diff % n === 0;
    }
    default:
      return true;
  }
}

export function formatEntryPreview(values: Record<string, unknown>): string {
  if (values.fld_faces) {
    const map: Record<string, string> = { sad: 'Triste', ok: 'Regular', happy: 'Bien' };
    return map[String(values.fld_faces)] ?? String(values.fld_faces);
  }
  if (values.fld_mood_scale !== undefined) {
    return `${values.fld_mood_scale}/10`;
  }
  const note = values.fld_note;
  if (note) return String(note).slice(0, 60);
  const first = Object.values(values).find((v) => v !== null && v !== undefined && v !== '');
  return first ? String(first).slice(0, 60) : 'Registro';
}

export function formatDateTimeAR(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateAR(iso: string): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function computeAdherence(
  periodicityType: PeriodicityType,
  config: PeriodicityConfig,
  assignmentStartsAt: string,
  filledDates: Set<string>,
  windowDays = 7,
): { expected: number; filled: number } {
  const today = formatDateISO(new Date());
  let expected = 0;
  let filled = 0;

  if (periodicityType === 'weekly') {
    const weekDays = getWeekDays(parseISODate(today));
    const weekDates = weekDays.map((d) => d.date);
    const hasAny = weekDates.some((d) => filledDates.has(d));
    return { expected: 1, filled: hasAny ? 1 : 0 };
  }

  for (let i = windowDays - 1; i >= 0; i--) {
    const d = formatDateISO(addDays(parseISODate(today), -i));
    if (isExpectedDay(periodicityType, d, config, assignmentStartsAt)) {
      expected++;
      if (filledDates.has(d)) filled++;
    }
  }
  return { expected, filled };
}
