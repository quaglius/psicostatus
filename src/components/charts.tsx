interface BarPoint {
  label: string;
  value: number;
}

export function BarChart({ title, help, points }: { title: string; help: string; points: BarPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div>
      <p className="font-display text-lg">{title}</p>
      <p className="mb-4 text-sm text-[var(--ink-soft)]">{help}</p>
      <div className="flex h-36 items-end gap-2">
        {points.map((p) => (
          <div key={p.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="w-full rounded-t-md bg-[var(--sage)]"
              style={{ height: `${Math.round((p.value / max) * 100)}%`, minHeight: p.value ? 4 : 0 }}
              title={`${p.label}: ${p.value}`}
            />
            <span className="text-[11px] text-[var(--ink-soft)]">{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Sparkline({ title, help, values }: { title: string; help: string; values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 280;
  const h = 72;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * h;
    return `${x},${y}`;
  });
  return (
    <div>
      <p className="font-display text-lg">{title}</p>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">{help}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" aria-hidden>
        <polyline fill="none" stroke="var(--clay)" strokeWidth="3" points={pts.join(' ')} />
      </svg>
    </div>
  );
}

export function AdherenceRing({ percent, label }: { percent: number; label: string }) {
  const r = 36;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className="flex items-center gap-4">
      <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden>
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--empty)" strokeWidth="10" />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="var(--sage)"
          strokeWidth="10"
          strokeDasharray={`${(clamped / 100) * c} ${c}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
        <text x="48" y="53" textAnchor="middle" fontSize="16" fill="var(--ink)">
          {clamped}%
        </text>
      </svg>
      <p className="text-sm text-[var(--ink-soft)]">{label}</p>
    </div>
  );
}
