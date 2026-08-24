import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import { TrendingUp, TrendingDown, Minus, Clock, BarChart3, X, ShieldAlert, Sparkles } from 'lucide-react-native';
import { COMMODITY_SPOT_RATES, CommodityRate } from '../../utils/commodityTicker';
import { useTheme } from '../../context/ThemeContext';

export const CommodityTickerBar: React.FC = () => {
  const { theme } = useTheme();
  const [selectedRate, setSelectedRate] = useState<CommodityRate | null>(null);

  return (
    <View style={[styles.container, { backgroundColor: theme.mode === 'dark' ? '#18181B' : '#F4F4F5', borderBottomColor: theme.border }]}>
      <View style={styles.badgeRow}>
        <View style={styles.livePulseDot} />
        <Text style={[styles.marketTitle, { color: theme.textPrimary }]}>SPOT INDEX</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {COMMODITY_SPOT_RATES.map((item) => {
          const isUp = item.change > 0;
          const isDown = item.change < 0;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedRate(item)}
              activeOpacity={0.7}
              style={[
                styles.tickerChip,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.tickerName, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.name.split('(')[0]}
              </Text>
              <Text style={[styles.tickerPrice, { color: theme.textPrimary }]}>
                ₹{item.currentPrice.toLocaleString('en-IN')}/{item.unit}
              </Text>
              <View style={styles.changeRow}>
                {isUp && <TrendingUp size={11} color="#16A34A" />}
                {isDown && <TrendingDown size={11} color="#DC2626" />}
                {!isUp && !isDown && <Minus size={11} color="#71717A" />}
                <Text
                  style={[
                    styles.changeText,
                    {
                      color: isUp ? '#16A34A' : isDown ? '#DC2626' : '#71717A',
                    },
                  ]}
                >
                  {item.changePercent > 0 ? `+${item.changePercent}%` : item.changePercent < 0 ? `${item.changePercent}%` : '0%'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Spot Price Trend Modal */}
      <Modal
        visible={!!selectedRate}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedRate(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setSelectedRate(null)} />
          {selectedRate && (
            <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{selectedRate.category} Spot Rate</Text>
                  </View>
                  <Text style={[styles.modalHeading, { color: theme.textPrimary }]}>
                    {selectedRate.name}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRate(null)} style={styles.closeBtn}>
                  <X size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Current Price Block */}
                <View style={[styles.priceHeroBox, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                  <View>
                    <Text style={styles.rateLabel}>Today's Benchmark Price</Text>
                    <Text style={[styles.rateValue, { color: theme.textPrimary }]}>
                      ₹{selectedRate.currentPrice.toLocaleString('en-IN')}
                      <Text style={styles.rateUnit}> / {selectedRate.unit}</Text>
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.trendBadge,
                      {
                        backgroundColor:
                          selectedRate.change > 0
                            ? '#DCFCE7'
                            : selectedRate.change < 0
                            ? '#FEE2E2'
                            : '#F4F4F5',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.trendBadgeText,
                        {
                          color:
                            selectedRate.change > 0
                              ? '#15803D'
                              : selectedRate.change < 0
                              ? '#B91C1C'
                              : '#52525B',
                        },
                      ]}
                    >
                      {selectedRate.change >= 0 ? `+₹${selectedRate.change}` : `-₹${Math.abs(selectedRate.change)}`} ({selectedRate.changePercent}%)
                    </Text>
                  </View>
                </View>

                {/* 7-Day Sparkline Bar Trend */}
                <View style={styles.trendSection}>
                  <View style={styles.sectionHeaderRow}>
                    <BarChart3 size={14} color={theme.textPrimary} />
                    <Text style={[styles.sectionHeading, { color: theme.textPrimary }]}>7-Day Daily Movement (₹)</Text>
                  </View>
                  <View style={[styles.sparklineContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
                    {selectedRate.sevenDayTrend.map((price, idx) => {
                      const min = Math.min(...selectedRate.sevenDayTrend);
                      const max = Math.max(...selectedRate.sevenDayTrend);
                      const range = max - min || 1;
                      const heightPercent = 30 + ((price - min) / range) * 55;
                      const isLatest = idx === selectedRate.sevenDayTrend.length - 1;
                      return (
                        <View key={idx} style={styles.sparkCol}>
                          <View style={styles.sparkBarTrack}>
                            <View
                              style={[
                                styles.sparkBarFill,
                                {
                                  height: `${heightPercent}%`,
                                  backgroundColor: isLatest ? '#111111' : '#94A3B8',
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.sparkDayLabel, { color: isLatest ? theme.textPrimary : theme.textSecondary }]}>
                            {idx === 6 ? 'Today' : `D-${6 - idx}`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>

                {/* Procurement Advice */}
                <View style={styles.adviceBox}>
                  <View style={styles.adviceHeaderRow}>
                    <Sparkles size={14} color="#047857" />
                    <Text style={styles.adviceHeading}>Procurement Intelligence</Text>
                  </View>
                  <Text style={styles.adviceText}>{selectedRate.recommendation}</Text>
                </View>

                <View style={styles.updateTimeRow}>
                  <Clock size={12} color={theme.textSecondary} />
                  <Text style={[styles.updateTimeText, { color: theme.textSecondary }]}>
                    Verified against Telangana Foundry & Mill indices ({selectedRate.lastUpdated})
                  </Text>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: '#E4E4E7',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#16A34A',
  },
  marketTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingLeft: 8,
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  tickerName: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 110,
  },
  tickerPrice: {
    fontSize: 11,
    fontWeight: '700',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
    maxWidth: 440,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  modalHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalHeaderLeft: {
    flex: 1,
    gap: 3,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#111111',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryTagText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 14,
    gap: 12,
    maxHeight: 400,
  },
  priceHeroBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rateLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  rateValue: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: 2,
  },
  rateUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  trendSection: {
    gap: 6,
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
  },
  sparklineContainer: {
    flexDirection: 'row',
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sparkCol: {
    alignItems: 'center',
    gap: 4,
    height: '100%',
    justifyContent: 'flex-end',
  },
  sparkBarTrack: {
    width: 14,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sparkBarFill: {
    width: '100%',
    borderRadius: 4,
  },
  sparkDayLabel: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  adviceBox: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 8,
  },
  adviceHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adviceHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  adviceText: {
    fontSize: 11.5,
    color: '#047857',
    lineHeight: 16,
  },
  updateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  updateTimeText: {
    fontSize: 10,
  },
});
