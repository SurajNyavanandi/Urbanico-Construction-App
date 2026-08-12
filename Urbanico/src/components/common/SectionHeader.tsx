import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  style,
}) => {
  const { theme, typography } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleCol}>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
          ]}
        >
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {subtitle}
          </Text>
        )}
      </View>

      {actionText && onActionPress && (
        <TouchableOpacity
          onPress={onActionPress}
          activeOpacity={0.7}
          style={styles.actionBtn}
        >
          <Text
            style={[
              styles.actionText,
              { color: theme.primary, fontFamily: typography.fontFamilyHeading },
            ]}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingLeft: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
