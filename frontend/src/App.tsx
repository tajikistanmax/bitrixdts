import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth.store';
import { ToastProvider } from './components/ui/Toast';
import { LoadingState } from './components/ui/Spinner';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/layout/Layout';

// Ленивая загрузка страниц — уменьшает начальный бандл и ускоряет первый рендер.
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const TasksPage = lazy(() => import('./pages/TasksPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage'));
const WorkflowPage = lazy(() => import('./pages/WorkflowPage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const TimesheetPage = lazy(() => import('./pages/TimesheetPage'));
const VacationPage = lazy(() => import('./pages/VacationPage'));
const TripPage = lazy(() => import('./pages/TripPage'));
const SickLeavePage = lazy(() => import('./pages/SickLeavePage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const KPIPage = lazy(() => import('./pages/KPIPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const DelegationPage = lazy(() => import('./pages/DelegationPage'));
const ResolutionsPage = lazy(() => import('./pages/ResolutionsPage'));
const ServiceDeskPage = lazy(() => import('./pages/ServiceDeskPage'));
const FileManagerPage = lazy(() => import('./pages/FileManagerPage'));
const NewsPage = lazy(() => import('./pages/NewsPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));
const SyncPage = lazy(() => import('./pages/SyncPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const WorkspacesPage = lazy(() => import('./pages/WorkspacesPage'));
const MemosPage = lazy(() => import('./pages/MemosPage'));
const PayrollPage = lazy(() => import('./pages/PayrollPage'));
const StaffPage = lazy(() => import('./pages/StaffPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function PageFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <LoadingState />
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

const routes: { path: string; element: React.ReactNode }[] = [
  { path: '/', element: <DashboardPage /> },
  { path: '/employees', element: <EmployeesPage /> },
  { path: '/tasks', element: <TasksPage /> },
  { path: '/projects', element: <ProjectsPage /> },
  { path: '/departments', element: <DepartmentsPage /> },
  { path: '/workflow', element: <WorkflowPage /> },
  { path: '/attendance', element: <AttendancePage /> },
  { path: '/timesheet', element: <TimesheetPage /> },
  { path: '/vacations', element: <VacationPage /> },
  { path: '/trips', element: <TripPage /> },
  { path: '/sickleaves', element: <SickLeavePage /> },
  { path: '/chat', element: <ChatPage /> },
  { path: '/meetings', element: <MeetingsPage /> },
  { path: '/documents', element: <DocumentsPage /> },
  { path: '/kpi', element: <KPIPage /> },
  { path: '/reports', element: <ReportsPage /> },
  { path: '/calendar', element: <CalendarPage /> },
  { path: '/delegation', element: <DelegationPage /> },
  { path: '/resolutions', element: <ResolutionsPage /> },
  { path: '/service-desk', element: <ServiceDeskPage /> },
  { path: '/files', element: <FileManagerPage /> },
  { path: '/news', element: <NewsPage /> },
  { path: '/announcements', element: <AnnouncementsPage /> },
  { path: '/sync', element: <SyncPage /> },
  { path: '/audit-logs', element: <AuditLogPage /> },
  { path: '/workspaces', element: <WorkspacesPage /> },
  { path: '/memos', element: <MemosPage /> },
  { path: '/payroll', element: <PayrollPage /> },
  { path: '/staff', element: <StaffPage /> },
  { path: '/feed', element: <FeedPage /> },
  { path: '/settings', element: <SettingsPage /> },
];

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <BrowserRouter>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                {routes.map((r) => (
                  <Route key={r.path} path={r.path} element={<PrivateRoute>{r.element}</PrivateRoute>} />
                ))}
                <Route path="*" element={<PrivateRoute><NotFoundPage /></PrivateRoute>} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
