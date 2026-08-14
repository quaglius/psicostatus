import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDateTimeAR, formatEntryPreview } from '@shared/periodicity';
import { WORKSPACE_KIND } from '@/lib/labels';
import { ListToolbar, Pagination, SortHeader, usePagedSort, type SortDir } from '@/components/paged-list';
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
          <AdminUsers users={users} disableUser={disableUser} />
        ) : null}

        {tab === 'workspaces' ? <AdminWorkspaces workspaces={workspaces} /> : null}

        {tab === 'entries' ? <AdminEntries entries={entries} /> : null}
      </main>
    </div>
  );
}

function toggle(current: string, key: string, dir: SortDir, setKey: (k: string) => void, setDir: (d: SortDir) => void) {
  if (current === key) setDir(dir === 'asc' ? 'desc' : 'asc');
  else {
    setKey(key);
    setDir('asc');
  }
}

function AdminUsers({
  users,
  disableUser,
}: {
  users: Array<UserDoc & { id: string }>;
  disableUser: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('email');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const paged = usePagedSort(users, {
    search,
    match: (u, q) => `${u.email} ${u.displayName ?? ''}`.toLowerCase().includes(q),
    sortKey,
    sortDir,
    value: (u, key) => (key === 'role' ? u.platformRole : key === 'created' ? u.createdAt : u.email),
  });
  return (
    <>
      <ListToolbar search={search} onSearch={setSearch} placeholder="Buscar usuario..." />
      <SortHeader
        columns={[
          { key: 'email', label: 'Correo' },
          { key: 'role', label: 'Rol' },
          { key: 'created', label: 'Alta' },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key) => toggle(sortKey, key, sortDir, setSortKey, setSortDir)}
      />
      <div className="space-y-2">
        {paged.pageItems.map((u) => (
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
      <Pagination page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} />
    </>
  );
}

function AdminWorkspaces({ workspaces }: { workspaces: Array<WorkspaceDoc & { id: string }> }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const paged = usePagedSort(workspaces, {
    search,
    match: (w, q) => `${w.name} ${WORKSPACE_KIND[w.kind].label}`.toLowerCase().includes(q),
    sortKey,
    sortDir,
    value: (w, key) => (key === 'kind' ? WORKSPACE_KIND[w.kind].label : key === 'created' ? w.createdAt : w.name.toLowerCase()),
  });
  return (
    <>
      <ListToolbar search={search} onSearch={setSearch} placeholder="Buscar espacio..." />
      <SortHeader
        columns={[
          { key: 'name', label: 'Nombre' },
          { key: 'kind', label: 'Tipo' },
          { key: 'created', label: 'Alta' },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key) => toggle(sortKey, key, sortDir, setSortKey, setSortDir)}
      />
      <div className="space-y-2">
        {paged.pageItems.map((w) => (
          <Card key={w.id}>
            <p className="font-medium">{w.name}</p>
            <p className="text-sm text-[var(--ink-soft)]">{WORKSPACE_KIND[w.kind].label}</p>
          </Card>
        ))}
      </div>
      <Pagination page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} />
    </>
  );
}

function AdminEntries({ entries }: { entries: Array<EntryDoc & { id: string }> }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const paged = usePagedSort(entries, {
    search,
    match: (e, q) => `${e.entryDate} ${formatEntryPreview(e.values)}`.toLowerCase().includes(q),
    sortKey,
    sortDir,
    value: (e, key) => (key === 'created' ? e.createdAt : e.entryDate),
  });
  return (
    <>
      <ListToolbar search={search} onSearch={setSearch} placeholder="Buscar cargas..." />
      <SortHeader
        columns={[
          { key: 'date', label: 'Día' },
          { key: 'created', label: 'Cargado' },
        ]}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={(key) => toggle(sortKey, key, sortDir, setSortKey, setSortDir)}
      />
      <div className="space-y-2">
        {paged.pageItems.map((e) => (
          <Card key={e.id}>
            <p className="text-sm text-[var(--ink-soft)]">{e.entryDate}</p>
            <p>{formatEntryPreview(e.values)}</p>
            <p className="text-xs text-[var(--ink-soft)]">{formatDateTimeAR(e.createdAt)}</p>
          </Card>
        ))}
      </div>
      <Pagination page={paged.page} pageCount={paged.pageCount} total={paged.total} onPage={paged.setPage} />
    </>
  );
}
