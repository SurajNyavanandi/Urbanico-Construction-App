import { useState, useCallback } from 'react';

/**
 * useAsyncModal
 * Provides immediate micro-spinner feedback when the user clicks a button
 * that requires downloading or resolving an asynchronous modal chunk.
 */
export function useAsyncModal() {
  const [loadingModalId, setLoadingModalId] = useState<string | null>(null);

  const triggerAsyncModal = useCallback(
    async (
      modalId: string,
      asyncImporter: () => Promise<any>,
      onResolved: () => void
    ) => {
      setLoadingModalId(modalId);
      try {
        await asyncImporter();
        onResolved();
      } catch (err) {
        console.error(`Failed to load chunk for modal ${modalId}:`, err);
        // Still attempt to open
        onResolved();
      } finally {
        setLoadingModalId(null);
      }
    },
    []
  );

  const isModalLoading = useCallback(
    (modalId: string) => loadingModalId === modalId,
    [loadingModalId]
  );

  return {
    loadingModalId,
    isModalLoading,
    triggerAsyncModal,
  };
}

export default useAsyncModal;
