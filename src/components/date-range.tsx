import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function DateRange({
  from,
  to,
  onChange,
}: {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Input label="Desde" type="date" value={from} onChange={(e) => onChange(e.target.value, to)} />
      <Input label="Hasta" type="date" value={to} onChange={(e) => onChange(from, e.target.value)} />
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          const end = new Date();
          const start = new Date();
          start.setDate(end.getDate() - 27);
          onChange(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
        }}
      >
        Últimos 28 días
      </Button>
    </div>
  );
}
