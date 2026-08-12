import React, { useEffect, useRef } from 'react';
import { View, Animated, Text, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onDismiss?: () => void;
  duration?: number;
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'success',
  onDismiss,
  duration = 3000,
  style,
}) => {
  const { theme, typography } = useTheme();
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: false,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      dismiss();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  let bg = theme.mode === 'dark' ? '#18181B' : '#000000';
  let IconComp = CheckCircle2;
  let iconColor = '#FFFFFF';

  if (type === 'error') {
    bg = '#18181B';
    IconComp = AlertCircle;
    iconColor = '#EF4444';
  } else if (type === 'info') {
    bg = theme.mode === 'dark' ? '#18181B' : '#000000';
    IconComp = Info;
    iconColor = '#FFFFFF';
  }

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        styles.toastWrapper,
        style,
      ]}
    >
      <AnimatedView
        style={[
          styles.toastContainer,
          {
            backgroundColor: bg,
            borderColor: theme.mode === 'dark' ? '#27272A' : '#18181B',
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <IconComp size={16} color={iconColor} />
        <Text
          style={[
            styles.toastText,
            { fontFamily: typography.fontFamilyHeading },
          ]}
          numberOfLines={2}
        >
          {message}
        </Text>
      </AnimatedView>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
    pointerEvents: 'box-none',
  },
  toastContainer: {
    maxWidth: 420,
    width: '90%',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
