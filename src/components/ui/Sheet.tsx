import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface SheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
  size?: 'md' | 'lg';
}

export function Sheet({ open, title, children, onClose, actions, size = 'md' }: SheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button type="button" className="absolute inset-0 bg-black/35" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={[
          'relative z-10 flex w-full flex-col rounded-t-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-soft)] sm:rounded-[var(--radius-card)]',
          size === 'lg' ? 'max-h-[min(92dvh,840px)] max-w-[420px]' : 'max-h-[min(88dvh,640px)] max-w-md',
        ].join(' ')}
      >
        <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
          <div className="h-1 w-10 rounded-full bg-[var(--line)]" />
        </div>

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--line)] px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="sheet-title" className="font-display text-base leading-snug text-[var(--ink)] sm:text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-full p-1.5 text-[var(--ink-soft)] hover:bg-[var(--empty)]"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 text-sm leading-relaxed text-[var(--ink-soft)] sm:px-5 sm:py-4">
          {children}
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-[var(--line)] px-4 py-3 sm:flex-row sm:justify-end sm:px-5 sm:py-4">
          {actions ?? (
            <Button variant="ghost" onClick={onClose}>
              Volver
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
