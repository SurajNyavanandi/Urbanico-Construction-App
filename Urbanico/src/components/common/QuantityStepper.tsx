import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { soundService } from '../../utils/soundHelper';

export interface QuantityStepperProps {
  value?: number;
  quantity?: number;
  onIncrement: () => void;
  onDecrement: () => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  allowDeleteAtMin?: boolean;
}

export const QuantityStepper: React.FC<QuantityStepperProps> = ({
  value,
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 9999,
  size = 'md',
  allowDeleteAtMin = false,
}) => {
  const { theme } = useTheme();
  const actualValue = value ?? quantity ?? 1;

  const handleDecrement = () => {
    soundService.playTap();
    onDecrement();
  };

  const handleIncrement = () => {
    soundService.playTap();
    onIncrement();
  };

  const isSmall = size === 'sm';
  const showTrash = allowDeleteAtMin && actualValue <= min;

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
      <TouchableOpacity
        onPress={handleDecrement}
        disabled={!allowDeleteAtMin && actualValue <= min}
        style={[styles.button, isSmall && styles.buttonSm]}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
      >
        {showTrash ? (
          <Trash2 size={isSmall ? 13 : 15} color="#EF4444" strokeWidth={2} />
        ) : (
          <Minus
            size={isSmall ? 13 : 15}
            color={!allowDeleteAtMin && actualValue <= min ? theme.textMuted : theme.textPrimary}
            strokeWidth={2.5}
          />
        )}
      </TouchableOpacity>

      <Text
        style={[
          styles.value,
          { color: theme.textPrimary },
          isSmall && styles.valueSm,
        ]}
        numberOfLines={1}
      >
        {actualValue}
      </Text>

      <TouchableOpacity
        onPress={handleIncrement}
        disabled={actualValue >= max}
        style={[styles.button, isSmall && styles.buttonSm]}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
      >
        <Plus
          size={isSmall ? 13 : 15}
          color={actualValue >= max ? theme.textMuted : theme.textPrimary}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  button: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  buttonSm: {
    width: 26,
    height: 26,
    borderRadius: 6,
  },
  value: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 13.5,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  valueSm: {
    minWidth: 22,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
});

export default QuantityStepper;
