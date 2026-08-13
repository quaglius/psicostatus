import type { PeriodicityType } from '@shared/types';
import type { WeekDayInfo } from '@shared/types';

interface WeekStripProps {
  days: WeekDayInfo[];
  periodicityType: PeriodicityType;
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function WeekStrip({ days, periodicityType, selectedDate, onSelectDate }: WeekStripProps) {
  const weeklyWrapper = periodicityType === 'weekly';

  const cells = days.map((day) => {
    const isSelected = day.date === selectedDate;
    const baseClasses = [
      'relative flex flex-1 flex-col items-center justify-center rounded-full py-2 transition-all duration-200',
      day.isFuture ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
      day.isFilled ? 'bg-[var(--sage-soft)] opacity-100' : 'bg-[var(--empty)] opacity-55',
      day.isToday ? 'ring-2 ring-[var(--clay-soft)]' : '',
      day.isExpected && periodicityType !== 'weekly' ? 'ring-1 ring-[var(--clay-soft)]' : '',
      isSelected ? 'underline decoration-[var(--clay)] decoration-2 underline-offset-4' : '',
    ].join(' ');

    return (
      <button
        key={day.date}
        type="button"
        disabled={day.isFuture}
        aria-label={`${day.label} ${day.date}${day.isFilled ? ', cargado' : ', sin carga'}`}
        aria-pressed={isSelected}
        className={baseClasses}
        onClick={() => !day.isFuture && onSelectDate(day.date)}
      >
        <span className={`text-sm font-medium ${day.isFilled ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
          {day.label}
        </span>
        {day.isFilled ? (
          <span className="mt-1 h-1 w-1 rounded-full bg-[var(--sage)]" aria-hidden />
        ) : null}
        {day.entryCount > 1 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--clay)] px-1 text-[10px] text-white">
            {day.entryCount}
          </span>
        ) : null}
      </button>
    );
  });

  if (weeklyWrapper) {
    return (
      <div
        className={[
          'rounded-[var(--radius-card)] p-2 ring-2',
          days.some((d) => d.isFilled) ? 'bg-[var(--sage-soft)] ring-[var(--sage)]' : 'bg-transparent ring-[var(--clay-soft)]',
        ].join(' ')}
      >
        <div className="flex gap-1">{cells}</div>
      </div>
    );
  }

  return <div className="flex gap-1">{cells}</div>;
}
