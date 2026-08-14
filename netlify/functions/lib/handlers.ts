import { v4 as uuidv4 } from 'uuid';
import type { HandlerEvent } from '@netlify/functions';
import { DEFAULT_TEMPLATE_FIELDS } from '../../../shared/fields';
import type {
  AssignmentDoc,
  EntryDoc,
  InviteLinkDoc,
  MeResponse,
  ProfessionalNoteDoc,
  TemplateDoc,
  TemplateVersionDoc,
  UserDoc,
  WorkspaceDoc,
  WorkspaceMemberDoc,
  WorkspacePatientDoc,
} from '../../../shared/types';
import { buildFieldReports, dailyCounts, mergeFieldReports, weekdayCounts } from '../../../shared/report';
import {
  computeAdherence,
  computePeriodKey,
  formatDateISO,
  todayInAR,
  formatEntryPreview,
  getWeekDays,
  isExpectedDay,
  isFutureDate,
  parseISODate,
  startOfWeekMonday,
  addDays,
} from '../../../shared/periodicity';
import { daysFromNow, generateInviteToken, hashToken, nowISO, todayISO, yesterdayISO } from '../../../shared/utils';
import { validateEntryValues, validateFieldDefinitions } from '../../../shared/fields';
import {
  assertCanEditPatient,
  assertCanSeePatient,
  assertWorkspaceAdmin,
  assertWorkspaceStaff,
  getWorkspaceMember,
  listVisiblePatients,
} from './access';
import { COLLECTIONS, getAdminAuth, getBucket, getDb } from './firebase';
import { ApiHttpError, type AuthContext, jsonResponse, parseBody, verifyBearer } from './http';

async function buildMeResponse(userId: string): Promise<MeResponse> {
  const db = getDb();
  const userDoc = await db.collection(COLLECTIONS.users).doc(userId).get();
  const user = { id: userDoc.id, ...(userDoc.data() as UserDoc) };

  const memberSnap = await db.collection(COLLECTIONS.workspaceMembers).where('userId', '==', userId).get();
  const workspaceMemberships = await Promise.all(
    memberSnap.docs.map(async (d) => {
      const member = { id: d.id, ...(d.data() as WorkspaceMemberDoc) };
      const ws = await db.collection(COLLECTIONS.workspaces).doc(member.workspaceId).get();
      return {
        ...member,
        workspace: { id: ws.id, ...(ws.data() as WorkspaceDoc) },
      };
    }),
  );

  const patientSnap = await db.collection(COLLECTIONS.workspacePatients).where('userId', '==', userId).get();
  const patientMemberships = await Promise.all(
    patientSnap.docs.map(async (d) => {
      const patient = { id: d.id, ...(d.data() as WorkspacePatientDoc) };
      const ws = await db.collection(COLLECTIONS.workspaces).doc(patient.workspaceId).get();
      return {
        ...patient,
        workspace: { id: ws.id, ...(ws.data() as WorkspaceDoc) },
      };
    }),
  );

  return { user, workspaceMemberships, patientMemberships };
}

export async function handleBootstrap(event: HandlerEvent) {
  const identity = await verifyBearer(event);
  const db = getDb();
  const body = parseBody<{ displayName?: string }>(event);
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'daniel.quagliano@gmail.com').toLowerCase();
  const email = identity.email.toLowerCase();
  const isAdmin = email === adminEmail;

  const existing = await db
    .collection(COLLECTIONS.users)
    .where('firebaseUid', '==', identity.uid)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0]!;
    if (isAdmin && (doc.data() as UserDoc).platformRole !== 'global_admin') {
      await doc.ref.update({ platformRole: 'global_admin', email });
    }
    return jsonResponse(200, await buildMeResponse(doc.id));
  }

  const userId = uuidv4();
  const userData: UserDoc = {
    firebaseUid: identity.uid,
    email,
    displayName: body.displayName ?? identity.name,
    platformRole: isAdmin ? 'global_admin' : 'user',
    disabledAt: null,
    createdAt: nowISO(),
  };

  await db.collection(COLLECTIONS.users).doc(userId).set(userData);
  return jsonResponse(201, await buildMeResponse(userId));
}

export async function handleGetMe(auth: AuthContext) {
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'daniel.quagliano@gmail.com').toLowerCase();
  if (auth.email.toLowerCase() === adminEmail && auth.user.platformRole !== 'global_admin') {
    await getDb().collection(COLLECTIONS.users).doc(auth.userId).update({ platformRole: 'global_admin' });
  }
  return jsonResponse(200, await buildMeResponse(auth.userId));
}

export async function handleCreateWorkspace(auth: AuthContext, event: HandlerEvent) {
  const body = parseBody<{ name: string; kind: WorkspaceDoc['kind'] }>(event);
  if (!body.name?.trim()) {
    throw new ApiHttpError(400, 'INVALID_INPUT', 'El nombre del espacio es obligatorio');
  }

  const db = getDb();
  const existing = await db.collection(COLLECTIONS.workspaceMembers).where('userId', '==', auth.userId).limit(1).get();
  if (!existing.empty) {
    throw new ApiHttpError(409, 'WORKSPACE_EXISTS', 'Ya tenés un espacio creado');
  }

  const workspaceId = uuidv4();
  const workspace: WorkspaceDoc = {
    kind: body.kind ?? 'solo',
    name: body.name.trim(),
    ownerUserId: auth.userId,
    imageUrl: null,
    createdAt: nowISO(),
  };

  const memberId = uuidv4();
  const member: WorkspaceMemberDoc = {
    workspaceId,
    userId: auth.userId,
    role: 'admin',
    seeAllPatients: true,
    removedAt: null,
    createdAt: nowISO(),
  };

  const templateId = uuidv4();
  const template: TemplateDoc = {
    workspaceId,
    name: 'Ánimo, medicación y notas',
    isDefault: true,
    archivedAt: null,
    createdAt: nowISO(),
  };

  const versionId = uuidv4();
  const version: TemplateVersionDoc = {
    templateId,
    version: 1,
    periodicityType: 'daily',
    periodicityConfig: {},
    fields: DEFAULT_TEMPLATE_FIELDS,
    patientGuide:
      'Cada día, elegí cómo te sentís, si tomaste la medicación y, si querés, escribí una nota. No hay respuestas correctas.',
    createdAt: nowISO(),
  };

  const token = generateInviteToken();
  const inviteId = uuidv4();
  const invite: InviteLinkDoc = {
    workspaceId,
    kind: 'patient',
    role: null,
    createdBy: auth.userId,
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: daysFromNow(90),
    singleUse: false,
    usedAt: null,
    assignedEmail: null,
    assignToMemberId: auth.userId,
    seeAllPatients: false,
    createdAt: nowISO(),
    token,
  };

  const batch = db.batch();
  batch.set(db.collection(COLLECTIONS.workspaces).doc(workspaceId), workspace);
  batch.set(db.collection(COLLECTIONS.workspaceMembers).doc(memberId), member);
  batch.set(db.collection(COLLECTIONS.templates).doc(templateId), template);
  batch.set(db.collection(COLLECTIONS.templateVersions).doc(versionId), version);
  batch.set(db.collection(COLLECTIONS.inviteLinks).doc(inviteId), invite);
  await batch.commit();

  return jsonResponse(201, {
    workspace: { id: workspaceId, ...workspace },
    patientInviteToken: token,
    template: { id: templateId, ...template, versionId },
  });
}

