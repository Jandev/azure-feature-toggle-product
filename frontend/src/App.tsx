import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/sections/authentication/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { useResources } from './context/ResourceContext';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { resources, currentResource, setCurrentResource } = useResources();

  // Determine active section from current route
  const getActiveSection = () => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/resources')) return 'resources';
    if (path.startsWith('/audit-log')) return 'audit-log';
    if (path.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  const handleNavigate = (section: string) => {
    switch (section) {
      case 'dashboard':
        navigate('/dashboard');
        break;
      case 'resources':
        navigate('/resources');
        break;
      case 'audit-log':
        navigate('/audit-log');
        break;
      case 'settings':
        navigate('/settings');
        break;
    }
  };

  const handleResourceChange = (resource: any) => {
    setCurrentResource(resource);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Check if on login page
  if (location.pathname === '/login') {
    return <LoginPage />;
  }

  return (
    <AppShell
      currentResource={currentResource}
      resources={resources}
      onResourceChange={handleResourceChange}
      userName={user?.name || 'User'}
      userEmail={user?.email || ''}
      userRole={user?.role || 'read-only'}
      onLogout={handleLogout}
      activeSection={getActiveSection()}
      onNavigate={handleNavigate}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/resources" element={<ResourcesPage />} />
        <Route path="/audit-log" element={<AuditLogPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AppContent />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

