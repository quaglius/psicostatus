interface MarkProps {
  size?: number;
  className?: string;
}

export function Mark({ size = 36, className = '' }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden
    >
      <rect width="48" height="48" rx="14" fill="#F0D9CF" />
      <circle cx="24" cy="24" r="13" fill="#FFF9F1" stroke="#6E8B74" strokeWidth="1.6" />
      <circle cx="19.5" cy="21.5" r="1.4" fill="#3A322C" />
      <circle cx="28.5" cy="21.5" r="1.4" fill="#3A322C" />
      <path
        d="M19.5 28.2C21.2 30.6 26.8 30.6 28.5 28.2"
        stroke="#C4785A"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
