import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import {
  X,
  MapPin,
  Check,
  Navigation,
  ChevronDown,
  Building2,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocation, LocationCoords } from '../context/LocationContext';
import {
  INDIAN_STATES,
  lookupCityStateFromPincode,
  validateIndianAddress,
  formatIndianAddressSummary,
} from '../utils/addressHelper';
import { IndianDeliveryAddress } from '../types';

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
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'success' | 'error' } | null>(null);

  // Minimal Address Fields
  const [pincode, setPincode] = useState<string>('500081');
  const [flatBuilding, setFlatBuilding] = useState<string>('');
  const [areaStreet, setAreaStreet] = useState<string>('');
  const [landmark, setLandmark] = useState<string>('');
  const [city, setCity] = useState<string>('Hyderabad');
  const [state, setState] = useState<string>('Telangana');

  // Form Validation & State Dropdown
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStateDropdown, setShowStateDropdown] = useState<boolean>(false);

  // Animations (Modal backdrop fade + spring sheet slide up)
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(280)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 90,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
    }
  }, [isOpen, fadeAnim, slideAnim]);

  const handleAnimatedClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 160,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!isOpen) return null;

  // 1-Tap Geolocation Auto-Detection
  const handleUseCurrentLocation = () => {
    setIsLocating(true);
    setStatusMessage({ text: 'Detecting GPS location...', type: 'info' });

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
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
            const addr = data?.address || {};

            const postcode = addr.postcode ? addr.postcode.replace(/\D/g, '').slice(0, 6) : '';
            const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.village || '';
            const road = addr.road || addr.street || addr.pedestrian || '';
            const resolvedCity = addr.city || addr.town || addr.city_district || 'Hyderabad';
            const resolvedState = addr.state || 'Telangana';

            if (postcode) setPincode(postcode);
            if (road || suburb) setAreaStreet([road, suburb].filter(Boolean).join(', '));
            if (!flatBuilding) setFlatBuilding(data?.name || 'Site Location');
            if (resolvedCity) setCity(resolvedCity);
            if (resolvedState) setState(resolvedState);

            setIsLocating(false);
            setStatusMessage({
              text: `Location detected: ${suburb || resolvedCity}`,
              type: 'success',
            });
          } catch {
            setPincode('500081');
            setAreaStreet('HITEC City Main Road');
            setCity('Hyderabad');
            setState('Telangana');
            setIsLocating(false);
            setStatusMessage({ text: 'GPS coordinates detected and auto-filled.', type: 'success' });
          }

          setTimeout(() => setStatusMessage(null), 3000);
        },
        (err) => {
          console.warn('Geolocation error:', err);
          setPincode('500081');
          setAreaStreet('HITEC City, Hyderabad');
          setCity('Hyderabad');
          setState('Telangana');
          setIsLocating(false);
          setStatusMessage({ text: 'Default location coordinates applied.', type: 'info' });
          setTimeout(() => setStatusMessage(null), 3000);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setIsLocating(false);
      setStatusMessage({ text: 'GPS not supported by browser.', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handlePincodeChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 6);
    setPincode(clean);
    if (errors.pincode) {
      setErrors((prev) => ({ ...prev, pincode: '' }));
    }

    if (clean.length === 6) {
      const lookup = lookupCityStateFromPincode(clean);
      if (lookup.city) setCity(lookup.city);
      if (lookup.state) setState(lookup.state);
    }
  };

  const handleSelectExistingAddress = (loc: string) => {
    const coords = getCoords(loc);
    setSelectedLocation(loc, coords);
    setStatusMessage({ text: 'Delivery address updated!', type: 'success' });
    setTimeout(() => {
      handleAnimatedClose();
    }, 600);
  };

  const handleSaveAndConfirm = () => {
    const addressData: IndianDeliveryAddress = {
      pincode,
      flatBuilding,
      areaStreet,
      landmark,
      city,
      state,
    };

    const validation = validateIndianAddress(addressData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setStatusMessage({ text: 'Please fill in all mandatory address fields', type: 'error' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }

    setErrors({});
    const summary = formatIndianAddressSummary(addressData);
    addLocation(summary, activeCoords);
    setSelectedLocation(summary, activeCoords);

    setStatusMessage({ text: 'Delivery address confirmed!', type: 'success' });
    setTimeout(() => {
      handleAnimatedClose();
    }, 600);
  };

  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView style={[styles.overlay, { opacity: fadeAnim }]}>
      <Pressable style={styles.backdrop} onPress={handleAnimatedClose} />
      <AnimatedView
        style={[
          styles.sheetContainer,
          {
            backgroundColor: theme.surface,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <View style={styles.titleGroup}>
            <MapPin size={20} color={theme.primary} strokeWidth={2.2} />
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>
              Delivery Location
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleAnimatedClose}
            style={styles.closeBtn}
            accessibilityLabel="Close location modal"
          >
            <X size={18} color={theme.textMuted} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Status Message Banner */}
          {statusMessage && (
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor:
                    statusMessage.type === 'error'
                      ? '#FEE2E2'
                      : statusMessage.type === 'success'
                      ? '#DCFCE7'
                      : theme.primaryLight,
                  borderColor:
                    statusMessage.type === 'error'
                      ? '#FCA5A5'
                      : statusMessage.type === 'success'
                      ? '#86EFAC'
                      : theme.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      statusMessage.type === 'error'
                        ? '#B91C1C'
                        : statusMessage.type === 'success'
                        ? '#15803D'
                        : theme.primaryDark,
                  },
                ]}
              >
                {statusMessage.text}
              </Text>
            </View>
          )}

          {/* Quick GPS Auto-Detect Button */}
          <TouchableOpacity
            onPress={handleUseCurrentLocation}
            disabled={isLocating}
            activeOpacity={0.8}
            style={[styles.gpsButton, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={theme.primaryDark} />
            ) : (
              <Navigation size={16} color={theme.primaryDark} strokeWidth={2.5} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.gpsTitle, { color: theme.primaryDark }]}>
                Use Current Location (GPS)
              </Text>
              <Text style={[styles.gpsSub, { color: theme.textSecondary }]}>
                Auto-fills Pincode, Street, City & State in 1 tap
              </Text>
            </View>
          </TouchableOpacity>

          {/* Recent / Saved Locations Quick Chips (if available) */}
          {savedLocations.length > 0 && (
            <View style={styles.quickChipsSection}>
              <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
                RECENT / SAVED LOCATIONS
              </Text>
              <View style={styles.chipsContainer}>
                {savedLocations.map((loc, idx) => {
                  const isSelected = selectedLocation === loc;
                  const shortName = loc.split(',')[0];
                  return (
                    <TouchableOpacity
                      key={loc + idx}
                      onPress={() => handleSelectExistingAddress(loc)}
                      activeOpacity={0.75}
                      style={[
                        styles.locationChip,
                        {
                          borderColor: isSelected ? theme.primary : theme.border,
                          backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                        },
                      ]}
                    >
                      <MapPin size={12} color={isSelected ? theme.primary : theme.textSecondary} />
                      <Text
                        style={[
                          styles.locationChipText,
                          {
                            color: isSelected ? theme.primaryDark : theme.textPrimary,
                            fontWeight: isSelected ? '700' : '500',
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {shortName}
                      </Text>
                      {isSelected ? (
                        <Check size={12} color={theme.primary} strokeWidth={2.5} />
                      ) : savedLocations.length > 1 ? (
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteLocation(loc);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          style={{ marginLeft: 2 }}
                        >
                          <Trash2 size={11} color={theme.textMuted} />
                        </TouchableOpacity>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Minimalist Address Form */}
          <View style={styles.formContainer}>
            <Text style={[styles.sectionHeading, { color: theme.textSecondary, marginBottom: 2 }]}>
              ADDRESS DETAILS
            </Text>

            {/* 1. Pincode (6 Digits) */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                Pincode <Text style={styles.mandatoryStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: errors.pincode ? '#EF4444' : theme.border,
                  },
                ]}
              >
                <TextInput
                  value={pincode}
                  onChangeText={handlePincodeChange}
                  keyboardType="numeric"
                  maxLength={6}
                  style={[styles.textInputField, { color: theme.textPrimary }]}
                  placeholder="6-digit pincode (e.g. 500081)"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>

            {/* 2. Flat / House / Building / Plot Name */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                Flat, House No., Building / Plot Name <Text style={styles.mandatoryStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: errors.flatBuilding ? '#EF4444' : theme.border,
                  },
                ]}
              >
                <Building2 size={15} color={theme.textMuted} />
                <TextInput
                  value={flatBuilding}
                  onChangeText={(t) => {
                    setFlatBuilding(t);
                    if (errors.flatBuilding) setErrors((prev) => ({ ...prev, flatBuilding: '' }));
                  }}
                  style={[styles.textInputField, { color: theme.textPrimary }]}
                  placeholder="e.g. Plot 42, Skyview Tower / Site B"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              {errors.flatBuilding && <Text style={styles.errorText}>{errors.flatBuilding}</Text>}
            </View>

            {/* 3. Area, Street, Village */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                Area, Street, Village <Text style={styles.mandatoryStar}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: errors.areaStreet ? '#EF4444' : theme.border,
                  },
                ]}
              >
                <TextInput
                  value={areaStreet}
                  onChangeText={(t) => {
                    setAreaStreet(t);
                    if (errors.areaStreet) setErrors((prev) => ({ ...prev, areaStreet: '' }));
                  }}
                  style={[styles.textInputField, { color: theme.textPrimary }]}
                  placeholder="e.g. Financial District, Main Road"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              {errors.areaStreet && <Text style={styles.errorText}>{errors.areaStreet}</Text>}
            </View>

            {/* 4. Landmark (Optional) */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Landmark <Text style={styles.optionalTag}>(Optional)</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.surfaceSecondary,
                    borderColor: theme.border,
                  },
                ]}
              >
                <TextInput
                  value={landmark}
                  onChangeText={setLandmark}
                  style={[styles.textInputField, { color: theme.textPrimary }]}
                  placeholder="e.g. Near Continental Hospital / Pillar 42"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* 5. Town / City & State (2-Column) */}
            <View style={styles.twoColumnRow}>
              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  Town / City <Text style={styles.mandatoryStar}>*</Text>
                </Text>
                <View
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: errors.city ? '#EF4444' : theme.border,
                    },
                  ]}
                >
                  <TextInput
                    value={city}
                    onChangeText={(t) => {
                      setCity(t);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    style={[styles.textInputField, { color: theme.textPrimary }]}
                    placeholder="e.g. Hyderabad"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>

              <View style={[styles.fieldWrapper, { flex: 1 }]}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>
                  State <Text style={styles.mandatoryStar}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => setShowStateDropdown(!showStateDropdown)}
                  style={[
                    styles.inputContainer,
                    {
                      backgroundColor: theme.surfaceSecondary,
                      borderColor: errors.state ? '#EF4444' : theme.border,
                      justifyContent: 'space-between',
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                    {state || 'Select State'}
                  </Text>
                  <ChevronDown size={15} color={theme.textSecondary} />
                </TouchableOpacity>
                {errors.state && <Text style={styles.errorText}>{errors.state}</Text>}
              </View>
            </View>

            {/* State Dropdown Selection Box */}
            {showStateDropdown && (
              <View style={[styles.stateDropdownCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.stateDropdownTitle, { color: theme.textSecondary }]}>
                  Select State / UT
                </Text>
                <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {INDIAN_STATES.map((st) => (
                    <TouchableOpacity
                      key={st}
                      onPress={() => {
                        setState(st);
                        setShowStateDropdown(false);
                        if (errors.state) setErrors((prev) => ({ ...prev, state: '' }));
                      }}
                      style={[
                        styles.stateOptionItem,
                        {
                          backgroundColor: state === st ? theme.surfaceSecondary : 'transparent',
                          borderBottomColor: theme.borderLight,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          color: state === st ? theme.primary : theme.textPrimary,
                          fontWeight: state === st ? '700' : '400',
                        }}
                      >
                        {st}
                      </Text>
                      {state === st && <Check size={14} color={theme.primary} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Bottom Action Footer */}
        <View style={[styles.footerBar, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
          <TouchableOpacity
            onPress={handleSaveAndConfirm}
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>Save & Set Delivery Address</Text>
          </TouchableOpacity>
        </View>
      </AnimatedView>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerRow: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statusBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  gpsSub: {
    fontSize: 11,
    marginTop: 1,
  },
  quickChipsSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  locationChipText: {
    fontSize: 12,
    maxWidth: 160,
  },
  formContainer: {
    gap: 12,
  },
  fieldWrapper: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  mandatoryStar: {
    color: '#EF4444',
  },
  optionalTag: {
    fontSize: 11,
    fontWeight: '400',
    color: '#94A3B8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textInputField: {
    flex: 1,
    fontSize: 13,
    padding: 0,
    outlineStyle: 'none' as any,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  stateDropdownCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  stateDropdownTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  stateOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  footerBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  saveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
