import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

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
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const bg = theme.mode === 'dark' ? '#27272A' : '#E4E4E7';
  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: bg,
          opacity: pulseAnim,
        },
        style,
      ]}
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

/* Catalog Skeleton */
export const CatalogSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Top Nav Tabs */}
      <View style={styles.horizontalRow}>
        <Skeleton width={90} height={28} borderRadius={14} />
        <Skeleton width={90} height={28} borderRadius={14} />
        <Skeleton width={90} height={28} borderRadius={14} />
      </View>

      {/* Grid Cards */}
      <View style={[styles.gridRow, { marginTop: 20 }]}>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
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

/* Order History Skeleton */
export const OrderHistorySkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      <Skeleton width="100%" height={90} borderRadius={14} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={90} borderRadius={14} style={{ marginBottom: 12 }} />
      <Skeleton width="100%" height={90} borderRadius={14} style={{ marginBottom: 12 }} />
    </View>
  );
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
