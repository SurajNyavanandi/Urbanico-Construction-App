import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import {
  Bell,
  Truck,
  CheckCircle2,
  Tag,
  X,
  Sparkles,
  Clock,
  Trash2,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { soundService } from '../utils/soundHelper';

export interface SiteNotification {
  id: string;
  type: 'dispatch' | 'delivery' | 'combo' | 'rate';
  title: string;
  message: string;
  time: string;
  isUnread: boolean;
  linkText?: string;
  onAction?: () => void;
}

const INITIAL_NOTIFICATIONS: SiteNotification[] = [
  {
    id: 'notif-1',
    type: 'rate',
    title: 'Transparent Per-KM Freight Active',
    message: 'Logistics fleet auto-calibrates from micro cargo tempos to multi-axle tippers. Fair rates scaled to exact order weight.',
    time: 'Today',
    isUnread: true,
  },
  {
    id: 'notif-2',
    type: 'combo',
    title: 'Quarry-Direct Material Rates',
    message: 'Explore factory-sealed cement, certified aggregates, and verified trade services with instant tax invoicing.',
    time: 'Today',
    isUnread: false,
  },
];

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
  onNavigateScreen?: (screen: any) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  visible,
  onClose,
  onNavigateScreen,
}) => {
  const { theme, typography } = useTheme();
  const [notifications, setNotifications] = useState<SiteNotification[]>(INITIAL_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  useEffect(() => {
    if (visible && unreadCount > 0) {
      soundService.playNotification();
    }
  }, [visible, unreadCount]);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleItemPress = (notif: SiteNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, isUnread: false } : n))
    );
    if (!onNavigateScreen) return;
    onClose();
    if (notif.type === 'dispatch' || notif.type === 'delivery') {
      onNavigateScreen('activity');
    } else if (notif.type === 'combo' || notif.type === 'rate') {
      onNavigateScreen('shop');
    } else {
      onNavigateScreen('home');
    }
  };

  const getIcon = (type: SiteNotification['type']) => {
    switch (type) {
      case 'dispatch':
        return <Truck size={18} color="#0284C7" strokeWidth={2.2} />;
      case 'delivery':
        return <CheckCircle2 size={18} color="#059669" strokeWidth={2.2} />;
      case 'combo':
        return <Sparkles size={18} color="#D97706" strokeWidth={2.2} />;
      case 'rate':
        return <Tag size={18} color="#7C3AED" strokeWidth={2.2} />;
      default:
        return <Bell size={18} color={theme.textPrimary} strokeWidth={2.2} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContainer,
            { backgroundColor: theme.background, borderColor: theme.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.bellIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <Bell size={18} color={theme.textPrimary} strokeWidth={2.2} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                  Notifications
                </Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                  {unreadCount > 0 ? `${unreadCount} new site updates` : 'All caught up'}
                </Text>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllAsRead}
                  style={styles.markReadBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.markReadText}>Mark read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.surfaceSecondary }]}
                activeOpacity={0.7}
              >
                <X size={18} color={theme.textPrimary} strokeWidth={2.2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.scrollList}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                  <CheckCircle2 size={32} color="#059669" strokeWidth={2} />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                  No New Notifications
                </Text>
                <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
                  You'll receive live alerts here when your materials are dispatched or out for delivery.
                </Text>
              </View>
            ) : (
              notifications.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => handleItemPress(item)}
                  style={[
                    styles.notificationCard,
                    {
                      backgroundColor: item.isUnread
                        ? theme.mode === 'dark'
                          ? '#1E293B'
                          : '#F8FAFC'
                        : theme.surface,
                      borderColor: item.isUnread
                        ? theme.mode === 'dark'
                          ? '#334155'
                          : '#CBD5E1'
                        : theme.border,
                    },
                  ]}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.typeIconWrapper}>{getIcon(item.type)}</View>
                    <View style={styles.cardTitleCol}>
                      <View style={styles.titleWithBadge}>
                        <Text style={[styles.notifTitle, { color: theme.textPrimary }]}>
                          {item.title}
                        </Text>
                        {item.isUnread && <View style={styles.unreadDot} />}
                      </View>
                      <View style={styles.timeRow}>
                        <Clock size={11} color={theme.textMuted} />
                        <Text style={[styles.timeText, { color: theme.textMuted }]}>
                          {item.time}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text style={[styles.notifMessage, { color: theme.textSecondary }]}>
                    {item.message}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          {notifications.length > 0 && (
            <View style={[styles.footerRow, { borderTopColor: theme.border }]}>
              <TouchableOpacity
                onPress={handleClearAll}
                style={styles.clearBtn}
                activeOpacity={0.7}
              >
                <Trash2 size={14} color="#DC2626" />
                <Text style={styles.clearBtnText}>Clear all alerts</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '82%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markReadBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 10,
  },
  notificationCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  typeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitleCol: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0284C7',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
});
