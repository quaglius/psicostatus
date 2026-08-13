import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { WeekStrip } from '@/components/week-strip';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatDateTimeAR, formatEntryPreview } from '@shared/periodicity';
import type {
  EntryDoc,
  PeriodicityType,
  TemplateDoc,
  TemplateVersionDoc,
  WeekDayInfo,
  WorkspaceMemberDoc,
} from '@shared/types';

interface MemberOption {
  id: string;
  userId: string;
  email: string;
  role: string;
}

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [patient, setPatient] = useState<{ firstName: string; lastName: string; id: string; workspaceId: string } | null>(null);
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

  const load = async () => {
    if (!id) return;
    const [detail, weekRes, entriesRes] = await Promise.all([
      apiFetch<{
        patient: { firstName: string; lastName: string; id: string; workspaceId: string };
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

    if (workspace) {
      const [tplRes, memRes] = await Promise.all([
        apiFetch<{ templates: typeof templates }>(`workspaces/${detail.patient.workspaceId}/templates`),
        apiFetch<{ members: Array<WorkspaceMemberDoc & { id: string; email: string }> }>(
          `workspaces/${detail.patient.workspaceId}/members`,
        ),
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

  const isAdmin = workspace?.role === 'admin' || me?.user.platformRole === 'global_admin';

  if (!patient) return <ProLayout><p className="text-[var(--ink-soft)]">Cargando...</p></ProLayout>;

  const entriesByDate = entries.reduce<Record<string, Array<EntryDoc & { id: string }>>>((acc, e) => {
    (acc[e.entryDate] ??= []).push(e);
    return acc;
  }, {});

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <h1 className="font-display mb-6 text-3xl">
        {patient.firstName} {patient.lastName}
      </h1>

      {week ? (
        <div className="mb-6">
          <div className="mb-2 flex gap-2">
            <Button variant="ghost" onClick={() => {
              const d = new Date(weekFrom || new Date());
              d.setDate(d.getDate() - 7);
              setWeekFrom(d.toISOString().split('T')[0]!);
            }}>
              ← Semana anterior
            </Button>
            <Button variant="ghost" onClick={() => setWeekFrom('')}>Esta semana</Button>
          </div>
          <WeekStrip
            days={week.days}
            periodicityType={week.periodicityType}
            selectedDate={week.days.find((d) => d.isToday)?.date ?? week.days[0]!.date}
            onSelectDate={() => {}}
          />
        </div>
      ) : null}

      {isAdmin ? (
        <div className="mb-8 grid gap-4 md:grid-cols-2">
          <Card className="space-y-3">
            <h2 className="font-display text-lg">Cambiar plantilla</h2>
            <p className="text-sm text-[var(--ink-soft)]">Lo ya cargado se conserva. A partir de hoy usa la nueva.</p>
            <select
              className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Elegir plantilla</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <Button onClick={assignTemplate} disabled={!selectedTemplate}>Asignar</Button>
          </Card>

          <Card className="space-y-3">
            <h2 className="font-display text-lg">Equipo de cuidado</h2>
            {careTeam.map((c) => {
              const m = members.find((x) => x.userId === c.memberUserId);
              return (
                <p key={c.id} className="text-sm">
                  {m?.email ?? c.memberUserId} — {c.canEdit ? 'edición' : 'solo lectura'}
                </p>
              );
            })}
            <select
              className="w-full rounded-[var(--radius-input)] border border-[var(--line)] bg-[var(--surface)] px-3 py-2"
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
            >
              <option value="">Agregar profesional</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>{m.email}</option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={canEditNew} onChange={(e) => setCanEditNew(e.target.checked)} />
              Puede editar
            </label>
            <Button variant="secondary" onClick={addToCareTeam} disabled={!newMemberId}>Agregar</Button>
          </Card>
        </div>
      ) : null}

      <h2 className="font-display mb-3 text-xl">Historial</h2>
      <div className="space-y-4">
        {Object.entries(entriesByDate).map(([date, dayEntries]) => (
          <div key={date}>
            <p className="mb-2 text-sm font-medium text-[var(--ink-soft)]">{date}</p>
            {dayEntries.map((entry) => (
              <Card key={entry.id} className="mb-2">
                <p className="font-medium">{formatEntryPreview(entry.values)}</p>
                <p className="text-xs text-[var(--ink-soft)]">Cargado: {formatDateTimeAR(entry.createdAt)}</p>
              </Card>
            ))}
          </div>
        ))}
        {entries.length === 0 ? (
          <Card><p className="text-[var(--ink-soft)]">Sin registros todavía.</p></Card>
        ) : null}
      </div>

      {templateVersion ? (
        <p className="mt-4 text-sm text-[var(--ink-soft)]">Plantilla activa: v{templateVersion.version} ({templateVersion.periodicityType})</p>
      ) : null}
    </ProLayout>
  );
}
