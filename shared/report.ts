import type { EntryDoc, FieldDefinition } from './types';

export interface ReportSlice {
  label: string;
  value: number;
}

export interface FieldReport {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  slices: ReportSlice[];
  series: Array<{ date: string; value: number }>;
}

const FACE_ES: Record<string, string> = { sad: 'Triste', ok: 'Regular', happy: 'Bien' };

export function filterEntriesByDate<T extends EntryDoc>(entries: T[], from?: string, to?: string): T[] {
  return entries.filter((e) => (!from || e.entryDate >= from) && (!to || e.entryDate <= to));
}

export function dailyCounts(entries: EntryDoc[]): ReportSlice[] {
  const map = new Map<string, number>();
  for (const e of entries) map.set(e.entryDate, (map.get(e.entryDate) ?? 0) + 1);
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));
}

export function weekdayCounts(entries: EntryDoc[]): ReportSlice[] {
  const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const values = [0, 0, 0, 0, 0, 0, 0];
  for (const e of entries) {
    const [y, m, d] = e.entryDate.split('-').map(Number);
    const day = new Date(y!, (m ?? 1) - 1, d).getDay();
    const idx = day === 0 ? 6 : day - 1;
    values[idx]! += 1;
  }
  return labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
}

export function buildFieldReports(entries: EntryDoc[], fields: FieldDefinition[]): FieldReport[] {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  return sorted
    .filter((f) => f.type === 'faces' || f.type === 'scale' || f.type === 'number' || f.type === 'select')
    .map((field) => {
      const slicesMap = new Map<string, number>();
      const series: Array<{ date: string; value: number }> = [];
      for (const e of [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate))) {
        const raw = e.values[field.id];
        if (raw === undefined || raw === null || raw === '') continue;
        if (field.type === 'faces' || field.type === 'select') {
          const key = field.type === 'faces' ? (FACE_ES[String(raw)] ?? String(raw)) : String(raw);
          slicesMap.set(key, (slicesMap.get(key) ?? 0) + 1);
        } else {
          const n = Number(raw);
          if (Number.isNaN(n)) continue;
          series.push({ date: e.entryDate, value: n });
          const bucket =
            field.type === 'scale'
              ? n <= 2
                ? '0 a 2'
                : n <= 4
                  ? '3 a 4'
                  : n <= 6
                    ? '5 a 6'
                    : n <= 8
                      ? '7 a 8'
                      : '9 a 10'
              : String(n);
          slicesMap.set(bucket, (slicesMap.get(bucket) ?? 0) + 1);
        }
      }
      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        slices: [...slicesMap.entries()].map(([label, value]) => ({ label, value })),
        series,
      };
    })
    .filter((r) => r.slices.length || r.series.length);
}

export function mergeFieldReports(reports: FieldReport[]): FieldReport[] {
  const map = new Map<string, FieldReport>();
  for (const r of reports) {
    const key = `${r.fieldType}:${r.fieldLabel}`;
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...r, slices: [...r.slices], series: [...r.series] });
      continue;
    }
    const slices = new Map(existing.slices.map((s) => [s.label, s.value]));
    for (const s of r.slices) slices.set(s.label, (slices.get(s.label) ?? 0) + s.value);
    map.set(key, {
      ...existing,
      slices: [...slices.entries()].map(([label, value]) => ({ label, value })),
      series: [...existing.series, ...r.series].sort((a, b) => a.date.localeCompare(b.date)),
    });
  }
  return [...map.values()];
}
