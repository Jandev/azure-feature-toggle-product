import { Menu } from 'lucide-react';
// Note: Install shadcn/ui components (Button, Avatar, Badge, DropdownMenu)
// Or implement your own versions of these components
import { Button } from '@/components/ui/button';
import { ResourceSwitcher } from './ResourceSwitcher';
import { UserMenu } from './UserMenu';

interface AppConfigResource {
  id: string;
  displayName: string;
  resourceName: string;
  environmentType: 'development' | 'staging' | 'production';
}

interface TopNavProps {
  currentResource: AppConfigResource;
  resources: AppConfigResource[];
  onResourceChange: (resource: AppConfigResource) => void;
  userName: string;
  userEmail: string;
  userRole: 'read-only' | 'admin';
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function TopNav({
  currentResource,
  resources,
  onResourceChange,
  userName,
  userEmail,
  userRole,
  onLogout,
  onToggleSidebar,
}: TopNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b bg-white dark:bg-slate-950 shadow-sm">
      <div className="h-full flex items-center justify-between px-4 gap-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:flex"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-orange-600 dark:text-orange-400 hidden sm:block">
            Azure Feature Toggle Tool
          </h1>
          <h1 className="text-lg font-semibold text-orange-600 dark:text-orange-400 sm:hidden">
            AFTT
          </h1>
        </div>

        {/* Center section */}
        <div className="flex-1 flex justify-center max-w-md">
          <ResourceSwitcher
            currentResource={currentResource}
            resources={resources}
            onResourceChange={onResourceChange}
          />
        </div>

        {/* Right section */}
        <div className="flex items-center">
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            onLogout={onLogout}
          />
        </div>
      </div>
    </header>
  );
}
