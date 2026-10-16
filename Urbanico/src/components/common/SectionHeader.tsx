import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useTypography } from '../../theme';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onAction?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText = 'View All',
  onAction,
}) => {
  const { theme } = useTheme();
  const typography = useTypography();

  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        <Text
          style={[
            styles.title,
            { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
          ]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { color: theme.textSecondary, fontFamily: typography.fontFamily },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onAction ? (
        <TouchableOpacity
          onPress={onAction}
          style={styles.actionButton}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text
            style={[
              styles.actionText,
              { color: theme.primary, fontFamily: typography.fontFamily },
            ]}
          >
            {actionText}
          </Text>
          <ChevronRight size={14} color={theme.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWrapper: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default SectionHeader;
