import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiClientError } from '@/lib/api';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { WeekNav, WeekStrip } from '@/components/week-strip';
import { EntryForm, useEntryFormState } from '@/components/entry-form';
import { EntryReadout } from '@/components/entry-readout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { HelpTip } from '@/components/help-tip';
import { PageSkeleton } from '@/components/skeleton';
import { addDays, formatDateAR, formatDateISO, parseISODate, todayInAR } from '@shared/periodicity';
import type { EntryDoc, PeriodicityType, TemplateVersionDoc, WeekDayInfo } from '@shared/types';

export function PatientTodayPage() {
  const { me } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeWsId, setActiveWsId] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [week, setWeek] = useState<{ days: WeekDayInfo[]; periodicityType: PeriodicityType } | null>(null);
  const [templateVersion, setTemplateVersion] = useState<TemplateVersionDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [existingEntries, setExistingEntries] = useState<Array<EntryDoc & { id: string }>>([]);
  const [showOverwrite, setShowOverwrite] = useState(false);
  const [updateEntryId, setUpdateEntryId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [dayEntries, setDayEntries] = useState<Array<EntryDoc & { id: string }>>([]);

  const memberships = me?.patientMemberships ?? [];
  const workspaces = memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name }));
  const today = todayInAR();
  const weekFrom = searchParams.get('semana') ?? '';
  const selectedDate = searchParams.get('dia') || today;
  const canMutate = selectedDate === today;

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    if (memberships.length && !activeWsId) {
      setActiveWsId(memberships[0]!.workspace.id);
    }
  }, [memberships, activeWsId]);

  useEffect(() => {
    const membership = memberships.find((m) => m.workspace.id === activeWsId);
    if (membership) setPatientId(membership.id);
  }, [activeWsId, memberships]);

  const loadWeek = async () => {
    if (!patientId) return;
    const fromParam = weekFrom ? `?from=${weekFrom}` : '';
    const res = await apiFetch<{
      days: WeekDayInfo[];
      periodicityType: PeriodicityType;
      templateVersion: TemplateVersionDoc;
    }>(`patients/${patientId}/week${fromParam}`);
    setWeek(res);
    setTemplateVersion(res.templateVersion);
    if (!searchParams.get('dia')) {
      const todayDay = res.days.find((d) => d.isToday);
      setParam('dia', todayDay?.date ?? res.days.find((d) => d.isExpected)?.date ?? res.days[0]?.date ?? '');
    }
  };

  const loadDayEntries = async () => {
    if (!patientId) return;
    const res = await apiFetch<{ entries: Array<EntryDoc & { id: string }> }>(`patients/${patientId}/entries`);
    setDayEntries(res.entries.filter((e) => e.entryDate === selectedDate));
  };

  useEffect(() => {
    loadWeek().catch(console.error);
  }, [patientId, weekFrom]);

  const { values, setValues, errors, validate } = useEntryFormState(templateVersion?.fields ?? []);

  useEffect(() => {
    loadDayEntries().catch(console.error);
    setEditing(false);
    setValues({});
  }, [selectedDate, patientId]);

  const handleSave = async (mode?: 'update' | 'new') => {
    if (!patientId || !templateVersion || !validate()) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        workspacePatientId: patientId,
        entryDate: selectedDate,
        values,
      };
      if (mode === 'update' && updateEntryId) {
        body.updateEntryId = updateEntryId;
      }
      if (mode === 'new') {
        body.forceNew = true;
      }

      await apiFetch('entries', { method: 'POST', body: JSON.stringify(body) });
      setShowOverwrite(false);
      setEditing(false);
      setValues({});
      await loadWeek();
      await loadDayEntries();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        const payload = err.payload as { existingEntries: Array<EntryDoc & { id: string }> };
        setExistingEntries(payload.existingEntries ?? []);
        setUpdateEntryId(payload.existingEntries?.[0]?.id ?? null);
        setShowOverwrite(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('¿Borrar lo de hoy? No se puede deshacer.')) return;
    await apiFetch(`entries/${entryId}`, { method: 'DELETE' });
    await loadWeek();
    await loadDayEntries();
  };

  const membership = memberships.find((m) => m.workspace.id === activeWsId);
  const greeting = membership ? `Hola, ${membership.firstName}.` : 'Hola.';
  const selectedDay = week?.days.find((d) => d.date === selectedDate);
  const showForm = editing || (!selectedDay?.isFilled && !selectedDay?.isFuture);

  const shiftWeek = (delta: number) => {
    const base = weekFrom ? parseISODate(weekFrom) : new Date();
    setParam('semana', formatDateISO(addDays(base, delta * 7)));
  };

  if (!memberships.length) {
    return (
      <PatientLayout>
        <Card>
          <p className="text-[var(--ink-soft)]">Todavía no estás vinculado a ningún consultorio. Pedile el link a tu profesional.</p>
        </Card>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout
      workspaceName={membership?.workspace.name}
      workspaceImageUrl={membership?.workspace.imageUrl}
      workspaces={workspaces.length > 1 ? workspaces : undefined}
      activeWorkspaceId={activeWsId}
      onWorkspaceChange={setActiveWsId}
    >
      <div className="mb-6">
        <h1 className="font-display flex items-center gap-2 text-2xl text-[var(--ink)]">
          {greeting}
          {templateVersion?.patientGuide ? (
            <HelpTip title="Qué te pedimos hoy" text={templateVersion.patientGuide} />
          ) : null}
        </h1>
        <p className="text-sm text-[var(--ink-soft)]">{formatDateAR(selectedDate)}</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">Tres toques: ánimo, medicación si aplica, y una nota si querés.</p>
      </div>

      {week ? (
        <div className="mb-4">
          <WeekNav
            isCurrentWeek={!weekFrom}
            onPrev={() => shiftWeek(-1)}
            onNext={() => shiftWeek(1)}
            onToday={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('semana');
              next.set('dia', today);
              setSearchParams(next, { replace: true });
            }}
          />
          <WeekStrip
            days={week.days}
            periodicityType={week.periodicityType}
            selectedDate={selectedDate}
            onSelectDate={(date) => setParam('dia', date)}
          />
        </div>
      ) : (
        <PageSkeleton />
      )}

      {selectedDay?.isFilled && !editing ? (
        <div className="mb-6 space-y-3">
          {dayEntries.map((e) => (
            <Card key={e.id}>
              <EntryReadout fields={templateVersion?.fields} entry={e} />
              {canMutate ? (
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setValues(e.values);
                      setUpdateEntryId(e.id);
                      setEditing(true);
                    }}
                  >
                    Editar este día
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(e.id)}>
                    Borrar
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--ink-soft)]">
                  Este día ya quedó registrado. Si hay un error, hablalo con tu profesional.
                </p>
              )}
            </Card>
          ))}
        </div>
      ) : null}

      {showForm && templateVersion && (canMutate || !selectedDay?.isFilled) && !selectedDay?.isFuture ? (
        <>
          {!canMutate && !selectedDay?.isFilled ? (
            <p className="mb-3 text-sm text-[var(--ink-soft)]">Estás completando un día que faltaba.</p>
          ) : null}
          {canMutate || !selectedDay?.isFilled ? (
            <>
              {templateVersion.patientGuide ? (
                <p className="mb-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
                  <HelpTip title="Qué te pedimos hoy" text={templateVersion.patientGuide} />
                  Tocá el ícono si no sabés cómo completar.
                </p>
              ) : null}
              <EntryForm fields={templateVersion.fields} values={values} onChange={setValues} errors={errors} />
              <Button className="mt-8" fullWidth onClick={() => handleSave(updateEntryId ? 'update' : undefined)} disabled={saving}>
                Guardar
              </Button>
            </>
          ) : null}
        </>
      ) : null}

      <Sheet
        open={showOverwrite}
        title="Ya hay un registro para este período"
        onClose={() => setShowOverwrite(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowOverwrite(false)}>
              Volver
            </Button>
            {canMutate ? (
              <Button variant="secondary" onClick={() => handleSave('update')}>
                Actualizar el de hoy
              </Button>
            ) : null}
            <Button onClick={() => handleSave('new')}>Dejar una nueva</Button>
          </>
        }
      >
        <p>Si seguís, podés actualizar lo que ya cargaste o agregar un registro nuevo.</p>
        {existingEntries.length > 0 ? (
          <p className="mt-2 text-sm">Registros en este período: {existingEntries.length}</p>
        ) : null}
      </Sheet>
    </PatientLayout>
  );
}
