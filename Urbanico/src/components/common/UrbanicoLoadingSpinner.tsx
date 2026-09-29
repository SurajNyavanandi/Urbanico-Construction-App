import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Layers } from 'lucide-react-native';

export interface UrbanicoLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  message?: string;
  subMessage?: string;
  style?: ViewStyle;
  showLogo?: boolean;
}

export const UrbanicoLoadingSpinner: React.FC<UrbanicoLoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading...',
  subMessage = 'Fetching verified construction rates',
  style,
  showLogo = true,
}) => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 360 degree continuous circular spin
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );

    // Subtle breathing pulse for brand emblem
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spinAnim, pulseAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const isFullscreen = size === 'fullscreen';
  const isSmall = size === 'small';
  const isLarge = size === 'large' || isFullscreen;

  const spinnerDimensions = isSmall ? 32 : isLarge ? 64 : 46;
  const strokeWidth = isSmall ? 3 : isLarge ? 5 : 4;
  const radius = (spinnerDimensions - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <View
      style={[
        styles.container,
        isFullscreen && [styles.fullscreen, { backgroundColor: theme.background }],
        style,
      ]}
    >
      <View style={styles.spinnerWrapper}>
        {/* Animated Outer Circular Ring (Amazon / Flipkart E-Commerce standard) */}
        <Animated.View
          style={[
            styles.ringContainer,
            {
              width: spinnerDimensions,
              height: spinnerDimensions,
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <svg
            width={spinnerDimensions}
            height={spinnerDimensions}
            viewBox={`0 0 ${spinnerDimensions} ${spinnerDimensions}`}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            {/* Background Track */}
            <circle
              cx={spinnerDimensions / 2}
              cy={spinnerDimensions / 2}
              r={radius}
              stroke={isDark ? '#27272A' : '#F1F5F9'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Spinning Accent Head */}
            <circle
              cx={spinnerDimensions / 2}
              cy={spinnerDimensions / 2}
              r={radius}
              stroke="#FCB026"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.35} ${circumference * 0.65}`}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </Animated.View>

        {/* Centered Brand Emblem Pulse */}
        {showLogo && (
          <Animated.View
            style={[
              styles.centerBadge,
              {
                width: spinnerDimensions * 0.6,
                height: spinnerDimensions * 0.6,
                borderRadius: (spinnerDimensions * 0.6) / 2,
                backgroundColor: isDark ? '#18181B' : '#FFF8EB',
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Layers size={isSmall ? 12 : isLarge ? 22 : 16} color="#FCB026" />
          </Animated.View>
        )}
      </View>

      {/* Typography Label */}
      {!isSmall && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {message}
          </Text>
          {subMessage ? (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {subMessage}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fullscreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  spinnerWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBadge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FCB026',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  textContainer: {
    marginTop: 16,
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

export default UrbanicoLoadingSpinner;
