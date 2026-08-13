interface FaceIconProps {
  mood: 'sad' | 'ok' | 'happy';
  selected?: boolean;
  onClick?: () => void;
  label: string;
}

function FaceSvg({ mood, selected }: { mood: string; selected?: boolean }) {
  const stroke = selected ? 'var(--sage)' : 'var(--ink-soft)';
  const fill = selected ? 'var(--sage-soft)' : 'var(--surface)';

  const mouths: Record<string, string> = {
    sad: 'M 28 38 Q 32 34 36 38',
    ok: 'M 28 37 L 36 37',
    happy: 'M 28 36 Q 32 42 36 36',
  };

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle cx="32" cy="32" r="28" fill={fill} stroke={stroke} strokeWidth="2" />
      <circle cx="24" cy="26" r="2.5" fill={stroke} />
      <circle cx="40" cy="26" r="2.5" fill={stroke} />
      <path d={mouths[mood] ?? mouths.ok} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function FaceButton({ mood, selected, onClick, label }: FaceIconProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'rounded-full p-1 transition-transform duration-200',
        selected ? 'scale-105' : 'hover:scale-[1.02]',
      ].join(' ')}
    >
      <FaceSvg mood={mood} selected={selected} />
    </button>
  );
}

const FACE_LABELS: Record<string, string> = {
  sad: 'Triste',
  ok: 'Regular',
  happy: 'Contento',
};

export function FacesField({
  value,
  options,
  onChange,
}: {
  value?: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex justify-center gap-4">
      {options.map((opt) => (
        <FaceButton
          key={opt}
          mood={opt as 'sad' | 'ok' | 'happy'}
          selected={value === opt}
          label={FACE_LABELS[opt] ?? opt}
          onClick={() => onChange(opt)}
        />
      ))}
    </div>
  );
}
