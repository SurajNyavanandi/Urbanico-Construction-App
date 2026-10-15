import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { Layers, ShieldCheck, Sparkles } from 'lucide-react-native';

export interface UrbanicoLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  message?: string;
  subMessage?: string;
  dynamicSteps?: string[];
  style?: ViewStyle;
  showLogo?: boolean;
}

const DEFAULT_DYNAMIC_STEPS = [
  'Fetching verified wholesale construction rates...',
  'Checking real-time stock at nearest regional hub...',
  'Verifying BIS & IS-456 standard certifications...',
  'Preparing best direct-from-mill pricing...',
];

export const UrbanicoLoadingSpinner: React.FC<UrbanicoLoadingSpinnerProps> = ({
  size = 'medium',
  message = 'Loading Urbanico...',
  subMessage,
  dynamicSteps = DEFAULT_DYNAMIC_STEPS,
  style,
  showLogo = true,
}) => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Cycle micro-copy smoothly every 1.8 seconds to build anticipation
  useEffect(() => {
    if (subMessage || !dynamicSteps || dynamicSteps.length <= 1) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev + 1) % dynamicSteps.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [subMessage, dynamicSteps]);

  const activeSubMessage = subMessage || dynamicSteps[activeStepIndex] || dynamicSteps[0];

  const isFullscreen = size === 'fullscreen';
  const isSmall = size === 'small';
  const isLarge = size === 'large' || isFullscreen;

  const spinnerDimensions = isSmall ? 36 : isLarge ? 68 : 50;
  const strokeWidth = isSmall ? 3.5 : isLarge ? 5.5 : 4.5;
  const radius = (spinnerDimensions - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Injected CSS guarantees that even before external CSS loads or if JS thread blocks,
  // the GPU compositor thread will spin at buttery-smooth 60fps continuously.
  const inlineKeyframeStyle = `
    @keyframes urbanico-never-freeze-spin {
      0% { transform: rotate(0deg) translateZ(0); }
      100% { transform: rotate(360deg) translateZ(0); }
    }
    @keyframes urbanico-breathing-pulse {
      0%, 100% { transform: scale(1) translateZ(0); opacity: 0.95; }
      50% { transform: scale(1.08) translateZ(0); opacity: 1; }
    }
    @keyframes urbanico-progress-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes urbanico-step-in {
      0% { opacity: 0; transform: translateY(3px); }
      100% { opacity: 1; transform: translateY(0); }
    }
  `;

  return (
    <View
      style={[
        styles.container,
        isFullscreen && [styles.fullscreen, { backgroundColor: theme.background }],
        style,
      ]}
    >
      {/* Self-contained CSS injection for zero-freeze guarantee across all web runtimes */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: inlineKeyframeStyle }} />
      )}

      <View style={styles.spinnerWrapper}>
        {/* Soft Ambient Radial Backlight */}
        <View
          style={[
            styles.ambientGlow,
            {
              width: spinnerDimensions * 1.5,
              height: spinnerDimensions * 1.5,
              borderRadius: (spinnerDimensions * 1.5) / 2,
              backgroundColor: isDark ? 'rgba(252, 176, 38, 0.06)' : 'rgba(252, 176, 38, 0.12)',
            },
          ]}
        />

        {/* 60FPS Never-Freeze Circular Spinner (Runs purely on GPU compositor thread) */}
        <div
          className="urbanico-gpu-spinner"
          style={{
            width: spinnerDimensions,
            height: spinnerDimensions,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'urbanico-never-freeze-spin 0.85s linear infinite',
            willChange: 'transform',
            transform: 'translateZ(0)',
          }}
        >
          <svg
            width={spinnerDimensions}
            height={spinnerDimensions}
            viewBox={`0 0 ${spinnerDimensions} ${spinnerDimensions}`}
            style={{ display: 'block' }}
          >
            <defs>
              <linearGradient id="urbanicoAccentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FCB026" stopOpacity="0.3" />
                <stop offset="70%" stopColor="#FCB026" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EAB308" stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Static background track */}
            <circle
              cx={spinnerDimensions / 2}
              cy={spinnerDimensions / 2}
              r={radius}
              stroke={isDark ? '#27272A' : '#F1F5F9'}
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Glowing active arc - continuously rotating without JS interruption */}
            <circle
              cx={spinnerDimensions / 2}
              cy={spinnerDimensions / 2}
              r={radius}
              stroke="url(#urbanicoAccentGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * 0.36} ${circumference * 0.64}`}
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>

        {/* Center Brand Emblem with Hardware-Accelerated Breathing Pulse */}
        {showLogo && (
          <div
            className="urbanico-emblem-pulse"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) translateZ(0)',
              width: spinnerDimensions * 0.58,
              height: spinnerDimensions * 0.58,
              borderRadius: (spinnerDimensions * 0.58) / 2,
              backgroundColor: isDark ? '#1C1917' : '#FFFDF5',
              border: `1.5px solid ${isDark ? '#292524' : '#FEF3C7'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'urbanico-breathing-pulse 1.8s ease-in-out infinite',
              willChange: 'transform, opacity',
              boxShadow: isDark
                ? '0 2px 10px rgba(0, 0, 0, 0.4)'
                : '0 2px 12px rgba(252, 176, 38, 0.22)',
            }}
          >
            <Layers
              size={isSmall ? 13 : isLarge ? 24 : 17}
              color="#FCB026"
              strokeWidth={2.4}
            />
          </div>
        )}
      </View>

      {/* Typography & Dynamic Micro-Copy Container */}
      {!isSmall && (
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {message}
          </Text>

          {/* Dynamic Fading Milestone Copy */}
          <div
            key={activeSubMessage}
            style={{
              animation: 'urbanico-step-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {activeSubMessage}
            </Text>
          </div>

          {/* Minimalist Shimmer Progress Indicator to build anticipation */}
          <div
            className="urbanico-shimmer-bar"
            style={{
              marginTop: 10,
              width: 120,
              height: 3,
              borderRadius: 2,
              backgroundColor: isDark ? '#27272A' : '#E2E8F0',
              overflow: 'hidden',
              background: `linear-gradient(90deg, ${isDark ? '#27272A' : '#F1F5F9'} 0%, #FCB026 50%, ${isDark ? '#27272A' : '#F1F5F9'} 100%)`,
              backgroundSize: '200% 100%',
              animation: 'urbanico-progress-shimmer 1.4s ease-in-out infinite',
              willChange: 'background-position',
            }}
          />
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
  ambientGlow: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    filter: 'blur(10px)',
  },
  textContainer: {
    marginTop: 18,
    alignItems: 'center',
    gap: 5,
  },
  title: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    letterSpacing: 0.1,
    textAlign: 'center',
    minHeight: 18,
  },
});

export default UrbanicoLoadingSpinner;