export async function handleGetInvite(token: string) {
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.inviteLinks)
    .where('tokenHash', '==', hashToken(token))
    .limit(1)
    .get();

  if (snap.empty) {
    throw new ApiHttpError(404, 'INVITE_INVALID', 'Este link ya no vale. Pedile uno nuevo.');
  }

  const doc = snap.docs[0]!;
  const invite = doc.data() as InviteLinkDoc;

  if (invite.revokedAt) {
    throw new ApiHttpError(410, 'INVITE_REVOKED', 'Este link ya no vale. Pedile uno nuevo.');
  }
  if (invite.expiresAt < nowISO()) {
    throw new ApiHttpError(410, 'INVITE_EXPIRED', 'Este link expiró. Pedile uno nuevo.');
  }
  if (invite.singleUse && invite.usedAt) {
    throw new ApiHttpError(410, 'INVITE_USED', 'Este link ya fue usado.');
  }

  const ws = await db.collection(COLLECTIONS.workspaces).doc(invite.workspaceId).get();
  const workspace = ws.data() as WorkspaceDoc;

  return jsonResponse(200, {
    workspaceId: invite.workspaceId,
    workspaceName: workspace.name,
    kind: invite.kind,
    role: invite.role,
    assignedEmail: invite.assignedEmail,
  });
}

export async function handleAcceptInvite(auth: AuthContext, event: HandlerEvent) {
  const body = parseBody<{
    token: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string | null;
    phone?: string | null;
  }>(event);

  if (!body.token) {
    throw new ApiHttpError(400, 'INVALID_INPUT', 'Token inválido');
  }

  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.inviteLinks)
    .where('tokenHash', '==', hashToken(body.token))
    .limit(1)
    .get();

  if (snap.empty) {
    throw new ApiHttpError(404, 'INVITE_INVALID', 'Este link ya no vale.');
  }

  const inviteDoc = snap.docs[0]!;
  const invite = inviteDoc.data() as InviteLinkDoc;

  if (invite.revokedAt || invite.expiresAt < nowISO()) {
    throw new ApiHttpError(410, 'INVITE_INVALID', 'Este link ya no vale.');
  }
  if (invite.singleUse && invite.usedAt) {
    throw new ApiHttpError(410, 'INVITE_USED', 'Este link ya fue usado.');
  }
  if (invite.assignedEmail && invite.assignedEmail.toLowerCase() !== auth.email.toLowerCase()) {
    throw new ApiHttpError(403, 'EMAIL_MISMATCH', 'Este link está restringido a otro correo');
  }

  if (invite.kind === 'staff') {
    const existing = await getWorkspaceMember(invite.workspaceId, auth.userId);
    if (existing) {
      return jsonResponse(200, { type: 'already_staff', workspaceId: invite.workspaceId });
    }

    const memberId = uuidv4();
    const member: WorkspaceMemberDoc = {
      workspaceId: invite.workspaceId,
      userId: auth.userId,
      role: invite.role ?? 'professional',
      seeAllPatients: invite.seeAllPatients,
      removedAt: null,
      createdAt: nowISO(),
    };

    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.workspaceMembers).doc(memberId), member);
    if (invite.singleUse) {
      batch.update(inviteDoc.ref, { usedAt: nowISO() });
    }
    await batch.commit();

    return jsonResponse(200, { type: 'staff', workspaceId: invite.workspaceId });
  }

  // Patient invite
  const existingMember = await getWorkspaceMember(invite.workspaceId, auth.userId);
  if (existingMember) {
    return jsonResponse(200, { type: 'already_professional', workspaceId: invite.workspaceId });
  }

  const existingPatient = await db
    .collection(COLLECTIONS.workspacePatients)
    .where('workspaceId', '==', invite.workspaceId)
    .where('userId', '==', auth.userId)
    .limit(1)
    .get();

  if (!existingPatient.empty) {
    return jsonResponse(200, {
      type: 'patient',
      workspacePatientId: existingPatient.docs[0]!.id,
      alreadyMember: true,
    });
  }

  const fromProfile = (auth.user.displayName ?? '').trim();
  const [profileFirst, ...profileRest] = fromProfile.split(/\s+/);
  const firstName = body.firstName?.trim() || profileFirst || (auth.email.split('@')[0] ?? 'Paciente');
  const lastName = body.lastName?.trim() || (profileRest.length ? profileRest.join(' ') : '—');

  const defaultTemplate = await db
    .collection(COLLECTIONS.templates)
    .where('workspaceId', '==', invite.workspaceId)
    .where('isDefault', '==', true)
    .limit(1)
    .get();

  if (defaultTemplate.empty) {
    throw new ApiHttpError(500, 'NO_DEFAULT_TEMPLATE', 'El espacio no tiene plantilla por defecto');
  }

  const templateId = defaultTemplate.docs[0]!.id;
  const versionSnap = await db
    .collection(COLLECTIONS.templateVersions)
    .where('templateId', '==', templateId)
    .orderBy('version', 'desc')
    .limit(1)
    .get();

  const versionDoc = versionSnap.docs[0]!;

  const patientId = uuidv4();
  const patient: WorkspacePatientDoc = {
    workspaceId: invite.workspaceId,
    userId: auth.userId,
    firstName,
    lastName,
    photoUrl: null,
    birthDate: body.birthDate ?? null,
    phone: body.phone ?? null,
    internalNotes: null,
    archivedAt: null,
    createdAt: nowISO(),
  };

  const assignmentId = uuidv4();
  const assignment: AssignmentDoc = {
    workspacePatientId: patientId,
    templateId,
    templateVersionId: versionDoc.id,
    startsAt: todayISO(),
    endsAt: null,
    createdAt: nowISO(),
  };

  const batch = db.batch();
  batch.set(db.collection(COLLECTIONS.workspacePatients).doc(patientId), patient);
  batch.set(db.collection(COLLECTIONS.assignments).doc(assignmentId), assignment);

  if (invite.assignToMemberId) {
    const careId = uuidv4();
    batch.set(db.collection(COLLECTIONS.careTeam).doc(careId), {
      workspaceId: invite.workspaceId,
      workspacePatientId: patientId,
      memberUserId: invite.assignToMemberId,
      canEdit: true,
      createdAt: nowISO(),
    });
  }

  if (invite.singleUse) {
    batch.update(inviteDoc.ref, { usedAt: nowISO() });
  }

  await batch.commit();

  return jsonResponse(201, { type: 'patient', workspacePatientId: patientId });
}

