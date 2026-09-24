import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Globe, Check, Sparkles, Languages, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage, LanguageCode } from '../context/LanguageContext';
import { LoadingButton } from './common/LoadingButton';

interface LanguagePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (selectedLang: LanguageCode) => void;
}

export const LanguagePromptModal: React.FC<LanguagePromptModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { theme, typography } = useTheme();
  const { language, setLanguage, languageOptions, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>(language);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setLanguage(selectedLang);
      setIsSaving(false);
      if (onConfirm) onConfirm(selectedLang);
      onClose();
    }, 300);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header with Single Clear Close Button */}
          <View style={[styles.headerBox, { borderBottomColor: theme.borderLight }]}>
            <View style={styles.topActionRow}>
              <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
                <Languages size={20} color={theme.primary} />
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.headerBtn, { backgroundColor: theme.surfaceSecondary }]}
                activeOpacity={0.7}
                accessibilityLabel="Close language modal"
              >
                <X size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.title, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              {t.selectLanguagePromptTitle}
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              {t.selectLanguagePromptSub}
            </Text>
          </View>

          {/* Language Options List */}
          <View style={styles.optionsList}>
            {languageOptions.map((opt) => {
              const isSelected = selectedLang === opt.code;
              return (
                <TouchableOpacity
                  key={opt.code}
                  onPress={() => setSelectedLang(opt.code)}
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
                    <Text style={styles.flagText}>{opt.flag}</Text>
                    <View>
                      <View style={styles.nameRow}>
                        <Text
                          style={[
                            styles.nativeName,
                            { color: isSelected ? theme.primaryDark : theme.textPrimary },
                          ]}
                        >
                          {opt.nativeName}
                        </Text>
                        {opt.code === 'en' && (
                          <View style={[styles.defaultBadge, { backgroundColor: theme.primaryLight }]}>
                            <Text style={[styles.defaultBadgeText, { color: theme.primaryDark }]}>Default</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.regionText, { color: theme.textMuted }]}>
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

          {/* Action Footer */}
          <View style={styles.footerBox}>
            <LoadingButton
              title={t.confirmLanguage}
              onPress={handleSave}
              isLoading={isSaving}
              variant="primary"
            />
            <Text style={[styles.noteText, { color: theme.textMuted }]}>
              💡 {t.changeLanguageAnytime}
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  headerBox: {
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 6,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  optionsList: {
    gap: 10,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagText: {
    fontSize: 24,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: '700',
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  regionText: {
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBox: {
    gap: 10,
    paddingTop: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

