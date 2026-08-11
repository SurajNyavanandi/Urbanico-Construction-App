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
  LayoutList,
  Grid2X2,
  Languages,
  ChevronRight,
} from 'lucide-react-native';
import {
  useTheme,
  ThemeMode,
  AccentColor,
  TypographyFontFamily,
  ACCENT_DEFINITIONS,
  FONT_CONFIGS,
} from '../context/ThemeContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { LanguagePromptModal } from './LanguagePromptModal';

interface SettingsScreenProps {
  onBack: () => void;
  onClearRecentSearches?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  onClearRecentSearches,
  viewMode = 'grid',
  onViewModeChange,
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

  const { language, setLanguage, languageOptions, currentLanguageOption, t } = useLanguage();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

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

      {/* Language Popup Modal */}
      <LanguagePromptModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        onConfirm={(langCode) => {
          const opt = languageOptions.find((l) => l.code === langCode);
          if (opt) triggerToast(`Language changed to ${opt.nativeName}`);
        }}
      />

      {/* SECTION 0: Language Preferences (Sleek Ultra-Minimal Single Row) */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setIsLangModalOpen(true)}
          style={styles.langCompactRow}
          activeOpacity={0.7}
        >
          <View style={styles.langCompactLeft}>
            <View style={[styles.langIconWrapper, { backgroundColor: theme.primaryLight }]}>
              <Languages size={18} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                {t.language}
              </Text>
              <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
                {t.languageSub}
              </Text>
            </View>
          </View>

          <View style={styles.langCompactRight}>
            <View style={[styles.activeLangBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.activeLangBadgeText, { color: theme.primaryDark }]}>
                {currentLanguageOption.flag} {currentLanguageOption.nativeName}
              </Text>
            </View>
            <ChevronRight size={18} color={theme.textMuted} />
          </View>
        </TouchableOpacity>
      </View>

      {/* SECTION 1: App Theme & Display Layout Settings */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Palette size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Theme & Display Layout
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Customize color theme and catalog view presentation
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          {/* Theme Mode Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Dark Mode Theme</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {themeMode === 'dark' ? 'Dark color scheme active' : 'Light color scheme active'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(val) => {
                const nextMode = val ? 'dark' : 'light';
                setThemeMode(nextMode);
                triggerToast(val ? 'Dark Mode Active' : 'Light Mode Active');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Catalog Display Layout Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Grid Layout View (2x)</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {viewMode === 'grid' ? '2-column grid active' : '1-column list active'}
              </Text>
            </View>
            <Switch
              value={viewMode === 'grid'}
              onValueChange={(val) => {
                const nextMode = val ? 'grid' : 'list';
                if (onViewModeChange) onViewModeChange(nextMode);
                triggerToast(val ? 'Global 2x Grid View Active' : 'Global List View Active');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* SECTION 2: Notification Controls */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Bell size={18} color={theme.primary} />
          <View>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Notification Controls
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Manage real-time dispatch and order status notifications
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Push Notifications</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Order status and dispatch updates
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
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Truck Dispatch Alerts</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Real-time delivery vehicle proximity alerts
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
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>WhatsApp Invoices & Updates</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Receive delivery slips directly on WhatsApp
              </Text>
            </View>
            <Switch
              value={whatsappReceipts}
              onValueChange={(val) => {
                setWhatsappReceipts(val);
                triggerToast(val ? 'WhatsApp updates ON' : 'WhatsApp updates OFF');
              }}
              trackColor={{ false: '#CBD5E1', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>
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
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  activeLangBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeLangBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  languageGrid: {
    gap: 8,
  },
  languageOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  langLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  langFlagText: {
    fontSize: 18,
  },
  langNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langNativeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  defaultTag: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  defaultTagText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  langSubRegion: {
    fontSize: 10,
    marginTop: 1,
  },
  radioCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardSubTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
  },
  compactCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  compactCardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 999,
    padding: 3,
    borderWidth: 1,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    gap: 6,
  },
  segmentBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  colorDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  colorDotWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  minimalColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minimalColorDotActive: {
    borderWidth: 3,
  },
  colorDotLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  fontPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fontPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  fontPillText: {
    fontSize: 12,
    fontWeight: '800',
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
  /* Compact Language Row Styles */
  langCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  langCompactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  langIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langCompactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    paddingTop: 8,
  },
});
