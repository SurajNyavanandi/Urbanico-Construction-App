import { useState, useCallback } from 'react';

/**
 * useToggle
 * Clean, lightweight boolean state manager.
 * Eliminates repetitive boolean state handlers (e.g. open/close modal, toggle menu, expand/collapse section).
 * 
 * @example
 * const [isModalOpen, { toggle, setTrue: openModal, setFalse: closeModal }] = useToggle(false);
 * 
 * // Or object destructuring:
 * const { value: isVisible, toggle, on, off } = useToggleState(false);
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, { toggle: () => void; setTrue: () => void; setFalse: () => void; set: (val: boolean) => void }] {
  const [value, setValue] = useState<boolean>(initialValue);

  const toggle = useCallback(() => setValue((v) => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const set = useCallback((val: boolean) => setValue(val), []);

  return [value, { toggle, setTrue, setFalse, set }];
}

/**
 * Object-syntax variant for intuitive named destructuring.
 */
export function useToggleState(initialValue: boolean = false) {
  const [value, actions] = useToggle(initialValue);
  return {
    value,
    isOpen: value,
    toggle: actions.toggle,
    open: actions.setTrue,
    close: actions.setFalse,
    on: actions.setTrue,
    off: actions.setFalse,
    set: actions.set,
  };
}
