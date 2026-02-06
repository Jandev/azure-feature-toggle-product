import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppConfigResource, ConnectionTestResult, DiscoveredResource } from '@/types';
import type { ResourceFormData } from '@/components/sections/resource-configuration/ResourceForm';
import { apiClient } from '@/lib/apiClient';
import { useAuth } from './AuthContext';

interface ResourceContextType {
  resources: AppConfigResource[];
  discoveredResources: DiscoveredResource[];
  isDiscovering: boolean;
  discoverResources: () => Promise<void>;
  addResource: (data: ResourceFormData) => Promise<void>;
  addDiscoveredResource: (discovered: DiscoveredResource) => void;
  updateResource: (id: string, data: ResourceFormData) => Promise<void>;
  deleteResource: (id: string) => void;
  testConnection: (data: ResourceFormData) => Promise<ConnectionTestResult>;
  currentResource: AppConfigResource | null;
  setCurrentResource: (resource: AppConfigResource | null) => void;
}

const ResourceContext = createContext<ResourceContextType | undefined>(undefined);

const STORAGE_KEY = 'azure-feature-toggle-resources';

export function ResourceProvider({ children }: { children: ReactNode }) {
  const [resources, setResources] = useState<AppConfigResource[]>([]);
  const [discoveredResources, setDiscoveredResources] = useState<DiscoveredResource[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [currentResource, setCurrentResource] = useState<AppConfigResource | null>(null);
  const { getAccessToken, getManagementToken, isAuthenticated } = useAuth();

  // Load resources from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppConfigResource[];
        setResources(parsed);
        
        // Set first resource as current if exists
        if (parsed.length > 0 && !currentResource) {
          setCurrentResource(parsed[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load resources from localStorage:', error);
    }
  }, []);

  // Save resources to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(resources));
    } catch (error) {
      console.error('Failed to save resources to localStorage:', error);
    }
  }, [resources]);

  const convertDiscoveredToAppConfig = (discovered: DiscoveredResource): AppConfigResource => {
    return {
      id: discovered.id,
      displayName: discovered.displayName,
      resourceName: discovered.resourceName,
      resourceGroup: discovered.resourceGroup,
      subscriptionId: discovered.subscriptionId,
      endpoint: discovered.endpoint,
      environmentType: discovered.environmentType,
      connectionStatus: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  // Discover resources from Azure when authenticated
  const discoverResources = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('[ResourceContext] Not authenticated, skipping discovery');
      return;
    }

    console.log('[ResourceContext] Starting resource discovery...');
    setIsDiscovering(true);
    try {
      // Get Azure Management token for accessing Azure Resource Manager
      const managementToken = await getManagementToken();
      if (!managementToken) {
        throw new Error('Failed to acquire Azure Management token');
      }

      console.log('[ResourceContext] Calling /resources/discover API...');
      const discovered = await apiClient.get<DiscoveredResource[]>(
        '/resources/discover',
        undefined, // No API token needed for discovery endpoint
        { 'X-Management-Token': managementToken } // Pass management token in custom header
      );

      console.log('[ResourceContext] Discovered resources:', discovered);
      setDiscoveredResources(discovered);

      // Auto-add discovered resources if resources list is empty
      if (resources.length === 0 && discovered.length > 0) {
        console.log('[ResourceContext] Auto-adding discovered resources to list');
        const converted = discovered.map((d) => convertDiscoveredToAppConfig(d));
        setResources(converted);
        if (converted.length > 0) {
          setCurrentResource(converted[0]);
        }
      } else {
        console.log('[ResourceContext] Not auto-adding:', {
          hasExistingResources: resources.length > 0,
          discoveredCount: discovered.length
        });
      }
    } catch (error) {
      console.error('[ResourceContext] Failed to discover resources:', error);
      if (error instanceof Error) {
        console.error('[ResourceContext] Error details:', error.message);
      }
    } finally {
      setIsDiscovering(false);
    }
  }, [isAuthenticated, getManagementToken, resources.length]);

  const addDiscoveredResource = (discovered: DiscoveredResource) => {
    const newResource = convertDiscoveredToAppConfig(discovered);
    setResources((prev) => [...prev, newResource]);

    // Set as current if it's the first resource
    if (resources.length === 0) {
      setCurrentResource(newResource);
    }
  };

  // Discover resources on mount when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('[ResourceContext] User authenticated, triggering resource discovery');
      discoverResources();
    }
  }, [isAuthenticated, discoverResources]);

  const addResource = async (data: ResourceFormData): Promise<void> => {
    const newResource: AppConfigResource = {
      id: crypto.randomUUID(),
      ...data,
      connectionStatus: 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setResources((prev) => [...prev, newResource]);

    // Set as current if it's the first resource
    if (resources.length === 0) {
      setCurrentResource(newResource);
    }
  };

  const updateResource = async (id: string, data: ResourceFormData): Promise<void> => {
    setResources((prev) =>
      prev.map((resource) =>
        resource.id === id
          ? {
              ...resource,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : resource
      )
    );

    // Update current resource if it's the one being edited
    if (currentResource?.id === id) {
      setCurrentResource((prev) =>
        prev
          ? {
              ...prev,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    }
  };

  const deleteResource = (id: string) => {
    setResources((prev) => prev.filter((resource) => resource.id !== id));

    // Clear current resource if it's the one being deleted
    if (currentResource?.id === id) {
      const remaining = resources.filter((r) => r.id !== id);
      setCurrentResource(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const testConnection = async (data: ResourceFormData): Promise<ConnectionTestResult> => {
    try {
      // Validate endpoint format
      if (!data.endpoint.startsWith('https://') || !data.endpoint.includes('.azconfig.io')) {
        return {
          success: false,
          message: 'Invalid endpoint URL. Must be in format: https://your-appconfig.azconfig.io',
          timestamp: new Date().toISOString(),
        };
      }

      // Get access token for authenticated request
      const token = await getAccessToken();
      if (!token) {
        return {
          success: false,
          message: 'Authentication required. Please log in again.',
          timestamp: new Date().toISOString(),
        };
      }

      // Call backend API to test connection
      const result = await apiClient.post<ConnectionTestResult>(
        '/resources/test-connection',
        { endpoint: data.endpoint },
        token
      );

      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString(),
      };
    }
  };

  return (
    <ResourceContext.Provider
      value={{
        resources,
        discoveredResources,
        isDiscovering,
        discoverResources,
        addResource,
        addDiscoveredResource,
        updateResource,
        deleteResource,
        testConnection,
        currentResource,
        setCurrentResource,
      }}
    >
      {children}
    </ResourceContext.Provider>
  );
}

export function useResources() {
  const context = useContext(ResourceContext);
  if (context === undefined) {
    throw new Error('useResources must be used within a ResourceProvider');
  }
  return context;
}
