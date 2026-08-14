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
  answerCount: number;
  numeric?: { min: number; max: number; avg: number; last: number };
  yesCount?: number;
  noCount?: number;
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

export function formatReportValue(field: FieldDefinition, raw: unknown): string {
  if (raw === undefined || raw === null || raw === '') return '';
  if (field.type === 'yes_no') return raw === true || raw === 'true' || raw === 'Sí' ? 'Sí' : 'No';
  if (field.type === 'faces') return FACE_ES[String(raw)] ?? String(raw);
  return String(raw);
}

function numberBuckets(values: number[]): ReportSlice[] {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ label: String(min), value: values.length }];
  const unique = new Set(values);
  if (unique.size <= 8) {
    return [...unique]
      .sort((a, b) => a - b)
      .map((n) => ({ label: String(n), value: values.filter((v) => v === n).length }));
  }
  const span = max - min || 1;
  const buckets = [0, 0, 0, 0, 0];
  const labels: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = min + (span * i) / 5;
    const b = min + (span * (i + 1)) / 5;
    labels.push(`${a.toFixed(1)} a ${b.toFixed(1)}`);
  }
  for (const n of values) {
    const idx = Math.min(4, Math.floor(((n - min) / span) * 5));
    buckets[idx]! += 1;
  }
  return labels.map((label, i) => ({ label, value: buckets[i] ?? 0 })).filter((s) => s.value > 0);
}

export function buildFieldReports(entries: EntryDoc[], fields: FieldDefinition[]): FieldReport[] {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  return sorted
    .filter((f) => f.type === 'faces' || f.type === 'scale' || f.type === 'number' || f.type === 'select' || f.type === 'yes_no')
    .map((field) => {
      const slicesMap = new Map<string, number>();
      const series: Array<{ date: string; value: number }> = [];
      const numericValues: number[] = [];
      let yesCount = 0;
      let noCount = 0;
      let answerCount = 0;
      for (const e of [...entries].sort((a, b) => a.entryDate.localeCompare(b.entryDate))) {
        const raw = e.values[field.id];
        if (raw === undefined || raw === null || raw === '') continue;
        answerCount += 1;
        if (field.type === 'yes_no') {
          const yes = raw === true || raw === 'true' || raw === 'Sí';
          if (yes) yesCount += 1;
          else noCount += 1;
          const key = yes ? 'Sí' : 'No';
          slicesMap.set(key, (slicesMap.get(key) ?? 0) + 1);
        } else if (field.type === 'faces' || field.type === 'select') {
          const key = field.type === 'faces' ? (FACE_ES[String(raw)] ?? String(raw)) : String(raw);
          slicesMap.set(key, (slicesMap.get(key) ?? 0) + 1);
        } else {
          const n = Number(raw);
          if (Number.isNaN(n)) continue;
          series.push({ date: e.entryDate, value: n });
          numericValues.push(n);
          if (field.type === 'scale') {
            const bucket =
              n <= 2 ? '0 a 2' : n <= 4 ? '3 a 4' : n <= 6 ? '5 a 6' : n <= 8 ? '7 a 8' : '9 a 10';
            slicesMap.set(bucket, (slicesMap.get(bucket) ?? 0) + 1);
          }
        }
      }
      const slices =
        field.type === 'number' ? numberBuckets(numericValues) : [...slicesMap.entries()].map(([label, value]) => ({ label, value }));
      const numeric =
        numericValues.length > 0
          ? {
              min: Math.min(...numericValues),
              max: Math.max(...numericValues),
              avg: Math.round((numericValues.reduce((a, b) => a + b, 0) / numericValues.length) * 10) / 10,
              last: numericValues[numericValues.length - 1]!,
            }
          : undefined;
      return {
        fieldId: field.id,
        fieldLabel: field.label,
        fieldType: field.type,
        slices,
        series,
        answerCount,
        numeric,
        yesCount: field.type === 'yes_no' ? yesCount : undefined,
        noCount: field.type === 'yes_no' ? noCount : undefined,
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
      map.set(key, {
        ...r,
        slices: [...r.slices],
        series: [...r.series],
      });
      continue;
    }
    const slices = new Map(existing.slices.map((s) => [s.label, s.value]));
    for (const s of r.slices) slices.set(s.label, (slices.get(s.label) ?? 0) + s.value);
    const series = [...existing.series, ...r.series].sort((a, b) => a.date.localeCompare(b.date));
    const nums = series.map((s) => s.value);
    const yesCount = (existing.yesCount ?? 0) + (r.yesCount ?? 0);
    const noCount = (existing.noCount ?? 0) + (r.noCount ?? 0);
    map.set(key, {
      ...existing,
      slices: [...slices.entries()].map(([label, value]) => ({ label, value })),
      series,
      answerCount: existing.answerCount + r.answerCount,
      yesCount: r.yesCount != null || existing.yesCount != null ? yesCount : undefined,
      noCount: r.noCount != null || existing.noCount != null ? noCount : undefined,
      numeric:
        nums.length > 0
          ? {
              min: Math.min(...nums),
              max: Math.max(...nums),
              avg: Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10,
              last: nums[nums.length - 1]!,
            }
          : existing.numeric,
    });
  }
  return [...map.values()];
}
