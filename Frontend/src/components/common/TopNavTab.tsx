import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TopNavTabProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const TopNavTab: React.FC<TopNavTabProps> = ({
  label,
  isActive,
  onPress,
  style,
  textStyle,
}) => {
  const { theme, typography } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.tab, style]}
    >
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
      {isActive && (
        <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    marginRight: 22,
    alignItems: 'center',
    position: 'relative',
  },
  text: {
    fontSize: 14,
    letterSpacing: -0.2,
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
