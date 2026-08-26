import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, MapPin, Check, Navigation, Search, Plus, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocation, LocationCoords } from '../context/LocationContext';
import { GoogleMapPicker } from './common/GoogleMapPicker';

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
    currentCoords,
    setSelectedLocation,
    addLocation,
    deleteLocation,
    getCoords,
  } = useLocation();

  const [activeCoords, setActiveCoords] = useState<LocationCoords>(currentCoords);
  const [addressInput, setAddressInput] = useState<string>('');
  const [pincodeInput, setPincodeInput] = useState<string>('');
  const [selectedSiteName, setSelectedSiteName] = useState<string>(selectedLocation);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [showMap, setShowMap] = useState<boolean>(false);

  if (!isOpen) return null;

  // Real browser/device Geolocation GPS detection with automatic Pincode extraction
  const handleUseCurrentLocation = () => {
    setShowMap(true);
    setIsLocating(true);
    setStatusMessage('Fetching GPS location & resolving pincode...');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setActiveCoords(coords);

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
            );
            const data = await res.json();
            const postcode = data?.address?.postcode || '';
            const suburb = data?.address?.suburb || data?.address?.neighbourhood || data?.address?.residential || data?.address?.road || 'Site Location';
            const city = data?.address?.city || data?.address?.state_district || 'Hyderabad';
            
            const gpsName = postcode
              ? `${suburb}, ${city} - PIN ${postcode}`
              : data?.display_name
              ? data.display_name.split(',').slice(0, 3).join(', ')
              : `Current GPS Site (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;

            if (postcode) {
              setPincodeInput(postcode);
            }
            setSelectedSiteName(gpsName);
            setAddressInput(gpsName);
            addLocation(gpsName, coords);
            setIsLocating(false);
            setStatusMessage(`GPS location & PIN ${postcode || 'detected'} found!`);
          } catch {
            const gpsName = `Current GPS Site (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
            setSelectedSiteName(gpsName);
            setAddressInput(gpsName);
            addLocation(gpsName, coords);
            setIsLocating(false);
            setStatusMessage('GPS coordinates detected!');
          }

          setTimeout(() => setStatusMessage(null), 3000);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          const fallbackCoords = { lat: 17.3924, lng: 78.4738 };
          const fallbackName = 'Hyderabad Central, Abids - PIN 500001';
          setActiveCoords(fallbackCoords);
          setSelectedSiteName(fallbackName);
          setPincodeInput('500001');
          addLocation(fallbackName, fallbackCoords);
          setIsLocating(false);
          setStatusMessage('Using Hyderabad Central location (PIN 500001)');
          setTimeout(() => setStatusMessage(null), 3000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setStatusMessage('GPS not supported by browser. Selected default site.');
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleMapLocationSelect = (pos: LocationCoords, formattedAddress?: string) => {
    setActiveCoords(pos);
    const name = formattedAddress || `Site Pin (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`;
    setSelectedSiteName(name);
    setAddressInput(name);
  };

  const handleSearchOrAddAddress = () => {
    if (!addressInput.trim()) return;
    const cleanAddr = addressInput.trim();
    const cleanPin = pincodeInput.replace(/[^0-9]/g, '').slice(0, 6);
    const fullName = cleanPin
      ? (cleanAddr.includes(cleanPin) ? cleanAddr : `${cleanAddr} - PIN ${cleanPin}`)
      : cleanAddr;

    setSelectedSiteName(fullName);
    addLocation(fullName, activeCoords);
    setAddressInput('');
    setPincodeInput('');
    setStatusMessage(`Saved "${fullName}" to delivery sites!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  const handleSelectSavedSite = (siteName: string) => {
    setSelectedSiteName(siteName);
    const coords = getCoords(siteName);
    setActiveCoords(coords);
    setSelectedLocation(siteName, coords);
  };

  const handleConfirmLocation = () => {
    setSelectedLocation(selectedSiteName, activeCoords);
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <View style={styles.titleGroup}>
            <MapPin size={22} color={theme.primary} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Change Construction Site Location
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Status Message Toast */}
          {statusMessage && (
            <View style={[styles.statusBanner, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.statusText, { color: theme.primaryDark }]}>{statusMessage}</Text>
            </View>
          )}

          {/* Search / Add Custom Address & Pincode Input */}
          <View style={styles.searchBoxWrapper}>
            <View style={[styles.searchBar, { flex: 1, backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Search size={18} color={theme.textMuted} />
              <TextInput
                value={addressInput}
                onChangeText={setAddressInput}
                placeholder="Site address / area..."
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.textPrimary }]}
                onSubmitEditing={handleSearchOrAddAddress}
              />
              {Boolean(addressInput) && (
                <TouchableOpacity onPress={() => setAddressInput('')}>
                  <X size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <View style={[styles.searchBar, { width: 90, backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <TextInput
                value={pincodeInput}
                onChangeText={(t) => setPincodeInput(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Pincode"
                placeholderTextColor={theme.textMuted}
                keyboardType="numeric"
                style={[styles.searchInput, { color: theme.textPrimary, textAlign: 'center', fontWeight: '700' }]}
                onSubmitEditing={handleSearchOrAddAddress}
              />
            </View>
            <TouchableOpacity
              onPress={handleSearchOrAddAddress}
              style={[styles.addBtn, { backgroundColor: theme.primary }]}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Use GPS Location Button */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
            activeOpacity={0.8}
            style={[styles.gpsButton, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={theme.primaryDark} />
            ) : (
              <Navigation size={18} color={theme.primaryDark} strokeWidth={2.5} />
            )}
            <View style={styles.gpsTextWrapper}>
              <Text style={[styles.gpsTitle, { color: theme.primaryDark }]}>
                Detect Current GPS Location
              </Text>
              <Text style={[styles.gpsSub, { color: theme.textSecondary }]}>
                Fetch current device coordinates via GPS
              </Text>
            </View>
          </TouchableOpacity>

          {/* Interactive Construction Site Map - Shown when GPS is triggered */}
          {showMap && (
            <View style={styles.mapBoxSection}>
              <View style={styles.mapLabelRow}>
                <Text style={[styles.mapLabelText, { color: theme.textPrimary }]}>
                  Site Pin on Construction Map
                </Text>
                <Text style={[styles.mapHelpText, { color: theme.textMuted }]}>
                  Tap anywhere on map to move site pin
                </Text>
              </View>
              <GoogleMapPicker
                center={activeCoords}
                markerPosition={activeCoords}
                markerTitle={selectedSiteName}
                onLocationSelect={handleMapLocationSelect}
                height={220}
                interactive={true}
              />
            </View>
          )}

          {/* Saved Delivery Sites List */}
          <View style={styles.savedSection}>
            <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>
              Saved Delivery Sites
            </Text>
            <View style={styles.locationsList}>
              {savedLocations.map((loc) => {
                const isSelected = selectedSiteName === loc || selectedLocation === loc;
                return (
                  <TouchableOpacity
                    key={loc}
                    onPress={() => handleSelectSavedSite(loc)}
                    activeOpacity={0.75}
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
                        size={18}
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
                    <View style={styles.cardRightGroup}>
                      {isSelected && <Check size={18} color={theme.primaryDark} strokeWidth={2.5} />}
                      {savedLocations.length > 1 && (
                        <TouchableOpacity
                          onPress={() => deleteLocation(loc)}
                          style={styles.deleteBtn}
                        >
                          <Trash2 size={16} color={theme.textMuted} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Footer Confirm Action */}
        <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleConfirmLocation}
            style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
          >
            <Text style={styles.confirmBtnText}>Set As Active Site Location</Text>
          </TouchableOpacity>
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
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
    padding: 6,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  statusBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBoxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
    marginBottom: 16,
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
  mapBoxSection: {
    marginBottom: 16,
  },
  mapLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mapLabelText: {
    fontSize: 13,
    fontWeight: '800',
  },
  mapHelpText: {
    fontSize: 11,
  },
  savedSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
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
  cardRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteBtn: {
    padding: 4,
  },
  locationNameText: {
    fontSize: 13,
    flex: 1,
  },
  footerRow: {
    padding: 16,
    borderTopWidth: 1,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
