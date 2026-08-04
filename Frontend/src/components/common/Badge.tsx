import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          bg: theme.surfaceSecondary,
          text: theme.textSecondary,
          border: theme.border,
        };
      case 'accent':
        return {
          bg: '#FEF3C7',
          text: '#B45309',
          border: '#FDE68A',
        };
      case 'outline':
        return {
          bg: 'transparent',
          text: theme.primary,
          border: theme.primary,
        };
      case 'primary':
      default:
        return {
          bg: theme.primaryLight,
          text: theme.primaryDark,
          border: 'transparent',
        };
    }
  };

  const vStyle = getVariantStyle();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyle.bg,
          borderColor: vStyle.border,
          borderWidth: variant === 'outline' || variant === 'secondary' ? 1 : 0,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: vStyle.text }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
