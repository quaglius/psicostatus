import { z } from 'zod';
import type { FieldDefinition, FieldType } from './types';

const fieldConfigSchema = z.record(z.unknown());

export const fieldDefinitionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    'short_text',
    'long_text',
    'date',
    'time',
    'datetime',
    'scale',
    'number',
    'select',
    'faces',
  ] as const),
  label: z.string().min(1),
  required: z.boolean(),
  order: z.number().int().min(0),
  config: fieldConfigSchema,
});

export const fieldsArraySchema = z.array(fieldDefinitionSchema).min(1);

export function validateFieldDefinitions(fields: FieldDefinition[]): FieldDefinition[] {
  const parsed = fieldsArraySchema.parse(fields);
  const ids = new Set<string>();
  for (const field of parsed) {
    if (ids.has(field.id)) {
      throw new Error(`Campo duplicado: ${field.id}`);
    }
    ids.add(field.id);
    if (field.type === 'scale') {
      const min = Number(field.config.min ?? 0);
      const max = Number(field.config.max ?? 10);
      if (max <= min || max - min > 20) {
        throw new Error('Escala inválida');
      }
    }
    if (field.type === 'select') {
      const options = field.config.options;
      if (!Array.isArray(options) || options.length < 2) {
        throw new Error('La lista desplegable necesita al menos 2 opciones');
      }
    }
    if (field.type === 'faces') {
      const options = field.config.options;
      if (!Array.isArray(options) || options.length < 2) {
        throw new Error('Las caritas necesitan al menos 2 opciones');
      }
    }
  }
  return parsed.sort((a, b) => a.order - b.order);
}

export function validateEntryValues(
  fields: FieldDefinition[],
  values: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.id];
    if (field.required && (value === undefined || value === null || value === '')) {
      throw new Error(`El campo "${field.label}" es obligatorio`);
    }
    if (value === undefined || value === null || value === '') {
      continue;
    }
    switch (field.type as FieldType) {
      case 'short_text':
      case 'long_text': {
        const str = String(value);
        const maxLength = Number(field.config.maxLength ?? (field.type === 'short_text' ? 200 : 2000));
        if (str.length > maxLength) {
          throw new Error(`"${field.label}" es demasiado largo`);
        }
        result[field.id] = str;
        break;
      }
      case 'date':
      case 'time':
      case 'datetime':
        result[field.id] = String(value);
        break;
      case 'scale':
      case 'number': {
        const num = Number(value);
        if (Number.isNaN(num)) {
          throw new Error(`"${field.label}" debe ser un número`);
        }
        if (field.type === 'scale') {
          const min = Number(field.config.min ?? 0);
          const max = Number(field.config.max ?? 10);
          if (num < min || num > max) {
            throw new Error(`"${field.label}" debe estar entre ${min} y ${max}`);
          }
        }
        result[field.id] = num;
        break;
      }
      case 'select': {
        const options = field.config.options as string[];
        const str = String(value);
        if (!options.includes(str)) {
          throw new Error(`Opción inválida en "${field.label}"`);
        }
        result[field.id] = str;
        break;
      }
      case 'faces': {
        const options = field.config.options as string[];
        const str = String(value);
        if (!options.includes(str)) {
          throw new Error(`Cara inválida en "${field.label}"`);
        }
        result[field.id] = str;
        break;
      }
      default:
        result[field.id] = value;
    }
  }
  return result;
}

export const DEFAULT_TEMPLATE_FIELDS: FieldDefinition[] = [
  {
    id: 'fld_mood_scale',
    type: 'scale',
    label: 'Del 0 al 10, ¿cómo te sentís?',
    required: true,
    order: 1,
    config: { min: 0, max: 10, step: 1 },
  },
  {
    id: 'fld_faces',
    type: 'faces',
    label: 'Elegí una cara',
    required: true,
    order: 2,
    config: { options: ['sad', 'ok', 'happy'] },
  },
  {
    id: 'fld_meds',
    type: 'select',
    label: '¿Tomaste la medicación?',
    required: false,
    order: 3,
    config: { options: ['Sí', 'No', 'No corresponde'] },
  },
  {
    id: 'fld_note',
    type: 'long_text',
    label: '¿Querés contar algo más?',
    required: false,
    order: 4,
    config: { maxLength: 2000, placeholder: 'Opcional' },
  },
];