export async function handleCreateInvite(auth: AuthContext, event: HandlerEvent) {
  const body = parseBody<{
    workspaceId: string;
    kind: InviteLinkDoc['kind'];
    role?: InviteLinkDoc['role'];
    singleUse?: boolean;
    assignedEmail?: string | null;
    seeAllPatients?: boolean;
  }>(event);

  if (!body.workspaceId || !body.kind) {
    throw new ApiHttpError(400, 'INVALID_INPUT', 'Datos incompletos');
  }

  if (body.kind === 'staff') {
    await assertWorkspaceAdmin(auth.user, body.workspaceId);
  } else {
    const member = await assertWorkspaceStaff(auth.user, body.workspaceId, ['admin', 'professional']);
    if (member.role === 'read_only') {
      throw new ApiHttpError(403, 'FORBIDDEN', 'No podés invitar pacientes');
    }
  }

  const token = generateInviteToken();
  const inviteId = uuidv4();

  let assignToMemberId: string | null = null;
  if (body.kind === 'patient') {
    const inviter = await getWorkspaceMember(body.workspaceId, auth.userId);
    if (inviter && (inviter.role === 'professional' || inviter.role === 'admin')) {
      assignToMemberId = auth.userId;
    }
  }

  const invite: InviteLinkDoc = {
    workspaceId: body.workspaceId,
    kind: body.kind,
    role: body.kind === 'staff' ? (body.role ?? 'professional') : null,
    createdBy: auth.userId,
    tokenHash: hashToken(token),
    revokedAt: null,
    expiresAt: daysFromNow(90),
    singleUse: body.singleUse ?? false,
    usedAt: null,
    assignedEmail: body.assignedEmail ?? null,
    assignToMemberId,
    seeAllPatients: body.seeAllPatients ?? false,
    createdAt: nowISO(),
    token,
  };

  await getDb().collection(COLLECTIONS.inviteLinks).doc(inviteId).set(invite);

  return jsonResponse(201, { id: inviteId, token, invite });
}

export async function handleRotateInvite(auth: AuthContext, inviteId: string) {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.inviteLinks).doc(inviteId).get();
  if (!doc.exists) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Invitación no encontrada');
  }

  const invite = doc.data() as InviteLinkDoc;
  if (invite.kind === 'staff') {
    await assertWorkspaceAdmin(auth.user, invite.workspaceId);
  } else {
    await assertWorkspaceStaff(auth.user, invite.workspaceId, ['admin', 'professional']);
  }

  const token = generateInviteToken();
  const batch = db.batch();
  batch.update(doc.ref, { revokedAt: nowISO() });

  const newId = uuidv4();
  const newInvite: InviteLinkDoc = {
    ...invite,
    tokenHash: hashToken(token),
    token,
    revokedAt: null,
    expiresAt: daysFromNow(90),
    usedAt: null,
    createdAt: nowISO(),
    createdBy: auth.userId,
  };
  batch.set(db.collection(COLLECTIONS.inviteLinks).doc(newId), newInvite);
  await batch.commit();

  return jsonResponse(200, { id: newId, token });
}

export async function handleListPatients(auth: AuthContext, workspaceId: string) {
  await assertWorkspaceStaff(auth.user, workspaceId);
  const patients = await listVisiblePatients(auth.user, workspaceId);
  const db = getDb();

  const enriched = await Promise.all(
    patients.map(async (p) => {
      const entriesSnap = await db
        .collection(COLLECTIONS.entries)
        .where('workspacePatientId', '==', p.id)
        .orderBy('entryDate', 'desc')
        .limit(1)
        .get();

      const assignmentSnap = await db
        .collection(COLLECTIONS.assignments)
        .where('workspacePatientId', '==', p.id)
        .where('endsAt', '==', null)
        .limit(1)
        .get();

      let adherence = { expected: 0, filled: 0 };
      if (!assignmentSnap.empty) {
        const assignment = assignmentSnap.docs[0]!.data() as AssignmentDoc;
        const versionDoc = await db.collection(COLLECTIONS.templateVersions).doc(assignment.templateVersionId).get();
        const version = versionDoc.data() as TemplateVersionDoc;

        const weekEntries = await db
          .collection(COLLECTIONS.entries)
          .where('workspacePatientId', '==', p.id)
          .get();

        const filledDates = new Set(weekEntries.docs.map((e) => (e.data() as EntryDoc).entryDate));
        adherence = computeAdherence(
          version.periodicityType,
          version.periodicityConfig,
          assignment.startsAt,
          filledDates,
        );
      }

      return {
        ...p,
        lastEntryAt: entriesSnap.empty ? null : (entriesSnap.docs[0]!.data() as EntryDoc).createdAt,
        adherence,
      };
    }),
  );

  return jsonResponse(200, { patients: enriched });
}

export async function handleGetPatient(auth: AuthContext, patientId: string) {
  const patient = await assertCanSeePatient(auth.user, patientId);
  const db = getDb();

  const assignmentSnap = await db
    .collection(COLLECTIONS.assignments)
    .where('workspacePatientId', '==', patientId)
    .where('endsAt', '==', null)
    .limit(1)
    .get();

  let assignment = null;
  let templateVersion = null;
  if (!assignmentSnap.empty) {
    const aDoc = assignmentSnap.docs[0]!;
    assignment = { id: aDoc.id, ...(aDoc.data() as AssignmentDoc) };
    const vDoc = await db.collection(COLLECTIONS.templateVersions).doc(assignment.templateVersionId).get();
    templateVersion = { id: vDoc.id, ...(vDoc.data() as TemplateVersionDoc) };
  }

  const careSnap = await db.collection(COLLECTIONS.careTeam).where('workspacePatientId', '==', patientId).get();
  const careTeam = careSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return jsonResponse(200, { patient, assignment, templateVersion, careTeam });
}

