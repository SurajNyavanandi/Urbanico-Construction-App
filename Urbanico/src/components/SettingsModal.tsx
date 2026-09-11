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
  Languages,
  ChevronRight,
  X,
  ShieldCheck,
  Moon,
  LayoutGrid,
  ArrowLeft,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

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
  const { language, setLanguage, languageOptions, currentLanguageOption, t } = useLanguage();
  const { showToast } = useToast();

  const [activeSubView, setActiveSubView] = useState<'main' | 'language'>('main');

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    const opt = languageOptions.find((l) => l.code === code);
    if (opt) showToast(`Language changed to ${opt.nativeName}`, 'info');
    setActiveSubView('main');
  };

  const handleModalClose = () => {
    setActiveSubView('main');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleModalClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={handleModalClose} />
        <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <View style={styles.modalHeaderTitleRow}>
              {activeSubView === 'language' ? (
                <TouchableOpacity
                  onPress={() => setActiveSubView('main')}
                  style={[styles.headerIconCircle, { backgroundColor: theme.surfaceSecondary }]}
                  activeOpacity={0.7}
                  accessibilityLabel="Back to settings"
                >
                  <ArrowLeft size={18} color={theme.textPrimary} strokeWidth={2.2} />
                </TouchableOpacity>
              ) : (
                <View style={[styles.headerIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <Palette size={18} color={theme.textPrimary} strokeWidth={2} />
                </View>
              )}
              <View>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {activeSubView === 'language' ? 'Select Language' : 'App Settings'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                  {activeSubView === 'language' ? 'Choose your preferred language' : 'Preferences & Configurations'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleModalClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
              activeOpacity={0.7}
              accessibilityLabel="Close settings modal"
            >
              <X size={18} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          {activeSubView === 'language' ? (
            /* Language Sub-View */
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={{ gap: 10, paddingVertical: 4 }}>
                {languageOptions.map((opt) => {
                  const isSelected = language === opt.code;
                  return (
                    <TouchableOpacity
                      key={opt.code}
                      onPress={() => handleSelectLanguage(opt.code)}
                      activeOpacity={0.8}
                      style={[
                        styles.optionCard,
                        {
                          backgroundColor: isSelected ? theme.primaryLight : theme.surfaceSecondary,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={{ fontSize: 24 }}>{opt.flag}</Text>
                        <View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              style={{
                                fontSize: 15,
                                fontWeight: '700',
                                color: isSelected ? theme.primaryDark : theme.textPrimary,
                              }}
                            >
                              {opt.nativeName}
                            </Text>
                            {opt.code === 'en' && (
                              <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: theme.primaryLight }}>
                                <Text style={{ fontSize: 9.5, fontWeight: '700', color: theme.primaryDark }}>Default</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                            {opt.name} • {opt.region}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.radioCircle,
                          isSelected
                            ? { backgroundColor: theme.primary, borderColor: theme.primary }
                            : { borderColor: theme.border, backgroundColor: theme.surface },
                        ]}
                      >
                        {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            /* Main Settings Body */
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* 1. Language Option */}
              <Text style={[styles.sectionHeaderLabel, { color: theme.textMuted }]}>LANGUAGE & REGION</Text>

              <View style={[styles.settingsGroupCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                <TouchableOpacity
                  onPress={() => setActiveSubView('language')}
                  style={styles.switchRow}
                  activeOpacity={0.7}
                >
                  <View style={styles.switchRowLeft}>
                    <Languages size={16} color={theme.textPrimary} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                        {t.language}
                      </Text>
                      <Text style={[styles.settingSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {t.languageSub}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.settingRowRight}>
                    <Text style={[styles.settingValueText, { color: theme.textPrimary }]} numberOfLines={1}>
                      {currentLanguageOption.flag} {currentLanguageOption.nativeName}
                    </Text>
                    <ChevronRight size={15} color={theme.textMuted} />
                  </View>
                </TouchableOpacity>
              </View>

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

                {/* Grid Mode Switch */}
                <View style={styles.switchRow}>
                  <View style={styles.switchRowLeft}>
                    <LayoutGrid size={16} color={theme.textPrimary} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>2-Column Grid Layout</Text>
                      <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                        {viewMode === 'grid' ? 'Compact two-column catalog (Default)' : 'Single-column list layout'}
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

              {/* Security Badge */}
              <View style={[styles.securityBanner, { backgroundColor: theme.surfaceSecondary }]}>
                <ShieldCheck size={16} color="#059669" />
                <Text style={[styles.securityBannerText, { color: theme.textSecondary }]}>
                  Urbanico PRO Builder Portal v2.6.4 • Verified 18% GST Compliant
                </Text>
              </View>
            </ScrollView>
          )}

          {/* Modal Footer */}
          <View style={[styles.modalFooter, { borderTopColor: theme.border }]}>
            {activeSubView === 'language' ? (
              <TouchableOpacity
                onPress={() => setActiveSubView('main')}
                style={styles.primaryDoneBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryDoneBtnText}>Back to Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleModalClose} style={styles.primaryDoneBtn} activeOpacity={0.85}>
                <Text style={styles.primaryDoneBtnText}>Done</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
    zIndex: 9999,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '88%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
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
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 11.5,
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
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  settingRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  settingValueText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  sectionHeaderLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  settingsGroupCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  switchRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  innerDivider: {
    height: 1,
    marginLeft: 42,
  },
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  securityBannerText: {
    fontSize: 10.5,
    fontWeight: '600',
    flex: 1,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
  },
  primaryDoneBtn: {
    backgroundColor: '#111111',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

