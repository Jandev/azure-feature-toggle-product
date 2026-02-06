import { LayoutDashboard, Server, FileText, Settings } from 'lucide-react';
// Note: Install shadcn/ui or implement your own cn() utility
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  activeSection: string;
  onNavigate: (section: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'resources', label: 'Resources', icon: Server },
  { id: 'audit-log', label: 'Audit Log', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ isCollapsed, activeSection, onNavigate }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 bg-orange-50 dark:bg-slate-900 border-r transition-all duration-300 ease-in-out z-40',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      <nav className="p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                'hover:bg-orange-100 dark:hover:bg-slate-800',
                isActive &&
                  'bg-orange-100 dark:bg-slate-800 border-l-4 border-orange-600 dark:border-orange-400',
                !isActive && 'border-l-4 border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive
                    ? 'text-orange-600 dark:text-orange-400'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              />
              {!isCollapsed && (
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive
                      ? 'text-orange-700 dark:text-orange-300'
                      : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
