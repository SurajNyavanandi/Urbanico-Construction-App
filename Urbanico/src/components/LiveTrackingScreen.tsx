import React from 'react';
import { OrderHistory } from './OrderHistory';
import { ActivityDelivery } from '../types';

export interface LiveTrackingScreenProps {
  deliveries?: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  deliveries = [],
  onBack,
  onExploreCatalog,
  onViewInvoice,
  onReorderMaterial,
  isLoggedIn = false,
  onOpenLoginModal,
}) => {
  return (
    <OrderHistory
      deliveries={deliveries}
      initialFilter="active"
      isLoggedIn={isLoggedIn}
      onBack={onBack}
      onExploreCatalog={onExploreCatalog}
      onViewInvoice={onViewInvoice}
      onReorderMaterial={onReorderMaterial}
      onOpenLoginModal={onOpenLoginModal}
    />
  );
};

export default LiveTrackingScreen;
