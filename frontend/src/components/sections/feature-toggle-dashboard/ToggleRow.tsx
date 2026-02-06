import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToggles } from '@/context/ToggleContext';
import { useAuth } from '@/context/AuthContext';
import { useResources } from '@/context/ResourceContext';
import type { FeatureToggle, ToggleChangeRequest } from '@/types';

interface ToggleRowProps {
  toggle: FeatureToggle;
  isUpdating: boolean;
}

export function ToggleRow({ toggle, isUpdating }: ToggleRowProps) {
  const { setConfirmationRequest } = useToggles();
  const { user } = useAuth();
  const { currentResource } = useResources();

  const isReadOnly = user?.role === 'read-only';
  const canToggle = !isReadOnly && !isUpdating;

  const handleToggle = () => {
    if (!canToggle || !currentResource) return;

    const request: ToggleChangeRequest = {
      toggleId: toggle.id,
      toggleName: toggle.name,
      currentState: toggle.enabled,
      newState: !toggle.enabled,
      requiresConfirmation: currentResource.environmentType === 'production',
    };

    // Set confirmation request - this will trigger ProductionConfirmation modal if needed
    setConfirmationRequest(request);
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Toggle Switch */}
          <div className="flex-shrink-0">
            {isUpdating ? (
              <div className="w-12 h-6 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              </div>
            ) : (
              <button
                onClick={handleToggle}
                disabled={isReadOnly}
                title={isReadOnly ? 'You have read-only access' : undefined}
                className={`
                  relative inline-flex h-6 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                  ${toggle.enabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'}
                  ${isReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${!isReadOnly && 'hover:opacity-80'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${toggle.enabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            )}
          </div>

          {/* Toggle Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-mono text-sm font-semibold text-slate-900 dark:text-white truncate">
                {toggle.name}
              </h3>
              <span
                className={`
                  inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${
                    toggle.enabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }
                `}
              >
                {toggle.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            {toggle.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                {toggle.description}
              </p>
            )}
          </div>

          {/* Last Modified */}
          <div className="hidden md:flex flex-col items-end text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            {toggle.lastModifiedBy && (
              <span className="font-medium">{toggle.lastModifiedBy}</span>
            )}
            <span>{formatTimestamp(toggle.lastModifiedAt)}</span>
          </div>
        </div>

        {/* Mobile Last Modified */}
        <div className="md:hidden mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          {toggle.lastModifiedBy && (
            <span>
              Last modified by <span className="font-medium">{toggle.lastModifiedBy}</span> on{' '}
              {formatTimestamp(toggle.lastModifiedAt)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
