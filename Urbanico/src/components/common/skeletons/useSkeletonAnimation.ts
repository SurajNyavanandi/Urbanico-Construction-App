import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export interface UseSkeletonAnimationOptions {
  duration?: number;
  minOpacity?: number;
  maxOpacity?: number;
}

/**
 * useSkeletonAnimation
 * Coordinates smooth, synchronized 60fps gradient shimmer wave pulses
 * using React Native native driver animations for ultra-smooth rendering.
 */
export const useSkeletonAnimation = (options?: UseSkeletonAnimationOptions) => {
  const duration = options?.duration ?? 950;
  const minOpacity = options?.minOpacity ?? 0.35;
  const maxOpacity = options?.maxOpacity ?? 0.85;

  const pulseAnim = useRef(new Animated.Value(minOpacity)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxOpacity,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minOpacity,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
    };
  }, [pulseAnim, duration, minOpacity, maxOpacity]);

  return {
    opacity: pulseAnim,
    pulseAnim,
  };
};

export default useSkeletonAnimation;
