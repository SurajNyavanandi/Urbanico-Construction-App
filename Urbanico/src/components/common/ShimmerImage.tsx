import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Image as RNImage,
  Animated,
  StyleSheet,
  StyleProp,
  ViewStyle,
  ImageStyle,
  TouchableOpacity,
  Text,
} from 'react-native';
import { ImageIcon, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  getOptimizedImageUrl,
  imageCache,
  ImageOptimizationOptions,
  ImageSizePreset,
} from '../../utils/imageOptimization';

export interface ShimmerImageProps {
  source?: any;
  style?: StyleProp<ViewStyle | ImageStyle>;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
  contentFit?: 'cover' | 'contain' | 'fill' | 'none';
  aspectRatio?: number;
  borderRadius?: number;
  preset?: ImageSizePreset;
  optimizationOptions?: ImageOptimizationOptions;
  priority?: 'high' | 'normal' | 'low';
  fallbackIconSize?: number;
  showFallbackOnMissing?: boolean;
  showRetryOnError?: boolean;
  recyclingKey?: string;
  onLoad?: (e?: any) => void;
  onError?: (e?: any) => void;
}

export const ShimmerImage: React.FC<ShimmerImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  contentFit,
  aspectRatio,
  borderRadius = 0,
  preset,
  optimizationOptions,
  priority = 'normal',
  fallbackIconSize = 22,
  showFallbackOnMissing = true,
  showRetryOnError = false,
  onLoad: externalOnLoad,
  onError: externalOnError,
}) => {
  const { theme } = useTheme();

  // Extract raw URI
  const rawUri = useMemo(() => {
    if (!source) return null;
    if (typeof source === 'string') return source;
    if (typeof source === 'object' && 'uri' in source) return (source as any).uri;
    return null;
  }, [source]);

  // Compute optimized Cloudinary URL
  const optimizedUri = useMemo(() => {
    if (!rawUri || typeof rawUri !== 'string') return null;
    return getOptimizedImageUrl(rawUri, optimizationOptions || preset);
  }, [rawUri, optimizationOptions, preset]);

  // Check if image is already cached in memory
  const initiallyCached = useMemo(() => {
    if (!optimizedUri) return false;
    return imageCache.isCached(optimizedUri);
  }, [optimizedUri]);

  const [loaded, setLoaded] = useState<boolean>(initiallyCached);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Pulse animation for placeholder shimmer
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // Sync state if URI changes
  useEffect(() => {
    if (optimizedUri && imageCache.isCached(optimizedUri)) {
      setLoaded(true);
      setHasError(false);
    } else if (rawUri) {
      setLoaded(false);
      setHasError(false);
    }
  }, [optimizedUri, rawUri, retryCount]);

  // Shimmer pulse animation while loading
  useEffect(() => {
    if (!loaded && !hasError) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.65,
            duration: 600,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.25,
            duration: 600,
            useNativeDriver: false,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [loaded, hasError, pulseAnim]);

  const handleLoad = (e: any) => {
    if (optimizedUri) {
      imageCache.markCached(optimizedUri);
    }
    setLoaded(true);
    setHasError(false);

    if (externalOnLoad) {
      externalOnLoad(e);
    }
  };

  const handleError = (e: any) => {
    setHasError(true);
    setLoaded(true);
    if (externalOnError) {
      externalOnError(e);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setLoaded(false);
    setRetryCount((prev) => prev + 1);
  };

  // Convert contentFit to resizeMode
  const finalResizeMode: 'cover' | 'contain' | 'stretch' | 'center' = useMemo(() => {
    if (resizeMode) return resizeMode;
    if (contentFit === 'contain') return 'contain';
    if (contentFit === 'fill') return 'stretch';
    if (contentFit === 'none') return 'center';
    return 'cover';
  }, [contentFit, resizeMode]);

  const skeletonBg = theme.mode === 'dark' ? '#27272A' : '#E2E8F0';
  const AnimatedView = Animated.View as any;

  // Missing or Error Fallback
  if ((!rawUri && !source) || hasError) {
    if (!showFallbackOnMissing) {
      return null;
    }
    return (
      <View
        style={[
          styles.container,
          {
            borderRadius,
            backgroundColor: theme.surfaceSecondary || (theme.mode === 'dark' ? '#1E1E22' : '#F4F4F5'),
            alignItems: 'center',
            justifyContent: 'center',
          },
          aspectRatio ? { aspectRatio } : null,
          style,
        ]}
      >
        <ImageIcon size={fallbackIconSize} color={theme.textMuted || '#94A3B8'} />
        {showRetryOnError && hasError && (
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.retryBtn}
            activeOpacity={0.7}
          >
            <RefreshCw size={12} color="#FFFFFF" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const finalSourceUri = optimizedUri || rawUri;

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        aspectRatio ? { aspectRatio } : null,
        style,
      ]}
    >
      {/* Lightweight Shimmer Placeholder before download */}
      {!loaded && (
        <AnimatedView
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: skeletonBg,
              opacity: pulseAnim,
              borderRadius,
            },
          ]}
        />
      )}

      {/* Universal Web & Native Compatible Image */}
      <RNImage
        source={{
          uri: finalSourceUri ? `${finalSourceUri}${retryCount > 0 ? `?retry=${retryCount}` : ''}` : undefined,
        }}
        resizeMode={finalResizeMode}
        style={[
          styles.image,
          {
            borderRadius,
            opacity: loaded ? 1 : 0.99,
          },
        ]}
        onLoad={handleLoad}
        onError={handleError}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
