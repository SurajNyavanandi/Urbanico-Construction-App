import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import {
  Check,
  AlertCircle,
  Info,
  Heart,
  Bell,
  X,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'favorite';

export interface ToastProps {
  visible: boolean;
  message: string;
  title?: string;
  type?: ToastType;
  onDismiss?: () => void;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  title,
  type = 'success',
  onDismiss,
  duration = 3800,
  actionLabel,
  onAction,
  style,
}) => {
  const { theme, typography } = useTheme();
  // Starts above the screen (-60) to glide in from the top
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (visible) {
      translateY.setValue(-60);
      opacity.setValue(0);
      scale.setValue(0.92);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 7,
          tension: 80,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();

      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      handleDismiss();
    }
  }, [visible, message]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -50,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 180,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible) return null;

  // Determine icon & headline based on message content and type
  const lowerMsg = (message || '').toLowerCase();
  let defaultTitle = 'Notification';
  let IconComponent = Info;
  let iconColor = theme.primary;
  let badgeColor = theme.primary;
  let BadgeIcon = Check;

  if (type === 'favorite' || lowerMsg.includes('favorite') || lowerMsg.includes('favourite')) {
    defaultTitle = lowerMsg.includes('removed') ? 'Favorites Updated' : 'Saved to Favorites';
    IconComponent = Heart;
    iconColor = '#EF4444';
    badgeColor = '#EF4444';
    BadgeIcon = Heart;
  } else if (lowerMsg.includes('cart') || lowerMsg.includes('basket') || lowerMsg.includes('saved for later')) {
    defaultTitle = lowerMsg.includes('removed') ? 'Cart Updated' : 'Cart';
    IconComponent = ShoppingBag;
    iconColor = theme.primary;
    badgeColor = theme.primary;
    BadgeIcon = Check;
  } else if (type === 'error' || lowerMsg.includes('error') || lowerMsg.includes('failed')) {
    defaultTitle = 'Notice';
    IconComponent = AlertCircle;
    iconColor = '#EF4444';
    badgeColor = '#EF4444';
    BadgeIcon = AlertCircle;
  } else if (type === 'success') {
    defaultTitle = 'Success';
    IconComponent = Check;
    iconColor = '#10B981';
    badgeColor = '#10B981';
    BadgeIcon = Check;
  } else {
    defaultTitle = 'Urbanico Update';
    IconComponent = Bell;
    iconColor = theme.primary;
    badgeColor = '#10B981';
    BadgeIcon = Check;
  }

  const displayTitle = title || defaultTitle;
  const AnimatedView = Animated.View as any;

  return (
    <View style={[styles.topOverlay, style, { pointerEvents: 'box-none' as any }]}>
      <AnimatedView
        style={[
          styles.toastCard,
          {
            backgroundColor: theme.mode === 'dark' ? '#18181B' : '#FFFFFF',
            borderColor: theme.mode === 'dark' ? '#27272A' : '#E5E7EB',
            
            transform: [{ translateY }, { scale }],
            opacity,
          },
        ]}
      >
        {/* Left: Icon Thumbnail with small badge - matching AddToCartToast format */}
        <View style={styles.imageCol}>
          <View
            style={[
              styles.thumbnailWrapper,
              {
                backgroundColor: theme.mode === 'dark' ? '#27272A' : '#F4F4F5',
                borderColor: theme.border,
              },
            ]}
          >
            <IconComponent size={20} color={iconColor} strokeWidth={2.2} />
          </View>
          <View style={[styles.successBadge, { backgroundColor: badgeColor }]}>
            <BadgeIcon size={9} color="#FFFFFF" strokeWidth={3} />
          </View>
        </View>

        {/* Center: Details */}
        <View style={styles.contentCol}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.headline,
                { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
              ]}
            >
              {displayTitle}
            </Text>
          </View>

          <Text
            style={[styles.itemName, { color: theme.textPrimary }]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>

        {/* Right: Optional Action CTA + Dismiss */}
        <View style={styles.actionsCol}>
          {actionLabel && onAction ? (
            <TouchableOpacity
              onPress={() => {
                handleDismiss();
                onAction();
              }}
              activeOpacity={0.85}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: theme.mode === 'dark' ? '#FFFFFF' : '#1D1D1F',
                },
              ]}
            >
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: theme.mode === 'dark' ? '#000000' : '#FFFFFF',
                    fontFamily: typography.fontFamilyHeading,
                  },
                ]}
              >
                {actionLabel}
              </Text>
              <ArrowRight
                size={12}
                color={theme.mode === 'dark' ? '#000000' : '#FFFFFF'}
                strokeWidth={2.5}
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handleDismiss}
            activeOpacity={0.6}
            style={styles.closeBtn}
          >
            <X size={14} color={theme.textMuted} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </AnimatedView>
    </View>
  );
};

const styles = StyleSheet.create({
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 18 : 28,
    left: 0,
    right: 0,
    zIndex: 999999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  toastCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    boxShadow: '0px 8px 18px rgba(0, 0, 0, 0.18)',
    elevation: 14,
  },
  imageCol: {
    position: 'relative',
  },
  thumbnailWrapper: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  contentCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headline: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 17,
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 999,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  closeBtn: {
    padding: 4,
  },
});