export async function handlePatchPatient(auth: AuthContext, patientId: string, event: HandlerEvent) {
  await assertCanEditPatient(auth.user, patientId);
  const body = parseBody<Partial<WorkspacePatientDoc>>(event);
  const allowed: Partial<WorkspacePatientDoc> = {};

  if (body.firstName !== undefined) allowed.firstName = body.firstName;
  if (body.lastName !== undefined) allowed.lastName = body.lastName;
  if (body.birthDate !== undefined) allowed.birthDate = body.birthDate;
  if (body.phone !== undefined) allowed.phone = body.phone;
  if (body.internalNotes !== undefined) allowed.internalNotes = body.internalNotes;
  if (body.archivedAt !== undefined) allowed.archivedAt = body.archivedAt;
  if (body.photoUrl !== undefined) allowed.photoUrl = body.photoUrl;

  await getDb().collection(COLLECTIONS.workspacePatients).doc(patientId).update(allowed);
  return jsonResponse(200, { ok: true });
}

export async function handleAssignTemplate(auth: AuthContext, patientId: string, event: HandlerEvent) {
  await assertCanEditPatient(auth.user, patientId);
  const body = parseBody<{ templateId: string; templateVersionId?: string }>(event);
  const db = getDb();

  const templateDoc = await db.collection(COLLECTIONS.templates).doc(body.templateId).get();
  if (!templateDoc.exists) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'Plantilla no encontrada');
  }

  let versionId = body.templateVersionId;
  if (!versionId) {
    const vSnap = await db
      .collection(COLLECTIONS.templateVersions)
      .where('templateId', '==', body.templateId)
      .orderBy('version', 'desc')
      .limit(1)
      .get();
    if (vSnap.empty) throw new ApiHttpError(404, 'NO_VERSION', 'La plantilla no tiene versiones');
    versionId = vSnap.docs[0]!.id;
  }

  const openSnap = await db
    .collection(COLLECTIONS.assignments)
    .where('workspacePatientId', '==', patientId)
    .where('endsAt', '==', null)
    .get();

  const batch = db.batch();
  for (const d of openSnap.docs) {
    batch.update(d.ref, { endsAt: yesterdayISO() });
  }

  const newId = uuidv4();
  const assignment: AssignmentDoc = {
    workspacePatientId: patientId,
    templateId: body.templateId,
    templateVersionId: versionId,
    startsAt: todayISO(),
    endsAt: null,
    createdAt: nowISO(),
  };
  batch.set(db.collection(COLLECTIONS.assignments).doc(newId), assignment);
  await batch.commit();

  return jsonResponse(200, { assignmentId: newId });
}

export async function handleAddCareTeam(auth: AuthContext, patientId: string, event: HandlerEvent) {
  const patient = await assertCanSeePatient(auth.user, patientId);
  await assertWorkspaceAdmin(auth.user, patient.workspaceId);

  const body = parseBody<{ memberUserId: string; canEdit: boolean }>(event);
  const member = await getWorkspaceMember(patient.workspaceId, body.memberUserId);
  if (!member) {
    throw new ApiHttpError(404, 'NOT_FOUND', 'El profesional no pertenece a este espacio');
  }

  const careId = uuidv4();
  await getDb().collection(COLLECTIONS.careTeam).doc(careId).set({
    workspaceId: patient.workspaceId,
    workspacePatientId: patientId,
    memberUserId: body.memberUserId,
    canEdit: body.canEdit,
    createdAt: nowISO(),
  });

  return jsonResponse(201, { id: careId });
}

export async function handleListTemplates(auth: AuthContext, workspaceId: string) {
  await assertWorkspaceStaff(auth.user, workspaceId);
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.templates).where('workspaceId', '==', workspaceId).get();

  const templates = await Promise.all(
    snap.docs.map(async (d) => {
      const template = { id: d.id, ...(d.data() as TemplateDoc) };
      const vSnap = await db
        .collection(COLLECTIONS.templateVersions)
        .where('templateId', '==', d.id)
        .orderBy('version', 'desc')
        .limit(1)
        .get();
      const latestVersion = vSnap.empty
        ? null
        : { id: vSnap.docs[0]!.id, ...(vSnap.docs[0]!.data() as TemplateVersionDoc) };
      return { ...template, latestVersion };
    }),
  );

  return jsonResponse(200, { templates });
}

export async function handleCreateTemplate(auth: AuthContext, event: HandlerEvent) {
  const body = parseBody<{
    workspaceId: string;
    name: string;
    fields?: TemplateVersionDoc['fields'];
    patientGuide?: string | null;
  }>(event);
  await assertWorkspaceStaff(auth.user, body.workspaceId, ['admin', 'professional']);

  const db = getDb();
  const templateId = uuidv4();
  const versionId = uuidv4();

  const template: TemplateDoc = {
    workspaceId: body.workspaceId,
    name: body.name.trim(),
    isDefault: false,
    archivedAt: null,
    createdAt: nowISO(),
  };

  const version: TemplateVersionDoc = {
    templateId,
    version: 1,
    periodicityType: 'daily',
    periodicityConfig: {},
    fields: validateFieldDefinitions(body.fields ?? DEFAULT_TEMPLATE_FIELDS),
    patientGuide: body.patientGuide?.trim() || null,
    createdAt: nowISO(),
  };

  const batch = db.batch();
  batch.set(db.collection(COLLECTIONS.templates).doc(templateId), template);
  batch.set(db.collection(COLLECTIONS.templateVersions).doc(versionId), version);
  await batch.commit();

  return jsonResponse(201, { template: { id: templateId, ...template }, version: { id: versionId, ...version } });
}

