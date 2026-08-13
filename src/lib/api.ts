import { getIdToken } from '@/lib/firebase/client';
import type { ApiError } from '@shared/types';

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public payload?: unknown,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getIdToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`/api/${path}`, { ...options, headers });
  const text = await res.text();
  if (!text) {
    throw new ApiClientError(
      'EMPTY_RESPONSE',
      'El servidor no respondió. Probá de nuevo en un momento.',
      res.status,
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ApiClientError('INVALID_RESPONSE', 'El servidor respondió mal. Probá de nuevo.', res.status, text);
  }

  if (!res.ok) {
    const err = data as ApiError;
    throw new ApiClientError(err.code ?? 'ERROR', err.message ?? 'Algo falló', res.status, data);
  }

  return data as T;
}
