import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-sm text-[var(--ink-soft)]">{label}</span>
      <input
        id={inputId}
        className={[
          'w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3',
          'text-[var(--ink)] outline-none transition-colors focus:border-[var(--sage)]',
          className,
        ].join(' ')}
        {...props}
      />
      {error ? <span className="text-sm text-[var(--danger)]">{error}</span> : null}
    </label>
  );
}
