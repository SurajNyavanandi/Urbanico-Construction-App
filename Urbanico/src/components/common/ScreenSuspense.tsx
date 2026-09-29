import React, { Suspense, useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { ScreenSkeletonLoader, ScreenSkeletonType } from './ScreenSkeletonLoader';

export interface ScreenSuspenseProps {
  children: React.ReactNode;
  type?: ScreenSkeletonType;
  fallback?: React.ReactNode;
  style?: ViewStyle;
}

/**
 * FadeInContent performs a smooth fade-in animation once the chunk has loaded
 */
const FadeInContent: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({
  children,
  style,
}) => {
  const fadeAnim = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView style={[{ flex: 1, opacity: fadeAnim }, style]}>
      {children}
    </AnimatedView>
  );
};

/**
 * ScreenSuspense: A lightweight wrapper for React.Suspense
 * providing instant screen-specific skeleton loaders and buttery fade-in
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
