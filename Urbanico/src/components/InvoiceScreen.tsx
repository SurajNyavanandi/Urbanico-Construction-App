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

export const InvoiceScreen: React.FC<InvoiceScreenProps> = (props) => {
  return <InvoiceModal isOpen={props.isOpen ?? true} {...props} />;
};

export default InvoiceScreen;
