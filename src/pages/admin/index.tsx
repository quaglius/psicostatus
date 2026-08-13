import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDateTimeAR, formatEntryPreview } from '@shared/periodicity';
import { WORKSPACE_KIND } from '@/lib/labels';
import type { EntryDoc, UserDoc, WorkspaceDoc } from '@shared/types';

export function AdminPage() {
  const [overview, setOverview] = useState<{ users: number; workspaces: number; patients: number; entries: number } | null>(null);
  const [users, setUsers] = useState<Array<UserDoc & { id: string }>>([]);
  const [workspaces, setWorkspaces] = useState<Array<WorkspaceDoc & { id: string }>>([]);
  const [entries, setEntries] = useState<Array<EntryDoc & { id: string }>>([]);
  const [tab, setTab] = useState<'overview' | 'users' | 'workspaces' | 'entries'>('overview');

  useEffect(() => {
    apiFetch<typeof overview>('admin/overview').then(setOverview);
    apiFetch<{ users: typeof users }>('admin/users').then((r) => setUsers(r.users));
    apiFetch<{ workspaces: typeof workspaces }>('admin/workspaces').then((r) => setWorkspaces(r.workspaces));
    apiFetch<{ entries: typeof entries }>('admin/entries').then((r) => setEntries(r.entries));
  }, []);

  const disableUser = async (userId: string) => {
    await apiFetch(`admin/users/${userId}/disable`, { method: 'POST', body: '{}' });
    const res = await apiFetch<{ users: typeof users }>('admin/users');
    setUsers(res.users);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Resumen' },
    { id: 'users' as const, label: 'Usuarios' },
    { id: 'workspaces' as const, label: 'Espacios' },
    { id: 'entries' as const, label: 'Cargas' },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <header className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-4">
        <div className="mx-auto max-w-[1080px]">
          <h1 className="font-display text-2xl">Admin — Shanti</h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-4 py-8">
        <nav className="mb-6 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'rounded-full px-4 py-2 text-sm',
                tab === t.id ? 'bg-[var(--sage-soft)] text-[var(--ink)]' : 'text-[var(--ink-soft)]',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'overview' && overview ? (
          <div className="grid gap-4 sm:grid-cols-4">
            {Object.entries(overview).map(([key, val]) => (
              <Card key={key}>
                <p className="text-3xl font-display">{val}</p>
                <p className="text-sm text-[var(--ink-soft)]">
                  {key === 'users' ? 'Cuentas' : key === 'workspaces' ? 'Espacios' : key === 'patients' ? 'Pacientes' : 'Cargas'}
                </p>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === 'users' ? (
          <div className="space-y-2">
            {users.map((u) => (
              <Card key={u.id} className="flex items-center justify-between">
                <div>
                  <p>{u.email}</p>
                  <p className="text-sm text-[var(--ink-soft)]">{u.platformRole === 'global_admin' ? 'Administración de la plataforma' : 'Cuenta'}</p>
                </div>
                {!u.disabledAt ? (
                  <Button variant="danger" onClick={() => disableUser(u.id)}>
                    Desactivar
                  </Button>
                ) : (
                  <span className="text-sm text-[var(--danger)]">Desactivado</span>
                )}
              </Card>
            ))}
          </div>
        ) : null}

        {tab === 'workspaces' ? (
          <div className="space-y-2">
            {workspaces.map((w) => (
              <Card key={w.id}>
                <p className="font-medium">{w.name}</p>
                <p className="text-sm text-[var(--ink-soft)]">{WORKSPACE_KIND[w.kind].label}</p>
              </Card>
            ))}
          </div>
        ) : null}

        {tab === 'entries' ? (
          <div className="space-y-2">
            {entries.map((e) => (
              <Card key={e.id}>
                <p className="text-sm text-[var(--ink-soft)]">{e.entryDate}</p>
                <p>{formatEntryPreview(e.values)}</p>
                <p className="text-xs text-[var(--ink-soft)]">{formatDateTimeAR(e.createdAt)}</p>
              </Card>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
