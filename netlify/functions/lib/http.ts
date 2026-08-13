import type { HandlerEvent } from '@netlify/functions';
import { getAdminAuth } from './firebase';
import type { UserDoc } from '../../../shared/types';
import { COLLECTIONS, getDb } from './firebase';

export interface AuthContext {
  uid: string;
  email: string;
  userId: string;
  user: UserDoc & { id: string };
}

export class ApiHttpError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function authenticate(event: HandlerEvent): Promise<AuthContext> {
  const header = event.headers.authorization ?? event.headers.Authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Tenés que iniciar sesión');
  }

  const token = header.slice(7);
  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(token);
  } catch {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Sesión inválida o expirada');
  }

  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.users)
    .where('firebaseUid', '==', decoded.uid)
    .limit(1)
    .get();

  if (snap.empty) {
    throw new ApiHttpError(401, 'USER_NOT_BOOTSTRAPPED', 'Completá el registro primero');
  }

  const doc = snap.docs[0]!;
  const user = { id: doc.id, ...(doc.data() as UserDoc) };

  if (user.disabledAt) {
    throw new ApiHttpError(403, 'USER_DISABLED', 'Tu cuenta está desactivada');
  }

  return {
    uid: decoded.uid,
    email: decoded.email ?? user.email,
    userId: user.id,
    user,
  };
}

export function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof ApiHttpError) {
    return jsonResponse(err.statusCode, { code: err.code, message: err.message });
  }
  console.error(err);
  return jsonResponse(500, { code: 'INTERNAL_ERROR', message: 'Algo falló, probá de nuevo.' });
}

export function parseBody<T>(event: HandlerEvent): T {
  if (!event.body) return {} as T;
  try {
    return JSON.parse(event.body) as T;
  } catch {
    throw new ApiHttpError(400, 'INVALID_JSON', 'Datos inválidos');
  }
}

export function getPath(event: HandlerEvent): string {
  const raw = event.path.replace(/^\/\.netlify\/functions\/api\/?/, '').replace(/^\/api\/?/, '');
  return raw.startsWith('/') ? raw.slice(1) : raw;
}
