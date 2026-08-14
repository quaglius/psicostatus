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

export function HorizontalBarChart({ title, help, points }: { title: string; help: string; points: BarPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div>
      <p className="font-display text-lg">{title}</p>
      <p className="mb-4 text-sm text-[var(--ink-soft)]">{help}</p>
      <div className="space-y-2">
        {points.map((p) => (
          <div key={p.label}>
            <div className="mb-1 flex items-center justify-between gap-2 text-sm">
              <span className="truncate">{p.label}</span>
              <span className="shrink-0 text-[var(--ink-soft)]">
                {p.value} · {Math.round((p.value / total) * 100)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--empty)]">
              <div
                className="h-full rounded-full bg-[var(--sage)]"
                style={{ width: `${Math.round((p.value / max) * 100)}%` }}
              />
            </div>
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

const PIE_COLORS = ['var(--sage)', 'var(--clay)', 'var(--warn)', '#8aa3c7', '#b48bb0', '#7a9e8a'];

export function LineChart({
  title,
  help,
  points,
}: {
  title: string;
  help: string;
  points: Array<{ label: string; value: number }>;
}) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 320;
  const h = 88;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 8) - 4;
    return `${x},${y}`;
  });
  return (
    <div>
      <p className="font-display text-lg">{title}</p>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">{help}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-24 w-full" role="img" aria-label={title}>
        <polyline fill="none" stroke="var(--clay)" strokeWidth="3" points={pts.join(' ')} />
        {values.map((v, i) => {
          const x = (i / (values.length - 1)) * w;
          const y = h - ((v - min) / span) * (h - 8) - 4;
          return <circle key={`${points[i]!.label}-${i}`} cx={x} cy={y} r="3.5" fill="var(--sage)" />;
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[11px] text-[var(--ink-soft)]">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
}

export function PieChart({
  title,
  help,
  slices,
}: {
  title: string;
  help: string;
  slices: Array<{ label: string; value: number }>;
}) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  if (!total) return null;
  const r = 42;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div>
      <p className="font-display text-lg">{title}</p>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">{help}</p>
      <div className="flex flex-wrap items-center gap-4">
        <svg width="112" height="112" viewBox="0 0 112 112" aria-hidden>
          {slices.map((slice, i) => {
            const len = (slice.value / total) * c;
            const el = (
              <circle
                key={slice.label}
                cx="56"
                cy="56"
                r={r}
                fill="none"
                stroke={PIE_COLORS[i % PIE_COLORS.length]}
                strokeWidth="16"
                strokeDasharray={`${len} ${c}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 56 56)"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <ul className="space-y-1 text-sm">
          {slices.map((s, i) => (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              {s.label}: {s.value}
            </li>
          ))}
        </ul>
      </div>
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
