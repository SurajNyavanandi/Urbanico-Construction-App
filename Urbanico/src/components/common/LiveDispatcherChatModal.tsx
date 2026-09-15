import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, PhoneCall, Bot, User, CheckCheck, X, Truck, ShieldAlert, Sparkles, MapPin } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface Message {
  id: string;
  sender: 'user' | 'dispatcher' | 'system';
  text: string;
  time: string;
}

interface LiveDispatcherChatModalProps {
  visible?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  orderNumber?: string;
  driverName?: string;
  driverPhone?: string;
  delivery?: any;
}

export const LiveDispatcherChatModal: React.FC<LiveDispatcherChatModalProps> = ({
  visible,
  isOpen,
  onClose,
  orderNumber = 'URB-HYD-9821',
  driverName,
  driverPhone,
  delivery,
}) => {
  const isVisible = visible !== undefined ? visible : !!isOpen;
  const activeOrderNum = orderNumber || delivery?.orderNumber || 'URB-8821';
  const activeDriverName = driverName || delivery?.driverName || 'Assigned Delivery Partner';
  const activeDriverPhone = driverPhone || delivery?.driverPhone || 'Central Dispatch';
  const { theme } = useTheme();

  const isServiceOrder = Boolean(
    delivery?.vehicleType?.toLowerCase().includes('service') ||
    delivery?.materialName?.toLowerCase().includes('service')
  );

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'system',
      text: `Connected to Urbanico Support Desk. Active Order #${activeOrderNum} is assigned to ${activeDriverName}.`,
      time: 'Just now',
    },
    {
      id: 'm2',
      sender: 'dispatcher',
      text: isServiceOrder
        ? `Hello! I am your Urbanico service coordinator. Your verified trade specialist is scheduled and on track. How can I assist you with this booking?`
        : `Hello! I am your Urbanico dispatch coordinator. Your consignment (${delivery?.vehicleType || 'Commercial Transport'}) is in transit and moving on schedule. How can I assist?`,
      time: 'Just now',
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<any>(null);

  const handleSend = () => {
    if (!inputVal.trim()) return;

    const userMsg: Message = {
      id: 'user_' + Date.now(),
      sender: 'user',
      text: inputVal.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    const currentQuery = inputVal.trim().toLowerCase();
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      let reply = `Understood. ${activeDriverName} has been alerted. Current estimated arrival to your site is within the expected window.`;

      if (currentQuery.includes('delay') || currentQuery.includes('traffic') || currentQuery.includes('where')) {
        reply = `Dispatch tracking reports active transit along the delivery corridor. Transit ETA is confirmed on schedule.`;
      } else if (currentQuery.includes('unloading') || currentQuery.includes('labor') || currentQuery.includes('crane')) {
        reply = isServiceOrder
          ? `Trade specialists arrive with standard professional equipment. Please ensure site work areas are accessible.`
          : `Please ensure your site access and unloading bay are cleared for safe offloading.`;
      } else if (currentQuery.includes('bill') || currentQuery.includes('receipt') || currentQuery.includes('invoice') || currentQuery.includes('manifest')) {
        reply = `Your digital GST tax invoice and delivery manifest are always accessible in the Orders & Activity section.`;
      }

      const botMsg: Message = {
        id: 'bot_' + Date.now(),
        sender: 'dispatcher',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 1000);
  };

  const handleMaskedCall = () => {
    // Direct call action
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingModalWrapper}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Top Drag Indicator */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.2)' : '#CBD5E1' }]} />
            </View>

            {/* Clean Minimalist Header */}
            <View style={[styles.header, { borderBottomColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
              <View style={styles.headerLeft}>
                <View style={[styles.dispatcherAvatar, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
                  <Truck size={17} color={theme.primary || '#059669'} />
                  <View style={styles.onlineDot} />
                </View>
                <View style={{ gap: 2 }}>
                  <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Live Yard Dispatch</Text>
                  <Text style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>
                    Order #{activeOrderNum} • {activeDriverName}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={handleMaskedCall}
                  style={[styles.headerActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F8FAFC', borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}
                  activeOpacity={0.75}
                  accessibilityLabel="Call driver"
                >
                  <PhoneCall size={15} color={theme.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.headerActionBtn, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F8FAFC', borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}
                  activeOpacity={0.75}
                  accessibilityLabel="Close chat"
                >
                  <X size={16} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages Area */}
            <ScrollView
              ref={scrollRef}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((m) => {
                if (m.sender === 'system') {
                  return (
                    <View key={m.id} style={[styles.systemMsgBox, { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }]}>
                      <Text style={[styles.systemMsgText, { color: theme.textMuted }]}>{m.text}</Text>
                    </View>
                  );
                }

                const isMe = m.sender === 'user';
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.msgRow,
                      isMe ? styles.msgRowRight : styles.msgRowLeft,
                    ]}
                  >
                    <View
                      style={[
                        styles.msgBubble,
                        isMe
                          ? { backgroundColor: theme.mode === 'dark' ? '#334155' : '#0F172A', borderBottomRightRadius: 4 }
                          : { backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F1F5F9', borderBottomLeftRadius: 4 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.msgText,
                          { color: isMe ? '#FFFFFF' : theme.textPrimary },
                        ]}
                      >
                        {m.text}
                      </Text>
                      <View style={styles.msgFooterRow}>
                        <Text
                          style={[
                            styles.msgTime,
                            { color: isMe ? 'rgba(255,255,255,0.65)' : theme.textMuted },
                          ]}
                        >
                          {m.time}
                        </Text>
                        {isMe && <CheckCheck size={12} color="#38BDF8" />}
                      </View>
                    </View>
                  </View>
                );
              })}

              {isTyping && (
                <View style={styles.typingRow}>
                  <View style={[styles.typingDot, { backgroundColor: theme.primary || '#059669' }]} />
                  <Text style={[styles.typingText, { color: theme.textSecondary }]}>Dispatcher is replying...</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestions Horizontal Scroll */}
            <View style={styles.quickChipsWrapper}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.quickChipsContent}
              >
                {['Where is truck now?', 'Confirm unloader labor', 'Need delivery challan', 'Check site entrance'].map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setInputVal(chip);
                    }}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.06)' : '#F8FAFC',
                        borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quickChipText, { color: theme.textSecondary }]}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Modern Minimalist Input Bar */}
            <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F1F5F9' }]}>
              <TextInput
                value={inputVal}
                onChangeText={setInputVal}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                placeholder="Ask dispatch coordinator..."
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.nativeChatInput,
                  {
                    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                    backgroundColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                    color: theme.textPrimary,
                  },
                ]}
              />
              <TouchableOpacity
                onPress={handleSend}
                style={[
                  styles.sendBtn,
                  {
                    backgroundColor: inputVal.trim()
                      ? (theme.primary || '#059669')
                      : (theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                  },
                ]}
                disabled={!inputVal.trim()}
                activeOpacity={0.8}
              >
                <Send size={15} color={inputVal.trim() ? '#FFFFFF' : theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingModalWrapper: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    height: 520,
    width: '100%',
    overflow: 'hidden',
    borderTopWidth: 1,
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dispatcherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11.5,
    letterSpacing: -0.1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  systemMsgBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  systemMsgText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    maxWidth: '82%',
  },
  msgRowLeft: {
    alignSelf: 'flex-start',
  },
  msgRowRight: {
    alignSelf: 'flex-end',
  },
  msgBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  msgTime: {
    fontSize: 9.5,
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typingText: {
    fontSize: 11.5,
    fontStyle: 'italic',
  },
  quickChipsWrapper: {
    paddingVertical: 8,
  },
  quickChipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nativeChatInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 999,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
