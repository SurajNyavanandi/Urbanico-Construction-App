import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Modal,
  Pressable,
} from 'react-native';
import {
  Palette,
  Bell,
  Languages,
  ChevronRight,
  X,
  Smartphone,
  ShieldCheck,
  Moon,
  LayoutGrid,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { LanguagePromptModal } from './LanguagePromptModal';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onClearRecentSearches?: () => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  onClose,
  viewMode = 'grid',
  onViewModeChange,
}) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { languageOptions, currentLanguageOption, t } = useLanguage();
  const { showToast } = useToast();

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Notification Toggles State
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [dispatchAlerts, setDispatchAlerts] = useState(true);
  const [whatsappReceipts, setWhatsappReceipts] = useState(true);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={[styles.headerIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <Palette size={18} color={theme.textPrimary} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>App Settings</Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  Preferences & Configurations
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              activeOpacity={0.7}
              accessibilityLabel="Close settings modal"
            >
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 1. Language Option */}
            <TouchableOpacity
              onPress={() => setIsLangModalOpen(true)}
              style={[styles.settingRowCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
              activeOpacity={0.75}
            >
              <View style={styles.settingRowLeft}>
                <View style={styles.iconCircle}>
                  <Languages size={18} color="#111111" strokeWidth={2} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>{t.language}</Text>
                  <Text style={[styles.settingSub, { color: theme.textSecondary }]}>{t.languageSub}</Text>
                </View>
              </View>
              <View style={styles.settingRowRight}>
                <Text style={[styles.settingValueText, { color: theme.textPrimary }]}>
                  {currentLanguageOption.flag} {currentLanguageOption.nativeName}
                </Text>
                <ChevronRight size={16} color={theme.textMuted} />
              </View>
            </TouchableOpacity>

            {/* 2. Theme & Display */}
            <Text style={[styles.sectionHeaderLabel, { color: theme.textMuted }]}>DISPLAY & THEME</Text>

            <View style={[styles.settingsGroupCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              {/* Dark Mode Switch */}
              <View style={styles.switchRow}>
                <View style={styles.switchRowLeft}>
                  <Moon size={16} color={theme.textPrimary} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Dark Mode</Text>
                    <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                      {themeMode === 'dark' ? 'Night scheme active' : 'High-contrast light scheme'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={(val) => {
                    const nextMode = val ? 'dark' : 'light';
                    setThemeMode(nextMode);
                    showToast(val ? 'Dark mode enabled' : 'Light mode enabled', 'info');
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#111111' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.innerDivider, { backgroundColor: theme.border }]} />

              {/* Grid Mode Switch */}
              <View style={styles.switchRow}>
                <View style={styles.switchRowLeft}>
                  <LayoutGrid size={16} color={theme.textPrimary} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>2-Column Grid Layout</Text>
                    <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                      {viewMode === 'grid' ? 'Compact two-column catalog' : 'Single-column list layout'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={viewMode === 'grid'}
                  onValueChange={(val) => {
                    const nextMode = val ? 'grid' : 'list';
                    if (onViewModeChange) onViewModeChange(nextMode);
                    showToast(val ? '2-Column Grid layout active' : 'List view active', 'info');
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#111111' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* 3. Notification Controls */}
            <Text style={[styles.sectionHeaderLabel, { color: theme.textMuted }]}>ALERTS & NOTIFICATIONS</Text>

            <View style={[styles.settingsGroupCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <View style={styles.switchRow}>
                <View style={styles.switchRowLeft}>
                  <Bell size={16} color={theme.textPrimary} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Order & Dispatch Push Alerts</Text>
                    <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                      Instant weighbridge tare weight & gate dispatch notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={enableNotifications}
                  onValueChange={(val) => {
                    setEnableNotifications(val);
                    showToast(val ? 'Order alerts enabled' : 'Order alerts muted', 'info');
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#111111' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.innerDivider, { backgroundColor: theme.border }]} />

              <View style={styles.switchRow}>
                <View style={styles.switchRowLeft}>
                  <Smartphone size={16} color={theme.textPrimary} strokeWidth={2} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>WhatsApp Invoices & E-Way Bills</Text>
                    <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                      Receive signed PDF receipts directly upon delivery sign-off
                    </Text>
                  </View>
                </View>
                <Switch
                  value={whatsappReceipts}
                  onValueChange={(val) => {
                    setWhatsappReceipts(val);
                    showToast(val ? 'WhatsApp delivery receipts enabled' : 'WhatsApp receipts paused', 'info');
                  }}
                  trackColor={{ false: '#E4E4E7', true: '#111111' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Security Badge */}
            <View style={[styles.securityBanner, { backgroundColor: theme.surfaceSecondary }]}>
              <ShieldCheck size={16} color="#059669" />
              <Text style={[styles.securityBannerText, { color: theme.textSecondary }]}>
                Urbanico PRO Builder Portal v2.6.4 • Verified 18% GST Compliant
              </Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.primaryDoneBtn} activeOpacity={0.85}>
              <Text style={styles.primaryDoneBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Embedded Language Prompt Modal */}
      <LanguagePromptModal
        isOpen={isLangModalOpen}
        onClose={() => setIsLangModalOpen(false)}
        onConfirm={(langCode) => {
          const opt = languageOptions.find((l) => l.code === langCode);
          if (opt) showToast(`Language changed to ${opt.nativeName}`, 'info');
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
    maxHeight: 460,
  },
  settingRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValueText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginTop: 4,
  },
  settingsGroupCard: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    gap: 12,
  },
  switchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  innerDivider: {
    height: StyleSheet.hairlineWidth,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 6,
    marginBottom: 10,
  },
  securityBannerText: {
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    alignItems: 'flex-end',
  },
  primaryDoneBtn: {
    backgroundColor: '#111111',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
