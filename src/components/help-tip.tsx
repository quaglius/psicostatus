import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

export function HelpTip({ title, text }: { title?: string; text: string }) {
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-full p-1 text-[var(--sage)] transition-transform duration-150 hover:bg-[var(--sage-soft)] active:scale-95"
        aria-label="Ver explicación"
        onClick={() => setOpen(true)}
      >
        <CircleHelp size={20} />
      </button>
      <Sheet
        open={open}
        title={title ?? 'Cómo completar esto'}
        onClose={() => setOpen(false)}
        actions={
          <Button onClick={() => setOpen(false)}>Entendido</Button>
        }
      >
        <p className="whitespace-pre-wrap text-[var(--ink)]">{text}</p>
      </Sheet>
    </>
  );
}
