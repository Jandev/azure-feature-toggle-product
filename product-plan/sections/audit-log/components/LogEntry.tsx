/**
 * LogEntry Component
 * 
 * Dependencies:
 * - shadcn/ui components: avatar, badge, card
 *   Install via: npx shadcn@latest add avatar badge card
 * - lucide-react: Icons
 */

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

type ActionType = 'enabled' | 'disabled';
type EnvironmentType = 'development' | 'staging' | 'production';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userName: string;
  action: ActionType;
  toggleName: string;
  resourceName: string;
  environmentType: EnvironmentType;
  previousState: boolean;
  newState: boolean;
}

interface LogEntryProps {
  entry: AuditLogEntry;
}

const environmentColors = {
  development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  staging: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  production: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const actionColors = {
  enabled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  disabled: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTimestamp(timestamp);
}

export function LogEntry({ entry }: LogEntryProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* User Avatar */}
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200">
              {getInitials(entry.userName)}
            </AvatarFallback>
          </Avatar>

          {/* Log Details */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Top Row: User, Action, Toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-900 dark:text-white">
                {entry.userName}
              </span>
              <Badge className={`text-xs ${actionColors[entry.action]}`}>
                {entry.action}
              </Badge>
              <span className="text-slate-600 dark:text-slate-400 text-sm">
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {entry.toggleName}
                </span>
              </span>
            </div>

            {/* Middle Row: State Change */}
            <div className="flex items-center gap-2 text-sm">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  entry.previousState
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {entry.previousState ? 'Enabled' : 'Disabled'}
              </span>
              <ArrowRight className="h-3 w-3 text-slate-400" />
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  entry.newState
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {entry.newState ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {/* Bottom Row: Environment and Time */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <Badge className={`text-xs ${environmentColors[entry.environmentType]}`}>
                {entry.resourceName}
              </Badge>
              <span className="hidden sm:inline" title={formatTimestamp(entry.timestamp)}>
                {formatRelativeTime(entry.timestamp)}
              </span>
              <span className="sm:hidden">{formatTimestamp(entry.timestamp)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
