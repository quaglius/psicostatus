import {
  AlignLeft,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Clock,
  Gauge,
  Hash,
  List,
  Repeat,
  Smile,
  Sun,
  Type,
  type LucideIcon,
} from 'lucide-react';
import type { FieldType, PeriodicityType } from '@shared/types';

export const FIELD_ICONS: Record<FieldType, LucideIcon> = {
  scale: Gauge,
  faces: Smile,
  short_text: Type,
  long_text: AlignLeft,
  date: Calendar,
  time: Clock,
  datetime: CalendarClock,
  number: Hash,
  select: List,
  yes_no: CheckSquare,
};

export const PERIODICITY_ICONS: Record<PeriodicityType, LucideIcon> = {
  daily: Sun,
  weekly: CalendarDays,
  every_n_days: Repeat,
  weekdays: CalendarCheck,
};

export function FieldTypeIcon({ type, size = 18 }: { type: FieldType; size?: number }) {
  const Icon = FIELD_ICONS[type];
  return <Icon size={size} aria-hidden className="shrink-0 text-[var(--sage)]" />;
}

export function PeriodicityIcon({ type, size = 18 }: { type: PeriodicityType; size?: number }) {
  const Icon = PERIODICITY_ICONS[type];
  return <Icon size={size} aria-hidden className="shrink-0 text-[var(--sage)]" />;
}
