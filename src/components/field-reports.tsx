import { BarChart, HorizontalBarChart, LineChart, PieChart } from '@/components/charts';
import { Card } from '@/components/ui/Card';
import { FieldTypeIcon } from '@/lib/field-icons';
import { FIELD_TYPE } from '@/lib/labels';
import type { FieldType } from '@shared/types';
import type { FieldReport } from '@shared/report';

function isFieldType(value: string): value is FieldType {
  return value in FIELD_TYPE;
}

export function FieldReports({ reports, emptyHint }: { reports: FieldReport[]; emptyHint?: string }) {
  if (!reports.length) {
    return (
      <Card>
        <p className="text-[var(--ink-soft)]">
          {emptyHint ?? 'En este rango no hay respuestas para graficar con esta plantilla.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {reports.map((r) => (
        <Card key={r.fieldId} className="anim-in space-y-4">
          <div>
            <p className="flex items-center gap-2 font-medium">
              {isFieldType(r.fieldType) ? <FieldTypeIcon type={r.fieldType} /> : null}
              {r.fieldLabel}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              {isFieldType(r.fieldType) ? FIELD_TYPE[r.fieldType].label : r.fieldType} · {r.answerCount}{' '}
              {r.answerCount === 1 ? 'respuesta' : 'respuestas'}
            </p>
          </div>

          {r.fieldType === 'yes_no' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[var(--radius-input)] bg-[var(--sage-soft)] px-3 py-2">
                  <p className="font-display text-2xl">{r.yesCount ?? 0}</p>
                  <p className="text-sm text-[var(--ink-soft)]">Sí</p>
                </div>
                <div className="rounded-[var(--radius-input)] bg-[var(--clay-soft)] px-3 py-2">
                  <p className="font-display text-2xl">{r.noCount ?? 0}</p>
                  <p className="text-sm text-[var(--ink-soft)]">No</p>
                </div>
              </div>
              <PieChart
                title="Cómo se reparte"
                help="Marcado es sí, vacío es no. Sirve para ver si predomina uno."
                slices={r.slices}
              />
            </>
          ) : null}

          {r.fieldType === 'select' && r.slices.length ? (
            <HorizontalBarChart
              title="Opciones elegidas"
              help="Cada barra es una opción de la lista. El porcentaje es sobre las respuestas de esta pregunta."
              points={[...r.slices].sort((a, b) => b.value - a.value)}
            />
          ) : null}

          {r.fieldType === 'faces' ? (
            <>
              <PieChart
                title="Cómo se distribuyen las caritas"
                help="Cada porción es una cara. Sirve para ver el clima general."
                slices={r.slices}
              />
              {r.slices.length > 1 ? (
                <HorizontalBarChart
                  title="Cantidad por cara"
                  help="La misma información, en barras."
                  points={r.slices}
                />
              ) : null}
            </>
          ) : null}

          {r.numeric ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="font-display text-xl">{r.numeric.avg}</p>
                <p className="text-xs text-[var(--ink-soft)]">Promedio</p>
              </div>
              <div>
                <p className="font-display text-xl">{r.numeric.min}</p>
                <p className="text-xs text-[var(--ink-soft)]">Mínimo</p>
              </div>
              <div>
                <p className="font-display text-xl">{r.numeric.max}</p>
                <p className="text-xs text-[var(--ink-soft)]">Máximo</p>
              </div>
            </div>
          ) : null}

          {(r.fieldType === 'scale' || r.fieldType === 'number') && r.slices.length ? (
            <BarChart
              title={r.fieldType === 'scale' ? 'Por rangos de puntuación' : 'Cómo se agrupan los números'}
              help={
                r.fieldType === 'scale'
                  ? 'Agrupamos las notas para ver si hay más valores bajos, medios o altos.'
                  : 'Agrupamos los números para ver dónde se concentran.'
              }
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
