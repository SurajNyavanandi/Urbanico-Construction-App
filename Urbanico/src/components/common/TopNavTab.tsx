import React, { useRef } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle, Animated, Platform } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TopNavTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  badgeCount?: number;
}

const TopNavTabComponent: React.FC<TopNavTabProps> = ({
  label,
  isActive,
  onPress,
  style,
  textStyle,
  badgeCount,
}) => {
  const { theme, typography } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const AnimatedView = Animated.View as any;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={[styles.tab, style]}
    >
      <AnimatedView style={{ transform: [{ scale: scaleAnim }] }}>
        <View style={styles.tabContentRow}>
          <Text
            style={[
              styles.text,
              {
                color: isActive ? theme.textPrimary : theme.textSecondary,
                fontFamily: typography.fontFamilyHeading,
                fontWeight: isActive ? '700' : '500',
              },
              textStyle,
            ]}
          >
            {label}
          </Text>
          {typeof badgeCount === 'number' && badgeCount > 0 ? (
            <View style={[styles.badge, { backgroundColor: isActive ? theme.primary : theme.surfaceSecondary }]}>
              <Text style={[styles.badgeText, { color: isActive ? (theme.primaryText || '#18181B') : theme.textSecondary }]}>
                {badgeCount}
              </Text>
            </View>
          ) : null}
        </View>
      </AnimatedView>
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );
};

export const TopNavTab = React.memo(TopNavTabComponent, (prev, next) => {
  return (
    prev.label === next.label &&
    prev.isActive === next.isActive &&
    prev.badgeCount === next.badgeCount &&
    prev.style === next.style &&
    prev.textStyle === next.textStyle
  );
});

const styles = StyleSheet.create({
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginRight: 20,
    alignItems: 'center',
    position: 'relative',
  },
  tabContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  text: {
    fontSize: 14,
    letterSpacing: -0.2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 2,
  },
});
