import { useState } from 'react';
import type { FieldDefinition } from '@shared/types';
import { FacesField } from './faces-field';
import { ScaleField } from './scale-field';
import { Input } from './ui/Input';

interface EntryFormProps {
  fields: FieldDefinition[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  errors?: Record<string, string>;
}

export function EntryForm({ fields, values, onChange, errors = {} }: EntryFormProps) {
  const sorted = [...fields].sort((a, b) => a.order - b.order);

  const setValue = (id: string, val: unknown) => {
    onChange({ ...values, [id]: val });
  };

  return (
    <div className="space-y-6">
      {sorted.map((field) => (
        <div key={field.id} className="space-y-3">
          <h3 className="font-display text-2xl text-[var(--ink)]">{field.label}</h3>

          {field.type === 'scale' ? (
            <ScaleField
              value={values[field.id] as number | undefined}
              min={Number(field.config.min ?? 0)}
              max={Number(field.config.max ?? 10)}
              onChange={(v) => setValue(field.id, v)}
            />
          ) : null}

          {field.type === 'faces' ? (
            <FacesField
              value={values[field.id] as string | undefined}
              options={(field.config.options as string[]) ?? ['sad', 'ok', 'happy']}
              onChange={(v) => setValue(field.id, v)}
            />
          ) : null}

          {field.type === 'short_text' ? (
            <Input
              label=""
              value={String(values[field.id] ?? '')}
              onChange={(e) => setValue(field.id, e.target.value)}
              error={errors[field.id]}
            />
          ) : null}

          {field.type === 'long_text' ? (
            <textarea
              className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--sage)]"
              rows={4}
              placeholder={String(field.config.placeholder ?? '')}
              value={String(values[field.id] ?? '')}
              onChange={(e) => setValue(field.id, e.target.value)}
            />
          ) : null}

          {field.type === 'number' ? (
            <Input
              label=""
              type="number"
              value={String(values[field.id] ?? '')}
              onChange={(e) => setValue(field.id, Number(e.target.value))}
              error={errors[field.id]}
            />
          ) : null}

          {field.type === 'date' || field.type === 'time' || field.type === 'datetime' ? (
            <Input
              label=""
              type={field.type === 'datetime' ? 'datetime-local' : field.type}
              value={String(values[field.id] ?? '')}
              onChange={(e) => setValue(field.id, e.target.value)}
              error={errors[field.id]}
            />
          ) : null}

          {field.type === 'select' ? (
            <select
              className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)]"
              value={String(values[field.id] ?? '')}
              onChange={(e) => setValue(field.id, e.target.value)}
            >
              <option value="">Elegí una opción</option>
              {((field.config.options as string[]) ?? []).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : null}

          {errors[field.id] ? (
            <p className="text-sm text-[var(--danger)]">{errors[field.id]}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function useEntryFormState(fields: FieldDefinition[]) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const v = values[field.id];
      if (field.required && (v === undefined || v === null || v === '')) {
        next[field.id] = 'Este campo es obligatorio';
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  return { values, setValues, errors, setErrors, validate };
}
