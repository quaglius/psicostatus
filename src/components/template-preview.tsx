import { useState } from 'react';
import { CircleHelp, Smartphone } from 'lucide-react';
import { EntryForm } from '@/components/entry-form';
import type { FieldDefinition, PeriodicityType } from '@shared/types';
import { PERIODICITY, WEEKDAY_FULL } from '@/lib/labels';

export function TemplatePreview({
  name,
  fields,
  patientGuide,
  periodicityType,
  everyNDays,
  weekdays,
}: {
  name: string;
  fields: FieldDefinition[];
  patientGuide: string;
  periodicityType: PeriodicityType;
  everyNDays?: number;
  weekdays?: number[];
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const previewFields = fields.map((f) => ({
    ...f,
    label: f.label.trim() || 'Pregunta sin título',
  }));

  let rhythm = PERIODICITY[periodicityType].label;
  if (periodicityType === 'every_n_days') {
    rhythm = `Cada ${everyNDays ?? 3} días`;
  } else if (periodicityType === 'weekdays' && weekdays?.length) {
    const days = [...weekdays]
      .sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
      .map((d) => WEEKDAY_FULL[d]);
    rhythm = days.join(', ');
  }

  return (
    <div className="rounded-[22px] border border-[var(--line)] bg-[var(--paper)] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-xs tracking-[0.12em] text-[var(--sage)] uppercase">
        <Smartphone size={14} aria-hidden />
        Así lo ve en el celular
      </p>
      <div className="mb-4">
        <h3 className="font-display text-xl text-[var(--ink)]">{name.trim() || 'Sin nombre'}</h3>
        <p className="text-sm text-[var(--ink-soft)]">{rhythm}</p>
      </div>
      {patientGuide.trim() ? (
        <div className="mb-5 rounded-[var(--radius-input)] border border-[var(--sage)] bg-[var(--sage-soft)] px-3 py-2">
          <p className="flex items-center gap-1.5 text-sm font-medium text-[var(--sage)]">
            <CircleHelp size={16} aria-hidden /> Cómo cargar
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--ink)]">{patientGuide}</p>
        </div>
      ) : null}
      <EntryForm fields={previewFields} values={values} onChange={setValues} />
      <p className="mt-6 rounded-full bg-[var(--empty)] py-3 text-center text-sm text-[var(--ink-soft)]">
        Botón Guardar — solo en la app real
      </p>
    </div>
  );
}
