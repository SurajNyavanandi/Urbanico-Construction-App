import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonItem } from './SkeletonItem';

export interface OrdersSkeletonProps {
  count?: number;
}

export const OrderCardSkeleton: React.FC = () => {
  return (
    <View style={styles.orderCard}>
      {/* Order Header: ID & Status Badge */}
      <View style={styles.rowBetween}>
        <View style={{ gap: 4 }}>
          <SkeletonItem width={120} height={16} borderRadius={6} />
          <SkeletonItem width={90} height={12} borderRadius={4} />
        </View>
        <SkeletonItem width={84} height={26} borderRadius={13} />
      </View>

      {/* Items Preview */}
      <View style={styles.itemsRow}>
        <SkeletonItem width={56} height={56} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <SkeletonItem width="80%" height={15} borderRadius={5} />
          <SkeletonItem width="45%" height={13} borderRadius={5} />
        </View>
      </View>

      {/* Order Footer: Total & Actions */}
      <View style={[styles.rowBetween, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]}>
        <SkeletonItem width={95} height={18} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SkeletonItem width={80} height={32} borderRadius={8} />
          <SkeletonItem width={80} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

export const OrdersSkeleton: React.FC<OrdersSkeletonProps> = ({ count = 3 }) => {
  const items = Array.from({ length: count });

  return (
    <View style={styles.container}>
      {/* Tab filter pills */}
      <View style={styles.filterTabs}>
        <SkeletonItem width={72} height={30} borderRadius={15} />
        <SkeletonItem width={88} height={30} borderRadius={15} />
        <SkeletonItem width={80} height={30} borderRadius={15} />
      </View>

      {/* Orders list */}
      <View style={{ gap: 14, marginTop: 14 }}>
        {items.map((_, i) => (
          <OrderCardSkeleton key={i} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  filterTabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default OrdersSkeleton;
