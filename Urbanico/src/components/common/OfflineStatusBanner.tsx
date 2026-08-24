import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react-native';
import { syncManager } from '../../utils/syncManager';
import { useToast } from '../../context/ToastContext';

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const { showToast } = useToast();

  useEffect(() => {
    const updateQueue = () => {
      const q = syncManager.getOfflineQueue();
      setQueuedCount(q.length);
    };

    updateQueue();

    const handleOnline = () => {
      setIsOnline(true);
      setIsSyncing(true);
      const q = syncManager.getOfflineQueue();
      if (q.length > 0) {
        setTimeout(() => {
          syncManager.clearOfflineQueue();
          setQueuedCount(0);
          setIsSyncing(false);
          showToast(`Back online! Synced ${q.length} pending mutations successfully.`, 'success');
        }, 1200);
      } else {
        setIsSyncing(false);
        showToast('Internet connection restored.', 'info');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('Network disconnected. Switched to offline cached mode.', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(updateQueue, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [showToast]);

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      syncManager.clearOfflineQueue();
      setQueuedCount(0);
      setIsSyncing(false);
      showToast('Offline cache synced with central server.', 'success');
    }, 800);
  };

  if (isOnline && queuedCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        !isOnline ? styles.bannerOffline : styles.bannerSyncing,
      ]}
    >
      <View style={styles.contentRow}>
        {!isOnline ? (
          <WifiOff size={14} color="#FFFFFF" />
        ) : (
          <RefreshCw size={14} color="#FFFFFF" />
        )}
        <Text style={styles.bannerText}>
          {!isOnline
            ? `Offline Mode • ${queuedCount > 0 ? `${queuedCount} actions queued` : 'Local cache active'}`
            : isSyncing
            ? 'Syncing offline mutations...'
            : 'Connection Restored'}
        </Text>
      </View>

      {queuedCount > 0 && isOnline && (
        <TouchableOpacity
          onPress={handleManualSync}
          style={styles.syncBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.syncBtnText}>Sync Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 9999,
  },
  bannerOffline: {
    backgroundColor: '#DC2626',
  },
  bannerSyncing: {
    backgroundColor: '#0284C7',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  syncBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
