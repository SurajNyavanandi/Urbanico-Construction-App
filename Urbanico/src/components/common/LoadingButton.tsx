import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'primary',
  style,
  textStyle,
  icon,
}) => {
  const { theme, typography } = useTheme();

  let bg = theme.primary;
  let textColor = '#FFFFFF';
  let borderWidth = 0;
  let borderColor = 'transparent';

  if (variant === 'secondary') {
    bg = theme.surfaceSecondary;
    textColor = theme.textPrimary;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textColor = theme.primary;
    borderWidth = 1.5;
    borderColor = theme.primary;
  } else if (variant === 'ghost') {
    bg = 'transparent';
    textColor = theme.textSecondary;
  }

  const isBtnDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isBtnDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        {
          backgroundColor: bg,
          borderWidth,
          borderColor,
          opacity: isBtnDisabled && !isLoading ? 0.5 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? '#FFFFFF' : theme.primary}
        />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              { color: textColor, fontFamily: typography.fontFamilyHeading },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
