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
import { useToast } from '../context/ToastContext';
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
  const { showToast } = useToast();

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

  const handleClearCache = () => {
    if (onClearRecentSearches) {
      onClearRecentSearches();
    }
    showToast('App Cache & Search History Cleared (14.2 MB)!', 'info');
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
      {/* Language Popup Modal */}
      <LanguagePromptModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        onConfirm={(langCode) => {
          const opt = languageOptions.find((l) => l.code === langCode);
          if (opt) showToast(`Language changed to ${opt.nativeName}`, 'info');
        }}
      />

      {/* SECTION 0: Language Preferences (Apple-styled Clean Inset Row) */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => setIsLangModalOpen(true)}
          style={styles.langItemRow}
          activeOpacity={0.7}
        >
          <View style={styles.langLeftGroup}>
            <View style={[styles.langIconBox, { backgroundColor: theme.surfaceSecondary }]}>
              <Languages size={18} color={theme.primary} strokeWidth={2} />
            </View>
            <View style={styles.langTextGroup}>
              <Text style={[styles.rowTitle, { color: theme.textPrimary }]}>
                {t.language}
              </Text>
              <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]}>
                {t.languageSub}
              </Text>
            </View>
          </View>

          <View style={styles.langRightGroup}>
            <Text style={[styles.langValueText, { color: theme.primary }]}>
              {currentLanguageOption.flag} {currentLanguageOption.nativeName}
            </Text>
            <ChevronRight size={16} color={theme.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>

      {/* SECTION 1: App Theme & Display Layout Settings */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Palette size={18} color={theme.primary} strokeWidth={2} />
          <View style={styles.headerTextCol}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Theme & Display
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Appearance and catalog view options
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          {/* Theme Mode Toggle */}
          <View style={[styles.settingRow, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Dark Mode</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {themeMode === 'dark' ? 'Dark scheme active' : 'Light scheme active'}
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={(val) => {
                const nextMode = val ? 'dark' : 'light';
                setThemeMode(nextMode);
                showToast(val ? 'Dark Mode Active' : 'Light Mode Active', 'info');
              }}
              trackColor={{ false: '#E5E5EA', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Catalog Display Layout Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Grid Layout (2-Column)</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                {viewMode === 'grid' ? 'Compact 2-column grid' : 'Single column list view'}
              </Text>
            </View>
            <Switch
              value={viewMode === 'grid'}
              onValueChange={(val) => {
                const nextMode = val ? 'grid' : 'list';
                if (onViewModeChange) onViewModeChange(nextMode);
                showToast(val ? '2-Column Grid Active' : 'List View Active', 'info');
              }}
              trackColor={{ false: '#E5E5EA', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* SECTION 2: Notification Controls */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.cardHeader, { borderBottomColor: theme.borderLight }]}>
          <Bell size={18} color={theme.primary} strokeWidth={2} />
          <View style={styles.headerTextCol}>
            <Text style={[styles.cardTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Notifications
            </Text>
            <Text style={[styles.cardSubTitle, { color: theme.textSecondary }]}>
              Real-time delivery vehicle and status alerts
            </Text>
          </View>
        </View>

        <View style={styles.settingRowsList}>
          <View style={[styles.settingRow, { borderBottomColor: theme.borderLight }]}>
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
                showToast(val ? 'Push Notifications enabled' : 'Push Notifications muted', 'info');
              }}
              trackColor={{ false: '#E5E5EA', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Vehicle Dispatch Alerts</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Real-time delivery proximity alerts
              </Text>
            </View>
            <Switch
              value={dispatchAlerts}
              onValueChange={(val) => {
                setDispatchAlerts(val);
                showToast(val ? 'Dispatch alerts ON' : 'Dispatch alerts OFF', 'info');
              }}
              disabled={!enableNotifications}
              trackColor={{ false: '#E5E5EA', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>WhatsApp Invoices</Text>
              <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                Delivery slips directly on WhatsApp
              </Text>
            </View>
            <Switch
              value={whatsappReceipts}
              onValueChange={(val) => {
                setWhatsappReceipts(val);
                showToast(val ? 'WhatsApp updates ON' : 'WhatsApp updates OFF', 'info');
              }}
              trackColor={{ false: '#E5E5EA', true: theme.primary }}
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 10,
  },
  headerTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardSubTitle: {
    fontSize: 12,
    marginTop: 2,
  },
  langItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  langLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  langIconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langTextGroup: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  langRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langValueText: {
    fontSize: 13,
    fontWeight: '500',
  },
  settingRowsList: {
    gap: 10,
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
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
