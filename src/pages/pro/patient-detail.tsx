import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { WeekNav, WeekStrip } from '@/components/week-strip';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/avatar';
import { EntryReadout } from '@/components/entry-readout';
import { AdherenceRing, Sparkline } from '@/components/charts';
import { ImagePicker } from '@/components/image-picker';
import { MEMBER_ROLE, PERIODICITY, adherenceCopy } from '@/lib/labels';
import { addDays, formatDateAR, formatDateISO, parseISODate, todayInAR } from '@shared/periodicity';
import type {
  EntryDoc,
  FieldDefinition,
  PeriodicityType,
  TemplateDoc,
  TemplateVersionDoc,
  WeekDayInfo,
  WorkspaceMemberRole,
} from '@shared/types';

interface MemberOption {
  userId: string;
  email: string;
  displayName?: string | null;
  role: WorkspaceMemberRole;
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [patient, setPatient] = useState<{
    firstName: string;
    lastName: string;
    id: string;
    workspaceId: string;
    photoUrl?: string | null;
  } | null>(null);
  const [week, setWeek] = useState<{ days: WeekDayInfo[]; periodicityType: PeriodicityType } | null>(null);
  const [entries, setEntries] = useState<Array<EntryDoc & { id: string }>>([]);
  const [templateVersion, setTemplateVersion] = useState<(TemplateVersionDoc & { id: string }) | null>(null);
  const [templates, setTemplates] = useState<Array<TemplateDoc & { id: string; latestVersion?: TemplateVersionDoc & { id: string } }>>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [careTeam, setCareTeam] = useState<Array<{ id: string; memberUserId: string; canEdit: boolean }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [canEditNew, setCanEditNew] = useState(true);
  const [weekFrom, setWeekFrom] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayInAR());
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    const [detail, weekRes, entriesRes] = await Promise.all([
      apiFetch<{
        patient: { firstName: string; lastName: string; id: string; workspaceId: string; photoUrl?: string | null };
        templateVersion: TemplateVersionDoc & { id: string };
        careTeam: Array<{ id: string; memberUserId: string; canEdit: boolean }>;
      }>(`patients/${id}`),
      apiFetch<{ days: WeekDayInfo[]; periodicityType: PeriodicityType }>(
        `patients/${id}/week${weekFrom ? `?from=${weekFrom}` : ''}`,
      ),
      apiFetch<{ entries: Array<EntryDoc & { id: string }> }>(`patients/${id}/entries`),
    ]);
    setPatient(detail.patient);
    setTemplateVersion(detail.templateVersion);
    setCareTeam(detail.careTeam);
    setWeek(weekRes);
    setEntries(entriesRes.entries);
    if (!weekFrom) {
      const today = weekRes.days.find((d) => d.isToday);
      if (today) setSelectedDate(today.date);
    }

    if (workspace) {
      const [tplRes, memRes] = await Promise.all([
        apiFetch<{ templates: typeof templates }>(`workspaces/${detail.patient.workspaceId}/templates`),
        apiFetch<{ members: MemberOption[] }>(`workspaces/${detail.patient.workspaceId}/members`),
      ]);
      setTemplates(tplRes.templates);
      setMembers(memRes.members);
    }
  };

  useEffect(() => {
    load().catch(console.error);
  }, [id, weekFrom]);

  const assignTemplate = async () => {
    if (!id || !selectedTemplate) return;
    await apiFetch(`patients/${id}/template`, {
      method: 'POST',
      body: JSON.stringify({ templateId: selectedTemplate }),
    });
    await load();
  };

  const addToCareTeam = async () => {
    if (!id || !newMemberId) return;
    await apiFetch(`patients/${id}/care-team`, {
      method: 'POST',
      body: JSON.stringify({ memberUserId: newMemberId, canEdit: canEditNew }),
    });
    setNewMemberId('');
    await load();
  };

  const savePhoto = async () => {
    if (!id || !pendingPhoto) return;
    await apiFetch('uploads', {
      method: 'POST',
      body: JSON.stringify({ purpose: 'patient', targetId: id, dataUrl: pendingPhoto }),
    });
    setPendingPhoto(null);
    await load();
  };

  const isAdmin = workspace?.role === 'admin' || me?.user.platformRole === 'global_admin';
  const fields = templateVersion?.fields as FieldDefinition[] | undefined;
  const last = entries[0];
  const filledDates = new Set(entries.map((e) => e.entryDate));
  const expected = week?.days.filter((d) => d.isExpected && !d.isFuture).length ?? 0;
  const filledWeek = week?.days.filter((d) => d.isFilled).length ?? 0;
  const scaleField = fields?.find((f) => f.type === 'scale');
  const scaleSeries = scaleField
    ? [...entries].reverse().map((e) => Number(e.values[scaleField.id])).filter((n) => !Number.isNaN(n))
    : [];
  const dayEntries = entries.filter((e) => e.entryDate === selectedDate);
  const restEntries = entries.filter((e) => e.entryDate !== selectedDate);

  let daysWithout = 0;
  if (last) {
    const lastD = parseISODate(last.entryDate);
    const today = parseISODate(todayInAR());
    daysWithout = Math.max(0, Math.round((today.getTime() - lastD.getTime()) / 86400000));
  }

  if (!patient) return <ProLayout><p className="text-[var(--ink-soft)]">Cargando la ficha...</p></ProLayout>;

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const isCurrentWeek = !weekFrom;

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <Avatar name={fullName} src={pendingPhoto ?? patient.photoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl">{fullName}</h1>
          <p className="text-sm text-[var(--ink-soft)]">
            {last
              ? `Última carga: ${formatDateAR(last.entryDate)}`
              : 'Todavía no cargó nunca. Cuando lo haga, aparece acá entero.'}
          </p>
          {daysWithout >= 2 && last ? (
            <p className="text-sm text-[var(--warn)]">Lleva {daysWithout} días sin cargar.</p>
          ) : null}
        </div>
      </div>

      {isAdmin ? (
        <Card className="mb-6 space-y-3">
          <ImagePicker
            label="Foto de perfil"
            help="Si la persona no cargó una, podés ponerla vos. Si no hay, se ven las iniciales."
            name={fullName}
            value={pendingPhoto ?? patient.photoUrl}
            onChange={setPendingPhoto}
          />
          {pendingPhoto ? <Button onClick={savePhoto}>Guardar foto</Button> : null}
        </Card>
      ) : null}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Card>
          <AdherenceRing percent={expected ? Math.round((filledWeek / expected) * 100) : 0} label={adherenceCopy(filledWeek, expected)} />
        </Card>
        <Card>
          <p className="font-display text-3xl">{entries.length}</p>
          <p className="text-sm text-[var(--ink-soft)]">Registros guardados en total.</p>
        </Card>
        <Card>
          <p className="font-display text-3xl">{filledDates.size}</p>
          <p className="text-sm text-[var(--ink-soft)]">Días distintos con al menos una carga.</p>
        </Card>
      </div>

      {scaleSeries.length > 1 && scaleField ? (
        <Card className="mb-8">
          <Sparkline
            title={scaleField.label}
            help="Cómo fue cambiando el número a lo largo del tiempo. Cada punto es una carga."
            values={scaleSeries}
          />
        </Card>
      ) : null}

      {week ? (
        <div className="mb-6">
          <p className="mb-2 text-sm text-[var(--ink-soft)]">Tocá un día para leer lo que escribió ese día.</p>
          <WeekNav
            isCurrentWeek={isCurrentWeek}
            onPrev={() => {
              const d = new Date(weekFrom || new Date());
              d.setDate(d.getDate() - 7);
              setWeekFrom(formatDateISO(d));
            }}
            onNext={() => {
              const base = weekFrom ? parseISODate(weekFrom) : new Date();
              setWeekFrom(formatDateISO(addDays(base, 7)));
            }}
            onToday={() => setWeekFrom('')}
          />
          <WeekStrip
            days={week.days}
            periodicityType={week.periodicityType}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>
      ) : null}

      <h2 className="font-display mb-3 text-xl">{formatDateAR(selectedDate)}</h2>
      <div className="mb-8 space-y-3">
        {dayEntries.length === 0 ? (
          <Card>
            <p className="text-[var(--ink-soft)]">Ese día no hay carga. El círculo vacío en la cinta significa que se esperaba y no llegó.</p>
          </Card>
        ) : (
          dayEntries.map((entry) => (
            <Card key={entry.id}>
              <EntryReadout fields={fields} entry={entry} />
            </Card>
          ))
        )}
      </div>

      {isAdmin ? (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="font-display text-lg">Cambiar el cuestionario</h2>
            <p className="text-sm text-[var(--ink-soft)]">Lo ya cargado se conserva. A partir de hoy usa la plantilla nueva.</p>
            <select
              className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Elegir plantilla</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <Button onClick={assignTemplate} disabled={!selectedTemplate}>
              Usar esta plantilla
            </Button>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-display text-lg">Quién la atiende</h2>
            {careTeam.map((c) => {
              const m = members.find((x) => x.userId === c.memberUserId);
              return (
                <p key={c.id} className="text-sm">
                  {m?.displayName ?? m?.email ?? 'Persona del equipo'} — {c.canEdit ? 'puede editar' : 'solo mira'}
                </p>
              );
            })}
            <select
              className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
            >
              <option value="">Agregar a alguien del equipo</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.displayName ?? m.email} ({MEMBER_ROLE[m.role].label})
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={canEditNew} onChange={(e) => setCanEditNew(e.target.checked)} />
              Puede editar (si no, solo mira)
            </label>
            <Button variant="secondary" onClick={addToCareTeam} disabled={!newMemberId}>
              Agregar
            </Button>
          </Card>
        </div>
      ) : null}

      <h2 className="font-display mb-3 text-xl">Historial completo</h2>
      <p className="mb-3 text-sm text-[var(--ink-soft)]">Todo lo que escribió, sin recortar.</p>
      <div className="space-y-3">
        {restEntries.map((entry) => (
          <Card key={entry.id}>
            <p className="mb-2 text-sm font-medium">{formatDateAR(entry.entryDate)}</p>
            <EntryReadout fields={fields} entry={entry} />
          </Card>
        ))}
        {entries.length === 0 ? (
          <Card>
            <p className="text-[var(--ink-soft)]">Sin registros todavía.</p>
          </Card>
        ) : null}
      </div>

      {templateVersion ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">
          Cuestionario activo: {PERIODICITY[templateVersion.periodicityType].label}
        </p>
      ) : null}
    </ProLayout>
  );
}
