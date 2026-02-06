/**
 * Resource Configuration Section Types
 * Defines the data structures for managing Azure App Configuration resources
 */

export type EnvironmentType = 'development' | 'staging' | 'production';

export type ConnectionStatus = 'unknown' | 'testing' | 'connected' | 'error';

export interface AppConfigResource {
  id: string;
  displayName: string;
  environmentType: EnvironmentType;
  resourceName: string;
  resourceGroup: string;
  connectionString: string; // Masked in UI
  subscriptionId: string;
  connectionStatus: ConnectionStatus;
  lastTested?: string; // ISO 8601 timestamp
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

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

export interface ResourceListState {
  resources: AppConfigResource[];
  isLoading: boolean;
  error: string | null;
}

export interface ResourceFormState {
  mode: 'add' | 'edit';
  data: ResourceFormData;
  isSubmitting: boolean;
  isTesting: boolean;
  testResult: ConnectionTestResult | null;
  errors: Record<string, string>;
}
