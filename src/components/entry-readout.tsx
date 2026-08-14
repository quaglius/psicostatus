import type { EntryDoc, FieldDefinition } from '@shared/types';
import { FACE_LABELS } from '@/lib/labels';
import { formatDateTimeAR } from '@shared/periodicity';
import { FacesField } from './faces-field';
import { ScaleField } from './scale-field';

interface EntryReadoutProps {
  fields?: FieldDefinition[];
  entry: EntryDoc & { id: string };
}

function formatValue(field: FieldDefinition, raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return 'Sin respuesta';
  if (field.type === 'yes_no') return raw === true || raw === 'true' || raw === 'Sí' ? 'Sí' : 'No';
  if (field.type === 'faces') return FACE_LABELS[String(raw)] ?? String(raw);
  if (field.type === 'scale') return `${raw} de ${Number(field.config.max ?? 10)}`;
  return String(raw);
}

export function EntryReadout({ fields, entry }: EntryReadoutProps) {
  const sorted = [...(fields ?? [])].sort((a, b) => a.order - b.order);
  const known = new Set(sorted.map((f) => f.id));
  const extras = Object.entries(entry.values).filter(([id, v]) => !known.has(id) && v !== undefined && v !== '');

  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--ink-soft)]">Cargado: {formatDateTimeAR(entry.createdAt)}</p>
      {sorted.map((field) => {
        const value = entry.values[field.id];
        return (
          <div key={field.id}>
            <p className="text-sm text-[var(--ink-soft)]">{field.label}</p>
            {field.type === 'faces' && typeof value === 'string' ? (
              <div className="pointer-events-none mt-1 opacity-90">
                <FacesField value={value} options={(field.config.options as string[]) ?? ['sad', 'ok', 'happy']} onChange={() => {}} />
              </div>
            ) : field.type === 'scale' && typeof value === 'number' ? (
              <div className="pointer-events-none mt-1">
                <ScaleField value={value} min={Number(field.config.min ?? 0)} max={Number(field.config.max ?? 10)} onChange={() => {}} />
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-[var(--ink)]">{formatValue(field, value)}</p>
            )}
          </div>
        );
      })}
      {!sorted.length
        ? Object.entries(entry.values).map(([id, v]) => (
            <p key={id} className="whitespace-pre-wrap">
              {FACE_LABELS[String(v)] ?? String(v)}
            </p>
          ))
        : extras.map(([id, v]) => (
            <p key={id} className="whitespace-pre-wrap text-[var(--ink)]">
              {FACE_LABELS[String(v)] ?? String(v)}
            </p>
          ))}
    </div>
  );
}
