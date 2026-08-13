import { Check } from 'lucide-react';
import type { PeriodicityType, WeekDayInfo } from '@shared/types';
import { formatDateAR, parseISODate } from '@shared/periodicity';

interface WeekStripProps {
  days: WeekDayInfo[];
  periodicityType: PeriodicityType;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  showLegend?: boolean;
}

function dayNumber(iso: string): string {
  return String(parseISODate(iso).getDate());
}

export function WeekStrip({ days, selectedDate, onSelectDate, showLegend = true }: WeekStripProps) {
  const first = days[0]?.date;
  const last = days[6]?.date;
  const range =
    first && last
      ? `${parseISODate(first).getDate()} al ${parseISODate(last).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}`
      : '';

  return (
    <div className="space-y-3">
      {range ? <p className="text-center text-sm text-[var(--ink-soft)]">{range}</p> : null}
      <div className="flex gap-1">
        {days.map((day) => {
          const isSelected = day.date === selectedDate;
          const missed = day.isExpected && !day.isFilled && !day.isFuture && !day.isToday;
          return (
            <button
              key={day.date}
              type="button"
              disabled={day.isFuture}
              aria-label={`${formatDateAR(day.date)}${day.isFilled ? ', ya cargó' : day.isExpected ? ', se esperaba carga' : ''}`}
              aria-pressed={isSelected}
              className={[
                'relative flex flex-1 flex-col items-center rounded-[18px] py-2 text-center transition-all duration-200',
                day.isFuture ? 'cursor-not-allowed opacity-35' : 'cursor-pointer',
                isSelected ? 'bg-[var(--clay)] text-white' : 'bg-[var(--surface)] text-[var(--ink)]',
                !isSelected && day.isToday ? 'ring-2 ring-[var(--clay)]' : 'border border-[var(--line)]',
              ].join(' ')}
              onClick={() => !day.isFuture && onSelectDate(day.date)}
            >
              <span className="text-[11px] leading-none opacity-80">{day.label}</span>
              <span className="mt-1 font-display text-lg leading-none">{dayNumber(day.date)}</span>
              <span className="mt-1 flex h-4 items-center justify-center">
                {day.isFilled ? (
                  <Check size={14} strokeWidth={2.5} className={isSelected ? 'text-white' : 'text-[var(--sage)]'} />
                ) : missed ? (
                  <span className={`h-2.5 w-2.5 rounded-full border-2 ${isSelected ? 'border-white' : 'border-[var(--clay)]'}`} />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
      {showLegend ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
          <li className="flex items-center gap-1">
            <Check size={12} className="text-[var(--sage)]" /> Ya cargó
          </li>
          <li className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-[var(--clay)]" /> Faltó cargar
          </li>
          <li className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full ring-2 ring-[var(--clay)]" /> Hoy
          </li>
        </ul>
      ) : null}
    </div>
  );
}

export function WeekNav({
  onPrev,
  onNext,
  onToday,
  isCurrentWeek,
}: {
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  isCurrentWeek: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button type="button" className="text-sm text-[var(--sage)]" onClick={onPrev}>
        Semana anterior
      </button>
      {!isCurrentWeek ? (
        <button type="button" className="text-sm text-[var(--clay)]" onClick={onToday}>
          Ir a hoy
        </button>
      ) : (
        <span className="text-sm text-[var(--ink-soft)]">Esta semana</span>
      )}
      <button type="button" className="text-sm text-[var(--sage)]" onClick={onNext}>
        Semana siguiente
      </button>
    </div>
  );
}
