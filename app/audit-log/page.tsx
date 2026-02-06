'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogEntry } from '@/components/audit-log';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Search, Filter, X } from 'lucide-react';
import type { AuditLogEntry } from '@/types';

type DateRangeFilter = 'last7days' | 'last30days' | 'last90days';

interface Filters {
  dateRange: DateRangeFilter;
  toggleName: string;
  environmentType: string;
  action: string;
}

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    dateRange: 'last7days',
    toggleName: '',
    environmentType: '',
    action: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLogs();
    }
  }, [status, filters.dateRange, filters.environmentType, filters.action]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set('dateRange', filters.dateRange);
      
      if (filters.toggleName) {
        params.set('toggleName', filters.toggleName);
      }
      if (filters.environmentType) {
        params.set('environmentType', filters.environmentType);
      }
      if (filters.action) {
        params.set('action', filters.action);
      }

      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch audit logs');
      }
      
      const data = await response.json();
      setLogs(data.logs);
      setTotalCount(data.totalCount);
      setHasMore(data.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setIsExporting(true);

      const response = await fetch('/api/audit-logs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          filters: {
            dateRange: filters.dateRange,
            toggleName: filters.toggleName || undefined,
            environmentType: filters.environmentType || undefined,
            action: filters.action || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Failed to export logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      dateRange: 'last7days',
      toggleName: '',
      environmentType: '',
      action: '',
    });
  };

  const hasActiveFilters = filters.toggleName || filters.environmentType || filters.action;

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent mb-4"></div>
          <p className="text-slate-600">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Audit Logs</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={fetchLogs}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
          <p className="text-slate-600 mt-1">
            Complete history of all feature toggle changes
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={isExporting || logs.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Date Range */}
        <div className="flex gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1 w-fit">
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'last7days' })}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filters.dateRange === 'last7days'
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Last 7 days
          </button>
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'last30days' })}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filters.dateRange === 'last30days'
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Last 30 days
          </button>
          <button
            onClick={() => setFilters({ ...filters, dateRange: 'last90days' })}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              filters.dateRange === 'last90days'
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-900 dark:text-orange-100 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            Last 90 days
          </button>
        </div>

        {/* Additional Filters Toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}

          <div className="text-sm text-slate-600">
            {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Toggle Name
              </label>
              <Input
                value={filters.toggleName}
                onChange={(e) => setFilters({ ...filters, toggleName: e.target.value })}
                placeholder="Search by toggle name..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Environment
              </label>
              <select
                value={filters.environmentType}
                onChange={(e) => setFilters({ ...filters, environmentType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">All Environments</option>
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">All Actions</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            <div className="md:col-span-3">
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Log Entries */}
      {logs.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg">
          <p className="text-slate-600 dark:text-slate-400">
            {hasActiveFilters ? 'No logs match your filters' : 'No changes have been made yet'}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((entry) => (
            <LogEntry key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
