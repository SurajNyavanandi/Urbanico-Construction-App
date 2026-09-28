import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { CheckCircle2, Clock, Truck, Package, XCircle } from 'lucide-react-native';
import { AppText } from './AppText';
import { useTheme } from '../../context/ThemeContext';

export type DeliveryStatusType =
  | 'Placed'
  | 'Confirmed'
  | 'Dispatched'
  | 'En Route'
  | 'In Transit'
  | 'Delivered'
  | 'Cancelled'
  | 'Pending';

export interface StatusBadgeProps {
  status: DeliveryStatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  containerStyle?: ViewStyle;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  containerStyle,
}) => {
  const { theme, themeMode } = useTheme();
  const isDark = themeMode === 'dark';

  const getStatusConfig = (st: string) => {
    const s = (st || '').toLowerCase();
    if (s.includes('deliver')) {
      return {
        bg: '#DCFCE7',
        text: '#15803D',
        border: '#86EFAC',
        Icon: CheckCircle2,
      };
    }
    if (s.includes('route') || s.includes('transit') || s.includes('dispatch')) {
      return {
        bg: '#FEF3C7',
        text: '#B45309',
        border: '#FDE68A',
        Icon: Truck,
      };
    }
    if (s.includes('cancel') || s.includes('failed')) {
      return {
        bg: '#FEE2E2',
        text: '#B91C1C',
        border: '#FCA5A5',
        Icon: XCircle,
      };
    }
    if (s.includes('place') || s.includes('confirm')) {
      return {
        bg: '#E0F2FE',
        text: '#0369A1',
        border: '#BAE6FD',
        Icon: Package,
      };
    }
    return {
      bg: isDark ? '#27272A' : '#F4F4F5',
      text: theme.textSecondary || '#71717A',
      border: theme.border || (isDark ? '#3F3F46' : '#E4E4E7'),
      Icon: Clock,
    };
  };

  const config = getStatusConfig(status);
  const IconComponent = config.Icon;

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 10;
      case 'lg':
        return 13;
      case 'md':
      default:
        return 11;
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 11;
      case 'lg':
        return 15;
      case 'md':
      default:
        return 12;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingHorizontal: 6, paddingVertical: 2 };
      case 'lg':
        return { paddingHorizontal: 12, paddingVertical: 5 };
      case 'md':
      default:
        return { paddingHorizontal: 8, paddingVertical: 3 };
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          ...getPadding(),
        },
        containerStyle,
      ]}
    >
      {showIcon && (
        <IconComponent size={getIconSize()} color={config.text} style={styles.icon} />
      )}
      <AppText
        style={[styles.text, { color: config.text, fontSize: getFontSize() }]}
        weight="bold"
      >
        {status}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  text: {
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
});
