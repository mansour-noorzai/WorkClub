import { ConfigProvider } from 'antd';
import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { AppShell } from '@/components/AppShell';
import { Navigate, RouterProvider, useLocation } from '@/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { bootstrapSession } from '@/store/authSlice';

const AcceptInvitePage = lazy(() =>
  import('@/pages/AcceptInvitePage').then((module) => ({ default: module.AcceptInvitePage }))
);
const AuditPage = lazy(() =>
  import('@/pages/AuditPage').then((module) => ({ default: module.AuditPage }))
);
const ClientsPage = lazy(() =>
  import('@/pages/ClientsPage').then((module) => ({ default: module.ClientsPage }))
);
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage }))
);
const InvoicesPage = lazy(() =>
  import('@/pages/InvoicesPage').then((module) => ({ default: module.InvoicesPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('@/pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage }))
);
const VerifyEmailPage = lazy(() =>
  import('@/pages/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage }))
);
const PortalPage = lazy(() =>
  import('@/pages/PortalPage').then((module) => ({ default: module.PortalPage }))
);
const ProjectBoardPage = lazy(() =>
  import('@/pages/ProjectBoardPage').then((module) => ({ default: module.ProjectBoardPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/ProjectsPage').then((module) => ({ default: module.ProjectsPage }))
);
const ProposalsPage = lazy(() =>
  import('@/pages/ProposalsPage').then((module) => ({ default: module.ProposalsPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/RegisterPage').then((module) => ({ default: module.RegisterPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage }))
);
const TeamPage = lazy(() =>
  import('@/pages/TeamPage').then((module) => ({ default: module.TeamPage }))
);
const TimesheetsPage = lazy(() =>
  import('@/pages/TimesheetsPage').then((module) => ({ default: module.TimesheetsPage }))
);

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6558f5',
          borderRadius: 10,
          colorText: '#172033',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        },
      }}
    >
      <RouterProvider>
        <Suspense fallback={<div className="route-loader">Loading WorkClub…</div>}>
          <AppRoutes />
        </Suspense>
      </RouterProvider>
    </ConfigProvider>
  );
}

function AppRoutes() {
  const dispatch = useAppDispatch();
  const path = useLocation();
  const { user, initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized) void dispatch(bootstrapSession());
  }, [dispatch, initialized]);

  if (!initialized) return <div className="route-loader">Securing your session…</div>;
  if (path === '/login') return <LoginPage />;
  if (path === '/register') return <RegisterPage />;
  if (path === '/accept-invite') return <AcceptInvitePage />;
  if (path === '/forgot-password') return <ForgotPasswordPage />;
  if (path === '/reset-password') return <ResetPasswordPage />;
  if (path === '/verify-email') return <VerifyEmailPage />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'client') {
    return path === '/portal' ? <PortalPage /> : <Navigate to="/portal" replace />;
  }

  if (path === '/') return <Navigate to="/dashboard" replace />;
  const canManage = user.role === 'owner' || user.role === 'manager';
  let page: ReactNode;

  if (path === '/dashboard') page = <DashboardPage />;
  else if (path === '/projects') page = <ProjectsPage />;
  else if (/^\/projects\/[^/]+\/board$/.test(path)) page = <ProjectBoardPage />;
  else if (path === '/timesheets') page = <TimesheetsPage />;
  else if (canManage && path === '/clients') page = <ClientsPage />;
  else if (canManage && path === '/invoices') page = <InvoicesPage />;
  else if (canManage && path === '/proposals') page = <ProposalsPage />;
  else if (canManage && path === '/team') page = <TeamPage />;
  else if (canManage && path === '/settings') page = <SettingsPage />;
  else if (user.role === 'owner' && path === '/audit') page = <AuditPage />;
  else if (
    (!canManage && ['/clients', '/invoices', '/proposals', '/team', '/settings'].includes(path)) ||
    (user.role !== 'owner' && path === '/audit')
  ) {
    return <Navigate to="/dashboard" replace />;
  } else page = <NotFoundPage />;

  return <AppShell>{page}</AppShell>;
}
