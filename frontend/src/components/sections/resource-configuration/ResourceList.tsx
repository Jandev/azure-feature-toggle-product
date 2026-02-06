import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Edit, Server, Trash2, XCircle, RefreshCw } from 'lucide-react';
import type { AppConfigResource } from '@/types';
import { useResources } from '@/context/ResourceContext';

interface ResourceListProps {
  resources: AppConfigResource[];
  onAdd: () => void;
  onEdit: (resource: AppConfigResource) => void;
  onDelete: (resource: AppConfigResource) => void;
}

const environmentColors = {
  development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  staging: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  production: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const connectionStatusIcons = {
  unknown: null,
  testing: null,
  connected: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  error: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
};

export function ResourceList({ resources, onAdd, onEdit, onDelete }: ResourceListProps) {
  const { isDiscovering, discoverResources, discoveredResources } = useResources();

  if (isDiscovering && resources.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-spin" />
            </div>
            <CardTitle>Discovering Resources</CardTitle>
            <CardDescription>
              Scanning your Azure subscriptions for App Configuration resources...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
              <Server className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <CardTitle>No Resources Found</CardTitle>
            <CardDescription>
              {discoveredResources.length > 0 
                ? `Found ${discoveredResources.length} resource(s) in your subscriptions, but none have been added yet.`
                : 'No Azure App Configuration resources were found in your accessible subscriptions.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-2">
            {discoveredResources.length > 0 ? (
              <Button
                onClick={onAdd}
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
              >
                Add Resource
              </Button>
            ) : (
              <>
                <Button
                  onClick={discoverResources}
                  variant="outline"
                  disabled={isDiscovering}
                  className="mr-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  onClick={onAdd}
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
                >
                  Add Manually
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Azure App Configuration Resources
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {resources.length} resource(s) configured
            {discoveredResources.length > 0 && discoveredResources.length !== resources.length && 
              ` · ${discoveredResources.length} discovered in your subscriptions`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={discoverResources}
            variant="outline"
            disabled={isDiscovering}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
            {isDiscovering ? 'Discovering...' : 'Refresh'}
          </Button>
          <Button
            onClick={onAdd}
            className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700"
          >
            Add Resource
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{resource.displayName}</CardTitle>
                  <Badge
                    className={`mt-2 text-xs ${environmentColors[resource.environmentType]}`}
                  >
                    {resource.environmentType}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  {connectionStatusIcons[resource.connectionStatus]}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 dark:text-slate-400 min-w-[80px]">
                    Resource:
                  </span>
                  <span className="text-slate-900 dark:text-white font-mono text-xs break-all">
                    {resource.resourceName}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 dark:text-slate-400 min-w-[80px]">
                    Group:
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 break-all">
                    {resource.resourceGroup}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 dark:text-slate-400 min-w-[80px]">
                    Endpoint:
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono text-xs break-all">
                    {resource.endpoint}
                  </span>
                </div>
                {resource.updatedAt && (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-500 dark:text-slate-400 min-w-[80px]">
                      Updated:
                    </span>
                    <span className="text-slate-600 dark:text-slate-400 text-xs">
                      {new Date(resource.updatedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(resource)}
                  className="flex-1"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(resource)}
                  className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
