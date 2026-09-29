import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonItem } from './SkeletonItem';

export interface CatalogSkeletonProps {
  viewMode?: 'grid' | 'list';
  itemCount?: number;
}

export const CatalogSkeletonCard: React.FC<{ viewMode?: 'grid' | 'list' }> = ({
  viewMode = 'grid',
}) => {
  if (viewMode === 'list') {
    return (
      <View style={styles.listCard}>
        <SkeletonItem width={90} height={90} borderRadius={14} />
        <View style={styles.listContent}>
          <SkeletonItem width="40%" height={12} borderRadius={4} />
          <SkeletonItem width="85%" height={16} borderRadius={6} style={{ marginTop: 4 }} />
          <View style={styles.rowBetween}>
            <SkeletonItem width="35%" height={16} borderRadius={6} />
            <SkeletonItem width={70} height={28} borderRadius={14} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.gridCard}>
      {/* Thumbnail placeholder */}
      <SkeletonItem width="100%" height={136} borderRadius={14} />
      {/* Tag & Category */}
      <View style={{ marginTop: 10, gap: 6 }}>
        <SkeletonItem width="50%" height={12} borderRadius={4} />
        <SkeletonItem width="90%" height={15} borderRadius={6} />
        <SkeletonItem width="65%" height={13} borderRadius={6} />
      </View>
      {/* Pricing Bar */}
      <View style={[styles.rowBetween, { marginTop: 12 }]}>
        <SkeletonItem width="45%" height={18} borderRadius={6} />
        <SkeletonItem width={36} height={36} borderRadius={18} />
      </View>
    </View>
  );
};

export const CatalogSkeleton: React.FC<CatalogSkeletonProps> = ({
  viewMode = 'grid',
  itemCount = 6,
}) => {
  const items = Array.from({ length: itemCount });

  return (
    <View style={styles.container}>
      {/* Top Filter & Category Tabs Skeleton */}
      <View style={styles.headerTabs}>
        <SkeletonItem width={84} height={32} borderRadius={16} />
        <SkeletonItem width={100} height={32} borderRadius={16} />
        <SkeletonItem width={92} height={32} borderRadius={16} />
        <SkeletonItem width={88} height={32} borderRadius={16} />
      </View>

      {/* Sub-bar / Search & Sort */}
      <View style={[styles.rowBetween, { marginTop: 14, marginBottom: 14 }]}>
        <SkeletonItem width={120} height={16} borderRadius={6} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SkeletonItem width={36} height={32} borderRadius={8} />
          <SkeletonItem width={36} height={32} borderRadius={8} />
        </View>
      </View>

      {/* Catalog Items Grid / List */}
      {viewMode === 'list' ? (
        <View style={styles.listContainer}>
          {items.map((_, i) => (
            <CatalogSkeletonCard key={i} viewMode="list" />
          ))}
        </View>
      ) : (
        <View style={styles.gridContainer}>
          {items.map((_, i) => (
            <CatalogSkeletonCard key={i} viewMode="grid" />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%',
  },
  headerTabs: {
    flexDirection: 'row',
    gap: 10,
    overflow: 'hidden',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: '#FFFFFF',
    marginBottom: 4,
  },
  listContainer: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  listContent: {
    flex: 1,
    gap: 6,
  },
});

export default CatalogSkeleton;
