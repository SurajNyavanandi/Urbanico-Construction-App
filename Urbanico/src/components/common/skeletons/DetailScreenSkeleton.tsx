import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonItem } from './SkeletonItem';

export const DetailScreenSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Top Hero Image Banner */}
      <View style={styles.heroSection}>
        <SkeletonItem width="100%" height={260} borderRadius={20} />
      </View>

      {/* Brand & Badge row */}
      <View style={[styles.rowBetween, { marginTop: 18 }]}>
        <SkeletonItem width={90} height={24} borderRadius={12} />
        <SkeletonItem width={110} height={24} borderRadius={12} />
      </View>

      {/* Title & Rating */}
      <View style={{ marginTop: 12, gap: 8 }}>
        <SkeletonItem width="88%" height={26} borderRadius={8} />
        <SkeletonItem width="55%" height={16} borderRadius={6} />
      </View>

      {/* Pricing and Unit Selector */}
      <View style={styles.pricingCard}>
        <View style={styles.rowBetween}>
          <View style={{ gap: 6 }}>
            <SkeletonItem width={60} height={12} borderRadius={4} />
            <SkeletonItem width={120} height={24} borderRadius={6} />
          </View>
          <SkeletonItem width={90} height={36} borderRadius={18} />
        </View>
        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
          <SkeletonItem width={80} height={32} borderRadius={8} />
          <SkeletonItem width={80} height={32} borderRadius={8} />
          <SkeletonItem width={80} height={32} borderRadius={8} />
        </View>
      </View>

      {/* Technical Specifications List */}
      <View style={styles.specsCard}>
        <SkeletonItem width={140} height={18} borderRadius={6} style={{ marginBottom: 12 }} />
        <View style={{ gap: 10 }}>
          <View style={styles.rowBetween}>
            <SkeletonItem width="35%" height={14} borderRadius={4} />
            <SkeletonItem width="45%" height={14} borderRadius={4} />
          </View>
          <View style={styles.rowBetween}>
            <SkeletonItem width="30%" height={14} borderRadius={4} />
            <SkeletonItem width="40%" height={14} borderRadius={4} />
          </View>
          <View style={styles.rowBetween}>
            <SkeletonItem width="40%" height={14} borderRadius={4} />
            <SkeletonItem width="50%" height={14} borderRadius={4} />
          </View>
        </View>
      </View>

      {/* Bottom Sticky Action Bar Skeleton */}
      <View style={styles.bottomBar}>
        <SkeletonItem width={50} height={48} borderRadius={14} />
        <SkeletonItem width="40%" height={48} borderRadius={14} />
        <SkeletonItem width="40%" height={48} borderRadius={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    width: '100%',
  },
  heroSection: {
    width: '100%',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pricingCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
  },
  specsCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
  },
  bottomBar: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 10,
  },
});

export default DetailScreenSkeleton;
