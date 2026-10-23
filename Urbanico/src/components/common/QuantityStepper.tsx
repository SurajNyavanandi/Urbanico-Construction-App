import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus, Minus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { soundService } from '../../utils/soundHelper';

interface QuantityStepperProps {
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
  value: rawValue,
  quantity,
  onIncrement,
  onDecrement,
  min = 1,
  max = 9999,
  size = 'md',
  allowDeleteAtMin = false,
}) => {
  const value = rawValue !== undefined ? rawValue : (quantity !== undefined ? quantity : 1);
  const { theme } = useTheme();

  const handleDecrement = () => {
    soundService.playTap();
    onDecrement();
  };

  const handleIncrement = () => {
    soundService.playTap();
    onIncrement();
  };

  const isSmall = size === 'sm';
  const showTrash = allowDeleteAtMin && value <= min;

  return (
    <View style={[styles.container, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
      <TouchableOpacity
        onPress={handleDecrement}
        disabled={!allowDeleteAtMin && value <= min}
        style={[styles.button, isSmall && styles.buttonSm]}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {showTrash ? (
          <Trash2 size={isSmall ? 12 : 14} color="#EF4444" strokeWidth={2} />
        ) : (
          <Minus
            size={isSmall ? 12 : 14}
            color={!allowDeleteAtMin && value <= min ? theme.textMuted : theme.textPrimary}
            strokeWidth={2.5}
          />
        )}
      </TouchableOpacity>

      <Text style={[styles.value, { color: theme.textPrimary }, isSmall && styles.valueSm]}>
        {value}
      </Text>

      <TouchableOpacity
        onPress={handleIncrement}
        disabled={value >= max}
        style={[styles.button, isSmall && styles.buttonSm]}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Plus
          size={isSmall ? 12 : 14}
          color={value >= max ? theme.textMuted : theme.textPrimary}
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
    paddingHorizontal: 3,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  button: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  buttonSm: {
    width: 22,
    height: 22,
  },
  value: {
    minWidth: 26,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 4,
  },
  valueSm: {
    minWidth: 20,
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 2,
  },
});

export default QuantityStepper;
