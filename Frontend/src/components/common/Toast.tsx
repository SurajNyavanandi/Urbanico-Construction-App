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

  let bg = '#16A34A';
  let IconComp = CheckCircle2;

  if (type === 'error') {
    bg = '#DC2626';
    IconComp = AlertCircle;
  } else if (type === 'info') {
    bg = theme.mode === 'dark' ? '#334155' : '#0F172A';
    IconComp = Info;
  }

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        styles.toastContainer,
        {
          backgroundColor: bg,
          transform: [{ translateY }],
          opacity,
        },
        style,
      ]}
    >
      <IconComp size={18} color="#FFFFFF" />
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
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
