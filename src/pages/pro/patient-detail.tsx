import { useEffect, useMemo, useState } from 'react';
import { NavLink, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { apiFetch, ApiClientError } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { ProLayout } from '@/components/layout/ProLayout';
import { WeekNav, WeekStrip } from '@/components/week-strip';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Sheet } from '@/components/ui/Sheet';
import { Avatar } from '@/components/avatar';
import { EntryReadout } from '@/components/entry-readout';
import { EntryNotes } from '@/components/entry-notes';
import { AdherenceRing } from '@/components/charts';
import { ImagePicker } from '@/components/image-picker';
import { DateRange } from '@/components/date-range';
import { FieldReports } from '@/components/field-reports';
import { PageSkeleton } from '@/components/skeleton';
import { MEMBER_ROLE, PERIODICITY, adherenceCopy } from '@/lib/labels';
import { ListToolbar, Pagination, SortHeader, usePagedSort, type SortDir } from '@/components/paged-list';
import { addDays, formatDateAR, formatDateISO, parseISODate, todayInAR } from '@shared/periodicity';
import { buildFieldReports, filterEntriesByDate } from '@shared/report';
import type {
  EntryDoc,
  FieldDefinition,
  PeriodicityType,
  ProfessionalNoteDoc,
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

const TABS = [
  { to: '', label: 'Ficha', end: true },
  { to: '/historial', label: 'Historial' },
  { to: '/equipo', label: 'Equipo' },
];

export function PatientDetailPage() {
  const { id, seccion } = useParams<{ id: string; seccion?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const workspace = me?.workspaceMemberships[0];
  const [patient, setPatient] = useState<{
    firstName: string;
    lastName: string;
    id: string;
    workspaceId: string;
    photoUrl?: string | null;
    archivedAt?: string | null;
  } | null>(null);
  const [week, setWeek] = useState<{ days: WeekDayInfo[]; periodicityType: PeriodicityType } | null>(null);
  const [entries, setEntries] = useState<Array<EntryDoc & { id: string }>>([]);
  const [templateVersion, setTemplateVersion] = useState<(TemplateVersionDoc & { id: string }) | null>(null);
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [templates, setTemplates] = useState<Array<TemplateDoc & { id: string; latestVersion?: TemplateVersionDoc & { id: string } }>>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [careTeam, setCareTeam] = useState<Array<{ id: string; memberUserId: string; canEdit: boolean }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [canEditNew, setCanEditNew] = useState(true);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState<Array<ProfessionalNoteDoc & { id: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [histSearch, setHistSearch] = useState('');
  const [histSort, setHistSort] = useState('date');
  const [histDir, setHistDir] = useState<SortDir>('desc');
  const [assigning, setAssigning] = useState(false);
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  const weekFrom = searchParams.get('semana') ?? '';
  const selectedDate = searchParams.get('dia') || todayInAR();
  const histFrom = searchParams.get('desde') || formatDateISO(addDays(new Date(), -27));
  const histTo = searchParams.get('hasta') || todayInAR();

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };

  const load = async () => {
    if (!id) return;
    const [detail, weekRes, entriesRes, notesRes] = await Promise.all([
      apiFetch<{
        patient: { firstName: string; lastName: string; id: string; workspaceId: string; photoUrl?: string | null; archivedAt?: string | null };
        assignment?: { templateId: string } | null;
        templateVersion: TemplateVersionDoc & { id: string };
        templateName?: string | null;
        careTeam: Array<{ id: string; memberUserId: string; canEdit: boolean }>;
      }>(`patients/${id}`),
      apiFetch<{ days: WeekDayInfo[]; periodicityType: PeriodicityType }>(
        `patients/${id}/week${weekFrom ? `?from=${weekFrom}` : ''}`,
      ),
      apiFetch<{ entries: Array<EntryDoc & { id: string }> }>(`patients/${id}/entries`),
      apiFetch<{ notes: Array<ProfessionalNoteDoc & { id: string }> }>(`patients/${id}/notes`),
    ]);
    setPatient(detail.patient);
    setTemplateVersion(detail.templateVersion);
    setTemplateName(detail.templateName ?? null);
    setSelectedTemplate(detail.assignment?.templateId ?? '');
    setCareTeam(detail.careTeam);
    setWeek(weekRes);
    setEntries(entriesRes.entries);
    setNotes(notesRes.notes);
    if (!searchParams.get('dia')) {
      const todayDay = weekRes.days.find((d) => d.isToday);
      setParam('dia', todayDay?.date ?? weekRes.days.find((d) => d.isExpected)?.date ?? weekRes.days[0]?.date ?? '');
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
    setLoading(true);
    load()
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, weekFrom]);

  const assignTemplate = async () => {
    if (!id || !selectedTemplate) return;
    setAssigning(true);
    try {
      const res = await apiFetch<{ unchanged: boolean; templateName: string }>(`patients/${id}/template`, {
        method: 'POST',
        body: JSON.stringify({ templateId: selectedTemplate }),
      });
      await load();
      setNotice({
        title: res.unchanged ? 'Sin cambios' : 'Cuestionario actualizado',
        body: res.unchanged
          ? `Esta persona ya usaba «${res.templateName}».`
          : `A partir de hoy usa «${res.templateName}». Lo ya cargado se conserva. Si querés otra plantilla, elegila de nuevo acá.`,
      });
    } catch (err) {
      setNotice({
        title: 'No se pudo cambiar',
        body: err instanceof ApiClientError ? err.message : 'Algo falló. Probá de nuevo.',
      });
    } finally {
      setAssigning(false);
    }
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

  const addNote = async (entryId: string, body: string) => {
    if (!id || !body.trim()) return;
    await apiFetch(`patients/${id}/notes`, { method: 'POST', body: JSON.stringify({ body, entryId }) });
    await load();
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('¿Borrar este comentario?')) return;
    await apiFetch(`notes/${noteId}`, { method: 'DELETE' });
    await load();
  };

  const toggleActive = async () => {
    if (!id || !patient) return;
    await apiFetch(`patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ archivedAt: patient.archivedAt ? null : new Date().toISOString() }),
    });
    await load();
  };

  const isAdmin = workspace?.role === 'admin' || me?.user.platformRole === 'global_admin';
  const canChangeTemplate =
    isAdmin || workspace?.role === 'professional';
  const fields = templateVersion?.fields as FieldDefinition[] | undefined;
  const last = entries[0];
  const filledDates = new Set(entries.map((e) => e.entryDate));
  const expected = week?.days.filter((d) => d.isExpected && !d.isFuture).length ?? 0;
  const filledWeek = week?.days.filter((d) => d.isFilled).length ?? 0;
  const dayEntries = entries.filter((e) => e.entryDate === selectedDate);
  const notesFor = (entryId: string) => notes.filter((n) => n.entryId === entryId);
  const filteredHistory = filterEntriesByDate(entries, histFrom, histTo);
  const reports = useMemo(
    () => (fields ? buildFieldReports(filterEntriesByDate(entries, histFrom, histTo), fields) : []),
    [entries, fields, histFrom, histTo],
  );
  const histPaged = usePagedSort(filteredHistory, {
    search: histSearch,
    match: (e, q) => `${e.entryDate} ${JSON.stringify(e.values)}`.toLowerCase().includes(q),
    sortKey: histSort,
    sortDir: histDir,
    value: (e, key) => (key === 'updated' ? e.updatedAt : e.entryDate),
  });

  let daysWithout = 0;
  if (last) {
    const lastD = parseISODate(last.entryDate);
    const today = parseISODate(todayInAR());
    daysWithout = Math.max(0, Math.round((today.getTime() - lastD.getTime()) / 86400000));
  }

  if (loading || !patient) {
    return (
      <ProLayout>
        <PageSkeleton />
      </ProLayout>
    );
  }

  const fullName = `${patient.firstName} ${patient.lastName}`;
  const base = `/pro/pacientes/${id}`;
  const section = seccion ?? '';

  if (section === 'notas') {
    return <Navigate to={`${base}/historial`} replace />;
  }

  return (
    <ProLayout workspaceName={workspace?.workspace.name}>
      <div className="mb-6 flex flex-wrap items-start gap-4">
        <Avatar name={fullName} src={pendingPhoto ?? patient.photoUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl">{fullName}</h1>
          {patient.archivedAt ? <p className="text-sm text-[var(--warn)]">Está inactivo. No aparece en la lista de activos.</p> : null}
          <p className="text-sm text-[var(--ink-soft)]">
            {last
              ? `Última carga: ${formatDateAR(last.entryDate)}`
              : 'Todavía no cargó nunca. Cuando lo haga, aparece acá entero.'}
          </p>
          {daysWithout >= 2 && last ? (
            <p className="text-sm text-[var(--warn)]">Lleva {daysWithout} días sin cargar.</p>
          ) : null}
        </div>
        <Button variant={patient.archivedAt ? 'secondary' : 'ghost'} onClick={() => void toggleActive()}>
          {patient.archivedAt ? 'Activar' : 'Desactivar'}
        </Button>
      </div>

      <nav className="mb-6 flex flex-wrap gap-1 rounded-full bg-[var(--empty)] p-1">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={`${base}${tab.to}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`}
            end={tab.end}
            className={({ isActive }) =>
              [
                'flex-1 rounded-full px-3 py-2 text-center text-sm transition-colors hover:no-underline',
                isActive ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm' : 'text-[var(--ink-soft)]',
              ].join(' ')
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {section === '' || section === undefined ? (
        <>
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

          <Card className="mb-6">
            <p className="mb-3 font-display text-lg">Reportería</p>
            <DateRange from={histFrom} to={histTo} onChange={(a, b) => {
              const next = new URLSearchParams(searchParams);
              next.set('desde', a);
              next.set('hasta', b);
              setSearchParams(next, { replace: true });
            }} />
          </Card>
          <div className="mb-8">
            <FieldReports reports={reports} />
          </div>

          {week ? (
            <div className="mb-6">
              <p className="mb-2 text-sm text-[var(--ink-soft)]">Tocá un día para leer lo que escribió ese día.</p>
              <WeekNav
                isCurrentWeek={!weekFrom}
                onPrev={() => {
                  const d = weekFrom ? parseISODate(weekFrom) : new Date();
                  setParam('semana', formatDateISO(addDays(d, -7)));
                }}
                onNext={() => {
                  const baseDate = weekFrom ? parseISODate(weekFrom) : new Date();
                  setParam('semana', formatDateISO(addDays(baseDate, 7)));
                }}
                onToday={() => setParam('semana', '')}
              />
              <WeekStrip
                days={week.days}
                periodicityType={week.periodicityType}
                selectedDate={selectedDate}
                onSelectDate={(date) => setParam('dia', date)}
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
                  <EntryNotes
                    notes={notesFor(entry.id)}
                    onAdd={(body) => addNote(entry.id, body)}
                    onDelete={deleteNote}
                  />
                </Card>
              ))
            )}
          </div>

          {canChangeTemplate ? (
            <Card className="mb-8 space-y-3" data-tour="patient-template">
              <h2 className="font-display text-lg">Cambiar el cuestionario</h2>
              <p className="text-sm text-[var(--ink-soft)]">Lo ya cargado se conserva. A partir de hoy usa la plantilla nueva. Si no elegís nada, los nuevos usan la plantilla marcada por defecto en Plantillas.</p>
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
              <Button type="button" onClick={() => void assignTemplate()} disabled={!selectedTemplate || assigning}>
                {assigning ? 'Guardando…' : 'Usar esta plantilla'}
              </Button>
              {templateVersion ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  Ahora usa: {templateName ?? 'plantilla actual'} · {PERIODICITY[templateVersion.periodicityType].label}
                </p>
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">Todavía no tiene cuestionario asignado.</p>
              )}
            </Card>
          ) : null}
        </>
      ) : null}

      {section === 'historial' ? (
        <>
          <DateRange
            from={histFrom}
            to={histTo}
            onChange={(a, b) => {
              const next = new URLSearchParams(searchParams);
              next.set('desde', a);
              next.set('hasta', b);
              setSearchParams(next, { replace: true });
            }}
          />
          <h2 className="font-display mb-3 mt-6 text-xl">Historial</h2>
          <p className="mb-3 text-sm text-[var(--ink-soft)]">Filtrado por fechas. Todo lo que escribió, sin recortar. El comentario tuyo va en cada carga.</p>
          <ListToolbar search={histSearch} onSearch={setHistSearch} placeholder="Buscar en las cargas..." />
          <SortHeader
            columns={[
              { key: 'date', label: 'Fecha' },
              { key: 'updated', label: 'Último cambio' },
            ]}
            sortKey={histSort}
            sortDir={histDir}
            onSort={(key) => {
              if (histSort === key) setHistDir((d) => (d === 'asc' ? 'desc' : 'asc'));
              else {
                setHistSort(key);
                setHistDir('desc');
              }
            }}
          />
          <div className="space-y-3">
            {histPaged.pageItems.map((entry) => (
              <Card key={entry.id} className="anim-in">
                <p className="mb-2 text-sm font-medium">{formatDateAR(entry.entryDate)}</p>
                <EntryReadout fields={fields} entry={entry} />
                <EntryNotes
                  notes={notesFor(entry.id)}
                  onAdd={(body) => addNote(entry.id, body)}
                  onDelete={deleteNote}
                />
              </Card>
            ))}
            {histPaged.total === 0 ? (
              <Card>
                <p className="text-[var(--ink-soft)]">Sin registros en ese rango.</p>
              </Card>
            ) : null}
          </div>
          <Pagination page={histPaged.page} pageCount={histPaged.pageCount} total={histPaged.total} onPage={histPaged.setPage} />
        </>
      ) : null}

      {section === 'equipo' && isAdmin ? (
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
      ) : null}

      {section === 'equipo' && !isAdmin ? (
        <Card>
          <p className="text-[var(--ink-soft)]">Solo quien administra el espacio puede cambiar el equipo de atención.</p>
        </Card>
      ) : null}

      {section && !['historial', 'equipo'].includes(section) ? (
        <Card>
          <p>No encontramos esa sección.</p>
          <Button className="mt-3" variant="secondary" onClick={() => navigate(base)}>
            Volver a la ficha
          </Button>
        </Card>
      ) : null}

      <Sheet open={!!notice} title={notice?.title ?? ''} onClose={() => setNotice(null)}>
        <p>{notice?.body}</p>
      </Sheet>
    </ProLayout>
  );
}
