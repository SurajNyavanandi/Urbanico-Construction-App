import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Plus, Minus } from 'lucide-react-native';
import { AppText } from './AppText';
import { useTheme } from '../../context/ThemeContext';
import { soundService } from '../../utils/soundHelper';

export interface QuantityStepperProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined' | 'subtle';
  containerStyle?: ViewStyle;
  disabled?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 9999,
  size = 'md',
  variant = 'outlined',
  containerStyle,
  disabled = false,
}) => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const handleDec = () => {
    if (disabled || quantity <= min) return;
    soundService.playTap();
    onDecrement();
  };

  const handleInc = () => {
    if (disabled || quantity >= max) return;
    soundService.playTap();
    onIncrement();
  };

  const getDimensions = () => {
    switch (size) {
      case 'sm':
        return { btnSize: 26, iconSize: 12, fontSize: 13, gap: 6, paddingH: 4 };
      case 'lg':
        return { btnSize: 38, iconSize: 18, fontSize: 16, gap: 14, paddingH: 10 };
      case 'md':
      default:
        return { btnSize: 32, iconSize: 15, fontSize: 14, gap: 10, paddingH: 6 };
    }
  };

  const dim = getDimensions();

  const canDec = !disabled && quantity > min;
  const canInc = !disabled && quantity < max;

  const getContainerStyle = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: isDark ? '#27272A' : '#F4F4F5',
          borderColor: 'transparent',
        };
      case 'subtle':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'outlined':
      default:
        return {
          backgroundColor: theme.surface || '#FFFFFF',
          borderColor: theme.border || (isDark ? '#3F3F46' : '#E4E4E7'),
          borderWidth: 1,
        };
    }
  };

  return (
    <View
      style={[
        styles.container,
        getContainerStyle(),
        {
          paddingHorizontal: dim.paddingH,
          gap: dim.gap,
          opacity: disabled ? 0.6 : 1,
        },
        containerStyle,
      ]}
    >
      <TouchableOpacity
        onPress={handleDec}
        disabled={!canDec}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.button,
          {
            width: dim.btnSize,
            height: dim.btnSize,
            borderRadius: dim.btnSize / 2,
            backgroundColor: canDec
              ? isDark
                ? '#3F3F46'
                : '#E4E4E7'
              : 'transparent',
          },
        ]}
      >
        <Minus
          size={dim.iconSize}
          color={canDec ? theme.textPrimary || '#18181B' : theme.textMuted || '#A1A1AA'}
        />
      </TouchableOpacity>

      <AppText
        style={[styles.valueText, { fontSize: dim.fontSize, color: theme.textPrimary || '#18181B' }]}
        weight="bold"
      >
        {quantity}
      </AppText>

      <TouchableOpacity
        onPress={handleInc}
        disabled={!canInc}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.button,
          {
            width: dim.btnSize,
            height: dim.btnSize,
            borderRadius: dim.btnSize / 2,
            backgroundColor: canInc ? theme.primary : '#E4E4E7',
          },
        ]}
      >
        <Plus
          size={dim.iconSize}
          color={canInc ? '#18181B' : theme.textMuted || '#A1A1AA'}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    paddingVertical: 3,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    minWidth: 20,
    textAlign: 'center',
  },
});
