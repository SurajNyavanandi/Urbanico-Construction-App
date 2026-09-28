import React from 'react';
import { NikeAuthModal } from '../NikeAuthModal';
import { ItemQuantityModal } from '../ItemQuantityModal';
import { InvoiceModal } from '../InvoiceModal';
import { LocationModal } from '../LocationModal';
import { MaterialItem, UnitOption, ActivityDelivery, UserProfile } from '../../types';

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
        <NikeAuthModal
          isOpen={isAuthModalOpen}
          onClose={onCloseAuthModal}
          onSuccessAuth={onAuthSuccess}
        />
      )}

      {/* Item Quantity Modal (Slide-up Bottom Sheet) */}
      {selectedItemForModal && (
        <ItemQuantityModal
          item={selectedItemForModal}
          onClose={onCloseItemModal}
          onAddToCart={onAddToCartFromModal}
          onBuyNow={onBuyNowFromModal}
          favoriteIds={favoriteIds}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {/* Official GST Tax Invoice Modal */}
      {selectedInvoiceDelivery && (
        <InvoiceModal
          isOpen={!!selectedInvoiceDelivery}
          onClose={onCloseInvoiceModal}
          delivery={selectedInvoiceDelivery}
          user={user}
          isLoggedIn={isLoggedIn}
          onOpenLoginModal={onOpenLoginModal}
        />
      )}

      {/* Delivery Site Location Picker Sheet */}
      {isLocationModalOpen && (
        <LocationModal
          isOpen={isLocationModalOpen}
          onClose={onCloseLocationModal}
        />
      )}
    </>
  );
};
