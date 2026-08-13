interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
}

export function Avatar({ name, src, size = 44, className = '' }: AvatarProps) {
  const dim = `${size}px`;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: dim, height: dim }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--sage-soft)] text-[var(--ink)] ${className}`}
      style={{ width: dim, height: dim, fontSize: Math.max(12, size * 0.32) }}
    >
      {initials(name)}
    </span>
  );
}
