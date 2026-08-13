export function ScaleField({
  value,
  min,
  max,
  onChange,
}: {
  value?: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-4">
      <div className="text-center font-display text-4xl text-[var(--ink)]">
        {value !== undefined ? value : '—'}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {points.map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n}`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={[
              'h-9 w-9 rounded-full text-sm font-medium transition-all duration-200',
              value === n
                ? 'bg-[var(--sage)] text-white scale-110'
                : 'bg-[var(--empty)] text-[var(--ink-soft)] hover:bg-[var(--sage-soft)]',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
