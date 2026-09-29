import React from 'react';
import { InvoiceModal } from './InvoiceModal';
import { UserProfile, ActivityDelivery } from '../types';

export interface InvoiceScreenProps {
  delivery: ActivityDelivery | null;
  user: UserProfile;
  isOpen?: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

export const InvoiceScreen: React.FC<InvoiceScreenProps> = ({
  delivery,
  user,
  isOpen = true,
  onClose,
  isLoggedIn = true,
  onOpenLoginModal,
}) => {
  return (
    <InvoiceModal
      isOpen={isOpen}
      onClose={onClose}
      delivery={delivery}
      user={user}
      isLoggedIn={isLoggedIn}
      onOpenLoginModal={onOpenLoginModal}
    />
  );
};

export default InvoiceScreen;
