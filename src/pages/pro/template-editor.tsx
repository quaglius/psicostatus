import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { apiFetch, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { PageSkeleton } from '@/components/skeleton';
import { FieldTypeIcon, PeriodicityIcon } from '@/lib/field-icons';
import { FIELD_TYPE, PERIODICITY } from '@/lib/labels';
import { DEFAULT_TEMPLATE_FIELDS } from '@shared/fields';
import type { FieldDefinition, FieldType, PeriodicityType, TemplateDoc, TemplateVersionDoc } from '@shared/types';

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

export function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'nueva';
  const navigate = useNavigate();
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedOpen, setSavedOpen] = useState(false);
  const [fields, setFields] = useState<FieldDefinition[]>(DEFAULT_TEMPLATE_FIELDS);
  const [periodicityType, setPeriodicityType] = useState<PeriodicityType>('daily');
  const [everyNDays, setEveryNDays] = useState(3);
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [name, setName] = useState('');
  const [patientGuide, setPatientGuide] = useState(
    'Cada día, elegí cómo te sentís, si tomaste la medicación y, si querés, escribí una nota. No hay respuestas correctas.',
  );

  useEffect(() => {
    if (isNew || !id) return;
    apiFetch<{ template: TemplateRow }>(`templates/${id}`)
      .then((res) => {
        const t = res.template;
        setName(t.name);
        setFields(t.latestVersion?.fields ?? DEFAULT_TEMPLATE_FIELDS);
        setPeriodicityType(t.latestVersion?.periodicityType ?? 'daily');
        if (t.latestVersion?.periodicityConfig.n) setEveryNDays(t.latestVersion.periodicityConfig.n);
        if (t.latestVersion?.periodicityConfig.weekdays) setWeekdays(t.latestVersion.periodicityConfig.weekdays);
        setPatientGuide(t.latestVersion?.patientGuide ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No pudimos abrir la plantilla'))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const moveField = (index: number, direction: -1 | 1) => {
    const next = [...fields];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target]!, next[index]!];
    setFields(next.map((f, i) => ({ ...f, order: i + 1 })));
  };

  const updateField = (index: number, patch: Partial<FieldDefinition>) => {
    const next = [...fields];
    next[index] = { ...next[index]!, ...patch };
    setFields(next);
  };

  const removeField = (index: number) => {
    if (fields.length <= 1) return;
    setFields(fields.filter((_, i) => i !== index).map((f, i) => ({ ...f, order: i + 1 })));
  };

  const addField = (type: FieldType) => {
    const fieldId = `fld_${Date.now()}`;
    const base: FieldDefinition = {
      id: fieldId,
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
    if (!name.trim()) {
      setError('Poné un nombre a la plantilla.');
      return;
    }
    if (!workspace) {
      setError('No encontramos el espacio. Recargá la página.');
      return;
    }
    setSaving(true);
    setError('');
    const periodicityConfig =
      periodicityType === 'every_n_days' ? { n: everyNDays } : periodicityType === 'weekdays' ? { weekdays } : {};
    const payload = { fields, periodicityType, periodicityConfig, patientGuide };
    try {
      if (isNew) {
        const created = await apiFetch<{ template: { id: string } }>('templates', {
          method: 'POST',
          body: JSON.stringify({ workspaceId: workspace.workspace.id, name, fields, patientGuide }),
        });
        await apiFetch(`templates/${created.template.id}/versions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        navigate(`/pro/plantillas/${created.template.id}`, { replace: true });
      } else if (id) {
        await apiFetch(`templates/${id}`, { method: 'POST', body: JSON.stringify({ name }) });
        await apiFetch(`templates/${id}/versions`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSavedOpen(true);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProLayout workspaceName={workspace?.workspace.name}>
        <PageSkeleton />
      </ProLayout>
    );
  }

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <Link to="/pro/plantillas" className="mb-4 inline-block text-sm text-[var(--sage)]">
        ← Volver al listado
      </Link>
      <h1 className="font-display text-3xl">{isNew ? 'Nueva plantilla' : 'Editar plantilla'}</h1>
      <p className="mb-6 mt-1 text-sm text-[var(--ink-soft)]">
        La plantilla es el formulario que ve el paciente. Cada cambio crea una versión nueva: lo que ya cargaron no se borra.
      </p>
      {error ? <p className="mb-4 text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="space-y-6">
        <Input label="Nombre de la plantilla" value={name} onChange={(e) => setName(e.target.value)} />

        <label className="block space-y-1.5">
          <span className="text-sm text-[var(--ink-soft)]">Nota para el paciente</span>
          <textarea
            className="min-h-28 w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none transition-colors focus:border-[var(--sage)]"
            value={patientGuide}
            onChange={(e) => setPatientGuide(e.target.value)}
            placeholder="Qué tiene que hacer, con tus palabras."
          />
          <span className="block text-xs text-[var(--ink-soft)]">
            El paciente ve un ícono de ayuda y abre este texto. Dejalo vacío si no hace falta.
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 font-medium">¿Cada cuánto le pedimos que cargue?</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(PERIODICITY) as PeriodicityType[]).map((p) => {
              const Icon = PeriodicityIcon;
              return (
                <label
                  key={p}
                  className={[
                    'cursor-pointer rounded-[var(--radius-input)] border p-3 transition-all duration-200',
                    periodicityType === p ? 'border-[var(--sage)] bg-[var(--sage-soft)]' : 'border-[var(--line)]',
                  ].join(' ')}
                >
                  <input type="radio" className="sr-only" checked={periodicityType === p} onChange={() => setPeriodicityType(p)} />
                  <span className="flex items-center gap-2 font-medium">
                    <Icon type={p} />
                    {PERIODICITY[p].label}
                  </span>
                  <span className="mt-1 block text-sm text-[var(--ink-soft)]">{PERIODICITY[p].help}</span>
                </label>
              );
            })}
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
                  <button type="button" className="text-[var(--ink-soft)] transition-transform active:scale-90" onClick={() => moveField(i, -1)} aria-label="Subir">
                    <ArrowUp size={16} />
                  </button>
                  <button type="button" className="text-[var(--ink-soft)] transition-transform active:scale-90" onClick={() => moveField(i, 1)} aria-label="Bajar">
                    <ArrowDown size={16} />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="flex items-center gap-2 text-xs text-[var(--sage)]">
                    <FieldTypeIcon type={f.type} size={14} />
                    {FIELD_TYPE[f.type].label}
                  </p>
                  <Input
                    label="Cómo se lo preguntamos al paciente"
                    value={f.label}
                    onChange={(e) => updateField(i, { label: e.target.value })}
                  />
                  {f.type === 'select' ? (
                    <Input
                      label="Opciones (separadas por coma)"
                      value={
                        typeof f.config.optionsText === 'string'
                          ? f.config.optionsText
                          : ((f.config.options as string[]) ?? []).join(', ')
                      }
                      onChange={(e) => {
                        const optionsText = e.target.value;
                        updateField(i, {
                          config: {
                            ...f.config,
                            optionsText,
                            options: optionsText
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          },
                        });
                      }}
                    />
                  ) : null}
                  {f.type === 'yes_no' ? (
                    <p className="text-sm text-[var(--ink-soft)]">El paciente elige Sí o No con dos botones.</p>
                  ) : (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.required}
                        onChange={(e) => updateField(i, { required: e.target.checked })}
                      />
                      Obligatorio (no puede saltearlo)
                    </label>
                  )}
                </div>
                <button
                  type="button"
                  className="rounded-full p-2 text-[var(--danger)] transition-colors hover:bg-[var(--clay-soft)] disabled:opacity-30"
                  onClick={() => removeField(i)}
                  disabled={fields.length <= 1}
                  aria-label="Borrar pregunta"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-4 text-sm text-[var(--ink-soft)]">Agregar una pregunta</p>
          <div className="flex flex-wrap gap-2">
            {FIELD_TYPES.map((type) => (
              <Button key={type} variant="ghost" onClick={() => addField(type)}>
                <FieldTypeIcon type={type} size={14} /> {FIELD_TYPE[type].label}
              </Button>
            ))}
          </div>
        </div>

        <Button type="button" onClick={() => void save()} disabled={!name.trim() || saving}>
          {saving ? 'Guardando…' : 'Guardar. A partir de ahora usan esta versión; lo ya cargado queda.'}
        </Button>
      </div>
      <Sheet open={savedOpen} title="Plantilla guardada" onClose={() => setSavedOpen(false)}>
        <p>
          Quienes ya tenían este cuestionario pasan a esta versión. Lo que ya cargaron no se borra. Si alguien tiene otra
          plantilla, se cambia en su ficha.
        </p>
      </Sheet>
    </ProLayout>
  );
}
