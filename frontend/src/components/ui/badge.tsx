import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200':
            variant === 'default',
          'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200':
            variant === 'secondary',
          'border border-stone-300 text-stone-700 dark:border-stone-700 dark:text-stone-300':
            variant === 'outline',
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200':
            variant === 'destructive',
        },
        className
      )}
      {...props}
    />
  );
}

export { Badge };
