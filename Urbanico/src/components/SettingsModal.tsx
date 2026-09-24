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
  Platform,
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
  const { theme, themeMode, setThemeMode, accentColor, setAccentColor } = useTheme();
  const { language, setLanguage, languageOptions, currentLanguageOption, t } = useLanguage();

  const [activeSubView, setActiveSubView] = useState<'main' | 'language'>('main');

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
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
                        {isSelected && <Check size={14} color={theme.primaryText || '#18181B'} strokeWidth={3} />}
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
                    }}
                    trackColor={{ false: '#E4E4E7', true: theme.primary || '#FCB026' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Brand Color Theme Palette Selector */}
                <View style={[styles.switchRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 10 }]}>
                  <View style={styles.switchRowLeft}>
                    <Palette size={16} color={theme.textPrimary} strokeWidth={2} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.settingTitle, { color: theme.textPrimary }]}>Brand Theme Color</Text>
                      <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                        Switch primary brand accent & button styling
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 10, width: '100%', paddingTop: 6, justifyContent: 'space-between' }}>
                    {[
                      { id: 'yellow', hex: '#FCB026' },
                      { id: 'black', hex: '#0F172A' },
                      { id: 'blue', hex: '#1E3A8A' },
                      { id: 'amber', hex: '#D97706' },
                      { id: 'green', hex: '#059669' },
                      { id: 'red', hex: '#DC2626' },
                      { id: 'purple', hex: '#7C3AED' },
                    ].map((pal) => {
                      const isSelected = accentColor === pal.id;
                      return (
                        <TouchableOpacity
                          key={pal.id}
                          onPress={() => setAccentColor(pal.id as any)}
                          activeOpacity={0.8}
                          accessibilityLabel={`Theme color ${pal.id}`}
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: pal.hex,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: isSelected ? 3 : 1,
                            borderColor: isSelected ? (themeMode === 'dark' ? '#FFFFFF' : '#18181B') : 'rgba(0,0,0,0.12)',
                            transform: [{ scale: isSelected ? 1.1 : 1 }],
                            ...Platform.select({
                              web: {
                                boxShadow: isSelected ? '0 3px 10px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.1)',
                              },
                              default: {
                                elevation: isSelected ? 4 : 1,
                              },
                            }),
                          }}
                        >
                          {isSelected && (
                            <Check size={18} color={pal.id === 'yellow' ? '#18181B' : '#FFFFFF'} strokeWidth={3} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
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
                    }}
                    trackColor={{ false: '#E4E4E7', true: theme.primary || '#FCB026' }}
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
                style={[styles.primaryDoneBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryDoneBtnText, { color: theme.buttonText || '#18181B' }]}>Back to Settings</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleModalClose}
                style={[styles.primaryDoneBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryDoneBtnText, { color: theme.buttonText || '#18181B' }]}>Done</Text>
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
    backgroundColor: '#FCB026',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryDoneBtnText: {
    color: '#18181B',
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

