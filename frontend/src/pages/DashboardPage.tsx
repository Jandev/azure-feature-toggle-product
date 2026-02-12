import { useEffect, useCallback } from 'react';
import { Dashboard } from '@/components/sections/feature-toggle-dashboard/Dashboard';
import { ProductionConfirmation } from '@/components/sections/feature-toggle-dashboard/ProductionConfirmation';
import { useToggles } from '@/context/ToggleContext';
import { useResources } from '@/context/ResourceContext';

export function DashboardPage() {
  const { confirmationRequest, setConfirmationRequest, updateToggle } = useToggles();
  const { currentResource } = useResources();

  const handleConfirm = useCallback(async () => {
    if (!confirmationRequest) return;

    try {
      await updateToggle(confirmationRequest);
    } catch (error) {
      console.error('Failed to update toggle:', error);
      // Error is already set in context
    }
  }, [confirmationRequest, updateToggle]);

  const handleCancel = () => {
    setConfirmationRequest(null);
  };

  // If not in production, execute toggle immediately without confirmation
  const shouldShowConfirmation =
    confirmationRequest?.requiresConfirmation &&
    currentResource?.environmentType === 'production';

  // Execute non-production toggles immediately (in useEffect to avoid side effects during render)
  useEffect(() => {
    if (confirmationRequest && !shouldShowConfirmation) {
      handleConfirm();
    }
  }, [confirmationRequest, shouldShowConfirmation, handleConfirm]);

  return (
    <div>
      <Dashboard />
      
      {/* Production Confirmation Modal */}
      {shouldShowConfirmation && confirmationRequest && (
        <ProductionConfirmation
          isOpen={true}
          toggleName={confirmationRequest.toggleName}
          currentState={confirmationRequest.currentState}
          newState={confirmationRequest.newState}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
