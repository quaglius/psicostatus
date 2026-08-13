import { useState } from 'react';
import { compressImage } from '@/lib/compress-image';
import { Avatar } from './avatar';

interface ImagePickerProps {
  label: string;
  help: string;
  name: string;
  value?: string | null;
  onChange: (dataUrl: string) => void;
  round?: boolean;
}

export function ImagePicker({ label, help, name, value, onChange, round = true }: ImagePickerProps) {
  const [error, setError] = useState('');

  return (
    <div className="space-y-2">
      <p className="text-sm text-[var(--ink-soft)]">{label}</p>
      <p className="text-xs text-[var(--ink-soft)]">{help}</p>
      <label className="flex cursor-pointer items-center gap-3">
        {round ? (
          <Avatar name={name} src={value} size={64} />
        ) : (
          <span className="h-16 w-16 overflow-hidden rounded-[var(--radius-input)] bg-[var(--sage-soft)]">
            {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : null}
          </span>
        )}
        <span className="text-sm text-[var(--sage)]">Elegir imagen (opcional)</span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setError('');
            try {
              onChange(await compressImage(file));
            } catch {
              setError('No pudimos leer esa imagen. Probá con otra.');
            }
          }}
        />
      </label>
      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
