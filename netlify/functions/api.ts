import type { Handler, HandlerEvent } from '@netlify/functions';
import {
  handleAcceptInvite,
  handleAddCareTeam,
  handleAdminEntries,
  handleAdminOverview,
  handleAdminUsers,
  handleAdminWorkspaces,
  handleAssignTemplate,
  handleBootstrap,
  handleCreateEntry,
  handleCreateInvite,
  handleCreateNote,
  handleCreateTemplate,
  handleCreateTemplateVersion,
  handleCreateWorkspace,
  handleDeleteEntry,
  handleDeleteNote,
  handleDisableUser,
  handleEnsurePatientInvite,
  handleGetInvite,
  handleGetMe,
  handleGetPatient,
  handleGetTemplate,
  handleGetWeek,
  handleListEntries,
  handleListInvites,
  handleListNotes,
  handleListPatients,
  handleListTemplates,
  handleListWorkspaceMembers,
  handlePatchEntry,
  handlePatchPatient,
  handlePatchTemplate,
  handleSetDefaultTemplate,
  handlePatchWorkspace,
  handleRemoveMember,
  handleRotateInvite,
  handleUpload,
  handleWorkspaceOverview,
} from './lib/handlers';
import { authenticate, errorResponse, getPath, jsonResponse } from './lib/http';

