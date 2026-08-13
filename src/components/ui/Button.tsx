import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--clay)] text-white hover:opacity-90',
  secondary: 'bg-[var(--sage-soft)] text-[var(--ink)] hover:bg-[var(--sage)] hover:text-white',
  ghost: 'bg-transparent text-[var(--ink-soft)] hover:bg-[var(--line)]',
  danger: 'bg-[var(--danger)] text-white hover:opacity-90',
};

export function Button({
  variant = 'primary',
  children,
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium',
        'transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
