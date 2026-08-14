import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;
let resolvedBucketName: string | null = null;

function readServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT no configurado');
  }
  return JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

function storageBucketCandidates(projectId: string): string[] {
  const envName = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  return [...new Set([envName, resolvedBucketName, `${projectId}.firebasestorage.app`, `${projectId}.appspot.com`].filter(Boolean) as string[])];
}

function getApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const serviceAccount = readServiceAccount();
  const bucket = storageBucketCandidates(serviceAccount.project_id)[0]!;

  app = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
    storageBucket: bucket,
  });

  return app;
}

export function getAdminAuth() {
  return getAuth(getApp());
}

export function getDb() {
  return getFirestore(getApp());
}

export function getBucket(name?: string) {
  return getStorage(getApp()).bucket(name ?? resolvedBucketName ?? undefined);
}

export async function saveStorageObject(
  path: string,
  buffer: Buffer,
  contentType: string,
  downloadToken: string,
): Promise<{ bucketName: string }> {
  const projectId = (getApp().options.projectId as string | undefined) ?? readServiceAccount().project_id;
  let lastErr: unknown;
  for (const bucketName of storageBucketCandidates(projectId)) {
    try {
      await getStorage(getApp()).bucket(bucketName).file(path).save(buffer, {
        resumable: false,
        metadata: {
          contentType,
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        },
      });
      resolvedBucketName = bucketName;
      return { bucketName };
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('No se pudo subir el archivo');
}

export const COLLECTIONS = {
  users: 'users',
  workspaces: 'workspaces',
  workspaceMembers: 'workspaceMembers',
  workspacePatients: 'workspacePatients',
  careTeam: 'careTeam',
  templates: 'templates',
  templateVersions: 'templateVersions',
  assignments: 'assignments',
  entries: 'entries',
  inviteLinks: 'inviteLinks',
  professionalNotes: 'professionalNotes',
} as const;
