import React from 'react';
import { ActivityDashboardScreen } from './ActivityDashboardScreen';
import { ActivityDelivery } from '../types';

export interface LiveTrackingScreenProps {
  deliveries: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

export const LiveTrackingScreen: React.FC<LiveTrackingScreenProps> = ({
  deliveries,
  onBack,
  onExploreCatalog,
  onViewInvoice,
  onReorderMaterial,
  isLoggedIn,
  onOpenLoginModal,
}) => {
  return (
    <ActivityDashboardScreen
      deliveries={deliveries}
      onBack={onBack}
      onExploreCatalog={onExploreCatalog}
      onViewInvoice={onViewInvoice}
      onReorderMaterial={onReorderMaterial}
      isLoggedIn={isLoggedIn}
      onOpenLoginModal={onOpenLoginModal}
    />
  );
};

export default LiveTrackingScreen;
