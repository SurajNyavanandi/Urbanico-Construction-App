import React from 'react';
import { OrderHistoryModal } from './OrderHistoryModal';
import { ActivityDelivery } from '../types';

export interface OrdersActivityModalProps {
  visible: boolean;
  onClose: () => void;
  deliveries?: ActivityDelivery[];
  onExploreCatalog?: () => void;
  onViewInvoice?: (delivery: ActivityDelivery) => void;
  onReorderMaterial?: (materialName: string) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

/**
 * Consolidated OrdersActivityModal
 * Delegates to the unified mobile OrderHistoryModal to eliminate duplicate screens
 */
export const OrdersActivityModal: React.FC<OrdersActivityModalProps> = ({
  visible,
  onClose,
  deliveries = [],
  onExploreCatalog,
  onViewInvoice,
  onReorderMaterial,
  isLoggedIn = false,
  onOpenLoginModal,
}) => {
  return (
    <OrderHistoryModal
      visible={visible}
      onClose={onClose}
      deliveries={deliveries}
      initialFilter="active"
      isLoggedIn={isLoggedIn}
      onExploreCatalog={onExploreCatalog}
      onViewInvoice={onViewInvoice}
      onReorderMaterial={onReorderMaterial}
      onOpenLoginModal={onOpenLoginModal}
    />
  );
};

export default OrdersActivityModal;
