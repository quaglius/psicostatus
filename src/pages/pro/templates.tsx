import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ClipboardList, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { FIELD_TYPE, PERIODICITY } from '@/lib/labels';
import type { FieldDefinition, FieldType, PeriodicityType, TemplateDoc, TemplateVersionDoc } from '@shared/types';
import { DEFAULT_TEMPLATE_FIELDS } from '@shared/fields';

const FIELD_TYPES = Object.keys(FIELD_TYPE) as FieldType[];
const WEEKDAY_UI = [
  { i: 1, label: 'Lun' },
  { i: 2, label: 'Mar' },
  { i: 3, label: 'Mié' },
  { i: 4, label: 'Jue' },
  { i: 5, label: 'Vie' },
  { i: 6, label: 'Sáb' },
  { i: 0, label: 'Dom' },
];

type TemplateRow = TemplateDoc & { id: string; latestVersion?: (TemplateVersionDoc & { id: string }) | null };

export function TemplatesPage() {
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [fields, setFields] = useState<FieldDefinition[]>(DEFAULT_TEMPLATE_FIELDS);
  const [periodicityType, setPeriodicityType] = useState<PeriodicityType>('daily');
  const [everyNDays, setEveryNDays] = useState(3);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [name, setName] = useState('');

  const load = async () => {
    if (!workspace) return;
    const res = await apiFetch<{ templates: TemplateRow[] }>(`workspaces/${workspace.workspace.id}/templates`);
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
      label: FIELD_TYPE[type].label,
      required: false,
      order: fields.length + 1,
      config:
        type === 'scale'
          ? { min: 0, max: 10, step: 1 }
          : type === 'faces'
            ? { options: ['sad', 'ok', 'happy'] }
            : type === 'select'
              ? { options: ['Opción 1', 'Opción 2'] }
              : type === 'long_text'
                ? { maxLength: 2000, placeholder: '' }
                : {},
    };
    setFields([...fields, base]);
  };

  const save = async () => {
    if (!workspace || !name.trim()) return;
    const periodicityConfig =
      periodicityType === 'every_n_days' ? { n: everyNDays } : periodicityType === 'weekdays' ? { weekdays } : {};

    if (editing === 'new') {
      const created = await apiFetch<{ template: { id: string } }>('templates', {
        method: 'POST',
        body: JSON.stringify({ workspaceId: workspace.workspace.id, name, fields }),
      });
      await apiFetch(`templates/${created.template.id}/versions`, {
        method: 'POST',
        body: JSON.stringify({ fields, periodicityType, periodicityConfig }),
      });
    } else if (editing) {
      await apiFetch(`templates/${editing}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      await apiFetch(`templates/${editing}/versions`, {
        method: 'POST',
        body: JSON.stringify({ fields, periodicityType, periodicityConfig }),
      });
    }
    setEditing(null);
    await load();
  };

  const openEdit = (t: TemplateRow) => {
    setEditing(t.id);
    setName(t.name);
    setFields(t.latestVersion?.fields ?? DEFAULT_TEMPLATE_FIELDS);
    setPeriodicityType(t.latestVersion?.periodicityType ?? 'daily');
    if (t.latestVersion?.periodicityConfig.n) setEveryNDays(t.latestVersion.periodicityConfig.n);
    if (t.latestVersion?.periodicityConfig.weekdays) setWeekdays(t.latestVersion.periodicityConfig.weekdays);
  };

  if (editing) {
    return (
      <ProLayout workspaceName={workspace?.workspace.name}>
        <button type="button" className="mb-4 text-sm text-[var(--sage)]" onClick={() => setEditing(null)}>
          ← Volver al listado
        </button>
        <h1 className="font-display text-3xl">{editing === 'new' ? 'Nueva plantilla' : 'Editar plantilla'}</h1>
        <p className="mb-6 mt-1 text-sm text-[var(--ink-soft)]">
          La plantilla es el formulario que ve el paciente. Cada cambio crea una versión nueva: lo que ya cargaron no se borra.
        </p>

        <div className="space-y-6">
          <Input label="Nombre de la plantilla" value={name} onChange={(e) => setName(e.target.value)} />

          <fieldset>
            <legend className="mb-2 font-medium">¿Cada cuánto le pedimos que cargue?</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(Object.keys(PERIODICITY) as PeriodicityType[]).map((p) => (
                <label
                  key={p}
                  className={[
                    'cursor-pointer rounded-[var(--radius-input)] border p-3',
                    periodicityType === p ? 'border-[var(--sage)] bg-[var(--sage-soft)]' : 'border-[var(--line)]',
                  ].join(' ')}
                >
                  <input type="radio" className="sr-only" checked={periodicityType === p} onChange={() => setPeriodicityType(p)} />
                  <span className="font-medium">{PERIODICITY[p].label}</span>
                  <span className="mt-1 block text-sm text-[var(--ink-soft)]">{PERIODICITY[p].help}</span>
                </label>
              ))}
            </div>
            {periodicityType === 'every_n_days' ? (
              <Input
                className="mt-3"
                label="Cada cuántos días"
                type="number"
                min={2}
                value={everyNDays}
                onChange={(e) => setEveryNDays(Number(e.target.value))}
              />
            ) : null}
            {periodicityType === 'weekdays' ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {WEEKDAY_UI.map(({ i, label }) => (
                  <label key={label} className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={weekdays.includes(i)}
                      onChange={(e) => setWeekdays(e.target.checked ? [...weekdays, i] : weekdays.filter((d) => d !== i))}
                    />
                    {label}
                  </label>
                ))}
              </div>
            ) : null}
          </fieldset>

          <div>
            <p className="mb-2 font-medium">Preguntas del formulario</p>
            <div className="space-y-3">
              {fields.map((f, i) => (
                <div key={f.id} className="flex items-start gap-2 rounded-[var(--radius-input)] border border-[var(--line)] p-3">
                  <div className="flex flex-col gap-1">
                    <button type="button" className="text-[var(--ink-soft)]" onClick={() => moveField(i, -1)} aria-label="Subir">
                      <ArrowUp size={16} />
                    </button>
                    <button type="button" className="text-[var(--ink-soft)]" onClick={() => moveField(i, 1)} aria-label="Bajar">
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-xs text-[var(--sage)]">{FIELD_TYPE[f.type].label}</p>
                    <Input
                      label="Cómo se lo preguntamos al paciente"
                      value={f.label}
                      onChange={(e) => {
                        const next = [...fields];
                        next[i] = { ...f, label: e.target.value };
                        setFields(next);
                      }}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => {
                          const next = [...fields];
                          next[i] = { ...f, required: e.target.checked };
                          setFields(next);
                        }}
                      />
                      Obligatorio (no puede saltearlo)
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <p className="mb-2 mt-4 text-sm text-[var(--ink-soft)]">Agregar una pregunta</p>
            <div className="flex flex-wrap gap-2">
              {FIELD_TYPES.map((type) => (
                <Button key={type} variant="ghost" onClick={() => addField(type)}>
                  <Plus size={14} /> {FIELD_TYPE[type].label}
                </Button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Tocá un tipo para entenderlo: {FIELD_TYPES.map((t) => FIELD_TYPE[t].help).join(' · ')}
            </p>
          </div>

          <Button onClick={save} disabled={!name.trim()}>
            Guardar. A partir de ahora usan esta versión; lo ya cargado queda.
          </Button>
        </div>
      </ProLayout>
    );
  }

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Plantillas</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--ink-soft)]">
            Una plantilla es el cuestionario del paciente: ánimo, medicación, notas, lo que armes. Podés tener varias y asignar una distinta a cada persona.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing('new');
            setName('');
            setFields(DEFAULT_TEMPLATE_FIELDS);
            setPeriodicityType('daily');
          }}
        >
          <Plus size={18} /> Nueva plantilla
        </Button>
      </div>

      <div className="space-y-3">
        {templates.map((t) => (
          <Card key={t.id} className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ClipboardList className="mt-1 text-[var(--sage)]" size={22} />
              <div>
                <p className="font-medium">{t.name}</p>
                {t.isDefault ? <p className="text-xs text-[var(--sage)]">La que se usa al invitar, si no elegís otra</p> : null}
                {t.latestVersion ? (
                  <p className="text-sm text-[var(--ink-soft)]">
                    {PERIODICITY[t.latestVersion.periodicityType].label} · {t.latestVersion.fields.length} preguntas
                  </p>
                ) : null}
              </div>
            </div>
            <Button variant="secondary" onClick={() => openEdit(t)}>
              Editar
            </Button>
          </Card>
        ))}
      </div>
    </ProLayout>
  );
}
