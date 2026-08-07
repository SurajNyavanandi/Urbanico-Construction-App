import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Globe, Check, Sparkles, Languages } from 'lucide-react-native';
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

  if (!isOpen) return null;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setLanguage(selectedLang);
      setIsSaving(false);
      if (onConfirm) onConfirm(selectedLang);
      onClose();
    }, 400);
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.headerBox, { borderBottomColor: theme.borderLight }]}>
            <View style={[styles.iconCircle, { backgroundColor: theme.primaryLight }]}>
              <Languages size={24} color={theme.primary} />
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
                    {isSelected && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
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
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
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
    fontSize: 22,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nativeName: {
    fontSize: 15,
    fontWeight: '800',
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  regionText: {
    fontSize: 11,
    marginTop: 2,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBox: {
    gap: 10,
    marginTop: 4,
  },
  noteText: {
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '500',
  },
});
