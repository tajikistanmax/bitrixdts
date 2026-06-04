import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth.store';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/layout/Layout';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import WorkflowPage from './pages/WorkflowPage';
import AttendancePage from './pages/AttendancePage';
import TimesheetPage from './pages/TimesheetPage';
import VacationPage from './pages/VacationPage';
import TripPage from './pages/TripPage';
import SickLeavePage from './pages/SickLeavePage';
import ChatPage from './pages/ChatPage';
import MeetingsPage from './pages/MeetingsPage';
import DocumentsPage from './pages/DocumentsPage';
import KPIPage from './pages/KPIPage';
import ReportsPage from './pages/ReportsPage';
import CalendarPage from './pages/CalendarPage';
import DelegationPage from './pages/DelegationPage';
import ResolutionsPage from './pages/ResolutionsPage';
import ServiceDeskPage from './pages/ServiceDeskPage';
import FileManagerPage from './pages/FileManagerPage';
import NewsPage from './pages/NewsPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import SyncPage from './pages/SyncPage';
import AuditLogPage from './pages/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/employees" element={<PrivateRoute><EmployeesPage /></PrivateRoute>} />
            <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
            <Route path="/projects" element={<PrivateRoute><ProjectsPage /></PrivateRoute>} />
            <Route path="/departments" element={<PrivateRoute><DepartmentsPage /></PrivateRoute>} />
            <Route path="/workflow" element={<PrivateRoute><WorkflowPage /></PrivateRoute>} />
            <Route path="/attendance" element={<PrivateRoute><AttendancePage /></PrivateRoute>} />
            <Route path="/timesheet" element={<PrivateRoute><TimesheetPage /></PrivateRoute>} />
            <Route path="/vacations" element={<PrivateRoute><VacationPage /></PrivateRoute>} />
            <Route path="/trips" element={<PrivateRoute><TripPage /></PrivateRoute>} />
            <Route path="/sickleaves" element={<PrivateRoute><SickLeavePage /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><ChatPage /></PrivateRoute>} />
            <Route path="/meetings" element={<PrivateRoute><MeetingsPage /></PrivateRoute>} />
            <Route path="/documents" element={<PrivateRoute><DocumentsPage /></PrivateRoute>} />
            <Route path="/kpi" element={<PrivateRoute><KPIPage /></PrivateRoute>} />
            <Route path="/reports" element={<PrivateRoute><ReportsPage /></PrivateRoute>} />
            <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
            <Route path="/delegation" element={<PrivateRoute><DelegationPage /></PrivateRoute>} />
            <Route path="/resolutions" element={<PrivateRoute><ResolutionsPage /></PrivateRoute>} />
            <Route path="/service-desk" element={<PrivateRoute><ServiceDeskPage /></PrivateRoute>} />
            <Route path="/files" element={<PrivateRoute><FileManagerPage /></PrivateRoute>} />
            <Route path="/news" element={<PrivateRoute><NewsPage /></PrivateRoute>} />
            <Route path="/announcements" element={<PrivateRoute><AnnouncementsPage /></PrivateRoute>} />
            <Route path="/sync" element={<PrivateRoute><SyncPage /></PrivateRoute>} />
            <Route path="/audit-logs" element={<PrivateRoute><AuditLogPage /></PrivateRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