async function route(event: HandlerEvent) {
  const method = event.httpMethod;
  const path = getPath(event);

  if (method === 'OPTIONS') {
    return jsonResponse(200, { ok: true });
  }

  // Public routes
  if (method === 'GET' && path.startsWith('invite/')) {
    const token = path.replace('invite/', '');
    return handleGetInvite(token);
  }

  if (method === 'POST' && path === 'me/bootstrap') {
    return handleBootstrap(event);
  }

  const auth = await authenticate(event);
  if (method === 'GET' && path === 'me') return handleGetMe(auth);

  if (method === 'POST' && path === 'workspaces') return handleCreateWorkspace(auth, event);
  if (method === 'PATCH' && path.match(/^workspaces\/[^/]+$/)) {
    return handlePatchWorkspace(auth, path.replace('workspaces/', ''), event);
  }
  if (method === 'POST' && path.match(/^workspaces\/[^/]+$/)) {
    return handlePatchWorkspace(auth, path.replace('workspaces/', ''), event);
  }
  if (method === 'POST' && path === 'uploads') return handleUpload(auth, event);

  if (method === 'POST' && path === 'invites/accept') return handleAcceptInvite(auth, event);
  if (method === 'POST' && path === 'invites') return handleCreateInvite(auth, event);
  if (method === 'POST' && path.startsWith('invites/') && path.endsWith('/rotate')) {
    const inviteId = path.replace('invites/', '').replace('/rotate', '');
    return handleRotateInvite(auth, inviteId);
  }
  if (method === 'GET' && path.startsWith('workspaces/') && path.endsWith('/invites')) {
    const workspaceId = path.replace('workspaces/', '').replace('/invites', '');
    return handleListInvites(auth, workspaceId);
  }
  if (method === 'GET' && path.match(/^workspaces\/[^/]+\/patient-invite$/)) {
    const workspaceId = path.split('/')[1]!;
    return handleEnsurePatientInvite(auth, workspaceId);
  }
  if (method === 'GET' && path.startsWith('workspaces/') && path.endsWith('/members')) {
    const workspaceId = path.replace('workspaces/', '').replace('/members', '');
    return handleListWorkspaceMembers(auth, workspaceId);
  }
  if (method === 'POST' && path.match(/^workspaces\/[^/]+\/members\/[^/]+\/remove$/)) {
    const parts = path.split('/');
    return handleRemoveMember(auth, parts[1]!, parts[3]!);
  }
  if (method === 'GET' && path.startsWith('workspaces/') && path.endsWith('/overview')) {
    const workspaceId = path.replace('workspaces/', '').replace('/overview', '');
    return handleWorkspaceOverview(
      auth,
      workspaceId,
      event.queryStringParameters?.from,
      event.queryStringParameters?.to,
    );
  }

  if (method === 'GET' && path.startsWith('workspaces/') && path.endsWith('/patients')) {
    const workspaceId = path.replace('workspaces/', '').replace('/patients', '');
    return handleListPatients(auth, workspaceId);
  }

  if (method === 'GET' && path.startsWith('patients/') && path.endsWith('/week')) {
    const parts = path.split('/');
    const patientId = parts[1]!;
    const from = event.queryStringParameters?.from;
    return handleGetWeek(auth, patientId, from);
  }
  if (method === 'GET' && path.match(/^patients\/[^/]+\/notes$/)) {
    const patientId = path.split('/')[1]!;
    return handleListNotes(auth, patientId, event.queryStringParameters?.from, event.queryStringParameters?.to);
  }
  if (method === 'POST' && path.match(/^patients\/[^/]+\/notes$/)) {
    const patientId = path.split('/')[1]!;
    return handleCreateNote(auth, patientId, event);
  }
  if (method === 'DELETE' && path.match(/^notes\/[^/]+$/)) {
    return handleDeleteNote(auth, path.replace('notes/', ''));
  }
  if (method === 'GET' && path.startsWith('patients/') && path.endsWith('/entries')) {
    const patientId = path.replace('patients/', '').replace('/entries', '');
    return handleListEntries(auth, patientId, event.queryStringParameters?.from, event.queryStringParameters?.to);
  }
  if (method === 'GET' && path.startsWith('patients/')) {
    const patientId = path.replace('patients/', '');
    if (!patientId.includes('/')) return handleGetPatient(auth, patientId);
  }
  if (method === 'PATCH' && path.startsWith('patients/')) {
    const patientId = path.replace('patients/', '');
    return handlePatchPatient(auth, patientId, event);
  }
  if (method === 'POST' && path.match(/^patients\/[^/]+\/template$/)) {
    const patientId = path.split('/')[1]!;
    return handleAssignTemplate(auth, patientId, event);
  }
  if (method === 'POST' && path.match(/^patients\/[^/]+\/care-team$/)) {
    const patientId = path.split('/')[1]!;
    return handleAddCareTeam(auth, patientId, event);
  }

  if (method === 'GET' && path.match(/^workspaces\/[^/]+\/templates$/)) {
    const workspaceId = path.replace('workspaces/', '').replace('/templates', '');
    return handleListTemplates(auth, workspaceId);
  }
  if (method === 'POST' && path === 'templates') return handleCreateTemplate(auth, event);
  if (method === 'GET' && path.match(/^templates\/[^/]+$/)) {
    return handleGetTemplate(auth, path.replace('templates/', ''));
  }
  if (method === 'PATCH' && path.match(/^templates\/[^/]+$/)) {
    return handlePatchTemplate(auth, path.replace('templates/', ''), event);
  }
  if (method === 'POST' && path.match(/^templates\/[^/]+\/default$/)) {
    const templateId = path.split('/')[1]!;
    return handleSetDefaultTemplate(auth, templateId);
  }
  if (method === 'POST' && path.match(/^templates\/[^/]+\/versions$/)) {
    const templateId = path.split('/')[1]!;
    return handleCreateTemplateVersion(auth, templateId, event);
  }

  if (method === 'GET' && path === 'entries') {
    const patientId = event.queryStringParameters?.workspacePatientId;
    if (!patientId) throw new Error('workspacePatientId requerido');
    return handleListEntries(
      auth,
      patientId,
      event.queryStringParameters?.from,
      event.queryStringParameters?.to,
    );
  }
  if (method === 'POST' && path === 'entries') return handleCreateEntry(auth, event);
  if (method === 'PATCH' && path.startsWith('entries/')) {
    const entryId = path.replace('entries/', '');
    return handlePatchEntry(auth, entryId, event);
  }
  if (method === 'DELETE' && path.startsWith('entries/')) {
    const entryId = path.replace('entries/', '');
    return handleDeleteEntry(auth, entryId);
  }

  if (method === 'GET' && path === 'admin/overview') return handleAdminOverview(auth);
  if (method === 'GET' && path === 'admin/users') return handleAdminUsers(auth);
  if (method === 'GET' && path === 'admin/workspaces') return handleAdminWorkspaces(auth);
  if (method === 'GET' && path === 'admin/entries') return handleAdminEntries(auth, event);
  if (method === 'POST' && path.startsWith('admin/users/') && path.endsWith('/disable')) {
    const userId = path.replace('admin/users/', '').replace('/disable', '');
    return handleDisableUser(auth, userId);
  }

  return jsonResponse(404, { code: 'NOT_FOUND', message: 'Ruta no encontrada' });
}

export const handler: Handler = async (event) => {
  try {
    return await route(event);
  } catch (err) {
    return errorResponse(err);
  }
};
