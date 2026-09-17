import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface ScreenSkeletonLoaderProps {
  type?: 'home' | 'catalog' | 'cart' | 'profile' | 'detail';
}

export const ScreenSkeletonLoader: React.FC<ScreenSkeletonLoaderProps> = ({ type = 'home' }) => {
  const { theme } = useTheme();

  const isDark = theme.mode === 'dark';
  const shimmerBg = isDark ? '#1E293B' : '#E2E8F0';
  const cardBg = isDark ? '#0F172A' : '#FFFFFF';

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Top Header Placeholder */}
      <View style={[styles.headerBar, { backgroundColor: cardBg, borderColor: theme.border }]}>
        <View style={[styles.skeletonPill, { width: 120, height: 28, backgroundColor: shimmerBg }]} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={[styles.skeletonCircle, { width: 32, height: 32, backgroundColor: shimmerBg }]} />
          <View style={[styles.skeletonCircle, { width: 32, height: 32, backgroundColor: shimmerBg }]} />
        </View>
      </View>

      {/* Hero / Banner Skeleton */}
      <View style={[styles.heroSkeleton, { backgroundColor: shimmerBg }]} />

      {/* Categories Row Skeleton */}
      <View style={styles.categoryRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.categoryItem}>
            <View style={[styles.skeletonCircle, { width: 48, height: 48, backgroundColor: shimmerBg }]} />
            <View style={[styles.skeletonPill, { width: 44, height: 10, marginTop: 6, backgroundColor: shimmerBg }]} />
          </View>
        ))}
      </View>

      {/* Product Cards Grid Skeleton */}
      <View style={styles.gridContainer}>
        {[1, 2, 3, 4].map((i) => (
          <View
            key={i}
            style={[
              styles.productCardSkeleton,
              { backgroundColor: cardBg, borderColor: theme.border },
            ]}
          >
            <View style={[styles.cardImageSkeleton, { backgroundColor: shimmerBg }]} />
            <View style={{ padding: 10, gap: 6 }}>
              <View style={[styles.skeletonPill, { width: '80%', height: 12, backgroundColor: shimmerBg }]} />
              <View style={[styles.skeletonPill, { width: '50%', height: 10, backgroundColor: shimmerBg }]} />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <View style={[styles.skeletonPill, { width: 60, height: 14, backgroundColor: shimmerBg }]} />
                <View style={[styles.skeletonPill, { width: 48, height: 24, borderRadius: 6, backgroundColor: shimmerBg }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  heroSkeleton: {
    height: 140,
    borderRadius: 14,
    marginBottom: 14,
    opacity: 0.8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  categoryItem: {
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  productCardSkeleton: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  cardImageSkeleton: {
    width: '100%',
    height: 110,
  },
  skeletonPill: {
    borderRadius: 6,
    opacity: 0.7,
  },
  skeletonCircle: {
    borderRadius: 999,
    opacity: 0.7,
  },
});
