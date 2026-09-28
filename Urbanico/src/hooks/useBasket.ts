import { useState, useMemo, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { CartItem, UserProfile, ActivityDelivery } from '../types';
import { soundService } from '../utils/soundHelper';

export interface UseBasketOptions {
  user: UserProfile;
  isLoggedIn: boolean;
  selectedLocation?: string;
  onOrderCreated?: (order: ActivityDelivery) => void;
  onOpenLoginModal?: () => void;
}

export function useBasket({
  user,
  isLoggedIn,
  selectedLocation,
  onOrderCreated,
  onOpenLoginModal,
}: UseBasketOptions) {
  const {
    cartItems,
    savedForLaterItems,
    totals,
    appliedCoupon,
    couponDiscount,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    saveForLater,
    moveToCart,
    removeSavedForLater,
  } = useCart();

  const { showToast } = useToast();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<'100_percent' | '50_split'>('100_percent');
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = useCallback(() => {
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    if (res.success) {
      soundService.playSuccess();
      showToast(res.message, 'success');
      setCouponInput('');
    } else {
      showToast(res.message, 'error');
    }
  }, [applyCoupon, couponInput, showToast]);

  const handleRemoveCoupon = useCallback(() => {
    removeCoupon();
    showToast('Coupon removed', 'info');
  }, [removeCoupon, showToast]);

  const handleIncrement = useCallback(
    (cartId: string, currentQty: number) => {
      soundService.playTap();
      updateQuantity(cartId, currentQty + 1);
    },
    [updateQuantity]
  );

  const handleDecrement = useCallback(
    (cartId: string, currentQty: number) => {
      soundService.playTap();
      if (currentQty > 1) {
        updateQuantity(cartId, currentQty - 1);
      } else {
        removeFromCart(cartId);
        showToast('Item removed from cart', 'info');
      }
    },
    [removeFromCart, showToast, updateQuantity]
  );

  const handleSaveForLater = useCallback(
    (item: CartItem) => {
      soundService.playTap();
      saveForLater(item);
      showToast(`Saved "${item.itemName}" for later`, 'info');
    },
    [saveForLater, showToast]
  );

  const handleMoveToCart = useCallback(
    (item: CartItem) => {
      soundService.playTap();
      moveToCart(item);
      showToast(`Moved "${item.itemName}" to cart`, 'success');
    },
    [moveToCart, showToast]
  );

  const isEmpty = cartItems.length === 0;

  return {
    cartItems,
    savedForLaterItems,
    totals,
    appliedCoupon,
    couponDiscount,
    couponInput,
    setCouponInput,
    isCheckingOut,
    setIsCheckingOut,
    selectedPaymentMode,
    setSelectedPaymentMode,
    handleApplyCoupon,
    handleRemoveCoupon,
    handleIncrement,
    handleDecrement,
    handleSaveForLater,
    handleMoveToCart,
    removeFromCart,
    clearCart,
    removeSavedForLater,
    isEmpty,
  };
}
