import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';

export interface BottomListLoaderProps {
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

/**
 * BottomListLoader
 * 60 FPS hardware-accelerated bottom circular loader for seamless infinite scroll feeds.
 * Uses an IntersectionObserver sentinel (280px threshold) to auto-trigger next batch of products
 * before the user hits the bottom, rendering a sleek amber spinner while loading.
 */
export const BottomListLoader: React.FC<BottomListLoaderProps> = ({
  isLoading,
  hasMore,
  onLoadMore,
}) => {
  const { themeMode } = useTheme();
  const isDark = themeMode === 'dark';
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Auto-trigger loadMore when approaching viewport edge (280px margin)
  useEffect(() => {
    if (!hasMore || Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first && first.isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: '280px 0px',
        threshold: 0.01,
      }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [hasMore, onLoadMore]);

  if (!hasMore && !isLoading) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Invisible intersection sentinel */}
      {Platform.OS === 'web' && (
        <div ref={sentinelRef} style={{ width: '100%', height: 1, pointerEvents: 'none' }} />
      )}

      {/* Sleek, never-freeze 60FPS circular spinner */}
      <View style={styles.spinnerContainer}>
        <div
          className="urbanico-gpu-spinner"
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'urbanico-never-freeze-spin 0.8s linear infinite',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32">
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke={isDark ? '#27272A' : '#E2E8F0'}
              strokeWidth="3"
              fill="none"
            />
            <circle
              cx="16"
              cy="16"
              r="12"
              stroke="#FCB026"
              strokeWidth="3"
              strokeDasharray="26 50"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
});

export default BottomListLoader;
