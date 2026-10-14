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

      // Suppress noisy, non-essential notifications (auth status, locations, addresses, profile, category clicks, coupons, invoices, quotations, sync warnings)
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

      // 1. Essential Cart action toasts: Item added, removed, moved, or service duplicate warnings
      const isCartAction =
        (lower.includes('cart') || lower.includes('basket') || lower.includes('booking')) &&
        (lower.includes('add') ||
          lower.includes('remov') ||
          lower.includes('back to cart') ||
          lower.includes('moved') ||
          lower.includes('saved') ||
          lower.includes('already') ||
          lower.includes('service'));

      // 2. Essential Favorite action toasts: Item added or removed from favorites
      const isFavoriteAction =
        (type === 'favorite' || lower.includes('favorite') || lower.includes('favourite')) &&
        (lower.includes('saved') || lower.includes('add') || lower.includes('remov'));

      // 3. Essential Error & Rate Limit alerts
      const isErrorAction = type === 'error' || lower.includes('rate limit') || lower.includes('too many requests');

      // Retain ONLY essential user-action toasts
      if (!isCartAction && !isFavoriteAction && !isErrorAction) {
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

  // Listen to central 429 rate limit events and duplicate service warnings
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const rateLimitHandler = (e: any) => {
      const detail = e.detail || {};
      const retryAfter = detail.retryAfter || 60;
      setToast({
        visible: true,
        message: detail.message || `Too many requests. Please wait ${retryAfter}s before retrying.`,
        title: 'Rate Limit Active',
        type: 'error',
        duration: Math.min(retryAfter * 1000, 6000),
      });
    };

    const serviceAlreadyHandler = (e: any) => {
      const detail = e.detail || {};
      setToast({
        visible: true,
        message:
          detail.message ||
          'Service booking already in cart. You can update booking slot or location at checkout.',
        title: 'Booking In Cart',
        type: 'info',
        duration: 4000,
      });
    };

    window.addEventListener('urbanico:rate-limited', rateLimitHandler);
    window.addEventListener('urbanico:service-already-in-cart', serviceAlreadyHandler);
    return () => {
      window.removeEventListener('urbanico:rate-limited', rateLimitHandler);
      window.removeEventListener('urbanico:service-already-in-cart', serviceAlreadyHandler);
    };
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
