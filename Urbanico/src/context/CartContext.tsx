import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { CartItem, MaterialItem, UnitOption } from '../types';
import { safeStorage } from '../utils/safeStorage';
import { syncManager } from '../utils/syncManager';
import { calculateCartTotals, CartTotals, isCartItemService } from '../utils/cartCalculations';

interface CartContextType {
  cartItems: CartItem[];
  savedForLaterItems: CartItem[];
  appliedCoupon: string | null;
  couponDiscount: number;
  totals: CartTotals;
  addToCart: (
    item: MaterialItem,
    option: UnitOption,
    quantity: number,
    customUnitPrice?: number
  ) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  saveForLater: (item: CartItem) => void;
  moveToCart: (item: CartItem) => void;
  removeSavedForLater: (id: string) => void;
  addBundleToCart: (bundleItems: Array<{
    itemId: string;
    itemName: string;
    categoryName: string;
    optionLabel: string;
    unitPrice: number;
    quantity: number;
    image: string;
  }>) => void;
  mergeGuestCartOnAuth: (phone: string) => void;
  resetCartOnLogout: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

function generateId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : null;
      const key = cleanPhone ? `urbanico_cart_${cleanPhone}` : 'urbanico_cart_guest';
      const saved = safeStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [savedForLaterItems, setSavedForLaterItems] = useState<CartItem[]>(() => {
    try {
      const saved = safeStorage.getItem('urbanico_saved_for_later');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState<number>(0);

  // Debounced auto-save mechanism for cart state to minimize storage I/O during rapid quantity adjustments
  useEffect(() => {
    try {
      const authSaved = safeStorage.getItem('urbanico_auth_session');
      const phone = authSaved ? JSON.parse(authSaved).phone : null;
      const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : null;
      const key = cleanPhone ? `urbanico_cart_${cleanPhone}` : 'urbanico_cart_guest';
      safeStorage.setDebouncedItem(key, JSON.stringify(cartItems), 250);
    } catch {
      // ignore
    }

    return () => {
      // Flush immediately on unmount
      try {
        const authSaved = safeStorage.getItem('urbanico_auth_session');
        const phone = authSaved ? JSON.parse(authSaved).phone : null;
        const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : null;
        const key = cleanPhone ? `urbanico_cart_${cleanPhone}` : 'urbanico_cart_guest';
        safeStorage.flushDebounced(key);
      } catch {}
    };
  }, [cartItems]);

  // Debounced auto-save for saved-for-later items
  useEffect(() => {
    try {
      safeStorage.setDebouncedItem('urbanico_saved_for_later', JSON.stringify(savedForLaterItems), 400);
    } catch {
      // ignore
    }
  }, [savedForLaterItems]);

  // Recalculate totals synchronously whenever cartItems or couponDiscount changes
  const totals = useMemo(() => {
    return calculateCartTotals(cartItems, couponDiscount);
  }, [cartItems, couponDiscount]);

  const addToCart = useCallback(
    (
      item: MaterialItem,
      option: UnitOption,
      quantity: number,
      customUnitPrice?: number
    ) => {
      const isService = isCartItemService({
        categoryName: item.categoryId,
        categoryId: item.categoryId,
        itemId: item.id,
        itemName: item.name,
      });

      const effectiveUnitPrice = isService
        ? 99
        : customUnitPrice !== undefined
        ? customUnitPrice
        : option.price || item.defaultPrice || 500;

      const safeQuantity = Math.max(1, quantity || 1);

      setCartItems((prev) => {
        const existingIdx = prev.findIndex(
          (ci) => ci.itemId === item.id && ci.selectedOptionLabel === option.label
        );

        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + safeQuantity,
            unitPrice: effectiveUnitPrice,
          };
          return updated;
        }

        const newItem: CartItem = {
          id: generateId(),
          itemId: item.id,
          itemName: item.name,
          categoryName: item.categoryId,
          selectedOptionLabel: option.label,
          unitPrice: effectiveUnitPrice,
          quantity: safeQuantity,
          image: item.image,
        };

        return [newItem, ...prev];
      });
    },
    []
  );

  const updateQuantity = useCallback((cartId: string, newQty: number) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.id !== cartId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.id === cartId ? { ...item, quantity: newQty } : item))
    );
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }, []);

  const applyCoupon = useCallback((code: string) => {
    const isServicesOnlyCart = cartItems.length > 0 && cartItems.every(isCartItemService);
    if (isServicesOnlyCart) {
      return { success: false, message: 'Coupons are not applicable on trade service visits' };
    }

    const clean = code.trim().toUpperCase();
    if (!clean) return { success: false, message: 'Enter a valid coupon code' };

    if (clean === 'URBAN10' || clean === 'SAVE10' || clean === 'DISCOUNT10') {
      setAppliedCoupon(clean);
      setCouponDiscount(100);
      return { success: true, message: 'Coupon applied: 10% discount' };
    }
    if (clean === 'URBAN50' || clean === 'SAVE50') {
      setAppliedCoupon(clean);
      setCouponDiscount(250);
      return { success: true, message: 'Coupon applied: ₹250 discount' };
    }
    if (clean === 'SUPER500' || clean === 'URBAN500' || clean === 'SITE500') {
      setAppliedCoupon(clean);
      setCouponDiscount(500);
      return { success: true, message: 'Coupon applied: ₹500 discount' };
    }

    return { success: false, message: 'Invalid coupon code' };
  }, [cartItems]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }, []);

  const saveForLater = useCallback((item: CartItem) => {
    setCartItems((prev) => prev.filter((i) => i.id !== item.id));
    setSavedForLaterItems((prev) => [...prev.filter((i) => i.id !== item.id), item]);
  }, []);

  const moveToCart = useCallback((item: CartItem) => {
    setSavedForLaterItems((prev) => prev.filter((i) => i.id !== item.id));
    setCartItems((prev) => {
      const exists = prev.find(
        (ci) => ci.itemId === item.itemId && ci.selectedOptionLabel === item.selectedOptionLabel
      );
      if (exists) {
        return prev.map((ci) =>
          ci.id === exists.id ? { ...ci, quantity: ci.quantity + item.quantity } : ci
        );
      }
      return [item, ...prev];
    });
  }, []);

  const removeSavedForLater = useCallback((id: string) => {
    setSavedForLaterItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addBundleToCart = useCallback(
    (
      bundleItems: Array<{
        itemId: string;
        itemName: string;
        categoryName: string;
        optionLabel: string;
        unitPrice: number;
        quantity: number;
        image: string;
      }>
    ) => {
      setCartItems((prev) => {
        const updated = [...prev];
        bundleItems.forEach((bi) => {
          const existingIdx = updated.findIndex(
            (ci) => ci.itemId === bi.itemId && ci.selectedOptionLabel === bi.optionLabel
          );
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              quantity: updated[existingIdx].quantity + bi.quantity,
            };
          } else {
            updated.unshift({
              id: generateId(),
              itemId: bi.itemId,
              itemName: bi.itemName,
              categoryName: bi.categoryName,
              selectedOptionLabel: bi.optionLabel,
              unitPrice: bi.unitPrice,
              quantity: bi.quantity,
              image: bi.image,
            });
          }
        });
        return updated;
      });
    },
    []
  );

  const mergeGuestCartOnAuth = useCallback((phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const userKey = `urbanico_cart_${cleanPhone}`;
    const guestKey = 'urbanico_cart_guest';

    try {
      // 1. Read existing saved cart for this user
      const existingUserCartRaw = safeStorage.getItem(userKey);
      const existingUserCart: CartItem[] = existingUserCartRaw ? JSON.parse(existingUserCartRaw) : [];

      // 2. Read guest cart from storage as well as current in-memory cartItems
      const guestCartRaw = safeStorage.getItem(guestKey);
      const guestStoredItems: CartItem[] = guestCartRaw ? JSON.parse(guestCartRaw) : [];

      setCartItems((prev) => {
        const itemsToMerge = prev.length > 0 ? prev : guestStoredItems;
        const merged = [...existingUserCart];

        itemsToMerge.forEach((guestItem) => {
          const matchIdx = merged.findIndex(
            (ci) => ci.itemId === guestItem.itemId && ci.selectedOptionLabel === guestItem.selectedOptionLabel
          );
          if (matchIdx >= 0) {
            merged[matchIdx] = {
              ...merged[matchIdx],
              quantity: Math.max(merged[matchIdx].quantity, guestItem.quantity),
            };
          } else {
            merged.push(guestItem);
          }
        });

        // Persist immediately to user partition
        safeStorage.setItem(userKey, JSON.stringify(merged));
        safeStorage.removeItem(guestKey);

        return merged;
      });
    } catch {
      // ignore
    }
  }, []);

  const resetCartOnLogout = useCallback(() => {
    setCartItems([]);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    safeStorage.removeItem('urbanico_cart_guest');
  }, []);

  const value = useMemo(
    () => ({
      cartItems,
      savedForLaterItems,
      appliedCoupon,
      couponDiscount,
      totals,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      setCartItems,
      applyCoupon,
      removeCoupon,
      saveForLater,
      moveToCart,
      removeSavedForLater,
      addBundleToCart,
      mergeGuestCartOnAuth,
      resetCartOnLogout,
    }),
    [
      cartItems,
      savedForLaterItems,
      appliedCoupon,
      couponDiscount,
      totals,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      applyCoupon,
      removeCoupon,
      saveForLater,
      moveToCart,
      removeSavedForLater,
      addBundleToCart,
      mergeGuestCartOnAuth,
      resetCartOnLogout,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

const fallbackCartContext: CartContextType = {
  cartItems: [],
  savedForLaterItems: [],
  appliedCoupon: null,
  couponDiscount: 0,
  totals: {
    serviceItems: [],
    materialItems: [],
    isServicesOnly: false,
    hasServices: false,
    hasMaterials: false,
    totalQuantity: 0,
    servicesSubtotal: 0,
    materialsSubtotal: 0,
    subtotal: 0,
    gstTax: 0,
    deliveryCharge: 0,
    unloadingCharge: 0,
    couponDiscount: 0,
    grandTotal: 0,
  },
  addToCart: () => {},
  updateQuantity: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  setCartItems: () => {},
  applyCoupon: () => ({ success: false, message: 'Cart not initialized' }),
  removeCoupon: () => {},
  saveForLater: () => {},
  moveToCart: () => {},
  removeSavedForLater: () => {},
  addBundleToCart: () => {},
  mergeGuestCartOnAuth: () => {},
  resetCartOnLogout: () => {},
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    return fallbackCartContext;
  }
  return context;
};
