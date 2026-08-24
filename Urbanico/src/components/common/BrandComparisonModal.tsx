import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import { Scale, Check, X, ShieldCheck, Sparkles, Award } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { MaterialItem } from '../../types';

interface BrandComparisonModalProps {
  visible: boolean;
  onClose: () => void;
  currentItem: MaterialItem | null;
  onSelectAlternative?: (item: any) => void;
}

export const BrandComparisonModal: React.FC<BrandComparisonModalProps> = ({
  visible,
  onClose,
  currentItem,
  onSelectAlternative,
}) => {
  const { theme } = useTheme();

  if (!currentItem) return null;

  const isCement = (currentItem.name + ' ' + currentItem.categoryId).toLowerCase().includes('cement');
  const isSteel = (currentItem.name + ' ' + currentItem.categoryId).toLowerCase().includes('bar') || (currentItem.name + ' ' + currentItem.categoryId).toLowerCase().includes('steel');

  const cementMatrix = [
    {
      brand: 'UltraTech Super',
      grade: 'OPC 53 Grade',
      strength28Day: '58.5 MPa',
      initialSetting: '125 mins',
      soundness: '1.2 mm',
      priceBag: 385,
      rating: '4.9 ★',
      badge: 'Best Workability',
      recommendedFor: 'Columns, Beams & Heavy Slabs',
    },
    {
      brand: 'ACC Suraksha Power',
      grade: 'PPC / Premium',
      strength28Day: '56.0 MPa',
      initialSetting: '140 mins',
      soundness: '1.5 mm',
      priceBag: 375,
      rating: '4.8 ★',
      badge: 'High Chemical Resistance',
      recommendedFor: 'Foundations & Coastal Zones',
    },
    {
      brand: 'Dalmia Supreme',
      grade: 'OPC 53 Grade',
      strength28Day: '57.2 MPa',
      initialSetting: '130 mins',
      soundness: '1.4 mm',
      priceBag: 365,
      rating: '4.7 ★',
      badge: 'Top Value',
      recommendedFor: 'Brickwork & Structural Concrete',
    },
  ];

  const steelMatrix = [
    {
      brand: 'Tata Tiscon 550D',
      grade: 'Fe 550D Super Ductile',
      yieldStrength: '595 N/mm²',
      elongation: '18.5 %',
      carbonPercent: '0.22 % (High Weldability)',
      priceTon: 54500,
      rating: '5.0 ★',
      badge: 'Earthquake Resistant',
      recommendedFor: 'High-Rise Multi-Story Frames',
    },
    {
      brand: 'JSW Neosteel 550D',
      grade: 'Fe 550D Pure TMT',
      yieldStrength: '585 N/mm²',
      elongation: '17.0 %',
      carbonPercent: '0.24 %',
      priceTon: 52400,
      rating: '4.9 ★',
      badge: 'High Corrosion Defense',
      recommendedFor: 'Bridges, Columns & Foundations',
    },
    {
      brand: 'Jindal Panther Fe550',
      grade: 'Fe 550 Parallel Rib',
      yieldStrength: '575 N/mm²',
      elongation: '16.5 %',
      carbonPercent: '0.25 %',
      priceTon: 50800,
      rating: '4.7 ★',
      badge: 'Economical Bulk',
      recommendedFor: 'Residential Slabs & Footings',
    },
  ];

  const matrix = isSteel ? steelMatrix : cementMatrix;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <Scale size={18} color="#111111" />
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                {isSteel ? 'TMT Steel Grade Comparison' : 'Cement Brand Benchmark'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.subHeading, { color: theme.textSecondary }]}>
              Comparing technical laboratory parameters certified under Bureau of Indian Standards (BIS):
            </Text>

            <View style={styles.matrixContainer}>
              {matrix.map((row: any, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.brandCard,
                    { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                  ]}
                >
                  <View style={styles.brandCardTop}>
                    <View>
                      <View style={styles.brandTitleRow}>
                        <Text style={[styles.brandName, { color: theme.textPrimary }]}>{row.brand}</Text>
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingText}>{row.rating}</Text>
                        </View>
                      </View>
                      <Text style={[styles.brandGrade, { color: theme.textSecondary }]}>{row.grade}</Text>
                    </View>

                    <View style={styles.badgePill}>
                      <Award size={11} color="#059669" />
                      <Text style={styles.badgePillText}>{row.badge}</Text>
                    </View>
                  </View>

                  {/* Spec Row List */}
                  <View style={styles.specRows}>
                    {isSteel ? (
                      <>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Yield / Tensile Strength</Text>
                          <Text style={[styles.specVal, { color: theme.textPrimary }]}>{row.yieldStrength}</Text>
                        </View>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Ductile Elongation</Text>
                          <Text style={[styles.specVal, { color: theme.textPrimary }]}>{row.elongation}</Text>
                        </View>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Benchmark Price</Text>
                          <Text style={styles.priceHighlight}>₹{row.priceTon.toLocaleString('en-IN')} / Ton</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>28-Day Compressive Strength</Text>
                          <Text style={[styles.specVal, { color: theme.textPrimary }]}>{row.strength28Day}</Text>
                        </View>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Initial Setting Time</Text>
                          <Text style={[styles.specVal, { color: theme.textPrimary }]}>{row.initialSetting}</Text>
                        </View>
                        <View style={styles.specRow}>
                          <Text style={styles.specLabel}>Benchmark Price</Text>
                          <Text style={styles.priceHighlight}>₹{row.priceBag.toLocaleString('en-IN')} / Bag</Text>
                        </View>
                      </>
                    )}
                    <View style={styles.specRow}>
                      <Text style={styles.specLabel}>Recommended Use</Text>
                      <Text style={[styles.specVal, { color: theme.textPrimary, fontStyle: 'italic' }]}>{row.recommendedFor}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Close Comparison</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  header: {
    padding: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    padding: 14,
    maxHeight: 420,
  },
  subHeading: {
    fontSize: 11.5,
    marginBottom: 12,
    lineHeight: 16,
  },
  matrixContainer: {
    gap: 10,
  },
  brandCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  brandCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  brandGrade: {
    fontSize: 11,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: '#FEF08A',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#854D0E',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  specRows: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 6,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  specVal: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  priceHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
  },
  doneBtn: {
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
