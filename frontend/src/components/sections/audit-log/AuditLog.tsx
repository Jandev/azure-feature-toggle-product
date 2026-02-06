import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Download, Search, X } from 'lucide-react';
import { LogEntry } from './LogEntry';
import { useAuditLog } from '@/context/AuditLogContext';
import type { DateRangeFilter, EnvironmentType, ActionType } from '@/types';

const dateRangeOptions: { value: DateRangeFilter; label: string }[] = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
];

const environmentOptions: { value: EnvironmentType | ''; label: string }[] = [
  { value: '', label: 'All Environments' },
  { value: 'development', label: 'Development' },
  { value: 'staging', label: 'Staging' },
  { value: 'production', label: 'Production' },
];

const actionOptions: { value: ActionType | ''; label: string }[] = [
  { value: '', label: 'All Actions' },
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

export function AuditLog() {
  const { entries, isLoading, error, filters, setFilters, totalCount, exportLogs } = useAuditLog();
  
  const [toggleSearch, setToggleSearch] = useState(filters.toggleName || '');
  const [isExporting, setIsExporting] = useState(false);

  const handleDateRangeChange = (dateRange: DateRangeFilter) => {
    setFilters({ ...filters, dateRange });
  };

  const handleEnvironmentChange = (environmentType: EnvironmentType | '') => {
    setFilters({
      ...filters,
      environmentType: environmentType || undefined,
    });
  };

  const handleActionChange = (action: ActionType | '') => {
    setFilters({
      ...filters,
      action: action || undefined,
    });
  };

  const handleToggleSearchChange = (value: string) => {
    setToggleSearch(value);
  };

  const handleToggleSearchApply = () => {
    setFilters({
      ...filters,
      toggleName: toggleSearch || undefined,
    });
  };

  const handleClearSearch = () => {
    setToggleSearch('');
    setFilters({
      ...filters,
      toggleName: undefined,
    });
  };

  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      await exportLogs(format);
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = filters.environmentType || filters.action || filters.toggleName;

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
            Failed to Load Audit Logs
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Log</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Complete history of all feature toggle changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting || entries.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={isExporting || entries.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Date Range Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 py-2">
            Date Range:
          </span>
          <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
            {dateRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleDateRangeChange(option.value)}
                className={`px-3 py-1.5 text-sm rounded transition-colors ${
                  filters.dateRange === option.value
                    ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Additional Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Toggle Name Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={toggleSearch}
              onChange={(e) => handleToggleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleToggleSearchApply()}
              placeholder="Search toggle name..."
              className="pl-10 pr-10"
            />
            {toggleSearch && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Environment Filter */}
          <select
            value={filters.environmentType || ''}
            onChange={(e) => handleEnvironmentChange(e.target.value as EnvironmentType | '')}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          >
            {environmentOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Action Filter */}
          <select
            value={filters.action || ''}
            onChange={(e) => handleActionChange(e.target.value as ActionType | '')}
            className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
          >
            {actionOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  dateRange: filters.dateRange,
                })
              }
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
        </span>
        {hasActiveFilters && (
          <Badge variant="secondary" className="text-xs">
            Filtered
          </Badge>
        )}
      </div>

      {/* Log Entries */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">
            {hasActiveFilters
              ? 'No logs match your filters'
              : 'No changes have been made yet'}
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  dateRange: filters.dateRange,
                })
              }
              className="mt-4"
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
