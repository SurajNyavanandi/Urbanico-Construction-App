import React, { Suspense } from 'react';
import { MaterialItem, UnitOption, ActivityDelivery, UserProfile } from '../../types';

// Dynamic lazy-loaded modal sheets for zero initial bundle bloat
const loadNikeAuthModal = () => import('../NikeAuthModal').then((m) => ({ default: m.NikeAuthModal }));
const loadItemQuantityModal = () => import('../ItemQuantityModal').then((m) => ({ default: m.ItemQuantityModal }));
const loadInvoiceModal = () => import('../InvoiceModal').then((m) => ({ default: m.InvoiceModal }));
const loadLocationModal = () => import('../LocationModal').then((m) => ({ default: m.LocationModal }));
const loadOrdersActivityModal = () => import('../OrdersActivityModal').then((m) => ({ default: m.OrdersActivityModal }));
const loadSettingsModal = () => import('../SettingsModal').then((m) => ({ default: m.SettingsModal }));
const loadPaymentSuccessModal = () => import('../PaymentSuccessModal').then((m) => ({ default: m.PaymentSuccessModal }));
const loadRazorpayModal = () => import('../common/RazorpayModal').then((m) => ({ default: m.RazorpayModal }));
const loadUpiQrModal = () => import('../common/UpiQrVerificationModal').then((m) => ({ default: m.UpiQrVerificationModal }));
const loadLiveChatModal = () => import('../common/LiveDispatcherChatModal').then((m) => ({ default: m.LiveDispatcherChatModal }));
const loadSupervisorModal = () => import('../common/SupervisorHandoffModal').then((m) => ({ default: m.SupervisorHandoffModal }));
const loadAddressModal = () => import('../common/DeliveryAddressFormModal').then((m) => ({ default: m.DeliveryAddressFormModal }));

export const NikeAuthModal = React.lazy(loadNikeAuthModal);
export const ItemQuantityModal = React.lazy(loadItemQuantityModal);
export const InvoiceModal = React.lazy(loadInvoiceModal);
export const LocationModal = React.lazy(loadLocationModal);
export const OrdersActivityModal = React.lazy(loadOrdersActivityModal);
export const SettingsModal = React.lazy(loadSettingsModal);
export const PaymentSuccessModal = React.lazy(loadPaymentSuccessModal);
export const RazorpayModal = React.lazy(loadRazorpayModal);
export const UpiQrVerificationModal = React.lazy(loadUpiQrModal);
export const LiveDispatcherChatModal = React.lazy(loadLiveChatModal);
export const SupervisorHandoffModal = React.lazy(loadSupervisorModal);
export const DeliveryAddressFormModal = React.lazy(loadAddressModal);

export const MODAL_PRELOADERS = {
  auth: loadNikeAuthModal,
  itemQuantity: loadItemQuantityModal,
  invoice: loadInvoiceModal,
  location: loadLocationModal,
  orders: loadOrdersActivityModal,
  settings: loadSettingsModal,
  paymentSuccess: loadPaymentSuccessModal,
  razorpay: loadRazorpayModal,
  upiQr: loadUpiQrModal,
  chat: loadLiveChatModal,
  supervisor: loadSupervisorModal,
  address: loadAddressModal,
};

export interface AppModalsContainerProps {
  isAuthModalOpen: boolean;
  onCloseAuthModal: () => void;
  onAuthSuccess: (phone: string) => void;

  selectedItemForModal: MaterialItem | null;
  onCloseItemModal: () => void;
  onAddToCartFromModal: (
    item: MaterialItem,
    option: UnitOption,
    quantity: number,
    totalPrice: number
  ) => void;
  onBuyNowFromModal: (
    item: MaterialItem,
    option: UnitOption,
    quantity: number,
    totalPrice: number
  ) => void;
  favoriteIds: string[];
  onToggleFavorite: (itemId: string) => void;

  selectedInvoiceDelivery: ActivityDelivery | null;
  onCloseInvoiceModal: () => void;
  user: UserProfile;
  isLoggedIn: boolean;
  onOpenLoginModal: () => void;

  isLocationModalOpen: boolean;
  onCloseLocationModal: () => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  isAuthModalOpen,
  onCloseAuthModal,
  onAuthSuccess,
  selectedItemForModal,
  onCloseItemModal,
  onAddToCartFromModal,
  onBuyNowFromModal,
  favoriteIds,
  onToggleFavorite,
  selectedInvoiceDelivery,
  onCloseInvoiceModal,
  user,
  isLoggedIn,
  onOpenLoginModal,
  isLocationModalOpen,
  onCloseLocationModal,
}) => {
  return (
    <>
      {/* Nike Auth Modal (Login/Signup Bottom Sheet) */}
      {isAuthModalOpen && (
        <Suspense fallback={null}>
          <NikeAuthModal
            isOpen={isAuthModalOpen}
            onClose={onCloseAuthModal}
            onSuccessAuth={onAuthSuccess}
          />
        </Suspense>
      )}

      {/* Item Quantity Modal (Slide-up Bottom Sheet) */}
      {selectedItemForModal && (
        <Suspense fallback={null}>
          <ItemQuantityModal
            item={selectedItemForModal}
            onClose={onCloseItemModal}
            onAddToCart={onAddToCartFromModal}
            onBuyNow={onBuyNowFromModal}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
          />
        </Suspense>
      )}

      {/* Official GST Tax Invoice Modal */}
      {selectedInvoiceDelivery && (
        <Suspense fallback={null}>
          <InvoiceModal
            isOpen={!!selectedInvoiceDelivery}
            onClose={onCloseInvoiceModal}
            delivery={selectedInvoiceDelivery}
            user={user}
            isLoggedIn={isLoggedIn}
            onOpenLoginModal={onOpenLoginModal}
          />
        </Suspense>
      )}

      {/* Delivery Site Location Picker Sheet */}
      {isLocationModalOpen && (
        <Suspense fallback={null}>
          <LocationModal
            isOpen={isLocationModalOpen}
            onClose={onCloseLocationModal}
          />
        </Suspense>
      )}
    </>
  );
};

export default AppModalsContainer;