export async function handleCreateTemplateVersion(auth: AuthContext, templateId: string, event: HandlerEvent) {
  const db = getDb();
  const templateDoc = await db.collection(COLLECTIONS.templates).doc(templateId).get();
  if (!templateDoc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Plantilla no encontrada');

  const template = templateDoc.data() as TemplateDoc;
  await assertWorkspaceStaff(auth.user, template.workspaceId, ['admin', 'professional']);

  const body = parseBody<{
    fields: TemplateVersionDoc['fields'];
    periodicityType: TemplateVersionDoc['periodicityType'];
    periodicityConfig: TemplateVersionDoc['periodicityConfig'];
    patientGuide?: string | null;
    mutateIfNoEntries?: boolean;
  }>(event);

  const fields = validateFieldDefinitions(body.fields);
  const latestSnap = await db
    .collection(COLLECTIONS.templateVersions)
    .where('templateId', '==', templateId)
    .orderBy('version', 'desc')
    .limit(1)
    .get();

  if (latestSnap.empty) throw new ApiHttpError(404, 'NO_VERSION', 'Sin versiones');

  const latestDoc = latestSnap.docs[0]!;
  const latest = latestDoc.data() as TemplateVersionDoc;

  const entriesSnap = await db
    .collection(COLLECTIONS.entries)
    .where('templateVersionId', '==', latestDoc.id)
    .limit(1)
    .get();

  if (entriesSnap.empty && body.mutateIfNoEntries !== false) {
    await latestDoc.ref.update({
      fields,
      periodicityType: body.periodicityType ?? latest.periodicityType,
      periodicityConfig: body.periodicityConfig ?? latest.periodicityConfig,
      patientGuide: body.patientGuide !== undefined ? body.patientGuide?.trim() || null : latest.patientGuide ?? null,
    });
    return jsonResponse(200, {
      version: {
        id: latestDoc.id,
        ...latest,
        fields,
        patientGuide: body.patientGuide !== undefined ? body.patientGuide?.trim() || null : latest.patientGuide ?? null,
      },
    });
  }

  const versionId = uuidv4();
  const version: TemplateVersionDoc = {
    templateId,
    version: latest.version + 1,
    periodicityType: body.periodicityType ?? latest.periodicityType,
    periodicityConfig: body.periodicityConfig ?? latest.periodicityConfig,
    fields,
    patientGuide: body.patientGuide !== undefined ? body.patientGuide?.trim() || null : latest.patientGuide ?? null,
    createdAt: nowISO(),
  };

  await db.collection(COLLECTIONS.templateVersions).doc(versionId).set(version);
  return jsonResponse(201, { version: { id: versionId, ...version } });
}

export async function handleGetWeek(auth: AuthContext, patientId: string, from?: string) {
  const patient = await assertCanSeePatient(auth.user, patientId);
  const db = getDb();

  const assignmentSnap = await db
    .collection(COLLECTIONS.assignments)
    .where('workspacePatientId', '==', patientId)
    .where('endsAt', '==', null)
    .limit(1)
    .get();

  if (assignmentSnap.empty) {
    throw new ApiHttpError(404, 'NO_ASSIGNMENT', 'No hay plantilla asignada');
  }

  const assignment = assignmentSnap.docs[0]!.data() as AssignmentDoc;
  const versionDoc = await db.collection(COLLECTIONS.templateVersions).doc(assignment.templateVersionId).get();
  const version = versionDoc.data() as TemplateVersionDoc;

  const baseDate = from ? parseISODate(from) : new Date();
  const weekDays = getWeekDays(baseDate);
  const today = formatDateISO(new Date());

  const entriesSnap = await db
    .collection(COLLECTIONS.entries)
    .where('workspacePatientId', '==', patientId)
    .get();

  const entriesByDate = new Map<string, EntryDoc[]>();
  for (const d of entriesSnap.docs) {
    const entry = d.data() as EntryDoc;
    const list = entriesByDate.get(entry.entryDate) ?? [];
    list.push(entry);
    entriesByDate.set(entry.entryDate, list);
  }

  const days = weekDays.map((day) => {
    const dayEntries = entriesByDate.get(day.date) ?? [];
    const latest = dayEntries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    return {
      date: day.date,
      label: day.label,
      isToday: day.date === today,
      isFuture: isFutureDate(day.date, today),
      isExpected: isExpectedDay(version.periodicityType, day.date, version.periodicityConfig, assignment.startsAt),
      isFilled: dayEntries.length > 0,
      entryCount: dayEntries.length,
      preview: latest ? formatEntryPreview(latest.values) : null,
    };
  });

  const weekHasEntry = days.some((d) => d.isFilled);

  return jsonResponse(200, {
    days,
    periodicityType: version.periodicityType,
    weekHasEntry,
    assignment,
    templateVersion: { id: versionDoc.id, ...version },
    patient,
  });
}

export async function handleListEntries(auth: AuthContext, patientId: string, from?: string, to?: string) {
  await assertCanSeePatient(auth.user, patientId);
  const db = getDb();
  let query = db.collection(COLLECTIONS.entries).where('workspacePatientId', '==', patientId);
  if (from) query = query.where('entryDate', '>=', from);
  if (to) query = query.where('entryDate', '<=', to);
  const snap = await query.orderBy('entryDate', 'desc').get();

  const entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as EntryDoc) }));
  return jsonResponse(200, { entries });
}

