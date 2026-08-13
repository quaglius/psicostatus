import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

let app: App;

function getApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT no configurado');
  }

  const serviceAccount = JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };

  app = initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
    storageBucket: `${serviceAccount.project_id}.appspot.com`,
  });

  return app;
}

export function getAdminAuth() {
  return getAuth(getApp());
}

export function getDb() {
  return getFirestore(getApp());
}

export function getBucket() {
  return getStorage(getApp()).bucket();
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
} as const;
