import type { MeResponse } from '@shared/types';

export function appHomePath(me: MeResponse | null): string {
  if (!me) return '/app';
  if (me.user.platformRole === 'global_admin') return '/admin';
  if (me.patientMemberships.length) return '/paciente/hoy';
  if (me.workspaceMemberships.length) return '/pro/pacientes';
  return '/pro/onboarding';
}

export function sessionLabel(me: MeResponse | null, email?: string | null): string {
  const name = me?.user.displayName?.trim();
  if (name) return name.split(' ')[0]!;
  const patient = me?.patientMemberships[0];
  if (patient?.firstName) return patient.firstName;
  if (email) return email.split('@')[0] ?? 'tu cuenta';
  return 'tu cuenta';
}
