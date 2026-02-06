import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Server } from 'lucide-react';
import type { AppConfigResource } from '@/types';

interface ResourceSwitcherProps {
  currentResource: AppConfigResource | null;
  resources: AppConfigResource[];
  onResourceChange: (resource: AppConfigResource) => void;
}

const environmentColors = {
  development: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  staging: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  production: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export function ResourceSwitcher({
  currentResource,
  resources,
  onResourceChange,
}: ResourceSwitcherProps) {
  if (!currentResource) {
    return (
      <Button variant="outline" disabled className="min-w-[200px]">
        <Server className="h-4 w-4 mr-2" />
        No resources configured
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="min-w-[200px] justify-between gap-2"
        >
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="font-medium">{currentResource.displayName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs ${
                environmentColors[currentResource.environmentType]
              }`}
            >
              {currentResource.environmentType}
            </Badge>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[200px]">
        {resources.map((resource) => (
          <DropdownMenuItem
            key={resource.id}
            onClick={() => onResourceChange(resource)}
            className="flex items-center justify-between gap-2"
          >
            <span>{resource.displayName}</span>
            <Badge
              className={`text-xs ${environmentColors[resource.environmentType]}`}
            >
              {resource.environmentType}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
