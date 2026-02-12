import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { FeatureToggle, ToggleChangeRequest } from '@/types';
import { useResources } from './ResourceContext';
import { useAuth } from './AuthContext';
import { apiClient } from '@/lib/apiClient';

interface ToggleContextType {
  toggles: FeatureToggle[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filter: 'all' | 'enabled' | 'disabled';
  setFilter: (filter: 'all' | 'enabled' | 'disabled') => void;
  filteredToggles: FeatureToggle[];
  updateToggle: (request: ToggleChangeRequest) => Promise<void>;
  refreshToggles: () => Promise<void>;
  confirmationRequest: ToggleChangeRequest | null;
  setConfirmationRequest: (request: ToggleChangeRequest | null) => void;
}

const ToggleContext = createContext<ToggleContextType | undefined>(undefined);

export function ToggleProvider({ children }: { children: ReactNode }) {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [confirmationRequest, setConfirmationRequest] = useState<ToggleChangeRequest | null>(null);

  const { currentResource } = useResources();
  const { user, getAccessToken } = useAuth();

  // Fetch toggles when currentResource changes
  // Backend uses OBO flow to get App Config token - we just pass our API token
  const fetchToggles = useCallback(async () => {
    if (!currentResource) {
      setToggles([]);
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

      const data = await apiClient.get<FeatureToggle[]>(
        `/toggles?endpoint=${encodeURIComponent(currentResource.endpoint)}&resourceId=${currentResource.id}`,
        token
      );
      
      setToggles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load toggles');
      console.error('Failed to fetch toggles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentResource, getAccessToken]);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  const refreshToggles = async () => {
    await fetchToggles();
  };

  const updateToggle = async (request: ToggleChangeRequest) => {
    if (!currentResource || !user) {
      throw new Error('No resource or user available');
    }

    try {
      // Get API token - backend will use OBO to get App Config token
      const token = await getAccessToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const updatedToggle = await apiClient.put<FeatureToggle>(
        `/toggles/${encodeURIComponent(request.toggleId)}`,
        {
          endpoint: currentResource.endpoint,
          resourceId: currentResource.id,
          enabled: request.newState,
          userName: user.name,
        },
        token
      );

      // Update local state with response
      setToggles((prev) =>
        prev.map((toggle) =>
          toggle.id === request.toggleId ? updatedToggle : toggle
        )
      );

      setConfirmationRequest(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update toggle';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Filtered toggles based on search query and filter
  const filteredToggles = toggles.filter((toggle) => {
    // Apply filter
    if (filter === 'enabled' && !toggle.enabled) return false;
    if (filter === 'disabled' && toggle.enabled) return false;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        toggle.name.toLowerCase().includes(query) ||
        toggle.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return (
    <ToggleContext.Provider
      value={{
        toggles,
        isLoading,
        error,
        searchQuery,
        setSearchQuery,
        filter,
        setFilter,
        filteredToggles,
        updateToggle,
        refreshToggles,
        confirmationRequest,
        setConfirmationRequest,
      }}
    >
      {children}
    </ToggleContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToggles() {
  const context = useContext(ToggleContext);
  if (context === undefined) {
    throw new Error('useToggles must be used within a ToggleProvider');
  }
  return context;
}
