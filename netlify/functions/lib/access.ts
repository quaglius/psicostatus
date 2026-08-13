import type {
  CareTeamDoc,
  UserDoc,
  WorkspaceMemberDoc,
  WorkspaceMemberRole,
  WorkspacePatientDoc,
} from '../../../shared/types';
import { COLLECTIONS, getDb } from './firebase';
import { ApiHttpError } from './http';

export async function getWorkspaceMember(
  workspaceId: string,
  userId: string,
): Promise<(WorkspaceMemberDoc & { id: string }) | null> {
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.workspaceMembers)
    .where('workspaceId', '==', workspaceId)
    .where('userId', '==', userId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0]!;
  return { id: doc.id, ...(doc.data() as WorkspaceMemberDoc) };
}

export async function getWorkspacePatient(
  workspacePatientId: string,
): Promise<(WorkspacePatientDoc & { id: string }) | null> {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.workspacePatients).doc(workspacePatientId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...(doc.data() as WorkspacePatientDoc) };
}

export async function getCareTeamLinks(workspacePatientId: string): Promise<Array<CareTeamDoc & { id: string }>> {
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.careTeam)
    .where('workspacePatientId', '==', workspacePatientId)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as CareTeamDoc) }));
}

export async function assertCanSeePatient(
  authUser: UserDoc & { id: string },
  workspacePatientId: string,
): Promise<WorkspacePatientDoc & { id: string }> {
  const patient = await getWorkspacePatient(workspacePatientId);
  if (!patient) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Paciente no encontrado');
  }

  if (authUser.platformRole === 'global_admin') {
    return patient;
  }

  if (patient.userId === authUser.id) {
    return patient;
  }

  const member = await getWorkspaceMember(patient.workspaceId, authUser.id);
  if (!member) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés ver esto');
  }

  if (member.role === 'admin' || member.seeAllPatients) {
    return patient;
  }

  const careTeam = await getCareTeamLinks(workspacePatientId);
  const onTeam = careTeam.some((c) => c.memberUserId === authUser.id);
  if (!onTeam) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés ver esto');
  }

  return patient;
}

export async function assertCanEditPatient(
  authUser: UserDoc & { id: string },
  workspacePatientId: string,
): Promise<WorkspacePatientDoc & { id: string }> {
  const patient = await assertCanSeePatient(authUser, workspacePatientId);

  if (authUser.platformRole === 'global_admin') {
    return patient;
  }

  if (patient.userId === authUser.id) {
    return patient;
  }

  const member = await getWorkspaceMember(patient.workspaceId, authUser.id);
  if (!member) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés editar esto');
  }

  if (member.role === 'admin') {
    return patient;
  }

  if (member.role === 'read_only') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'Tenés acceso de solo lectura');
  }

  const careTeam = await getCareTeamLinks(workspacePatientId);
  const editable = careTeam.some((c) => c.memberUserId === authUser.id && c.canEdit);
  if (!editable) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés editar este paciente');
  }

  return patient;
}

export async function assertWorkspaceAdmin(
  authUser: UserDoc & { id: string },
  workspaceId: string,
): Promise<WorkspaceMemberDoc & { id: string }> {
  if (authUser.platformRole === 'global_admin') {
    return {
      id: 'admin-override',
      workspaceId,
      userId: authUser.id,
      role: 'admin',
      seeAllPatients: true,
      createdAt: new Date().toISOString(),
    };
  }

  const member = await getWorkspaceMember(workspaceId, authUser.id);
  if (!member || member.role !== 'admin') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'Solo los administradores del espacio pueden hacer esto');
  }
  return member;
}

export async function assertWorkspaceStaff(
  authUser: UserDoc & { id: string },
  workspaceId: string,
  allowedRoles: WorkspaceMemberRole[] = ['admin', 'professional', 'read_only'],
): Promise<WorkspaceMemberDoc & { id: string }> {
  if (authUser.platformRole === 'global_admin') {
    return {
      id: 'admin-override',
      workspaceId,
      userId: authUser.id,
      role: 'admin',
      seeAllPatients: true,
      createdAt: new Date().toISOString(),
    };
  }

  const member = await getWorkspaceMember(workspaceId, authUser.id);
  if (!member || !allowedRoles.includes(member.role)) {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No tenés acceso a este espacio');
  }
  return member;
}

export async function listVisiblePatients(
  authUser: UserDoc & { id: string },
  workspaceId: string,
): Promise<Array<WorkspacePatientDoc & { id: string }>> {
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.workspacePatients)
    .where('workspaceId', '==', workspaceId)
    .get();

  const patients = snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkspacePatientDoc) }));

  if (authUser.platformRole === 'global_admin') {
    return patients.filter((p) => !p.archivedAt);
  }

  const member = await getWorkspaceMember(workspaceId, authUser.id);
  if (!member) return [];

  if (member.role === 'admin' || member.seeAllPatients) {
    return patients.filter((p) => !p.archivedAt);
  }

  const careSnap = await db
    .collection(COLLECTIONS.careTeam)
    .where('workspaceId', '==', workspaceId)
    .where('memberUserId', '==', authUser.id)
    .get();

  const patientIds = new Set(careSnap.docs.map((d) => (d.data() as CareTeamDoc).workspacePatientId));
  return patients.filter((p) => !p.archivedAt && patientIds.has(p.id));
}
