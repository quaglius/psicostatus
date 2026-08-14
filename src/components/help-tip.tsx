import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

export function HelpTip({ title, text, label = 'Cómo cargar' }: { title?: string; text: string; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-[var(--sage)] transition-transform duration-150 hover:bg-[var(--sage-soft)] active:scale-95"
        aria-label={`${label}. Ver explicación`}
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={18} aria-hidden />
        <span className="font-medium">{label}</span>
      </button>
      <Sheet
        open={open}
        title={title ?? 'Cómo completar esto'}
        onClose={() => setOpen(false)}
        actions={
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        }
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">{text}</p>
      </Sheet>
    </>
  );
}
