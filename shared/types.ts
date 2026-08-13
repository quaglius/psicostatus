export type PlatformRole = 'global_admin' | 'user';
export type WorkspaceKind = 'solo' | 'grupo' | 'clinica';
export type WorkspaceMemberRole = 'admin' | 'professional' | 'read_only';
export type InviteKind = 'staff' | 'patient';
export type PeriodicityType = 'daily' | 'weekly' | 'every_n_days' | 'weekdays';

export type FieldType =
  | 'short_text'
  | 'long_text'
  | 'date'
  | 'time'
  | 'datetime'
  | 'scale'
  | 'number'
  | 'select'
  | 'faces';

export interface FieldDefinition {
  id: string;
  type: FieldType;
  label: string;
  required: boolean;
  order: number;
  config: Record<string, unknown>;
}

export interface PeriodicityConfig {
  n?: number;
  weekdays?: number[];
  weeklyAnchor?: string;
}

export interface UserDoc {
  firebaseUid: string;
  email: string;
  displayName: string | null;
  platformRole: PlatformRole;
  disabledAt: string | null;
  createdAt: string;
}

export interface WorkspaceDoc {
  kind: WorkspaceKind;
  name: string;
  ownerUserId: string;
  createdAt: string;
}

export interface WorkspaceMemberDoc {
  workspaceId: string;
  userId: string;
  role: WorkspaceMemberRole;
  seeAllPatients: boolean;
  createdAt: string;
}

export interface WorkspacePatientDoc {
  workspaceId: string;
  userId: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  phone: string | null;
  internalNotes: string | null;
  archivedAt: string | null;
  createdAt: string;
}

export interface CareTeamDoc {
  workspaceId: string;
  workspacePatientId: string;
  memberUserId: string;
  canEdit: boolean;
  createdAt: string;
}

export interface TemplateDoc {
  workspaceId: string;
  name: string;
  isDefault: boolean;
  archivedAt: string | null;
  createdAt: string;
}

export interface TemplateVersionDoc {
  templateId: string;
  version: number;
  periodicityType: PeriodicityType;
  periodicityConfig: PeriodicityConfig;
  fields: FieldDefinition[];
  createdAt: string;
}

export interface AssignmentDoc {
  workspacePatientId: string;
  templateId: string;
  templateVersionId: string;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export interface EntryDoc {
  workspaceId: string;
  workspacePatientId: string;
  templateVersionId: string;
  periodKey: string;
  entryDate: string;
  values: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface InviteLinkDoc {
  workspaceId: string;
  kind: InviteKind;
  role: WorkspaceMemberRole | null;
  createdBy: string;
  tokenHash: string;
  revokedAt: string | null;
  expiresAt: string;
  singleUse: boolean;
  usedAt: string | null;
  assignedEmail: string | null;
  assignToMemberId: string | null;
  seeAllPatients: boolean;
  createdAt: string;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface MeResponse {
  user: UserDoc & { id: string };
  workspaceMemberships: Array<WorkspaceMemberDoc & { id: string; workspace: WorkspaceDoc & { id: string } }>;
  patientMemberships: Array<WorkspacePatientDoc & { id: string; workspace: WorkspaceDoc & { id: string } }>;
}

export interface WeekDayInfo {
  date: string;
  label: string;
  isToday: boolean;
  isFuture: boolean;
  isExpected: boolean;
  isFilled: boolean;
  entryCount: number;
  preview: string | null;
}

export interface WeekResponse {
  days: WeekDayInfo[];
  periodicityType: PeriodicityType;
  weekHasEntry: boolean;
}
