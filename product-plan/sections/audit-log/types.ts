/**
 * Audit Log Section Types
 * Defines the data structures for tracking feature toggle changes
 */

export type ActionType = 'enabled' | 'disabled';

export type EnvironmentType = 'development' | 'staging' | 'production';

export type DateRangeFilter = 'last7days' | 'last30days' | 'last90days' | 'custom';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  userId: string;
  userName: string;
  userEmail: string;
  action: ActionType;
  toggleId: string;
  toggleName: string;
  resourceId: string;
  resourceName: string;
  environmentType: EnvironmentType;
  previousState: boolean;
  newState: boolean;
}

export interface AuditLogFilters {
  dateRange: DateRangeFilter;
  customStartDate?: string;
  customEndDate?: string;
  userId?: string;
  toggleName?: string;
  environmentType?: EnvironmentType;
  action?: ActionType;
}

export interface AuditLogState {
  entries: AuditLogEntry[];
  isLoading: boolean;
  error: string | null;
  filters: AuditLogFilters;
  totalCount: number;
  hasMore: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'json';
  filters: AuditLogFilters;
}
