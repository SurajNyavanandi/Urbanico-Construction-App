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
  Platform,
} from 'react-native';
import { ImageIcon, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import {
  getOptimizedImageUrl,
  getBlurUpPlaceholderUrl,
  imageCache,
  ImageOptimizationOptions,
  ImageSizePreset,
} from '../../utils/imageOptimization';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

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
  lazy?: boolean;
  enableBlurUp?: boolean;
  rootMargin?: string;
  fallbackIconSize?: number;
  showFallbackOnMissing?: boolean;
  showRetryOnError?: boolean;
  recyclingKey?: string;
  onLoad?: (e?: any) => void;
  onError?: (e?: any) => void;
}

const ShimmerImageComponent: React.FC<ShimmerImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  contentFit,
  aspectRatio,
  borderRadius = 0,
  preset,
  optimizationOptions,
  priority = 'normal',
  lazy = true,
  enableBlurUp = true,
  rootMargin = '200px 0px',
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

  // Compute optimized Cloudinary URL (with f_auto, q_auto:eco, w_...)
  const optimizedUri = useMemo(() => {
    if (!rawUri || typeof rawUri !== 'string') return null;
    return getOptimizedImageUrl(rawUri, optimizationOptions || preset);
  }, [rawUri, optimizationOptions, preset]);

  // Compute ultra-low-byte progressive blur-up placeholder URL
  const blurUpUri = useMemo(() => {
    if (!enableBlurUp || !rawUri || typeof rawUri !== 'string') return null;
    return getBlurUpPlaceholderUrl(rawUri);
  }, [enableBlurUp, rawUri]);

  // Check if image is already cached in memory
  const initiallyCached = useMemo(() => {
    if (!optimizedUri) return false;
    return imageCache.isCached(optimizedUri);
  }, [optimizedUri]);

  const isPriorityHigh = priority === 'high';
  const shouldLazyLoad = lazy && !isPriorityHigh && !initiallyCached;

  // Native Intersection Observer for viewport detection
  const [containerRef, isVisible] = useIntersectionObserver<any>({
    rootMargin,
    threshold: 0.01,
    triggerOnce: true,
    enabled: shouldLazyLoad,
  });

  const isEligibleToLoad = initiallyCached || isPriorityHigh || !shouldLazyLoad || isVisible;

  const [loaded, setLoaded] = useState<boolean>(initiallyCached);
  const [blurLoaded, setBlurLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Smooth Cross-Fade Animation from Blur-up placeholder to High-Res Image
  const highResFadeAnim = useRef(new Animated.Value(initiallyCached ? 1 : 0)).current;
  // Shimmer Pulse Animation
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  // Sync state if URI changes
  useEffect(() => {
    if (optimizedUri && imageCache.isCached(optimizedUri)) {
      setLoaded(true);
      setHasError(false);
      highResFadeAnim.setValue(1);
    } else if (rawUri) {
      setLoaded(false);
      setBlurLoaded(false);
      setHasError(false);
      highResFadeAnim.setValue(0);
    }
  }, [optimizedUri, rawUri, retryCount, highResFadeAnim]);

  // Shimmer pulse animation while loading
  useEffect(() => {
    if (!loaded && !hasError) {
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.65,
            duration: 650,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.25,
            duration: 650,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
      return () => pulseLoop.stop();
    }
  }, [loaded, hasError, pulseAnim]);

  const handleHighResLoad = (e: any) => {
    if (optimizedUri) {
      imageCache.markCached(optimizedUri);
    }
    setLoaded(true);
    setHasError(false);

    // Smooth 200ms cross-fade into crisp resolution
    Animated.timing(highResFadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();

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
    setBlurLoaded(false);
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
        ref={containerRef as any}
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
            <RefreshCw size={12} color="#18181B" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const finalSourceUri = optimizedUri || rawUri;

  return (
    <View
      ref={containerRef as any}
      style={[
        styles.container,
        { borderRadius },
        aspectRatio ? { aspectRatio } : null,
        style,
      ]}
    >
      {/* 1. Shimmer Wave Placeholder while unobserved or loading initial bytes */}
      {(!loaded && !blurLoaded) && (
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

      {/* 2. Progressive Blur-Up Micro Placeholder (LQIP) */}
      {blurUpUri && isEligibleToLoad && !loaded && (
        <RNImage
          source={{ uri: blurUpUri }}
          resizeMode={finalResizeMode}
          onLoad={() => setBlurLoaded(true)}
          style={[
            styles.blurImage,
            {
              borderRadius,
              opacity: blurLoaded ? 0.95 : 0,
              ...(Platform.OS === 'web'
                ? {
                    filter: 'blur(10px)',
                    transform: 'scale(1.05)',
                    objectFit: finalResizeMode,
                  }
                : {}),
            },
          ]}
        />
      )}

      {/* 3. High-Fidelity Crisp Image with Smooth Cross-Fade */}
      {isEligibleToLoad && (
        <AnimatedView
          style={[
            StyleSheet.absoluteFill,
            {
              opacity: highResFadeAnim,
              borderRadius,
            },
          ]}
        >
          <RNImage
            source={{
              uri: finalSourceUri
                ? `${finalSourceUri}${retryCount > 0 ? `?retry=${retryCount}` : ''}`
                : undefined,
            }}
            resizeMode={finalResizeMode}
            style={[
              styles.image,
              {
                borderRadius,
                ...(Platform.OS === 'web' ? { objectFit: finalResizeMode } : {}),
              },
            ]}
            onLoad={handleHighResLoad}
            onError={handleError}
            // @ts-ignore Web specific attributes
            loading={isPriorityHigh ? 'eager' : 'lazy'}
            decoding="async"
          />
        </AnimatedView>
      )}
    </View>
  );
};

export const ShimmerImage = React.memo(ShimmerImageComponent);

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
  blurImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCB026',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    gap: 4,
  },
  retryText: {
    color: '#18181B',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default ShimmerImage;
