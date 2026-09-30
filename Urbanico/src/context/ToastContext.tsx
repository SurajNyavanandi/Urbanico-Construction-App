import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast, ToastType } from '../components/common/Toast';
import { AddToCartToast, CartToastPayload } from '../components/common/AddToCartToast';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  duration?: number;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface CartToastState {
  visible: boolean;
  item: CartToastPayload | null;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: ToastType,
    duration?: number,
    title?: string,
    actionLabel?: string,
    onAction?: () => void
  ) => void;
  hideToast: () => void;
  showAddToCartToast: (payload: CartToastPayload, duration?: number) => void;
  hideAddToCartToast: () => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
  hideToast: () => {},
  showAddToCartToast: () => {},
  hideAddToCartToast: () => {},
});

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const [cartToast, setCartToast] = useState<CartToastState>({
    visible: false,
    item: null,
  });

  const showToast = useCallback(
    (
      message: string,
      type: ToastType = 'success',
      duration = 3200,
      title?: string,
      actionLabel?: string,
      onAction?: () => void
    ) => {
      const lower = (message || '').toLowerCase();

      // Suppress all noisy, non-essential notifications (auth status, locations, addresses, profile, category clicks, coupons, invoices, quotations, sync warnings)
      if (
        lower.includes('logged in') ||
        lower.includes('logged out') ||
        lower.includes('log in') ||
        lower.includes('login') ||
        lower.includes('logout') ||
        lower.includes('otp') ||
        lower.includes('verification') ||
        lower.includes('account') ||
        lower.includes('location') ||
        lower.includes('address') ||
        lower.includes('gst') ||
        lower.includes('gstin') ||
        lower.includes('profile') ||
        lower.includes('auto-save') ||
        lower.includes('sync') ||
        lower.includes('coupon') ||
        lower.includes('invoice') ||
        lower.includes('quotation') ||
        lower.includes('category') ||
        lower.includes('welcome')
      ) {
        return;
      }

      // 1. Essential Cart action toasts: Item added, removed, or moved to/from cart
      const isCartAction =
        (lower.includes('cart') || lower.includes('basket') || lower.includes('saved for later')) &&
        (lower.includes('add') || lower.includes('remov') || lower.includes('back to cart') || lower.includes('moved') || lower.includes('saved'));

      // 2. Essential Favorite action toasts: Item added or removed from favorites
      const isFavoriteAction =
        (type === 'favorite' || lower.includes('favorite') || lower.includes('favourite')) &&
        (lower.includes('saved') || lower.includes('add') || lower.includes('remov'));

      // Retain ONLY essential user-action toasts
      if (!isCartAction && !isFavoriteAction) {
        return;
      }

      setToast({
        visible: true,
        message,
        type,
        duration,
        title,
        actionLabel,
        onAction,
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showAddToCartToast = useCallback((payload: CartToastPayload, duration = 3800) => {
    setCartToast({
      visible: true,
      item: payload,
      duration,
    });
  }, []);

  const hideAddToCartToast = useCallback(() => {
    setCartToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showToast,
        hideToast,
        showAddToCartToast,
        hideAddToCartToast,
      }}
    >
      {children}
      <Toast
        visible={toast.visible}
        message={toast.message}
        title={toast.title}
        type={toast.type}
        duration={toast.duration}
        actionLabel={toast.actionLabel}
        onAction={toast.onAction}
        onDismiss={hideToast}
      />
      <AddToCartToast
        visible={cartToast.visible}
        item={cartToast.item}
        duration={cartToast.duration}
        onDismiss={hideAddToCartToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
