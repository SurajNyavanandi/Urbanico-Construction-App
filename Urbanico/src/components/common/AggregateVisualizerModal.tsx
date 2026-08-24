import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Pressable } from 'react-native';
import { Eye, Ruler, Check, X, Sparkles, Layers, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface AggregateVisualizerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AggregateVisualizerModal: React.FC<AggregateVisualizerModalProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const [selectedSize, setSelectedSize] = useState<string>('20mm');

  const sizes = [
    {
      id: 'fine-msand',
      name: 'M-Sand (Zone II Fine)',
      sizeMm: '0.15mm – 2.36mm',
      visualWidth: 12,
      grainColor: '#A1A1AA',
      description: 'Manufactured sand with cubic particle distribution for plastering and concrete mix.',
      usage: 'Brick masonry, PCC, Plastering, Ready-Mix Concrete',
      siltContent: '< 2.0% silt (washed)',
    },
    {
      id: '10mm',
      name: '10mm Blue Metal (Grit)',
      sizeMm: '6.3mm – 10mm',
      visualWidth: 28,
      grainColor: '#64748B',
      description: 'Clean angular granite aggregate used in RCC column packing and precast blocks.',
      usage: 'Precast products, thin RCC slabs, paver blocks',
      siltContent: 'Nil / IS 383 compliant',
    },
    {
      id: '20mm',
      name: '20mm Blue Metal (Standard Coarse)',
      sizeMm: '12.5mm – 20mm',
      visualWidth: 54,
      grainColor: '#475569',
      description: 'Standard structural coarse aggregate for all reinforced concrete (M20, M25, M30 grades).',
      usage: 'Footings, heavy RCC columns, roof slabs, beams',
      siltContent: 'Flakiness index < 15%',
    },
    {
      id: '40mm',
      name: '40mm Blue Metal (Heavy Coarse)',
      sizeMm: '25mm – 40mm',
      visualWidth: 86,
      grainColor: '#334155',
      description: 'Large angular stones engineered for massive foundation blinding, PCC, and road sub-bases.',
      usage: 'Mass concrete, retaining walls, foundation beds',
      siltContent: 'High crushing strength > 300 kN',
    },
  ];

  const activeObj = sizes.find((s) => s.id === selectedSize) || sizes[2];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View style={styles.headerTitleRow}>
              <Ruler size={18} color="#111111" />
              <Text style={[styles.title, { color: theme.textPrimary }]}>
                Grain & Aggregate Sizing Scale
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Size Selector Tabs */}
            <View style={styles.sizeTabsRow}>
              {sizes.map((s) => {
                const isSel = s.id === selectedSize;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => setSelectedSize(s.id)}
                    style={[
                      styles.sizeTab,
                      isSel
                        ? { backgroundColor: '#111111', borderColor: '#111111' }
                        : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.sizeTabText,
                        { color: isSel ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {s.id.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Interactive Visualizer Canvas with Ruler */}
            <View style={[styles.visualizerStage, { backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
              {/* Scale Tick Marks */}
              <View style={styles.rulerContainer}>
                {[0, 10, 20, 30, 40, 50].map((mm) => (
                  <View key={mm} style={styles.rulerTickCol}>
                    <View style={styles.rulerTickMark} />
                    <Text style={styles.rulerTickText}>{mm}mm</Text>
                  </View>
                ))}
              </View>

              {/* Physical Grain Shape Demo */}
              <View style={styles.grainStage}>
                <View
                  style={[
                    styles.grainShape,
                    {
                      width: activeObj.visualWidth,
                      height: activeObj.visualWidth * 0.85,
                      backgroundColor: activeObj.grainColor,
                    },
                  ]}
                >
                  <View style={styles.grainFacetHighlight} />
                </View>
                <Text style={[styles.grainLabel, { color: theme.textPrimary }]}>
                  {activeObj.sizeMm} Actual Sieve Fraction
                </Text>
              </View>
            </View>

            {/* Technical Specifications */}
            <View style={[styles.detailsCard, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <Text style={[styles.detailsHeading, { color: theme.textPrimary }]}>
                {activeObj.name}
              </Text>
              <Text style={[styles.detailsDesc, { color: theme.textSecondary }]}>
                {activeObj.description}
              </Text>

              <View style={styles.specDivider} />

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Recommended Concrete Application:</Text>
                <Text style={[styles.metaVal, { color: theme.textPrimary }]}>{activeObj.usage}</Text>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Quality / Impurity Standard:</Text>
                <Text style={[styles.metaVal, { color: '#059669', fontWeight: '700' }]}>{activeObj.siltContent}</Text>
              </View>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity onPress={onClose} style={styles.doneBtn} activeOpacity={0.85}>
              <Text style={styles.doneBtnText}>Close Sizing Guide</Text>
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
    maxWidth: 440,
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
    maxHeight: 440,
    gap: 12,
  },
  sizeTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  sizeTab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sizeTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  visualizerStage: {
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rulerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
  },
  rulerTickCol: {
    alignItems: 'center',
  },
  rulerTickMark: {
    width: 1.5,
    height: 6,
    backgroundColor: '#64748B',
  },
  rulerTickText: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  grainStage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  grainShape: {
    borderRadius: 8,
    transform: [{ rotate: '12deg' }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    position: 'relative',
  },
  grainFacetHighlight: {
    position: 'absolute',
    top: 3,
    left: 4,
    width: '40%',
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 4,
  },
  grainLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  detailsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 6,
    marginTop: 6,
  },
  detailsHeading: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  detailsDesc: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  specDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 4,
  },
  metaRow: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 11.5,
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
