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
  Bell,
  Languages,
  ChevronRight,
  Sun,
  Grid2X2,
  ArrowLeft,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { themeMode, setThemeMode } = useTheme();
  const { languageOptions, currentLanguageOption, t } = useLanguage();
  const { showToast } = useToast();

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);

  // Notification Toggles State
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [dispatchAlerts, setDispatchAlerts] = useState(true);
  const [whatsappReceipts, setWhatsappReceipts] = useState(true);

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Top Navigation Bar */}
      <View style={styles.topNavBar}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          activeOpacity={0.7}
          accessibilityLabel="Go back to profile"
        >
          <ArrowLeft color="#111111" size={20} strokeWidth={2.2} />
        </TouchableOpacity>
        <Text style={styles.navBarTitle}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Prompt Modal */}
        <LanguagePromptModal
          isOpen={isLangModalOpen}
          onClose={() => setIsLangModalOpen(false)}
          onConfirm={(langCode) => {
            const opt = languageOptions.find((l) => l.code === langCode);
            if (opt) showToast(`Language changed to ${opt.nativeName}`, 'info');
          }}
        />

        {/* SECTION 0: Language Preferences (Nike Clean Inset Menu) */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            onPress={() => setIsLangModalOpen(true)}
            style={styles.menuRowOnly}
            activeOpacity={0.7}
          >
            <View style={styles.menuRowLeft}>
              <View style={styles.menuIconBox}>
                <Languages size={19} color="#111111" strokeWidth={1.8} />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.menuTitleText}>{t.language}</Text>
                <Text style={styles.menuSubText}>{t.languageSub}</Text>
              </View>
            </View>

            <View style={styles.menuRowRight}>
              <Text style={styles.subDetailText}>
                {currentLanguageOption.flag} {currentLanguageOption.nativeName}
              </Text>
              <ChevronRight size={18} color="#9CA3AF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: Theme & Display Layout */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Palette size={18} color="#111111" strokeWidth={2} />
            <Text style={styles.sectionHeaderTitle}>Theme & Display</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleRowLeft}>
              <Text style={styles.menuTitleText}>Dark Mode</Text>
              <Text style={styles.menuSubText}>
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
              trackColor={{ false: '#E5E7EB', true: '#111111' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleRowLast}>
            <View style={styles.toggleRowLeft}>
              <Text style={styles.menuTitleText}>Grid Layout (2-Column)</Text>
              <Text style={styles.menuSubText}>
                {viewMode === 'grid' ? 'Compact 2-column catalog' : 'Single column list view'}
              </Text>
            </View>
            <Switch
              value={viewMode === 'grid'}
              onValueChange={(val) => {
                const nextMode = val ? 'grid' : 'list';
                if (onViewModeChange) onViewModeChange(nextMode);
                showToast(val ? '2-Column Grid Active' : 'List View Active', 'info');
              }}
              trackColor={{ false: '#E5E7EB', true: '#111111' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* SECTION 2: Notification Controls */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Bell size={18} color="#111111" strokeWidth={2} />
            <Text style={styles.sectionHeaderTitle}>Notifications</Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleRowLeft}>
              <Text style={styles.menuTitleText}>Push Notifications</Text>
              <Text style={styles.menuSubText}>
                Order status and dispatch updates
              </Text>
            </View>
            <Switch
              value={enableNotifications}
              onValueChange={(val) => {
                setEnableNotifications(val);
                showToast(val ? 'Push Notifications enabled' : 'Push Notifications muted', 'info');
              }}
              trackColor={{ false: '#E5E7EB', true: '#111111' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleRowLeft}>
              <Text style={styles.menuTitleText}>Vehicle Dispatch Alerts</Text>
              <Text style={styles.menuSubText}>
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
              trackColor={{ false: '#E5E7EB', true: '#111111' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.toggleRowLast}>
            <View style={styles.toggleRowLeft}>
              <Text style={styles.menuTitleText}>WhatsApp Invoices</Text>
              <Text style={styles.menuSubText}>
                Delivery slips directly on WhatsApp
              </Text>
            </View>
            <Switch
              value={whatsappReceipts}
              onValueChange={(val) => {
                setWhatsappReceipts(val);
                showToast(val ? 'WhatsApp updates ON' : 'WhatsApp updates OFF', 'info');
              }}
              trackColor={{ false: '#E5E7EB', true: '#111111' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  topNavBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: {
    padding: 6,
    marginLeft: -6,
  },
  navBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.3,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 96,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.3,
  },
  menuRowOnly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  menuIconBox: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTitleText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111111',
    letterSpacing: -0.2,
  },
  menuSubText: {
    fontSize: 12,
    color: '#707072',
    marginTop: 1,
  },
  menuRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subDetailText: {
    fontSize: 13,
    color: '#707072',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  toggleRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  toggleRowLeft: {
    flex: 1,
    paddingRight: 14,
  },
});
