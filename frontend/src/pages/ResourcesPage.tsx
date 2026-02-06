import { useState } from 'react';
import { ResourceList } from '@/components/sections/resource-configuration/ResourceList';
import { ResourceForm, type ResourceFormData } from '@/components/sections/resource-configuration/ResourceForm';
import { useResources } from '@/context/ResourceContext';
import type { ConnectionTestResult } from '@/types';
import type { AppConfigResource } from '@/types';

type ViewMode = 'list' | 'add' | 'edit';

export function ResourcesPage() {
  const {
    resources,
    addResource,
    updateResource,
    deleteResource,
    testConnection,
  } = useResources();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingResource, setEditingResource] = useState<AppConfigResource | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    setViewMode('add');
    setEditingResource(null);
    setTestResult(null);
    setErrors({});
  };

  const handleEdit = (resource: AppConfigResource) => {
    setViewMode('edit');
    setEditingResource(resource);
    setTestResult(null);
    setErrors({});
  };

  const handleDelete = (resource: AppConfigResource) => {
    if (confirm(`Are you sure you want to delete "${resource.displayName}"?`)) {
      deleteResource(resource.id);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setEditingResource(null);
    setTestResult(null);
    setErrors({});
  };

  const validateForm = (data: ResourceFormData): boolean => {
    const newErrors: Record<string, string> = {};

    if (!data.displayName.trim()) {
      newErrors.displayName = 'Display name is required';
    }

    if (!data.resourceName.trim()) {
      newErrors.resourceName = 'Resource name is required';
    }

    if (!data.resourceGroup.trim()) {
      newErrors.resourceGroup = 'Resource group is required';
    }

    if (!data.endpoint.trim()) {
      newErrors.endpoint = 'Endpoint URL is required';
    } else if (!data.endpoint.startsWith('https://')) {
      newErrors.endpoint = 'Endpoint must start with https://';
    } else if (!data.endpoint.includes('.azconfig.io')) {
      newErrors.endpoint = 'Endpoint must be an Azure App Configuration URL';
    }

    if (!data.subscriptionId.trim()) {
      newErrors.subscriptionId = 'Subscription ID is required';
    } else if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.subscriptionId)) {
      newErrors.subscriptionId = 'Invalid subscription ID format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (data: ResourceFormData) => {
    if (!validateForm(data)) {
      return;
    }

    try {
      if (viewMode === 'add') {
        await addResource(data);
      } else if (viewMode === 'edit' && editingResource) {
        await updateResource(editingResource.id, data);
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save resource:', error);
      setErrors({
        general: 'Failed to save resource. Please try again.',
      });
    }
  };

  const handleTest = async (data: ResourceFormData) => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testConnection(data);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (viewMode === 'add') {
    return (
      <ResourceForm
        mode="add"
        isTesting={isTesting}
        testResult={testResult}
        errors={errors}
        onSave={handleSave}
        onTest={handleTest}
        onCancel={handleCancel}
      />
    );
  }

  if (viewMode === 'edit' && editingResource) {
    return (
      <ResourceForm
        mode="edit"
        initialData={{
          displayName: editingResource.displayName,
          environmentType: editingResource.environmentType,
          resourceName: editingResource.resourceName,
          resourceGroup: editingResource.resourceGroup,
          endpoint: editingResource.endpoint,
          subscriptionId: editingResource.subscriptionId,
        }}
        isTesting={isTesting}
        testResult={testResult}
        errors={errors}
        onSave={handleSave}
        onTest={handleTest}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <ResourceList
      resources={resources}
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
