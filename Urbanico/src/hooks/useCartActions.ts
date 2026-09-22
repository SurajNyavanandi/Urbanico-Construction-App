import { useCallback } from 'react';
import { MaterialItem, UnitOption, CartItem } from '../types';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { soundService } from '../utils/soundHelper';

/**
 * Reusable hook for Cart operations, audio triggers, and notification toasts.
 * Eliminates repetitive cart addition and modal dispatch code across screens.
 */
export function useCartActions() {
  const { addToCart, cartItems, totals, removeFromCart, updateQuantity } = useCart();
  const { showToast } = useToast();

  const addMaterialWithFeedback = useCallback(
    (
      item: MaterialItem,
      selectedOption?: UnitOption,
      quantity: number = 1,
      options?: { silent?: boolean; customMessage?: string; customUnitPrice?: number }
    ) => {
      const optionToUse: UnitOption = selectedOption || item.options?.[0] || {
        id: 'default',
        label: 'Standard',
        price: item.defaultPrice || 0,
        type: 'stepper',
      };

      addToCart(item, optionToUse, quantity, options?.customUnitPrice);

      if (!options?.silent) {
        soundService.playAddToCart();
        showToast(
          options?.customMessage || `Added ${quantity}x ${item.name} to Cart`,
          'success'
        );
      }
    },
    [addToCart, showToast]
  );

  return {
    addMaterialWithFeedback,
    cartItems,
    totals,
    removeFromCart,
    updateQuantity,
    totalItems: totals.totalQuantity,
    totalPrice: totals.grandTotal,
  };
}
