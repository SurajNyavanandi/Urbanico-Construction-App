import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  SkeletonItem,
  useSkeletonAnimation,
  CatalogSkeleton,
  DetailScreenSkeleton,
  OrdersSkeleton,
  TrackingSkeleton,
} from './skeletons';

export {
  useSkeletonAnimation,
  SkeletonItem,
  CatalogSkeleton,
  DetailScreenSkeleton,
  OrdersSkeleton,
  TrackingSkeleton,
};

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  return (
    <SkeletonItem
      width={width}
      height={height}
      borderRadius={borderRadius}
      style={style}
    />
  );
};

/* Product Card Skeleton */
export const ProductCardSkeleton: React.FC<{ viewMode?: 'grid' | 'list'; width?: number | string }> = ({
  viewMode = 'grid',
  width,
}) => {
  if (viewMode === 'list') {
    return (
      <View style={styles.listSkeleton}>
        <Skeleton width={84} height={84} borderRadius={14} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={12} />
          <Skeleton width="30%" height={14} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.gridSkeleton, width ? { width: width as any } : { width: '48%' }]}>
      <Skeleton width="100%" height={130} borderRadius={14} />
      <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
      <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
      <Skeleton width="40%" height={14} style={{ marginTop: 4 }} />
    </View>
  );
};

/* Home Dashboard Skeleton */
export const HomeSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Search & Location header skeleton */}
      <View style={styles.rowBetween}>
        <Skeleton width="60%" height={24} />
        <Skeleton width={36} height={36} borderRadius={18} />
      </View>
      <Skeleton width="100%" height={44} borderRadius={12} style={{ marginTop: 12 }} />

      {/* Banner Skeleton */}
      <Skeleton width="100%" height={150} borderRadius={16} style={{ marginTop: 20 }} />

      {/* Materials Horizontal Carousel */}
      <View style={{ marginTop: 24 }}>
        <Skeleton width="40%" height={20} style={{ marginBottom: 12 }} />
        <View style={styles.horizontalRow}>
          <ProductCardSkeleton width={140} />
          <ProductCardSkeleton width={140} />
          <ProductCardSkeleton width={140} />
        </View>
      </View>

      {/* Services Horizontal Carousel */}
      <View style={{ marginTop: 24 }}>
        <Skeleton width="40%" height={20} style={{ marginBottom: 12 }} />
        <View style={styles.horizontalRow}>
          <ProductCardSkeleton width={140} />
          <ProductCardSkeleton width={140} />
          <ProductCardSkeleton width={140} />
        </View>
      </View>
    </View>
  );
};

/* Profile Skeleton */
export const ProfileSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginVertical: 20 }}>
        <Skeleton width={90} height={90} borderRadius={45} />
        <Skeleton width={150} height={20} style={{ marginTop: 12 }} />
        <Skeleton width={180} height={14} style={{ marginTop: 6 }} />
      </View>
      <View style={{ gap: 12, marginTop: 16 }}>
        <Skeleton width="100%" height={56} borderRadius={12} />
        <Skeleton width="100%" height={56} borderRadius={12} />
        <Skeleton width="100%" height={56} borderRadius={12} />
      </View>
    </View>
  );
};

/* Basket / Cart Skeleton */
export const BasketSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Delivery address banner */}
      <Skeleton width="100%" height={70} borderRadius={16} style={{ marginBottom: 12 }} />
      {/* Cart items */}
      <View style={styles.listSkeleton}>
        <Skeleton width={80} height={80} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="35%" height={14} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      <View style={styles.listSkeleton}>
        <Skeleton width={80} height={80} borderRadius={12} />
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width="70%" height={16} />
          <Skeleton width="40%" height={14} />
          <Skeleton width="45%" height={12} />
        </View>
      </View>
      {/* Bill summary & CTA */}
      <Skeleton width="100%" height={120} borderRadius={16} style={{ marginTop: 8 }} />
      <Skeleton width="100%" height={52} borderRadius={14} style={{ marginTop: 12 }} />
    </View>
  );
};

/* Live Tracking Skeleton */
export const LiveTrackingSkeleton: React.FC = () => {
  return <TrackingSkeleton />;
};

/* Invoice Skeleton */
export const InvoiceSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.rowBetween, { marginBottom: 16 }]}>
        <Skeleton width="40%" height={24} />
        <Skeleton width={80} height={32} borderRadius={8} />
      </View>
      <Skeleton width="100%" height={140} borderRadius={14} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={200} borderRadius={14} style={{ marginBottom: 16 }} />
      <Skeleton width="100%" height={90} borderRadius={14} />
    </View>
  );
};

/* Trade Services Skeleton */
export const TradeServicesSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.horizontalRow}>
        <Skeleton width={110} height={32} borderRadius={16} />
        <Skeleton width={110} height={32} borderRadius={16} />
        <Skeleton width={110} height={32} borderRadius={16} />
      </View>
      <Skeleton width="100%" height={160} borderRadius={16} style={{ marginTop: 16 }} />
      <View style={[styles.gridRow, { marginTop: 16 }]}>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </View>
    </View>
  );
};

/* Order History Skeleton */
export const OrderHistorySkeleton: React.FC = () => {
  return <OrdersSkeleton />;
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 12,
    overflow: 'hidden',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  listSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  gridSkeleton: {
    marginBottom: 16,
  },
});
