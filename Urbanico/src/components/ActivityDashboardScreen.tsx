import React from 'react';
import { OrderHistory } from './OrderHistory';
import { ActivityDelivery } from '../types';

export interface ActivityDashboardScreenProps {
  deliveries?: ActivityDelivery[];
  onBack: () => void;
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

/**
 * Consolidated ActivityDashboardScreen
 * Standardized on the single unified mobile Order History & Tracking component
 */
export const ActivityDashboardScreen: React.FC<ActivityDashboardScreenProps> = ({
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

export default ActivityDashboardScreen;
