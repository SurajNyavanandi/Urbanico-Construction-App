import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X, MapPin, Check, Navigation } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { theme } = useTheme();
  const {
    selectedLocation,
    savedLocations,
    setSelectedLocation,
    addLocation,
  } = useLocation();

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    const gpsLocation = 'Current Location (Miyapur Site, Hyderabad)';
    addLocation(gpsLocation);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <View style={styles.titleGroup}>
            <MapPin size={20} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Select Delivery Site</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Use Current Location Button */}
        <TouchableOpacity
          onPress={handleUseCurrentLocation}
          activeOpacity={0.8}
          style={[styles.gpsButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
        >
          <Navigation size={18} color={theme.primaryDark} strokeWidth={2.5} />
          <View style={styles.gpsTextWrapper}>
            <Text style={[styles.gpsTitle, { color: theme.primaryDark }]}>Use Current Location (GPS)</Text>
            <Text style={[styles.gpsSub, { color: theme.textSecondary }]}>Fetch current GPS coordinates automatically</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.locationsList}>
          {savedLocations.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <TouchableOpacity
                key={loc}
                onPress={() => {
                  setSelectedLocation(loc);
                  onClose();
                }}
                activeOpacity={0.7}
                style={[
                  styles.locationCard,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
                  },
                ]}
              >
                <View style={styles.cardLeftGroup}>
                  <MapPin
                    size={16}
                    color={isSelected ? theme.primaryDark : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.locationNameText,
                      {
                        fontWeight: isSelected ? '800' : '500',
                        color: isSelected ? theme.textPrimary : theme.textSecondary,
                      },
                    ]}
                  >
                    {loc}
                  </Text>
                </View>
                {isSelected && <Check size={18} color={theme.primaryDark} strokeWidth={2.5} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 16,
    borderTopWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  gpsTextWrapper: {
    flex: 1,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  gpsSub: {
    fontSize: 11,
    marginTop: 2,
  },
  locationsList: {
    gap: 8,
  },
  locationCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  locationNameText: {
    fontSize: 13,
  },
});
