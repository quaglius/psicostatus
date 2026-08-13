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

export async function verifyBearer(event: HandlerEvent): Promise<{ uid: string; email: string; name: string | null }> {
  const header = event.headers.authorization ?? event.headers.Authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Tenés que iniciar sesión');
  }

  const token = header.slice(7);
  try {
    const decoded = await getAdminAuth().verifyIdToken(token);
    let email = (decoded.email ?? '').toLowerCase();
    if (!email) {
      const record = await getAdminAuth().getUser(decoded.uid);
      email = (record.email ?? '').toLowerCase();
    }
    return {
      uid: decoded.uid,
      email,
      name: decoded.name ?? null,
    };
  } catch (err) {
    if (err instanceof ApiHttpError) throw err;
    throw new ApiHttpError(401, 'UNAUTHORIZED', 'Sesión inválida o expirada');
  }
}

export async function authenticate(event: HandlerEvent): Promise<AuthContext> {
  const identity = await verifyBearer(event);
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.users)
    .where('firebaseUid', '==', identity.uid)
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
    uid: identity.uid,
    email: identity.email || user.email,
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new ApiHttpError(400, 'INVALID_JSON', 'Datos inválidos');
  }
}

export function getPath(event: HandlerEvent): string {
  const raw = (event.path || '')
    .replace(/^\/\.netlify\/functions\/api\/?/, '')
    .replace(/^\/api\/?/, '');
  return raw.replace(/^\/+/, '').replace(/\/+$/, '');
}
