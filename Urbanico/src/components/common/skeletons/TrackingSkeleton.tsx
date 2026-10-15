import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonItem } from './SkeletonItem';

export const TrackingSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Live Map Viewport Placeholder */}
      <View style={styles.mapContainer}>
        <SkeletonItem width="100%" height={240} borderRadius={20} />
        {/* Floating ETA badge simulation */}
        <View style={styles.floatingEtaBadge}>
          <SkeletonItem width={120} height={32} borderRadius={16} />
        </View>
      </View>

      {/* Driver & Transit Card */}
      <View style={styles.driverCard}>
        <View style={styles.rowBetween}>
          <View style={styles.driverProfile}>
            <SkeletonItem width={48} height={48} borderRadius={24} />
            <View style={{ gap: 4 }}>
              <SkeletonItem width={110} height={16} borderRadius={5} />
              <SkeletonItem width={80} height={12} borderRadius={4} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <SkeletonItem width={38} height={38} borderRadius={19} />
            <SkeletonItem width={38} height={38} borderRadius={19} />
          </View>
        </View>

        {/* Vehicle & Dispatch Details */}
        <View style={[styles.rowBetween, { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' }]}>
          <SkeletonItem width={130} height={14} borderRadius={4} />
          <SkeletonItem width={90} height={14} borderRadius={4} />
        </View>
      </View>

      {/* Timeline Nodes & Status Milestones */}
      <View style={styles.timelineCard}>
        <SkeletonItem width={140} height={18} borderRadius={6} style={{ marginBottom: 16 }} />

        {/* Milestone Stage 1 */}
        <View style={styles.milestoneRow}>
          <View style={styles.nodeColumn}>
            <SkeletonItem width={24} height={24} borderRadius={12} />
            <View style={styles.connectingLine} />
          </View>
          <View style={styles.milestoneContent}>
            <View style={styles.rowBetween}>
              <SkeletonItem width="55%" height={16} borderRadius={5} />
              <SkeletonItem width={60} height={14} borderRadius={4} />
            </View>
            <SkeletonItem width="75%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>

        {/* Milestone Stage 2 */}
        <View style={styles.milestoneRow}>
          <View style={styles.nodeColumn}>
            <SkeletonItem width={24} height={24} borderRadius={12} />
            <View style={styles.connectingLine} />
          </View>
          <View style={styles.milestoneContent}>
            <View style={styles.rowBetween}>
              <SkeletonItem width="50%" height={16} borderRadius={5} />
              <SkeletonItem width={60} height={14} borderRadius={4} />
            </View>
            <SkeletonItem width="70%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>

        {/* Milestone Stage 3 */}
        <View style={styles.milestoneRow}>
          <View style={styles.nodeColumn}>
            <SkeletonItem width={24} height={24} borderRadius={12} />
          </View>
          <View style={styles.milestoneContent}>
            <View style={styles.rowBetween}>
              <SkeletonItem width="60%" height={16} borderRadius={5} />
              <SkeletonItem width={60} height={14} borderRadius={4} />
            </View>
            <SkeletonItem width="65%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
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
  mapContainer: {
    position: 'relative',
    width: '100%',
  },
  floatingEtaBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  driverCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
  },
  driverProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timelineCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    backgroundColor: '#FFFFFF',
  },
  milestoneRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 24,
  },
  connectingLine: {
    width: 2,
    height: 38,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 4,
  },
  milestoneContent: {
    flex: 1,
    paddingBottom: 14,
  },
});

export default TrackingSkeleton;
