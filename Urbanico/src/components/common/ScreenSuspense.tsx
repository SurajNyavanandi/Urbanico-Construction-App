import React, { Suspense, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle, Platform } from 'react-native';
import { ScreenSkeletonLoader, ScreenSkeletonType } from './ScreenSkeletonLoader';

export interface ScreenSuspenseProps {
  children: React.ReactNode;
  type?: ScreenSkeletonType;
  fallback?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * FadeInContent performs an ultra-smooth 250ms cross-fade transition
 * when screen chunks finish loading, eliminating any flash of unstyled content.
 */
const FadeInContent: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        {
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      {children}
    </AnimatedView>
  );
};

/**
 * ScreenSuspense: A lightweight wrapper for React.Suspense
 * providing instant screen-specific loaders and buttery 250ms fade-in
 * transitions on chunk resolution without layout shifts.
 */
export const ScreenSuspense: React.FC<ScreenSuspenseProps> = ({
  children,
  type = 'home',
  fallback,
  style,
}) => {
  const fallbackElement = fallback || <ScreenSkeletonLoader type={type} />;

  return (
    <Suspense fallback={fallbackElement}>
      <FadeInContent style={style}>{children}</FadeInContent>
    </Suspense>
  );
};

export default ScreenSuspense;
