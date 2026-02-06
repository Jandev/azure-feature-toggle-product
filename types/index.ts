/**
 * Azure Feature Toggle Tool - Data Model Types
 * 
 * These TypeScript interfaces define the core data structures for the application.
 * Adapted from product-plan specifications.
 */

// ============================================================================
// Core Entities
// ============================================================================

export type UserRole = 'read-only' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export type EnvironmentType = 'development' | 'staging' | 'production';

export type ConnectionStatus = 'unknown' | 'testing' | 'connected' | 'error';

export interface AppConfigResource {
  id: string;
  displayName: string;
  environmentType: EnvironmentType;
  resourceName: string;
  resourceGroup: string;
  connectionString: string; // Store securely, mask in UI
  subscriptionId: string;
  connectionStatus: ConnectionStatus;
  lastTested?: string; // ISO 8601 timestamp
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface FeatureToggle {
  id: string;
  name: string; // Feature key/name
  description?: string;
  enabled: boolean;
  lastModifiedBy?: string;
  lastModifiedAt?: string; // ISO 8601 timestamp
  resourceId: string; // Foreign key to AppConfigResource
}

export type ActionType = 'enabled' | 'disabled';

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

// ============================================================================
// Authentication Types
// ============================================================================

export type AuthenticationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AuthenticationState {
  status: AuthenticationStatus;
  user: User | null;
  error: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  provider: 'microsoft'; // Azure AD OAuth
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface SessionInfo {
  user: User;
  expiresAt: string; // ISO 8601 timestamp
  issuedAt: string; // ISO 8601 timestamp
}

// ============================================================================
// Resource Configuration Types
// ============================================================================

export interface ResourceFormData {
  displayName: string;
  environmentType: EnvironmentType;
  resourceName: string;
  resourceGroup: string;
  connectionString: string;
  subscriptionId: string;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: string; // ISO 8601 timestamp
}

// ============================================================================
// Feature Toggle Dashboard Types
// ============================================================================

export interface DashboardState {
  toggles: FeatureToggle[];
  isLoading: boolean;
  error: string | null;
  currentResource: {
    id: string;
    displayName: string;
    environmentType: EnvironmentType;
  } | null;
  userRole: UserRole;
  searchQuery: string;
  filter: 'all' | 'enabled' | 'disabled';
}

export interface ToggleChangeRequest {
  toggleId: string;
  toggleName: string;
  currentState: boolean;
  newState: boolean;
  requiresConfirmation: boolean; // true for production
}

export interface ToggleChangeResult {
  success: boolean;
  message: string;
  toggle?: FeatureToggle;
}

// ============================================================================
// Audit Log Types
// ============================================================================

export type DateRangeFilter = 'last7days' | 'last30days' | 'last90days' | 'custom';

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
