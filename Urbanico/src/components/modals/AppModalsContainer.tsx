import React, { Suspense } from 'react';
import { MaterialItem, UnitOption, ActivityDelivery, UserProfile } from '../../types';

// Lazy-loaded modal sheets for zero bundle bloat on initial paint
const loadNikeAuthModal = () => import('../NikeAuthModal').then((m) => ({ default: m.NikeAuthModal }));
const loadItemQuantityModal = () => import('../ItemQuantityModal').then((m) => ({ default: m.ItemQuantityModal }));
const loadInvoiceModal = () => import('../InvoiceModal').then((m) => ({ default: m.InvoiceModal }));
const loadLocationModal = () => import('../LocationModal').then((m) => ({ default: m.LocationModal }));

const NikeAuthModal = React.lazy(loadNikeAuthModal);
const ItemQuantityModal = React.lazy(loadItemQuantityModal);
const InvoiceModal = React.lazy(loadInvoiceModal);
const LocationModal = React.lazy(loadLocationModal);

export const MODAL_PRELOADERS = {
  auth: loadNikeAuthModal,
  itemQuantity: loadItemQuantityModal,
  invoice: loadInvoiceModal,
  location: loadLocationModal,
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
      {/* Nike Auth Modal (Login/Signup Bottom Sheet matching n1.jpeg, n2.jpeg) */}
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
