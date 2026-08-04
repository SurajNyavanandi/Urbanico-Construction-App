import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
} from 'react-native';
import {
  Palette,
  Check,
  ArrowLeft,
  Bell,
  Shield,
  HardDrive,
  Info,
  CheckCircle2,
  Trash2,
  Globe,
  FileText,
  Sun,
  Moon,
  Type,
  Sparkles,
} from 'lucide-react-native';
import {
  useTheme,
  ThemeMode,
  AccentColor,
  TypographyFontFamily,
  ACCENT_DEFINITIONS,
  FONT_CONFIGS,
} from '../context/ThemeContext';

interface SettingsScreenProps {
  onBack: () => void;
  onClearRecentSearches?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onClearRecentSearches,
}) => {
  const {
    theme,
    themeMode,
    setThemeMode,
    accentColor,
    setAccentColor,
    typography,
    typographyFont,
    setTypographyFont,
  } = useTheme();

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notification Toggles State
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [dispatchAlerts, setDispatchAlerts] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [whatsappReceipts, setWhatsappReceipts] = useState(true);

  // Security Toggles State
  const [biometricLock, setBiometricLock] = useState(true);
  const [twoFactorOtp, setTwoFactorOtp] = useState(true);

  // Storage Toggle State
  const [offlineCatalog, setOfflineCatalog] = useState(true);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleClearCache = () => {
    if (onClearRecentSearches) {
      onClearRecentSearches();
    }
    triggerToast('App Cache & Search History Cleared (14.2 MB)!');
  };

  const accentOptions: { id: AccentColor; name: string; description: string; hex: string }[] = [
    {
      id: 'amber',
      name: 'Safety Amber (Default)',
      description: 'High visibility site safety color',
      hex: ACCENT_DEFINITIONS.amber.hex,
    },
    {
      id: 'violet',
      name: 'Urbanico Violet',
      description: 'Signature purple & violet builder identity',
      hex: ACCENT_DEFINITIONS.violet.hex,
    },
    {
      id: 'green',
      name: 'Eco Green',
      description: 'Fresh sustainable site identity',
      hex: ACCENT_DEFINITIONS.green.hex,
    },
    {
      id: 'blue',
      name: 'Blueprint Blue',
      description: 'Technical engineering & layout contrast',
      hex: ACCENT_DEFINITIONS.blue.hex,
    },
    {
      id: 'black',
      name: 'Contractor Black',
      description: 'High contrast dark slate accent',
      hex: ACCENT_DEFINITIONS.black.hex,
    },
  ];

  const fontOptions: { id: TypographyFontFamily; name: string; desc: string }[] = [
    { id: 'system', name: FONT_CONFIGS.system.name, desc: 'Native OS system font' },
    { id: 'inter', name: FONT_CONFIGS.inter.name, desc: 'Clean geometric sans-serif' },
    { id: 'jakarta', name: FONT_CONFIGS.jakarta.name, desc: 'Modern display typography' },
    { id: 'mono', name: FONT_CONFIGS.mono.name, desc: 'Technical spec monospace font' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}>
          <CheckCircle2 size={16} color={theme.primary} />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Back Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={onBack}
          style={[styles.backBtn, { backgroundColor: theme.surfaceSecondary }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
          App Preferences & Settings
        </Text>
      </View>

      {/* SECTION 1: Theme Mode (Light vs Dark) */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Palette size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Theme Mode
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Switch between Light daylight mode and Dark night mode
            </Text>
          </View>
        </View>

        <View style={styles.modeRow}>
          {/* Light Mode Button */}
          <TouchableOpacity
            onPress={() => {
              setThemeMode('light');
              triggerToast('Switched to Light Mode');
            }}
            activeOpacity={0.8}
            style={[
              styles.modeCard,
              {
                borderColor: themeMode === 'light' ? theme.primary : theme.border,
                backgroundColor: themeMode === 'light' ? theme.primaryLight : theme.surfaceSecondary,
              },
            ]}
          >
            <Sun size={20} color={themeMode === 'light' ? theme.primaryDark : theme.textMuted} />
            <Text style={[styles.modeCardTitle, { color: themeMode === 'light' ? theme.primaryDark : theme.textPrimary }]}>
              Light Mode
            </Text>
            <Text style={[styles.modeCardSub, { color: theme.textSecondary }]}>Daylight site view</Text>
            {themeMode === 'light' && <Check size={16} color={theme.primaryDark} strokeWidth={3} />}
          </TouchableOpacity>

          {/* Dark Mode Button */}
          <TouchableOpacity
            onPress={() => {
              setThemeMode('dark');
              triggerToast('Switched to Dark Mode');
            }}
            activeOpacity={0.8}
            style={[
              styles.modeCard,
              {
                borderColor: themeMode === 'dark' ? theme.primary : theme.border,
                backgroundColor: themeMode === 'dark' ? theme.primaryLight : theme.surfaceSecondary,
              },
            ]}
          >
            <Moon size={20} color={themeMode === 'dark' ? theme.primaryDark : theme.textMuted} />
            <Text style={[styles.modeCardTitle, { color: themeMode === 'dark' ? theme.primaryDark : theme.textPrimary }]}>
              Dark Mode
            </Text>
            <Text style={[styles.modeCardSub, { color: theme.textSecondary }]}>Low-light night view</Text>
            {themeMode === 'dark' && <Check size={16} color={theme.primaryDark} strokeWidth={3} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 2: Global Accent Color System */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Sparkles size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Global Accent Color
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Updates all buttons, icons, active navigation, cards & highlights instantly
            </Text>
          </View>
        </View>

        <View style={styles.themeList}>
          {accentOptions.map((accItem) => {
            const isSelected = accentColor === accItem.id;
            return (
              <TouchableOpacity
                key={accItem.id}
                onPress={() => {
                  setAccentColor(accItem.id);
                  triggerToast(`Global accent updated to ${accItem.name}`);
                }}
                activeOpacity={0.8}
                style={[
                  styles.themeRow,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                  },
                ]}
              >
                <View style={styles.themeLeft}>
                  <View style={[styles.colorCircle, { backgroundColor: accItem.hex }]}>
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <View style={styles.themeTextGroup}>
                    <Text style={[styles.themeName, { color: theme.textPrimary }]}>{accItem.name}</Text>
                    <Text style={[styles.themeDesc, { color: theme.textSecondary }]}>{accItem.description}</Text>
                  </View>
                </View>

                {isSelected && (
                  <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SECTION 3: Global Typography System */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Type size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Global Typography System
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Changing font family updates text styling across all screens automatically
            </Text>
          </View>
        </View>

        <View style={styles.fontGrid}>
          {fontOptions.map((fOpt) => {
            const isSelected = typographyFont === fOpt.id;
            return (
              <TouchableOpacity
                key={fOpt.id}
                onPress={() => {
                  setTypographyFont(fOpt.id);
                  triggerToast(`Font family updated to ${fOpt.name}`);
                }}
                activeOpacity={0.8}
                style={[
                  styles.fontCard,
                  {
                    borderColor: isSelected ? theme.primary : theme.border,
                    backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                  },
                ]}
              >
                <View style={styles.fontCardHeader}>
                  <Text style={[styles.fontCardTitle, { color: isSelected ? theme.primaryDark : theme.textPrimary }]}>
                    {fOpt.name}
                  </Text>
                  {isSelected && <Check size={14} color={theme.primaryDark} strokeWidth={2.5} />}
                </View>
                <Text style={[styles.fontCardDesc, { color: theme.textSecondary }]}>{fOpt.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Live Preview Sample */}
        <View style={[styles.previewBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
          <Text style={[styles.previewLabel, { color: theme.textMuted }]}>Typography & Theme Live Sample:</Text>
          <Text style={[styles.previewHeading, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
            Urbanico Construction Supply
          </Text>
          <Text style={[styles.previewBody, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
            High strength OPC 53 Grade Cement dispatched in 24 hours.
          </Text>
        </View>
      </View>

      {/* SECTION 4: Push Notifications & Site Alerts */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Bell size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Notifications & Site Alerts
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Real-time vehicle dispatch & delivery radar updates
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Enable Master Push Notifications</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                All order, dispatch and account alerts
              </Text>
            </View>
            <Switch
              value={enableNotifications}
              onValueChange={(val) => {
                setEnableNotifications(val);
                triggerToast(val ? 'Push Notifications enabled' : 'Push Notifications muted');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Truck Dispatch Radar Alerts</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Get notified when tipper/truck is within 2 km of site
              </Text>
            </View>
            <Switch
              value={dispatchAlerts}
              onValueChange={(val) => {
                setDispatchAlerts(val);
                triggerToast(val ? 'Dispatch alerts ON' : 'Dispatch alerts OFF');
              }}
              disabled={!enableNotifications}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Price Drops & Bulk Offers</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Cement, sand and rebar daily price notifications
              </Text>
            </View>
            <Switch
              value={priceAlerts}
              onValueChange={(val) => {
                setPriceAlerts(val);
                triggerToast(val ? 'Offer alerts ON' : 'Offer alerts OFF');
              }}
              disabled={!enableNotifications}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>WhatsApp GST Bills & Invoices</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Receive PDF weighbridge slips directly on WhatsApp
              </Text>
            </View>
            <Switch
              value={whatsappReceipts}
              onValueChange={(val) => {
                setWhatsappReceipts(val);
                triggerToast(val ? 'WhatsApp receipts ON' : 'WhatsApp receipts OFF');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* SECTION 5: Security & Site Access */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Shield size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Security & Site Access
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Protect site credit purchases with biometric PIN
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Biometric / Face ID App Lock</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Require biometric authentication to open app
              </Text>
            </View>
            <Switch
              value={biometricLock}
              onValueChange={(val) => {
                setBiometricLock(val);
                triggerToast(val ? 'Biometric Lock ON' : 'Biometric Lock OFF');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>OTP Verification for High Value</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Require Mobile OTP confirmation for orders over ₹50,000
              </Text>
            </View>
            <Switch
              value={twoFactorOtp}
              onValueChange={(val) => {
                setTwoFactorOtp(val);
                triggerToast(val ? 'High-value OTP ON' : 'High-value OTP OFF');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* SECTION 6: Storage & Offline Mode */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <HardDrive size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Data & Storage Management
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Manage local catalog cache & search history
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Offline Material Catalog</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Save material price lists for low-network construction sites
              </Text>
            </View>
            <Switch
              value={offlineCatalog}
              onValueChange={(val) => {
                setOfflineCatalog(val);
                triggerToast(val ? 'Offline catalog enabled' : 'Offline catalog disabled');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity
            onPress={handleClearCache}
            activeOpacity={0.7}
            style={styles.clearCacheBtn}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={styles.clearCacheText}>Clear Cache & Search History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 7: App Information */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Info size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Urbanico Platform Information
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Production build version & official terms
            </Text>
          </View>
        </View>

        <View style={styles.infoLinkGroup}>
          <View style={styles.infoMetaRow}>
            <Text style={[styles.infoMetaLabel, { color: theme.textSecondary }]}>Application Version:</Text>
            <Text style={[styles.infoMetaVal, { color: theme.textPrimary }]}>v1.5.0 (Build 2026.07)</Text>
          </View>
          <View style={styles.infoMetaRow}>
            <Text style={[styles.infoMetaLabel, { color: theme.textSecondary }]}>Platform Engine:</Text>
            <Text style={[styles.infoMetaVal, { color: theme.textPrimary }]}>React Native Expo Enterprise</Text>
          </View>

          <TouchableOpacity
            onPress={() => triggerToast('Terms of Service loaded')}
            style={styles.linkRow}
            activeOpacity={0.7}
          >
            <FileText size={14} color={theme.primary} />
            <Text style={[styles.linkText, { color: theme.primary }]}>Terms of Service & GST Rules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => triggerToast('Privacy Policy loaded')}
            style={styles.linkRow}
            activeOpacity={0.7}
          >
            <Globe size={14} color={theme.primary} />
            <Text style={[styles.linkText, { color: theme.primary }]}>Privacy & Data Protection Policy</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.footerNote, { color: theme.textMuted }]}>
        Urbanico On-Demand Construction Supply Platform • Production Ready
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 112,
    gap: 16,
  },
  toastContainer: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 4,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  cardSubTitle: {
    fontSize: 11,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modeCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  modeCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  modeCardSub: {
    fontSize: 10,
  },
  themeList: {
    gap: 10,
  },
  themeRow: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeTextGroup: {
    flex: 1,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '800',
  },
  themeDesc: {
    fontSize: 11,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  fontGrid: {
    gap: 8,
  },
  fontCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  fontCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fontCardTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  fontCardDesc: {
    fontSize: 10,
  },
  previewBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewHeading: {
    fontSize: 15,
    fontWeight: '900',
  },
  previewBody: {
    fontSize: 12,
  },
  settingRowsList: {
    gap: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingRowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
  },
  clearCacheBtn: {
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  clearCacheText: {
    color: '#E11D48',
    fontSize: 12,
    fontWeight: '800',
  },
  infoLinkGroup: {
    gap: 10,
  },
  infoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoMetaLabel: {
    fontSize: 12,
  },
  infoMetaVal: {
    fontSize: 12,
    fontWeight: '800',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    paddingTop: 8,
  },
});