export async function handleCreateEntry(auth: AuthContext, event: HandlerEvent) {
  const body = parseBody<{
    workspacePatientId: string;
    entryDate: string;
    values: Record<string, unknown>;
    updateEntryId?: string;
    forceNew?: boolean;
  }>(event);

  const patient = await assertCanEditPatient(auth.user, body.workspacePatientId);

  if (isFutureDate(body.entryDate)) {
    throw new ApiHttpError(400, 'FUTURE_DATE', 'No podés cargar fechas futuras');
  }

  const db = getDb();
  const assignmentSnap = await db
    .collection(COLLECTIONS.assignments)
    .where('workspacePatientId', '==', body.workspacePatientId)
    .where('endsAt', '==', null)
    .limit(1)
    .get();

  if (assignmentSnap.empty) {
    throw new ApiHttpError(404, 'NO_ASSIGNMENT', 'No hay plantilla asignada');
  }

  const assignment = assignmentSnap.docs[0]!.data() as AssignmentDoc;
  const versionDoc = await db.collection(COLLECTIONS.templateVersions).doc(assignment.templateVersionId).get();
  const version = versionDoc.data() as TemplateVersionDoc;
  const validatedValues = validateEntryValues(version.fields, body.values);

  const periodKey = computePeriodKey(
    version.periodicityType,
    body.entryDate,
    version.periodicityConfig,
    assignment.startsAt,
  );

  if (body.updateEntryId) {
    const existing = await db.collection(COLLECTIONS.entries).doc(body.updateEntryId).get();
    if (!existing.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Registro no encontrado');
    const entry = existing.data() as EntryDoc;
    if (entry.workspacePatientId !== body.workspacePatientId) {
      throw new ApiHttpError(403, 'FORBIDDEN', 'No podés editar este registro');
    }
    if (entry.entryDate !== todayInAR()) {
      throw new ApiHttpError(403, 'NOT_TODAY', 'Solo se puede cambiar lo de hoy.');
    }
    await existing.ref.update({ values: validatedValues, updatedAt: nowISO() });
    return jsonResponse(200, { id: existing.id, updated: true });
  }

  if (!body.forceNew) {
    const periodEntries = await db
      .collection(COLLECTIONS.entries)
      .where('workspacePatientId', '==', body.workspacePatientId)
      .where('periodKey', '==', periodKey)
      .get();

    if (!periodEntries.empty) {
      return jsonResponse(409, {
        code: 'PERIOD_EXISTS',
        message: 'Ya hay un registro para este período.',
        existingEntries: periodEntries.docs.map((d) => ({ id: d.id, ...(d.data() as EntryDoc) })),
      });
    }
  }

  const entryId = uuidv4();
  const entry: EntryDoc = {
    workspaceId: patient.workspaceId,
    workspacePatientId: body.workspacePatientId,
    templateVersionId: versionDoc.id,
    periodKey,
    entryDate: body.entryDate,
    values: validatedValues,
    createdAt: nowISO(),
    updatedAt: nowISO(),
  };

  await db.collection(COLLECTIONS.entries).doc(entryId).set(entry);
  return jsonResponse(201, { id: entryId, ...entry });
}

export async function handlePatchEntry(auth: AuthContext, entryId: string, event: HandlerEvent) {
  const body = parseBody<{ values: Record<string, unknown> }>(event);
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.entries).doc(entryId).get();
  if (!doc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Registro no encontrado');

  const entry = doc.data() as EntryDoc;
  await assertCanEditPatient(auth.user, entry.workspacePatientId);
  if (entry.entryDate !== todayInAR()) {
    throw new ApiHttpError(403, 'NOT_TODAY', 'Solo se puede cambiar lo de hoy.');
  }

  const versionDoc = await db.collection(COLLECTIONS.templateVersions).doc(entry.templateVersionId).get();
  const version = versionDoc.data() as TemplateVersionDoc;
  const validatedValues = validateEntryValues(version.fields, body.values);

  await doc.ref.update({ values: validatedValues, updatedAt: nowISO() });
  return jsonResponse(200, { id: entryId, updated: true });
}

export async function handleAdminOverview(auth: AuthContext) {
  if (auth.user.platformRole !== 'global_admin') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés ver esto');
  }

  const db = getDb();
  const [users, workspaces, patients, entries] = await Promise.all([
    db.collection(COLLECTIONS.users).count().get(),
    db.collection(COLLECTIONS.workspaces).count().get(),
    db.collection(COLLECTIONS.workspacePatients).count().get(),
    db.collection(COLLECTIONS.entries).count().get(),
  ]);

  return jsonResponse(200, {
    users: users.data().count,
    workspaces: workspaces.data().count,
    patients: patients.data().count,
    entries: entries.data().count,
  });
}

export async function handleAdminUsers(auth: AuthContext) {
  if (auth.user.platformRole !== 'global_admin') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés ver esto');
  }

  const snap = await getDb().collection(COLLECTIONS.users).orderBy('createdAt', 'desc').limit(100).get();
  const users = snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }));
  return jsonResponse(200, { users });
}

export async function handleAdminWorkspaces(auth: AuthContext) {
  if (auth.user.platformRole !== 'global_admin') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés ver esto');
  }

  const snap = await getDb().collection(COLLECTIONS.workspaces).orderBy('createdAt', 'desc').limit(100).get();
  const workspaces = snap.docs.map((d) => ({ id: d.id, ...(d.data() as WorkspaceDoc) }));
  return jsonResponse(200, { workspaces });
}

export async function handleAdminEntries(auth: AuthContext, event: HandlerEvent) {
  if (auth.user.platformRole !== 'global_admin') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés ver esto');
  }

  const params = event.queryStringParameters ?? {};
  const db = getDb();
  let query = db.collection(COLLECTIONS.entries).orderBy('createdAt', 'desc').limit(50);

  if (params.workspacePatientId) {
    query = db
      .collection(COLLECTIONS.entries)
      .where('workspacePatientId', '==', params.workspacePatientId)
      .orderBy('createdAt', 'desc')
      .limit(50) as typeof query;
  }

  const snap = await query.get();
  const entries = snap.docs.map((d) => ({ id: d.id, ...(d.data() as EntryDoc) }));
  return jsonResponse(200, { entries });
}

export async function handleDisableUser(auth: AuthContext, userId: string) {
  if (auth.user.platformRole !== 'global_admin') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés hacer esto');
  }

  const db = getDb();
  const userDoc = await db.collection(COLLECTIONS.users).doc(userId).get();
  if (!userDoc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Usuario no encontrado');

  const user = userDoc.data() as UserDoc;
  await getAdminAuth().updateUser(user.firebaseUid, { disabled: true });
  await userDoc.ref.update({ disabledAt: nowISO() });

  return jsonResponse(200, { ok: true });
}

