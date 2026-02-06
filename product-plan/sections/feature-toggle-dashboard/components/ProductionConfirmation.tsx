/**
 * ProductionConfirmation Component
 * 
 * Dependencies:
 * - shadcn/ui components: button, dialog
 *   Install via: npx shadcn@latest add button dialog
 * - lucide-react: Icons
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ProductionConfirmationProps {
  isOpen: boolean;
  toggleName: string;
  currentState: boolean;
  newState: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ProductionConfirmation({
  isOpen,
  toggleName,
  currentState,
  newState,
  onConfirm,
  onCancel,
}: ProductionConfirmationProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setIsConfirmed(false);
    }
  };

  const handleCancel = () => {
    onCancel();
    setIsConfirmed(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <DialogTitle className="text-lg">Production Environment</DialogTitle>
          </div>
          <DialogDescription>
            You're about to change a feature toggle in production. This will affect live users
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle Info */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Feature:</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {toggleName}
              </span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm py-2">
              <span
                className={`px-3 py-1 rounded-full font-medium ${
                  currentState
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {currentState ? 'Enabled' : 'Disabled'}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              <span
                className={`px-3 py-1 rounded-full font-medium ${
                  newState
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                {newState ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <div className="flex items-start space-x-3 p-4 border border-orange-200 dark:border-orange-800 rounded-lg">
            <input
              type="checkbox"
              id="confirm"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label
              htmlFor="confirm"
              className="text-sm font-medium leading-none cursor-pointer select-none"
            >
              I understand this change will affect live users in production
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!isConfirmed}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Confirm Change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
