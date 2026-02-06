'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AppShell } from '@/components/shell/AppShell';
import { AppConfigResource } from '@/types';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [resources, setResources] = useState<AppConfigResource[]>([]);
  const [currentResource, setCurrentResource] = useState<AppConfigResource | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    // Fetch resources on mount
    const fetchResources = async () => {
      try {
        const response = await fetch('/api/resources');
        if (response.ok) {
          const data = await response.json();
          setResources(data);
          if (data.length > 0 && !currentResource) {
            setCurrentResource(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      }
    };

    if (status === 'authenticated') {
      fetchResources();
    }
  }, [status]);

  const handleResourceChange = (resource: AppConfigResource) => {
    setCurrentResource(resource);
    // Save to localStorage for dashboard page
    localStorage.setItem('currentResource', JSON.stringify(resource));
  };

  // Save current resource to localStorage whenever it changes
  useEffect(() => {
    if (currentResource) {
      localStorage.setItem('currentResource', JSON.stringify(currentResource));
    }
  }, [currentResource]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const handleNavigate = (section: string) => {
    router.push(`/${section}`);
  };

  const getActiveSection = () => {
    if (pathname.startsWith('/resources')) return 'resources';
    if (pathname.startsWith('/audit-log')) return 'audit-log';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'dashboard';
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-stone-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Mock resource if none exist yet
  const mockResource: AppConfigResource = {
    id: 'no-resource',
    displayName: 'No Resources',
    resourceName: '',
    environmentType: 'development' as const,
    resourceGroup: '',
    connectionString: '',
    subscriptionId: '',
    connectionStatus: 'unknown' as const,
    lastTested: undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <AppShell
      currentResource={currentResource || mockResource}
      resources={resources.length > 0 ? resources : [mockResource]}
      onResourceChange={handleResourceChange}
      userName={session.user?.name || 'User'}
      userEmail={session.user?.email || ''}
      userRole={(session.user as any)?.role || 'read-only'}
      onLogout={handleLogout}
      activeSection={getActiveSection()}
      onNavigate={handleNavigate}
    >
      {children}
    </AppShell>
  );
}
