import { useState, useCallback } from 'react';

/**
 * Reusable hook for managing modal visibility, active item state, and dismiss transitions.
 * Eliminates repetitive boolean state, open/close boilerplate, and item selection across screens.
 */
export function useModalState<T = any>(initialOpen: boolean = false) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [selectedData, setSelectedData] = useState<T | null>(null);

  const open = useCallback((data?: T) => {
    if (data !== undefined) {
      setSelectedData(data);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const clearData = useCallback(() => {
    setSelectedData(null);
  }, []);

  return {
    isOpen,
    setIsOpen,
    open,
    close,
    toggle,
    selectedData,
    setSelectedData,
    clearData,
  };
}
