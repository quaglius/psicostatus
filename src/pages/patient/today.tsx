import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, ApiClientError } from '@/lib/api';
import { PatientLayout } from '@/components/layout/PatientLayout';
import { WeekStrip } from '@/components/week-strip';
import { EntryForm, useEntryFormState } from '@/components/entry-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { addDays, formatDateAR, formatDateISO, parseISODate } from '@shared/periodicity';
import type { EntryDoc, PeriodicityType, TemplateVersionDoc, WeekDayInfo } from '@shared/types';

export function PatientTodayPage() {
  const { me } = useAuth();
  const [activeWsId, setActiveWsId] = useState<string>('');
  const [patientId, setPatientId] = useState<string>('');
  const [week, setWeek] = useState<{ days: WeekDayInfo[]; periodicityType: PeriodicityType } | null>(null);
  const [templateVersion, setTemplateVersion] = useState<TemplateVersionDoc | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateISO(new Date()));
  const [weekFrom, setWeekFrom] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingEntries, setExistingEntries] = useState<Array<EntryDoc & { id: string }>>([]);
  const [showOverwrite, setShowOverwrite] = useState(false);
  const [updateEntryId, setUpdateEntryId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [dayEntries, setDayEntries] = useState<Array<EntryDoc & { id: string }>>([]);

  const memberships = me?.patientMemberships ?? [];
  const workspaces = memberships.map((m) => ({ id: m.workspace.id, name: m.workspace.name }));

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
    if (!weekFrom) {
      const today = res.days.find((d) => d.isToday);
      if (today) setSelectedDate(today.date);
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

  useEffect(() => {
    loadDayEntries().catch(console.error);
    setEditing(false);
    setValues({});
  }, [selectedDate, patientId]);

  const { values, setValues, errors, validate } = useEntryFormState(templateVersion?.fields ?? []);

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

  const membership = memberships.find((m) => m.workspace.id === activeWsId);
  const greeting = membership ? `Hola, ${membership.firstName}.` : 'Hola.';
  const selectedDay = week?.days.find((d) => d.date === selectedDate);
  const showForm = editing || (!selectedDay?.isFilled && !selectedDay?.isFuture);

  const shiftWeek = (delta: number) => {
    const base = weekFrom ? parseISODate(weekFrom) : new Date();
    const monday = addDays(base, delta * 7);
    setWeekFrom(formatDateISO(monday));
  };

  if (!memberships.length) {
    return (
      <PatientLayout>
        <Card>
          <p className="text-[var(--ink-soft)]">Todavía no estás vinculado a ningún consultorio.</p>
        </Card>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout
      workspaceName={membership?.workspace.name}
      workspaces={workspaces.length > 1 ? workspaces : undefined}
      activeWorkspaceId={activeWsId}
      onWorkspaceChange={setActiveWsId}
    >
      <div className="mb-6">
        <h1 className="font-display text-2xl text-[var(--ink)]">{greeting}</h1>
        <p className="text-sm text-[var(--ink-soft)]">{formatDateAR(selectedDate)}</p>
      </div>

      {week ? (
        <div className="mb-4">
          <div className="mb-2 flex justify-between">
            <button type="button" className="text-sm text-[var(--sage)]" onClick={() => shiftWeek(-1)} aria-label="Semana anterior">←</button>
            <button type="button" className="text-sm text-[var(--sage)]" onClick={() => setWeekFrom('')}>Hoy</button>
            <button type="button" className="text-sm text-[var(--sage)]" onClick={() => shiftWeek(1)} aria-label="Semana siguiente">→</button>
          </div>
          <WeekStrip
            days={week.days}
            periodicityType={week.periodicityType}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      ) : null}

      {selectedDay?.isFilled && !editing ? (
        <Card className="mb-6">
          <p className="text-[var(--ink-soft)]">Ya cargaste para este día.</p>
          {dayEntries.map((e) => (
            <div key={e.id} className="mt-2">
              <p className="font-medium">{String(e.values.fld_faces ?? e.values.fld_mood_scale ?? 'Registro')}</p>
              <p className="text-xs text-[var(--ink-soft)]">
                Cargado: {new Date(e.createdAt).toLocaleString('es-AR')}
              </p>
            </div>
          ))}
          <Button className="mt-4" variant="secondary" onClick={() => setEditing(true)}>
            Editar este día
          </Button>
        </Card>
      ) : null}

      {showForm && templateVersion ? (
        <>
          <EntryForm fields={templateVersion.fields} values={values} onChange={setValues} errors={errors} />
          <Button className="mt-8" fullWidth onClick={() => handleSave()} disabled={saving || selectedDay?.isFuture}>
            Guardar
          </Button>
        </>
      ) : null}

      <Sheet
        open={showOverwrite}
        title="Ya hay un registro para este período"
        onClose={() => setShowOverwrite(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowOverwrite(false)}>Volver</Button>
            <Button variant="secondary" onClick={() => handleSave('update')}>Actualizar el anterior</Button>
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
