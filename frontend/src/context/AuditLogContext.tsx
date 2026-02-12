import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AuditLogEntry, AuditLogFilters } from '@/types';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './AuthContext';
import { useResources } from './ResourceContext';

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
  const { currentResource } = useResources();

  // Fetch audit logs when filters change
  // Backend uses OBO flow to get App Config token - we just pass our API token
  const fetchLogs = useCallback(async () => {
    // Don't fetch if no resource is selected
    if (!currentResource) {
      console.log('[AuditLogContext] No resource selected, skipping audit log fetch');
      setEntries([]);
      setTotalCount(0);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get API token - backend will use OBO to get App Config token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      // Calculate start date based on date range filter
      const startDate = new Date();
      switch (filters.dateRange) {
        case 'last7days':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'last30days':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case 'last90days':
          startDate.setDate(startDate.getDate() - 90);
          break;
      }

      // Build query params with required endpoint and resourceId
      const params = new URLSearchParams({
        endpoint: currentResource.endpoint,
        resourceId: currentResource.id,
        startDate: startDate.toISOString(),
      });

      console.log('[AuditLogContext] Fetching audit logs for resource:', currentResource.displayName);
      const data = await apiClient.get<AuditLogEntry[]>(
        `/auditlogs?${params.toString()}`,
        token
      );

      // Apply client-side filters for environment, action, and toggle name
      let filteredData = data;
      if (filters.environmentType) {
        filteredData = filteredData.filter(
          (entry) => entry.environmentType === filters.environmentType
        );
      }
      if (filters.action) {
        filteredData = filteredData.filter(
          (entry) => entry.action === filters.action
        );
      }
      if (filters.toggleName) {
        filteredData = filteredData.filter(
          (entry) => entry.toggleName.toLowerCase().includes(filters.toggleName!.toLowerCase())
        );
      }

      setEntries(filteredData);
      setTotalCount(filteredData.length);
      setHasMore(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audit logs';
      setError(errorMessage);
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, getAccessToken, currentResource]);

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

// eslint-disable-next-line react-refresh/only-export-components
export function useAuditLog() {
  const context = useContext(AuditLogContext);
  if (context === undefined) {
    throw new Error('useAuditLog must be used within an AuditLogProvider');
  }
  return context;
}
