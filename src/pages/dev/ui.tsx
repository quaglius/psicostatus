import { WeekStrip } from '@/components/week-strip';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { FacesField } from '@/components/faces-field';
import { ScaleField } from '@/components/scale-field';
import { useState } from 'react';
import type { WeekDayInfo } from '@shared/types';

const mockDays: WeekDayInfo[] = [
  { date: '2026-08-11', label: 'L', isToday: false, isFuture: false, isExpected: true, isFilled: true, entryCount: 1, preview: '7/10' },
  { date: '2026-08-12', label: 'M', isToday: false, isFuture: false, isExpected: true, isFilled: false, entryCount: 0, preview: null },
  { date: '2026-08-13', label: 'X', isToday: true, isFuture: false, isExpected: true, isFilled: true, entryCount: 2, preview: 'Bien' },
  { date: '2026-08-14', label: 'J', isToday: false, isFuture: true, isExpected: true, isFilled: false, entryCount: 0, preview: null },
  { date: '2026-08-15', label: 'V', isToday: false, isFuture: true, isExpected: true, isFilled: false, entryCount: 0, preview: null },
  { date: '2026-08-16', label: 'S', isToday: false, isFuture: true, isExpected: true, isFilled: false, entryCount: 0, preview: null },
  { date: '2026-08-17', label: 'D', isToday: false, isFuture: true, isExpected: true, isFilled: false, entryCount: 0, preview: null },
];

export function DevUiPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scale, setScale] = useState(7);
  const [face, setFace] = useState('ok');

  return (
    <div className="min-h-screen bg-[var(--paper)] p-8">
      <h1 className="font-display mb-8 text-3xl">UI Kit — Dev only</h1>

      <section className="mb-10 space-y-4">
        <h2 className="font-display text-xl">Botones</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primario clay</Button>
          <Button variant="secondary">Secundario sage</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-4 text-xl">Cinta semanal</h2>
        <WeekStrip days={mockDays} periodicityType="daily" selectedDate="2026-08-13" onSelectDate={() => {}} />
      </section>

      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <Card>
          <h2 className="font-display mb-4 text-xl">Escala</h2>
          <ScaleField value={scale} min={0} max={10} onChange={setScale} />
        </Card>
        <Card>
          <h2 className="font-display mb-4 text-xl">Caritas</h2>
          <FacesField value={face} options={['sad', 'ok', 'happy']} onChange={setFace} />
        </Card>
      </section>

      <section className="mb-10">
        <h2 className="font-display mb-4 text-xl">Input</h2>
        <Input label="Campo de texto" placeholder="Ejemplo" />
      </section>

      <section>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>
          Abrir sheet de aviso
        </Button>
        <Sheet
          open={sheetOpen}
          title="Ya hay un registro para este período"
          onClose={() => setSheetOpen(false)}
          actions={
            <>
              <Button variant="ghost" onClick={() => setSheetOpen(false)}>Volver</Button>
              <Button variant="secondary">Actualizar el anterior</Button>
              <Button>Dejar una nueva</Button>
            </>
          }
        >
          Si seguís, podés actualizar lo que ya cargaste o agregar un registro nuevo.
        </Sheet>
      </section>
    </div>
  );
}
