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

      // Suppress noisy/unnecessary toasts (account status, login, logout, profile updates)
      if (
        lower.includes('logged in') ||
        lower.includes('logged out') ||
        lower.includes('log in') ||
        lower.includes('login') ||
        lower.includes('logout') ||
        lower.includes('account verified') ||
        lower.includes('welcome') ||
        lower.includes('profile updated') ||
        lower.includes('profile details')
      ) {
        return;
      }

      // Keep only cart additions/removals, favorites toasts, or critical alerts
      const isCart =
        lower.includes('cart') ||
        lower.includes('basket') ||
        lower.includes('requisition') ||
        lower.includes('saved for later') ||
        lower.includes('coupon') ||
        lower.includes('order');

      const isFavorite =
        type === 'favorite' ||
        lower.includes('favorite') ||
        lower.includes('favourite');

      const isCriticalNotice =
        type === 'error' ||
        lower.includes('failed') ||
        lower.includes('invalid') ||
        lower.includes('declined');

      // Drop any toast that is not Cart, Favorites, or critical notice
      if (!isCart && !isFavorite && !isCriticalNotice) {
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