export async function handleWorkspaceOverview(auth: AuthContext, workspaceId: string, fromParam?: string, toParam?: string) {
  await assertWorkspaceStaff(auth.user, workspaceId);
  const patients = await listVisiblePatients(auth.user, workspaceId);
  const db = getDb();

  const to = toParam || todayInAR();
  const from = fromParam || formatDateISO(addDays(parseISODate(to), -27));
  const weekStart = formatDateISO(startOfWeekMonday(parseISODate(todayInAR())));

  let entriesThisWeek = 0;
  let totalAdherence = { expected: 0, filled: 0 };
  const rangeEntries: EntryDoc[] = [];
  const reports: ReturnType<typeof buildFieldReports> = [];

  for (const p of patients) {
    const entriesSnap = await db
      .collection(COLLECTIONS.entries)
      .where('workspacePatientId', '==', p.id)
      .where('entryDate', '>=', from)
      .where('entryDate', '<=', to)
      .get();
    const patientEntries = entriesSnap.docs.map((d) => d.data() as EntryDoc);
    rangeEntries.push(...patientEntries);

    const weekSnap = await db
      .collection(COLLECTIONS.entries)
      .where('workspacePatientId', '==', p.id)
      .where('entryDate', '>=', weekStart)
      .get();
    entriesThisWeek += weekSnap.size;

    const assignmentSnap = await db
      .collection(COLLECTIONS.assignments)
      .where('workspacePatientId', '==', p.id)
      .where('endsAt', '==', null)
      .limit(1)
      .get();

    if (!assignmentSnap.empty) {
      const assignment = assignmentSnap.docs[0]!.data() as AssignmentDoc;
      const versionDoc = await db.collection(COLLECTIONS.templateVersions).doc(assignment.templateVersionId).get();
      const version = versionDoc.data() as TemplateVersionDoc;
      if (version?.fields) reports.push(...buildFieldReports(patientEntries, version.fields));
      const allEntries = await db.collection(COLLECTIONS.entries).where('workspacePatientId', '==', p.id).get();
      const filledDates = new Set(allEntries.docs.map((e) => (e.data() as EntryDoc).entryDate));
      const adh = computeAdherence(version.periodicityType, version.periodicityConfig, assignment.startsAt, filledDates);
      totalAdherence.expected += adh.expected;
      totalAdherence.filled += adh.filled;
    }
  }

  const inactivePatients: Array<{
    id: string;
    firstName: string;
    lastName: string;
    lastEntryAt: string | null;
    photoUrl?: string | null;
  }> = [];

  for (const p of patients) {
    const entriesSnap = await db
      .collection(COLLECTIONS.entries)
      .where('workspacePatientId', '==', p.id)
      .orderBy('entryDate', 'desc')
      .limit(1)
      .get();

    const lastEntryAt = entriesSnap.empty ? null : (entriesSnap.docs[0]!.data() as EntryDoc).createdAt;
    const assignmentSnap = await db
      .collection(COLLECTIONS.assignments)
      .where('workspacePatientId', '==', p.id)
      .where('endsAt', '==', null)
      .limit(1)
      .get();

    let periodsWithout = 3;
    if (!assignmentSnap.empty) {
      const assignment = assignmentSnap.docs[0]!.data() as AssignmentDoc;
      const versionDoc = await db.collection(COLLECTIONS.templateVersions).doc(assignment.templateVersionId).get();
      const version = versionDoc.data() as TemplateVersionDoc;
      periodsWithout =
        version.periodicityType === 'weekly'
          ? 21
          : version.periodicityType === 'every_n_days'
            ? (version.periodicityConfig.n ?? 2) * 3
            : 3;
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodsWithout);
    if (!lastEntryAt || new Date(lastEntryAt) < cutoff) {
      inactivePatients.push({
        id: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        lastEntryAt,
        photoUrl: p.photoUrl,
      });
    }
  }

  return jsonResponse(200, {
    from,
    to,
    activePatients: patients.length,
    entriesThisWeek,
    entriesInRange: rangeEntries.length,
    adherencePercent:
      totalAdherence.expected > 0 ? Math.round((totalAdherence.filled / totalAdherence.expected) * 100) : 0,
    inactivePatients: inactivePatients.slice(0, 10),
    weekdayLoads: weekdayCounts(rangeEntries),
    dailyLoads: dailyCounts(rangeEntries),
    fieldReports: mergeFieldReports(reports),
  });
}

export async function handleListInvites(auth: AuthContext, workspaceId: string) {
  await assertWorkspaceStaff(auth.user, workspaceId);
  const snap = await getDb()
    .collection(COLLECTIONS.inviteLinks)
    .where('workspaceId', '==', workspaceId)
    .where('revokedAt', '==', null)
    .get();

  const invites = snap.docs.map((d) => {
    const data = d.data() as InviteLinkDoc;
    const { tokenHash: _, ...safe } = data;
    return { id: d.id, ...safe };
  });

  return jsonResponse(200, { invites });
}

export async function handleEnsurePatientInvite(auth: AuthContext, workspaceId: string) {
  const member = await assertWorkspaceStaff(auth.user, workspaceId, ['admin', 'professional']);
  if (member.role === 'read_only') {
    throw new ApiHttpError(403, 'FORBIDDEN', 'No podés invitar pacientes');
  }
  const db = getDb();
  const snap = await db
    .collection(COLLECTIONS.inviteLinks)
    .where('workspaceId', '==', workspaceId)
    .where('kind', '==', 'patient')
    .get();
  const active = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as InviteLinkDoc) }))
    .filter((i) => !i.revokedAt && i.expiresAt >= nowISO())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];

  if (active?.token) {
    return jsonResponse(200, { token: active.token, id: active.id });
  }

  const token = generateInviteToken();
  if (active) {
    await db.collection(COLLECTIONS.inviteLinks).doc(active.id).update({
      token,
      tokenHash: hashToken(token),
    });
    return jsonResponse(200, { token, id: active.id });
  }

  const inviteId = uuidv4();
  const invite: InviteLinkDoc = {
    workspaceId,
    kind: 'patient',
    role: null,
    createdBy: auth.userId,
    tokenHash: hashToken(token),
    token,
    revokedAt: null,
    expiresAt: daysFromNow(90),
    singleUse: false,
    usedAt: null,
    assignedEmail: null,
    assignToMemberId: auth.userId,
    seeAllPatients: false,
    createdAt: nowISO(),
  };
  await db.collection(COLLECTIONS.inviteLinks).doc(inviteId).set(invite);
  return jsonResponse(201, { token, id: inviteId });
}

export async function handleListWorkspaceMembers(auth: AuthContext, workspaceId: string) {
  await assertWorkspaceStaff(auth.user, workspaceId);
  const db = getDb();
  const snap = await db.collection(COLLECTIONS.workspaceMembers).where('workspaceId', '==', workspaceId).get();

  const members = (
    await Promise.all(
      snap.docs.map(async (d) => {
        const member = { id: d.id, ...(d.data() as WorkspaceMemberDoc) };
        if (member.removedAt) return null;
        const userDoc = await db.collection(COLLECTIONS.users).doc(member.userId).get();
        const user = userDoc.data() as UserDoc;
        return { ...member, email: user?.email, displayName: user?.displayName };
      }),
    )
  ).filter(Boolean);

  return jsonResponse(200, { members });
}

function assertToday(entryDate: string) {
  if (entryDate !== todayInAR()) {
    throw new ApiHttpError(403, 'NOT_TODAY', 'Solo se puede cambiar lo de hoy.');
  }
}

export async function handleDeleteEntry(auth: AuthContext, entryId: string) {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.entries).doc(entryId).get();
  if (!doc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Registro no encontrado');
  const entry = doc.data() as EntryDoc;
  await assertCanEditPatient(auth.user, entry.workspacePatientId);
  assertToday(entry.entryDate);
  await doc.ref.delete();
  return jsonResponse(200, { ok: true });
}

export async function handlePatchWorkspace(auth: AuthContext, workspaceId: string, event: HandlerEvent) {
  await assertWorkspaceAdmin(auth.user, workspaceId);
  const body = parseBody<{ name?: string; imageUrl?: string | null }>(event);
  const allowed: Partial<WorkspaceDoc> = {};
  if (body.name?.trim()) allowed.name = body.name.trim();
  if (body.imageUrl !== undefined) allowed.imageUrl = body.imageUrl;
  if (Object.keys(allowed).length) {
    await getDb().collection(COLLECTIONS.workspaces).doc(workspaceId).update(allowed);
  }
  return jsonResponse(200, { ok: true });
}

