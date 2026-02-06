/**
 * Feature Toggle Dashboard Section Types
 * Defines the data structures for viewing and managing feature toggles
 */

export type UserRole = 'read-only' | 'admin';

export type EnvironmentType = 'development' | 'staging' | 'production';

export interface FeatureToggle {
  id: string;
  name: string; // Feature key/name
  description?: string;
  enabled: boolean;
  lastModifiedBy?: string;
  lastModifiedAt?: string; // ISO 8601 timestamp
}

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

export interface ConfirmationModalState {
  isOpen: boolean;
  toggle: ToggleChangeRequest | null;
  isConfirmed: boolean;
}
