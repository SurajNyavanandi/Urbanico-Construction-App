import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, PhoneCall, Bot, User, CheckCheck, X, Truck, ShieldAlert, Sparkles, MapPin } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

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
  const activeOrderNum = orderNumber || delivery?.orderNumber || 'URB-HYD-9821';
  const activeDriverName = driverName || delivery?.driverName || 'Ramesh Goud';
  const activeDriverPhone = driverPhone || delivery?.driverPhone || '+91 98480 22341';
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm1',
      sender: 'system',
      text: `Connected to Central Dispatch Yard (Miyapur Hub). Active Order #${activeOrderNum} is assigned to Driver ${activeDriverName}.`,
      time: 'Just now',
    },
    {
      id: 'm2',
      sender: 'dispatcher',
      text: `Hello! I am Srikanth from Logistics. The 6-Wheeler Tipper has cleared the weighbridge and is on route via ORR Exit 3. How can I assist?`,
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
      let reply = `Understood. Driver ${activeDriverName} has been notified. Current distance from site is 3.4 km with expected arrival in ~18 minutes.`;

      if (currentQuery.includes('delay') || currentQuery.includes('traffic') || currentQuery.includes('where')) {
        reply = `Vehicle TS-08-UB-4491 is crossing Gachibowli flyover. Minor signal queue detected; ETA adjusted by +4 mins.`;
      } else if (currentQuery.includes('unloading') || currentQuery.includes('labor') || currentQuery.includes('crane')) {
        reply = `Hydraulic tipper unloading is included. Please ensure the site gate has clear 12-foot vertical clearance for body lift.`;
      } else if (currentQuery.includes('bill') || currentQuery.includes('slip') || currentQuery.includes('weight')) {
        reply = `Digital Weighbridge Gross tare slip #WB-MYP-8832 is attached to your digital invoice. Net weight verified: 10.00 MT.`;
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
    showToast(`Connecting secure masked line to Driver ${activeDriverName} (${activeDriverPhone})...`, 'info');
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingModalWrapper}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: '#111111' }]}>
              <View style={styles.headerLeft}>
                <View style={styles.dispatcherAvatar}>
                  <Truck size={16} color="#FFFFFF" />
                </View>
                <View>
                  <View style={styles.titleWithLiveRow}>
                    <Text style={styles.headerTitle}>Yard Dispatch Control</Text>
                    <View style={styles.onlineBadge}>
                      <View style={styles.onlineDot} />
                      <Text style={styles.onlineText}>LIVE</Text>
                    </View>
                  </View>
                  <Text style={styles.headerSub}>Order #{orderNumber} • Driver: {driverName}</Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity onPress={handleMaskedCall} style={styles.callBtn} activeOpacity={0.8}>
                  <PhoneCall size={14} color="#FFFFFF" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={18} color="#FFFFFF" />
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
                  <View key={m.id} style={styles.systemMsgBox}>
                    <Text style={styles.systemMsgText}>{m.text}</Text>
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
                  {!isMe && (
                    <View style={styles.avatarMini}>
                      <Bot size={12} color="#111111" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.msgBubble,
                      isMe
                        ? { backgroundColor: '#111111', borderBottomRightRadius: 2 }
                        : { backgroundColor: theme.surfaceSecondary, borderBottomLeftRadius: 2, borderColor: theme.border, borderWidth: 1 },
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
                          { color: isMe ? 'rgba(255,255,255,0.7)' : theme.textSecondary },
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
                <Text style={[styles.typingText, { color: theme.textSecondary }]}>Dispatcher is typing...</Text>
              </View>
            )}
          </ScrollView>

          {/* Quick Reply Chips */}
          <View style={styles.quickChipsRow}>
            {['Where is truck now?', 'Confirm unloader labor', 'Need weighbridge slip'].map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setInputVal(chip);
                }}
                style={[styles.quickChip, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Text style={[styles.quickChipText, { color: theme.textPrimary }]}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Input Bar */}
          <View style={[styles.inputBar, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              value={inputVal}
              onChangeText={setInputVal}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              placeholder="Ask dispatch or request delivery update..."
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.nativeChatInput,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                },
              ]}
            />
            <TouchableOpacity
              onPress={handleSend}
              style={[
                styles.sendBtn,
                { backgroundColor: inputVal.trim() ? '#111111' : '#A1A1AA' },
              ]}
              disabled={!inputVal.trim()}
              activeOpacity={0.8}
            >
              <Send size={15} color="#FFFFFF" />
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
    backgroundColor: 'rgba(0,0,0,0.6)',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    height: 520,
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dispatcherAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWithLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    color: '#22C55E',
    fontSize: 9,
    fontWeight: '800',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 14,
    gap: 10,
  },
  systemMsgBox: {
    backgroundColor: '#F4F4F5',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  systemMsgText: {
    fontSize: 11,
    color: '#71717A',
    textAlign: 'center',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '85%',
  },
  msgRowLeft: {
    alignSelf: 'flex-start',
  },
  msgRowRight: {
    alignSelf: 'flex-end',
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E4E4E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  msgText: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  msgFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 3,
  },
  msgTime: {
    fontSize: 9.5,
  },
  typingRow: {
    paddingHorizontal: 8,
  },
  typingText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  quickChipsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    overflow: 'scroll',
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nativeChatInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
