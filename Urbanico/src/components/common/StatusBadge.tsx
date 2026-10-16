import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, Clock, Truck, AlertCircle, Check, XCircle, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export type BadgeStatus =
  | 'paid'
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'dispatched'
  | 'in_transit'
  | 'reached_site'
  | 'delivered'
  | 'cancelled'
  | 'failed'
  | 'authorized'
  | string;

interface StatusBadgeProps {
  status: BadgeStatus;
  label?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'md',
}) => {
  const { theme } = useTheme();
  const normalized = (status || '').toLowerCase().replace(/[\s-]/g, '_');

  let bg = '#F1F5F9';
  let text = '#475569';
  let Icon = Clock;
  let displayLabel = label || status;

  switch (normalized) {
    case 'paid':
    case 'delivered':
    case 'completed':
    case 'success':
      bg = '#DCFCE7';
      text = '#15803D';
      Icon = CheckCircle2;
      displayLabel = label || (normalized === 'paid' ? 'Paid' : 'Delivered');
      break;

    case 'in_transit':
    case 'on_the_way':
    case 'dispatched':
      bg = '#FEF3C7';
      text = '#B45309';
      Icon = Truck;
      displayLabel = label || (normalized === 'in_transit' ? 'In Transit' : 'Dispatched');
      break;

    case 'confirmed':
    case 'processing':
    case 'authorized':
      bg = '#E0E7FF';
      text = '#4338CA';
      Icon = ShieldCheck;
      displayLabel = label || (normalized === 'confirmed' ? 'Confirmed' : 'Processing');
      break;

    case 'pending':
    case 'pending_site_verification':
      bg = '#FFF7ED';
      text = '#C2410C';
      Icon = Clock;
      displayLabel = label || 'Pending';
      break;

    case 'cancelled':
    case 'failed':
      bg = '#FEE2E2';
      text = '#B91C1C';
      Icon = XCircle;
      displayLabel = label || 'Cancelled';
      break;

    default:
      bg = theme.mode === 'dark' ? '#334155' : '#F1F5F9';
      text = theme.mode === 'dark' ? '#94A3B8' : '#64748B';
      Icon = AlertCircle;
      break;
  }

  const isSmall = size === 'sm';
  const iconSize = isSmall ? 11 : 13;

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <Icon size={iconSize} color={text} strokeWidth={2.5} />
      <Text style={[styles.label, { color: text }, isSmall && styles.labelSm]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default StatusBadge;
