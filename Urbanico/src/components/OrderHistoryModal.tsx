import React from 'react';
import { Modal, StyleSheet, SafeAreaView } from 'react-native';
import { OrderHistory, OrderHistoryProps } from './OrderHistory';
import { useTheme } from '../context/ThemeContext';

export interface OrderHistoryModalProps extends OrderHistoryProps {
  visible: boolean;
  onClose: () => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  visible,
  onClose,
  ...orderHistoryProps
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: theme.background }]}>
        <OrderHistory
          {...orderHistoryProps}
          onBack={onClose}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
  },
});
