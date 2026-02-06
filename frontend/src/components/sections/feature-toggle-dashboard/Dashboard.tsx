import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Search, Server, X } from 'lucide-react';
import { ToggleRow } from './ToggleRow';
import { useToggles } from '@/context/ToggleContext';
import { useResources } from '@/context/ResourceContext';
import { useAuth } from '@/context/AuthContext';

const environmentColors = {
  development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  staging: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  production: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function Dashboard() {
  const {
    filteredToggles,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filter,
    setFilter,
    confirmationRequest,
  } = useToggles();
  
  const { currentResource } = useResources();
  const { user } = useAuth();

  if (!currentResource) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Server className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Resource Selected
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Please select an Azure App Configuration resource to view feature toggles.
          </p>
        </div>
      </div>
    );
  }

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Empty state (no toggles in resource)
  if (!isLoading && filteredToggles.length === 0 && !error && !searchQuery && filter === 'all') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Server className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            No Feature Toggles
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This resource doesn't have any feature toggles yet. Add feature flags in the Azure
            Portal to get started.
          </p>
          <Badge className={`${environmentColors[currentResource.environmentType]}`}>
            {currentResource.displayName}
          </Badge>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Toggles
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Feature Toggles
            </h2>
            <Badge className={`${environmentColors[currentResource.environmentType]}`}>
              {currentResource.displayName}
            </Badge>
            {user?.role === 'read-only' && (
              <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800">
                Read-Only
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {filteredToggles.length} {filteredToggles.length === 1 ? 'toggle' : 'toggles'}
          </div>
        </div>

        {/* Production Warning */}
        {currentResource.environmentType === 'production' && user?.role === 'admin' && (
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-900 dark:text-red-100">
                Production Environment
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Changes to toggles will affect live users. Extra confirmation will be required.
              </p>
            </div>
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search toggles..."
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                filter === 'all'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('enabled')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                filter === 'enabled'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Enabled
            </button>
            <button
              onClick={() => setFilter('disabled')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                filter === 'disabled'
                  ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Disabled
            </button>
          </div>
        </div>
      </div>

      {/* Toggle List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : filteredToggles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">
            No toggles match your search criteria
          </p>
          <Button variant="outline" onClick={clearSearch} className="mt-4">
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredToggles.map((toggle) => (
            <ToggleRow
              key={toggle.id}
              toggle={toggle}
              isUpdating={confirmationRequest?.toggleId === toggle.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
