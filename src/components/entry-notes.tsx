import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ProfessionalNoteDoc } from '@shared/types';

export function EntryNotes({
  notes,
  onAdd,
  onDelete,
}: {
  notes: Array<ProfessionalNoteDoc & { id: string }>;
  onAdd: (body: string) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
}) {
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await onAdd(body.trim());
      setBody('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-4">
      <p className="text-sm font-medium">Tu comentario sobre esta carga</p>
      <p className="text-xs text-[var(--ink-soft)]">Queda en el historial. El paciente no lo ve.</p>
      {notes.map((n) => (
        <div key={n.id} className="rounded-[var(--radius-input)] bg-[var(--sage-soft)] px-3 py-2">
          <p className="text-xs text-[var(--ink-soft)]">{new Date(n.createdAt).toLocaleString('es-AR')}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
          <button
            type="button"
            className="mt-1 text-xs text-[var(--danger)]"
            onClick={() => void onDelete(n.id)}
          >
            Borrar
          </button>
        </div>
      ))}
      <textarea
        className="min-h-20 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Por ejemplo: en sesión hablamos de sueño y ansiedad."
      />
      <Button type="button" variant="secondary" disabled={!body.trim() || saving} onClick={() => void save()}>
        {saving ? 'Guardando…' : 'Guardar comentario'}
      </Button>
    </div>
  );
}
