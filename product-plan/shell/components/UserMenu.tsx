// Note: Install shadcn/ui components (Avatar, Badge, DropdownMenu)
// Or implement your own versions of these components
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User } from 'lucide-react';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  userRole: 'read-only' | 'admin';
  onLogout: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function UserMenu({
  userName,
  userEmail,
  userRole,
  onLogout,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-sm font-medium">{userName}</span>
          <Badge
            variant="secondary"
            className={
              userRole === 'admin'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }
          >
            {userRole}
          </Badge>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <div className="font-medium">{userName}</div>
            <div className="text-xs text-muted-foreground">{userEmail}</div>
            <Badge
              variant="secondary"
              className={`mt-1 w-fit text-xs ${
                userRole === 'admin'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
            >
              {userRole}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600 dark:text-red-400">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