export async function handleGetTemplate(auth: AuthContext, templateId: string) {
  const db = getDb();
  const templateDoc = await db.collection(COLLECTIONS.templates).doc(templateId).get();
  if (!templateDoc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Plantilla no encontrada');
  const template = templateDoc.data() as TemplateDoc;
  await assertWorkspaceStaff(auth.user, template.workspaceId, ['admin', 'professional']);
  const vSnap = await db
    .collection(COLLECTIONS.templateVersions)
    .where('templateId', '==', templateId)
    .orderBy('version', 'desc')
    .limit(1)
    .get();
  const latestVersion = vSnap.empty
    ? null
    : { id: vSnap.docs[0]!.id, ...(vSnap.docs[0]!.data() as TemplateVersionDoc) };
  return jsonResponse(200, { template: { id: templateDoc.id, ...template, latestVersion } });
}

export async function handleListNotes(auth: AuthContext, patientId: string, from?: string, to?: string) {
  const patient = await assertCanSeePatient(auth.user, patientId);
  const snap = await getDb()
    .collection(COLLECTIONS.professionalNotes)
    .where('workspacePatientId', '==', patientId)
    .get();
  const notes = snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as ProfessionalNoteDoc) }))
    .filter((n) => {
      const day = n.createdAt.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return jsonResponse(200, { notes, workspaceId: patient.workspaceId });
}

export async function handleCreateNote(auth: AuthContext, patientId: string, event: HandlerEvent) {
  const patient = await assertCanEditPatient(auth.user, patientId);
  const body = parseBody<{ body: string }>(event);
  if (!body.body?.trim()) throw new ApiHttpError(400, 'INVALID_INPUT', 'Escribí un comentario');
  const note: ProfessionalNoteDoc = {
    workspaceId: patient.workspaceId,
    workspacePatientId: patientId,
    authorUserId: auth.userId,
    body: body.body.trim(),
    createdAt: nowISO(),
  };
  const id = uuidv4();
  await getDb().collection(COLLECTIONS.professionalNotes).doc(id).set(note);
  return jsonResponse(201, { note: { id, ...note } });
}

export async function handleDeleteNote(auth: AuthContext, noteId: string) {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.professionalNotes).doc(noteId).get();
  if (!doc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'No encontramos el comentario');
  const note = doc.data() as ProfessionalNoteDoc;
  await assertCanEditPatient(auth.user, note.workspacePatientId);
  if (note.authorUserId !== auth.userId && auth.user.platformRole !== 'global_admin') {
    const member = await getWorkspaceMember(note.workspaceId, auth.userId);
    if (member?.role !== 'admin') {
      throw new ApiHttpError(403, 'FORBIDDEN', 'Solo quien lo escribió o quien administra puede borrarlo');
    }
  }
  await doc.ref.delete();
  return jsonResponse(200, { ok: true });
}

export async function handlePatchTemplate(auth: AuthContext, templateId: string, event: HandlerEvent) {
  const db = getDb();
  const templateDoc = await db.collection(COLLECTIONS.templates).doc(templateId).get();
  if (!templateDoc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'Plantilla no encontrada');
  const template = templateDoc.data() as TemplateDoc;
  await assertWorkspaceStaff(auth.user, template.workspaceId, ['admin', 'professional']);
  const body = parseBody<{ name?: string }>(event);
  if (!body.name?.trim()) throw new ApiHttpError(400, 'INVALID_INPUT', 'El nombre es obligatorio');
  await templateDoc.ref.update({ name: body.name.trim() });
  return jsonResponse(200, { ok: true });
}

export async function handleRemoveMember(auth: AuthContext, workspaceId: string, memberId: string) {
  await assertWorkspaceAdmin(auth.user, workspaceId);
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.workspaceMembers).doc(memberId).get();
  if (!doc.exists) throw new ApiHttpError(404, 'NOT_FOUND', 'No está en el equipo');
  const member = doc.data() as WorkspaceMemberDoc;
  if (member.workspaceId !== workspaceId) throw new ApiHttpError(403, 'FORBIDDEN', 'No corresponde a este espacio');
  if (member.userId === auth.userId) {
    throw new ApiHttpError(400, 'INVALID_INPUT', 'No podés sacarte a vos mismo');
  }
  const others = await db.collection(COLLECTIONS.workspaceMembers).where('workspaceId', '==', workspaceId).get();
  const activeAdmins = others.docs.filter((d) => {
    const m = d.data() as WorkspaceMemberDoc;
    return !m.removedAt && m.role === 'admin' && d.id !== memberId;
  });
  if (member.role === 'admin' && activeAdmins.length === 0) {
    throw new ApiHttpError(400, 'LAST_ADMIN', 'Tiene que quedar al menos una persona que administre');
  }
  await doc.ref.update({ removedAt: nowISO() });
  return jsonResponse(200, { ok: true });
}

export async function handleUpload(auth: AuthContext, event: HandlerEvent) {
  const body = parseBody<{ purpose: 'workspace' | 'patient'; targetId: string; dataUrl: string }>(event);
  if (!body.dataUrl?.startsWith('data:image/') || !body.targetId) {
    throw new ApiHttpError(400, 'INVALID_INPUT', 'La imagen no es válida');
  }

  if (body.purpose === 'workspace') {
    await assertWorkspaceAdmin(auth.user, body.targetId);
  } else {
    await assertCanEditPatient(auth.user, body.targetId);
  }

  const match = body.dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!match) throw new ApiHttpError(400, 'INVALID_INPUT', 'La imagen no es válida');
  const contentType = match[1]!;
  const buffer = Buffer.from(match[2]!, 'base64');
  if (buffer.length > 1_500_000) {
    throw new ApiHttpError(400, 'TOO_LARGE', 'La imagen es muy pesada. Probá con otra más chica.');
  }

  const token = uuidv4();
  const path = `shanti/${body.purpose}/${body.targetId}/${token}.webp`;
  try {
    const file = getBucket().file(path);
    await file.save(buffer, {
      resumable: false,
      metadata: {
        contentType,
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });
    const url = `https://firebasestorage.googleapis.com/v0/b/${getBucket().name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`;
    if (body.purpose === 'workspace') {
      await getDb().collection(COLLECTIONS.workspaces).doc(body.targetId).update({ imageUrl: url });
    } else {
      await getDb().collection(COLLECTIONS.workspacePatients).doc(body.targetId).update({ photoUrl: url });
    }
    return jsonResponse(200, { url });
  } catch (err) {
    console.error(err);
    throw new ApiHttpError(500, 'UPLOAD_FAILED', 'No pudimos guardar la imagen. Si es la primera vez, hay que activar Storage en Firebase.');
  }
}
