import React, { Suspense } from 'react';
import { MaterialItem, UnitOption, ActivityDelivery, UserProfile } from '../../types';

// Direct modal component imports for instant interaction and 100% reliability
import { NikeAuthModal } from '../NikeAuthModal';
import { ItemQuantityModal } from '../ItemQuantityModal';
import { InvoiceModal } from '../InvoiceModal';
import { LocationModal } from '../LocationModal';
import { OrdersActivityModal } from '../OrdersActivityModal';
import { SettingsModal } from '../SettingsModal';
import { PaymentSuccessModal } from '../PaymentSuccessModal';
import { RazorpayModal } from '../common/RazorpayModal';
import { UpiQrVerificationModal } from '../common/UpiQrVerificationModal';
import { LiveDispatcherChatModal } from '../common/LiveDispatcherChatModal';
import { SupervisorHandoffModal } from '../common/SupervisorHandoffModal';
import { DeliveryAddressFormModal } from '../common/DeliveryAddressFormModal';

export {
  NikeAuthModal,
  ItemQuantityModal,
  InvoiceModal,
  LocationModal,
  OrdersActivityModal,
  SettingsModal,
  PaymentSuccessModal,
  RazorpayModal,
  UpiQrVerificationModal,
  LiveDispatcherChatModal,
  SupervisorHandoffModal,
  DeliveryAddressFormModal,
};

export const MODAL_PRELOADERS = {
  auth: () => Promise.resolve({ default: NikeAuthModal }),
  itemQuantity: () => Promise.resolve({ default: ItemQuantityModal }),
  invoice: () => Promise.resolve({ default: InvoiceModal }),
  location: () => Promise.resolve({ default: LocationModal }),
  orders: () => Promise.resolve({ default: OrdersActivityModal }),
  settings: () => Promise.resolve({ default: SettingsModal }),
  paymentSuccess: () => Promise.resolve({ default: PaymentSuccessModal }),
  razorpay: () => Promise.resolve({ default: RazorpayModal }),
  upiQr: () => Promise.resolve({ default: UpiQrVerificationModal }),
  chat: () => Promise.resolve({ default: LiveDispatcherChatModal }),
  supervisor: () => Promise.resolve({ default: SupervisorHandoffModal }),
  address: () => Promise.resolve({ default: DeliveryAddressFormModal }),
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
