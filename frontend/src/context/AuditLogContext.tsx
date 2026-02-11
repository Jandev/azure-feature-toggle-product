import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuditLogEntry, AuditLogFilters } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './AuthContext';

interface AuditLogContextType {
  entries: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
  filters: AuditLogFilters;
  setFilters: (filters: AuditLogFilters) => void;
  totalCount: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  exportLogs: (format: 'csv' | 'json') => Promise<void>;
}

const AuditLogContext = createContext<AuditLogContextType | undefined>(undefined);

export function AuditLogProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({
    dateRange: 'last7days',
  });
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const { getAccessToken } = useAuth();

  // Fetch audit logs when filters change
  // Backend uses OBO flow to get App Config token - we just pass our API token
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API token - backend will use OBO to get App Config token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        dateRange: filters.dateRange,
        ...(filters.environmentType && { environmentType: filters.environmentType }),
        ...(filters.action && { action: filters.action }),
        ...(filters.toggleName && { toggleName: filters.toggleName }),
      });

      const data = await apiClient.get<AuditLogEntry[]>(
        `/audit-logs?${params.toString()}`,
        token
      );

      setEntries(data);
      setTotalCount(data.length);
      setHasMore(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, getAccessToken]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const loadMore = async () => {
    // TODO: Implement pagination
    console.log('Load more not implemented yet');
  };

  const exportLogs = async (format: 'csv' | 'json') => {
    try {
      // TODO: Replace with actual API call to backend
      // const response = await fetch(
      //   `http://localhost:5000/api/audit-logs/export?format=${format}`,
      //   {
      //     method: 'POST',
      //     headers: {
      //       'Content-Type': 'application/json',
      //       Authorization: `Bearer ${token}`,
      //     },
      //     body: JSON.stringify({ filters }),
      //   }
      // );
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to export audit logs');
      // }
      // 
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `audit-log-${new Date().toISOString()}.${format}`;
      // document.body.appendChild(a);
      // a.click();
      // window.URL.revokeObjectURL(url);
      // document.body.removeChild(a);

      // Mock export
      if (format === 'json') {
        const dataStr = JSON.stringify(entries, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `audit-log-${new Date().toISOString()}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      } else {
        // CSV export
        const csvHeaders = [
          'Timestamp',
          'User',
          'Email',
          'Action',
          'Toggle Name',
          'Resource',
          'Environment',
          'Previous State',
          'New State',
        ];
        const csvRows = entries.map((entry) => [
          entry.timestamp,
          entry.userName,
          entry.userEmail,
          entry.action,
          entry.toggleName,
          entry.resourceName,
          entry.environmentType,
          entry.previousState ? 'Enabled' : 'Disabled',
          entry.newState ? 'Enabled' : 'Disabled',
        ]);
        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
        const exportFileDefaultName = `audit-log-${new Date().toISOString()}.csv`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      }
    } catch (err) {
      console.error('Failed to export audit logs:', err);
      alert('Failed to export audit logs. Please try again.');
    }
  };

  return (
    <AuditLogContext.Provider
      value={{
        entries,
        isLoading,
        error,
        filters,
        setFilters,
        totalCount,
        hasMore,
        loadMore,
        exportLogs,
      }}
    >
      {children}
    </AuditLogContext.Provider>
  );
}

export function useAuditLog() {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
}
