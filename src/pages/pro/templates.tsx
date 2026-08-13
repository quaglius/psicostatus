import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import type { FieldDefinition, FieldType, PeriodicityType, TemplateDoc, TemplateVersionDoc } from '@shared/types';
import { DEFAULT_TEMPLATE_FIELDS } from '@shared/fields';

const FIELD_TYPES: FieldType[] = [
  'scale', 'faces', 'short_text', 'long_text', 'date', 'time', 'datetime', 'number', 'select',
];

export function TemplatesPage() {
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [templates, setTemplates] = useState<Array<TemplateDoc & { id: string; latestVersion?: TemplateVersionDoc & { id: string } }>>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>(DEFAULT_TEMPLATE_FIELDS);
  const [periodicityType, setPeriodicityType] = useState<PeriodicityType>('daily');
  const [everyNDays, setEveryNDays] = useState(3);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [name, setName] = useState('');

  const load = async () => {
    if (!workspace) return;
    const res = await apiFetch<{ templates: typeof templates }>(`workspaces/${workspace.workspace.id}/templates`);
    setTemplates(res.templates);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [workspace?.workspace.id]);

  const moveField = (index: number, direction: -1 | 1) => {
    const next = [...fields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setFields(next.map((f, i) => ({ ...f, order: i + 1 })));
  };

  const addField = (type: FieldType) => {
    const id = `fld_${Date.now()}`;
    const base: FieldDefinition = {
      id,
      type,
      label: 'Nuevo campo',
      required: false,
      order: fields.length + 1,
      config: type === 'scale' ? { min: 0, max: 10, step: 1 }
        : type === 'faces' ? { options: ['sad', 'ok', 'happy'] }
        : type === 'select' ? { options: ['Opción 1', 'Opción 2'] }
        : type === 'long_text' ? { maxLength: 2000, placeholder: '' }
        : {},
    };
    setFields([...fields, base]);
  };

  const saveVersion = async (templateId: string) => {
    const periodicityConfig =
      periodicityType === 'every_n_days' ? { n: everyNDays }
      : periodicityType === 'weekdays' ? { weekdays }
      : {};

    await apiFetch(`templates/${templateId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ fields, periodicityType, periodicityConfig }),
    });
    setEditing(null);
    await load();
  };

  const createTemplate = async () => {
    if (!workspace || !name.trim()) return;
    await apiFetch('templates', {
      method: 'POST',
      body: JSON.stringify({ workspaceId: workspace.workspace.id, name }),
    });
    setName('');
    await load();
  };

  const weekdayLabels = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <h1 className="font-display mb-6 text-3xl">Plantillas</h1>

      <Card className="mb-6 space-y-3">
        <Input label="Nueva plantilla" value={name} onChange={(e) => setName(e.target.value)} />
        <Button onClick={createTemplate}>Crear plantilla</Button>
      </Card>

      <div className="space-y-4">
        {templates.map((t) => (
          <Card key={t.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t.name}</p>
                {t.isDefault ? <span className="text-xs text-[var(--sage)]">Por defecto</span> : null}
                {t.latestVersion ? (
                  <p className="text-sm text-[var(--ink-soft)]">
                    v{t.latestVersion.version} · {t.latestVersion.periodicityType}
                  </p>
                ) : null}
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(t.id);
                  setFields(t.latestVersion?.fields ?? DEFAULT_TEMPLATE_FIELDS);
                  setPeriodicityType(t.latestVersion?.periodicityType ?? 'daily');
                  if (t.latestVersion?.periodicityConfig.n) setEveryNDays(t.latestVersion.periodicityConfig.n);
                  if (t.latestVersion?.periodicityConfig.weekdays) setWeekdays(t.latestVersion.periodicityConfig.weekdays);
                }}
              >
                Editar
              </Button>
            </div>

            {editing === t.id ? (
              <div className="mt-4 space-y-4 border-t border-[var(--line)] pt-4">
                <fieldset>
                  <legend className="mb-2 text-sm text-[var(--ink-soft)]">Periodicidad</legend>
                  <div className="flex flex-wrap gap-2">
                    {(['daily', 'weekly', 'every_n_days', 'weekdays'] as PeriodicityType[]).map((p) => (
                      <label key={p} className="flex items-center gap-1 text-sm">
                        <input type="radio" checked={periodicityType === p} onChange={() => setPeriodicityType(p)} />
                        {p.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                  {periodicityType === 'every_n_days' ? (
                    <Input label="Cada N días" type="number" min={2} value={everyNDays} onChange={(e) => setEveryNDays(Number(e.target.value))} />
                  ) : null}
                  {periodicityType === 'weekdays' ? (
                    <div className="mt-2 flex gap-2">
                      {weekdayLabels.map((label, i) => (
                        <label key={label} className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={weekdays.includes(i)}
                            onChange={(e) => {
                              setWeekdays(e.target.checked ? [...weekdays, i] : weekdays.filter((d) => d !== i));
                            }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </fieldset>

                {fields.map((f, i) => (
                  <div key={f.id} className="flex items-start gap-2 rounded-[var(--radius-input)] border border-[var(--line)] p-3">
                    <div className="flex flex-col gap-1">
                      <button type="button" className="text-xs text-[var(--ink-soft)]" onClick={() => moveField(i, -1)} aria-label="Subir">↑</button>
                      <button type="button" className="text-xs text-[var(--ink-soft)]" onClick={() => moveField(i, 1)} aria-label="Bajar">↓</button>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Input label={`${f.type}`} value={f.label} onChange={(e) => {
                        const next = [...fields];
                        next[i] = { ...f, label: e.target.value };
                        setFields(next);
                      }} />
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={f.required} onChange={(e) => {
                          const next = [...fields];
                          next[i] = { ...f, required: e.target.checked };
                          setFields(next);
                        }} />
                        Obligatorio
                      </label>
                    </div>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2">
                  {FIELD_TYPES.map((type) => (
                    <Button key={type} variant="ghost" onClick={() => addField(type)}>+ {type}</Button>
                  ))}
                </div>

                <Button onClick={() => saveVersion(t.id)}>Guardar versión</Button>
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </ProLayout>
  );
}
