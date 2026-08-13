import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={[
        'rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5',
        'shadow-[var(--shadow-soft)]',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
