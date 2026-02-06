import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import type { AppConfigResource, UserRole } from '@/types';

interface AppShellProps {
  currentResource: AppConfigResource | null;
  resources: AppConfigResource[];
  onResourceChange: (resource: AppConfigResource) => void;
  userName: string;
  userEmail: string;
  userRole: UserRole;
  onLogout: () => void;
  activeSection: string;
  onNavigate: (section: string) => void;
  children: ReactNode;
}

export function AppShell({
  currentResource,
  resources,
  onResourceChange,
  userName,
  userEmail,
  userRole,
  onLogout,
  activeSection,
  onNavigate,
  children,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load collapsed state from localStorage
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950">
      <TopNav
        currentResource={currentResource}
        resources={resources}
        onResourceChange={onResourceChange}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        onLogout={onLogout}
        onToggleSidebar={toggleSidebar}
      />

      <Sidebar
        isCollapsed={isCollapsed}
        activeSection={activeSection}
        onNavigate={onNavigate}
      />

      <main
        className={cn(
          'pt-16 transition-all duration-300 ease-in-out min-h-screen',
          isCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
