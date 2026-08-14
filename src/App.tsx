import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingPage } from '@/pages/landing';
import { LoginPage, RegisterProfessionalPage } from '@/pages/auth';
import { OnboardingPage } from '@/pages/pro/onboarding';
import { PatientsPage } from '@/pages/pro/patients';
import { PatientDetailPage } from '@/pages/pro/patient-detail';
import { TemplatesPage } from '@/pages/pro/templates';
import { TemplateEditorPage } from '@/pages/pro/template-editor';
import { ScreenSkeleton } from '@/components/skeleton';
import { TeamPage } from '@/pages/pro/team';
import { WorkspacePage } from '@/pages/pro/workspace';
import { InvitePage } from '@/pages/patient/invite';
import { PatientAccessPage } from '@/pages/patient/access';
import { PatientTodayPage } from '@/pages/patient/today';
import { PatientWeekPage } from '@/pages/patient/week';
import { PatientAccountPage } from '@/pages/patient/account';
import { AdminPage } from '@/pages/admin/index';
import { PrivacyPage, TermsPage } from '@/pages/legal';
import { DevUiPage } from '@/pages/dev/ui';
import { appHomePath } from '@/lib/session';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth();
  if (loading) return <ScreenSkeleton />;
  if (!firebaseUser) return <Navigate to="/ingresar" replace />;
  return <>{children}</>;
}

function AppRedirect() {
  const { me, loading, refreshMe } = useAuth();
  if (loading) return <ScreenSkeleton />;
  if (!me) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--paper)] px-4 text-center">
        <p className="text-[var(--ink-soft)]">No pudimos cargar tu cuenta.</p>
        <button type="button" className="text-sm underline" onClick={() => void refreshMe()}>
          Reintentar
        </button>
      </div>
    );
  }
  return <Navigate to={appHomePath(me)} replace />;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { firebaseUser, me, loading } = useAuth();
  if (loading) return <ScreenSkeleton />;
  if (firebaseUser) return <Navigate to={appHomePath(me)} replace />;
  return <>{children}</>;
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { me, loading } = useAuth();
  if (loading) return null;
  if (me?.user.platformRole !== 'global_admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ingresar" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/registro/profesional" element={<GuestOnly><RegisterProfessionalPage /></GuestOnly>} />
      <Route path="/privacidad" element={<PrivacyPage />} />
      <Route path="/terminos" element={<TermsPage />} />
      <Route path="/paciente" element={<PatientAccessPage />} />
      <Route path="/i/:token" element={<InvitePage />} />

      {import.meta.env.DEV ? <Route path="/dev/ui" element={<DevUiPage />} /> : null}

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppRedirect />
          </RequireAuth>
        }
      />

      <Route
        path="/pro/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/pacientes"
        element={
          <RequireAuth>
            <PatientsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/pacientes/:id"
        element={
          <RequireAuth>
            <PatientDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/pacientes/:id/:seccion"
        element={
          <RequireAuth>
            <PatientDetailPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/plantillas"
        element={
          <RequireAuth>
            <TemplatesPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/plantillas/nueva"
        element={
          <RequireAuth>
            <TemplateEditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/plantillas/:id"
        element={
          <RequireAuth>
            <TemplateEditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/equipo"
        element={
          <RequireAuth>
            <TeamPage />
          </RequireAuth>
        }
      />
      <Route
        path="/pro/espacio"
        element={
          <RequireAuth>
            <WorkspacePage />
          </RequireAuth>
        }
      />

      <Route
        path="/paciente/hoy"
        element={
          <RequireAuth>
            <PatientTodayPage />
          </RequireAuth>
        }
      />
      <Route
        path="/paciente/semana"
        element={
          <RequireAuth>
            <PatientWeekPage />
          </RequireAuth>
        }
      />
      <Route
        path="/paciente/cuenta"
        element={
          <RequireAuth>
            <PatientAccountPage />
          </RequireAuth>
        }
      />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
