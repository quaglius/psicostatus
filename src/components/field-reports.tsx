import { BarChart, LineChart, PieChart } from '@/components/charts';
import { Card } from '@/components/ui/Card';
import { FieldTypeIcon } from '@/lib/field-icons';
import type { FieldType } from '@shared/types';
import type { FieldReport } from '@shared/report';

export function FieldReports({ reports }: { reports: FieldReport[] }) {
  if (!reports.length) {
    return (
      <Card>
        <p className="text-[var(--ink-soft)]">En este rango no hay puntuaciones ni caritas para graficar.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reports.map((r) => (
        <Card key={r.fieldId} className="anim-in space-y-4">
          <p className="flex items-center gap-2 font-medium">
            <FieldTypeIcon type={r.fieldType as FieldType} />
            {r.fieldLabel}
          </p>
          {r.fieldType === 'faces' || r.fieldType === 'select' || r.fieldType === 'yes_no' ? (
            <PieChart
              title="Cómo se distribuyen las respuestas"
              help="Cada porción es una opción. Sirve para ver qué predomina."
              slices={r.slices}
            />
          ) : null}
          {(r.fieldType === 'scale' || r.fieldType === 'number') && r.slices.length ? (
            <BarChart
              title="Por rangos de puntuación"
              help="Agrupamos las notas para ver si hay más valores bajos, medios o altos."
              points={r.slices}
            />
          ) : null}
          {r.series.length > 1 ? (
            <LineChart
              title="Evolución"
              help="Cada punto es una carga en el tiempo."
              points={r.series.map((s) => ({
                label: s.date.slice(5).replace('-', '/'),
                value: s.value,
              }))}
            />
          ) : null}
        </Card>
      ))}
    </div>
  );
}
