'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { ResourceFormData, ConnectionTestResult, EnvironmentType } from '@/types';

interface ResourceFormProps {
  mode: 'add' | 'edit';
  initialData?: ResourceFormData;
  isTesting: boolean;
  testResult: ConnectionTestResult | null;
  errors: Record<string, string>;
  onSave: (data: ResourceFormData) => void;
  onTest: (data: ResourceFormData) => void;
  onCancel: () => void;
}

const defaultFormData: ResourceFormData = {
  displayName: '',
  environmentType: 'development',
  resourceName: '',
  resourceGroup: '',
  connectionString: '',
  subscriptionId: '',
};

export function ResourceForm({
  mode,
  initialData,
  isTesting,
  testResult,
  errors,
  onSave,
  onTest,
  onCancel,
}: ResourceFormProps) {
  const [formData, setFormData] = useState<ResourceFormData>(initialData || defaultFormData);

  const handleChange = (field: keyof ResourceFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleTestConnection = () => {
    onTest(formData);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{mode === 'add' ? 'Add New Resource' : 'Edit Resource'}</CardTitle>
            <CardDescription>
              {mode === 'add'
                ? 'Configure a new Azure App Configuration resource'
                : 'Update resource configuration'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              placeholder="e.g., Development, Staging, Production"
              className={errors.displayName ? 'border-red-500' : ''}
            />
            {errors.displayName && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.displayName}</p>
            )}
          </div>

          {/* Environment Type */}
          <div className="space-y-2">
            <Label htmlFor="environmentType">
              Environment Type <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              {(['development', 'staging', 'production'] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => handleChange('environmentType', env)}
                  className={`flex-1 py-2 px-3 rounded-lg border transition-colors ${
                    formData.environmentType === env
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-900 dark:text-orange-100'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Badge
                    className={`w-full ${
                      env === 'development'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : env === 'staging'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {env}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Resource Name */}
          <div className="space-y-2">
            <Label htmlFor="resourceName">
              Azure Resource Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="resourceName"
              value={formData.resourceName}
              onChange={(e) => handleChange('resourceName', e.target.value)}
              placeholder="e.g., appconfig-dev-eastus"
              className={errors.resourceName ? 'border-red-500' : ''}
            />
            {errors.resourceName && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.resourceName}</p>
            )}
          </div>

          {/* Resource Group */}
          <div className="space-y-2">
            <Label htmlFor="resourceGroup">
              Resource Group <span className="text-red-500">*</span>
            </Label>
            <Input
              id="resourceGroup"
              value={formData.resourceGroup}
              onChange={(e) => handleChange('resourceGroup', e.target.value)}
              placeholder="e.g., rg-featuretoggle-dev"
              className={errors.resourceGroup ? 'border-red-500' : ''}
            />
            {errors.resourceGroup && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.resourceGroup}</p>
            )}
          </div>

          {/* Connection String */}
          <div className="space-y-2">
            <Label htmlFor="connectionString">
              Connection String <span className="text-red-500">*</span>
            </Label>
            <Input
              id="connectionString"
              type="password"
              value={formData.connectionString}
              onChange={(e) => handleChange('connectionString', e.target.value)}
              placeholder="Endpoint=https://...;Id=...;Secret=..."
              className={errors.connectionString ? 'border-red-500' : ''}
            />
            {errors.connectionString && (
              <p className="text-sm text-red-600 dark:text-red-400">{errors.connectionString}</p>
            )}
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Find this in the Azure Portal under your App Configuration resource
            </p>
          </div>

          {/* Subscription ID */}
          <div className="space-y-2">
            <Label htmlFor="subscriptionId">Subscription ID</Label>
            <Input
              id="subscriptionId"
              value={formData.subscriptionId}
              onChange={(e) => handleChange('subscriptionId', e.target.value)}
              placeholder="12345678-1234-1234-1234-123456789abc"
            />
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg border ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p
                className={`text-sm ${
                  testResult.success
                    ? 'text-emerald-900 dark:text-emerald-100'
                    : 'text-red-900 dark:text-red-100'
                }`}
              >
                {testResult.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex-1"
            >
              {isTesting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Connection'
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
              disabled={isTesting}
            >
              {mode === 'add' ? 'Add Resource' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
