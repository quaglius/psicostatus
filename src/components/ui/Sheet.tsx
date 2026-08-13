import type { ReactNode } from 'react';
import { Button } from './Button';

interface SheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}

export function Sheet({ open, title, children, onClose, actions }: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-4 sm:items-center">
      <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="relative z-10 w-full max-w-md rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-soft)]"
      >
        <h2 id="sheet-title" className="font-display mb-3 text-xl text-[var(--ink)]">
          {title}
        </h2>
        <div className="mb-5 text-[var(--ink-soft)]">{children}</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          {actions ?? <Button variant="ghost" onClick={onClose}>Volver</Button>}
        </div>
      </div>
    </div>
  );
}
