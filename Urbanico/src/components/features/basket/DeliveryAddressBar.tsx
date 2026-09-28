import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { AppText } from '../../common/AppText';
import { useTheme } from '../../../context/ThemeContext';

export interface DeliveryAddressBarProps {
  selectedLocation?: string;
  onChangeAddress: () => void;
}

export const DeliveryAddressBar: React.FC<DeliveryAddressBarProps> = ({
  selectedLocation,
  onChangeAddress,
}) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onChangeAddress}
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight || '#FFF8EB' }]}>
        <MapPin size={18} color={theme.primaryDark || '#B45309'} />
      </View>

      <View style={styles.textContainer}>
        <AppText style={[styles.label, { color: theme.textSecondary }]} weight="medium">
          Delivering to Construction Site
        </AppText>
        <AppText
          style={[styles.addressText, { color: theme.textPrimary }]}
          weight="bold"
          numberOfLines={1}
        >
          {selectedLocation || 'Select Delivery Destination'}
        </AppText>
      </View>

      <View style={styles.actionContainer}>
        <AppText style={[styles.changeText, { color: theme.primaryDark || '#B45309' }]} weight="bold">
          Change
        </AppText>
        <ChevronRight size={14} color={theme.primaryDark || '#B45309'} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.2,
  },
  addressText: {
    fontSize: 13,
    marginTop: 1,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  changeText: {
    fontSize: 12,
    marginRight: 2,
  },
});
