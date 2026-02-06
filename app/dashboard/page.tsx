'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Dashboard, ProductionConfirmation } from '@/components/dashboard';
import type { FeatureToggle, UserRole } from '@/types';

interface PendingToggle {
  toggleId: string;
  toggleName: string;
  currentState: boolean;
  newState: boolean;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingToggleId, setUpdatingToggleId] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [currentResourceId, setCurrentResourceId] = useState<string | null>(null);
  const [currentResourceName, setCurrentResourceName] = useState<string>('');
  const [currentEnvironment, setCurrentEnvironment] = useState<'development' | 'staging' | 'production'>('development');

  // Get current resource from localStorage (set by AppShell)
  useEffect(() => {
    const resourceData = localStorage.getItem('currentResource');
    if (resourceData) {
      try {
        const resource = JSON.parse(resourceData);
        setCurrentResourceId(resource.id);
        setCurrentResourceName(resource.displayName);
        setCurrentEnvironment(resource.environmentType);
      } catch (err) {
        console.error('Failed to parse current resource:', err);
      }
    }
  }, []);

  // Fetch toggles when resource changes
  useEffect(() => {
    if (currentResourceId) {
      fetchToggles();
    }
  }, [currentResourceId]);

  const fetchToggles = async () => {
    if (!currentResourceId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/resources/${currentResourceId}/toggles`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch toggles');
      }
      
      const data = await response.json();
      setToggles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching toggles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (toggleId: string, currentState: boolean) => {
    const toggle = toggles.find((t) => t.id === toggleId);
    if (!toggle) return;

    const newState = !currentState;

    // If production environment, show confirmation dialog
    if (currentEnvironment === 'production') {
      setPendingToggle({
        toggleId,
        toggleName: toggle.name,
        currentState,
        newState,
      });
      return;
    }

    // Otherwise, toggle directly
    await performToggle(toggleId, newState);
  };

  const performToggle = async (toggleId: string, newState: boolean) => {
    if (!currentResourceId) return;

    try {
      setUpdatingToggleId(toggleId);
      const response = await fetch(
        `/api/resources/${currentResourceId}/toggles/${toggleId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ enabled: newState }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update toggle');
      }

      const updatedToggle = await response.json();

      // Update local state
      setToggles((prev) =>
        prev.map((t) => (t.id === toggleId ? updatedToggle : t))
      );
    } catch (err) {
      console.error('Error updating toggle:', err);
      alert(
        err instanceof Error ? err.message : 'Failed to update toggle. Please try again.'
      );
    } finally {
      setUpdatingToggleId(null);
    }
  };

  const handleProductionConfirm = async () => {
    if (pendingToggle) {
      await performToggle(pendingToggle.toggleId, pendingToggle.newState);
      setPendingToggle(null);
    }
  };

  const handleProductionCancel = () => {
    setPendingToggle(null);
  };

  // Redirect to login if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Show message if no resource selected
  if (!currentResourceId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Feature Toggle Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            View and manage feature flags for your Azure resources
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-900">Getting Started</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>To get started, please configure your Azure App Configuration resources.</p>
                <p className="mt-2">
                  Navigate to <strong>Resources</strong> from the sidebar to add your first resource.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userRole = (session?.user as any)?.role || 'read-only';

  return (
    <>
      <Dashboard
        toggles={toggles}
        currentResource={{
          id: currentResourceId,
          displayName: currentResourceName,
          environmentType: currentEnvironment,
        }}
        userRole={userRole as UserRole}
        isLoading={isLoading}
        error={error}
        updatingToggleId={updatingToggleId}
        onToggle={handleToggle}
      />

      <ProductionConfirmation
        isOpen={pendingToggle !== null}
        toggleName={pendingToggle?.toggleName || ''}
        currentState={pendingToggle?.currentState || false}
        newState={pendingToggle?.newState || false}
        onConfirm={handleProductionConfirm}
        onCancel={handleProductionCancel}
      />
    </>
  );
}
