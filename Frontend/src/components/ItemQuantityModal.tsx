import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import { MaterialItem, UnitOption } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ItemQuantityModalProps {
  item: MaterialItem | null;
  onClose: () => void;
  onAddToCart: (
    item: MaterialItem,
    selectedOption: UnitOption,
    quantity: number,
    totalPrice: number
  ) => void;
}

export const ItemQuantityModal: React.FC<ItemQuantityModalProps> = ({
  item,
  onClose,
  onAddToCart,
}) => {
  const { theme, typography } = useTheme();

  // All Hooks MUST be called unconditionally at top level
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [selectedRadioOptionId, setSelectedRadioOptionId] = useState<string>('');
  const [globalQuantity, setGlobalQuantity] = useState<number>(2);

  // Sync state whenever the selected item changes
  useEffect(() => {
    if (!item) return;

    const isRadio = item.options.some((o) => o.type === 'radio');
    const initialQtyMap: Record<string, number> = {};
    item.options.forEach((opt, idx) => {
      if (opt.id === '12ft-3in') initialQtyMap[opt.id] = 20;
      else if (opt.id === '20ft-3in') initialQtyMap[opt.id] = 10;
      else if (opt.id === '20ft-8in') initialQtyMap[opt.id] = 50;
      else initialQtyMap[opt.id] = idx === 0 && !isRadio ? 1 : 0;
    });

    setOptionQuantities(initialQtyMap);
    setSelectedRadioOptionId(item.options[3]?.id || item.options[0]?.id || '');
    setGlobalQuantity(2);
  }, [item]);

  if (!item) return null;

  const isRadioType = item.options.some((o) => o.type === 'radio');

  const handleUpdateOptionQty = (optId: string, delta: number) => {
    setOptionQuantities((prev) => {
      const current = prev[optId] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [optId]: next };
    });
  };

  let calculatedTotal = 0;

  if (isRadioType) {
    const selectedOpt = item.options.find((o) => o.id === selectedRadioOptionId) || item.options[0];
    calculatedTotal = (selectedOpt?.price || 0) * globalQuantity;
  } else {
    item.options.forEach((opt) => {
      const qty = optionQuantities[opt.id] || 0;
      calculatedTotal += opt.price * qty;
    });
  }

  const handlePrimaryAdd = () => {
    if (isRadioType) {
      const selectedOpt = item.options.find((o) => o.id === selectedRadioOptionId) || item.options[0];
      if (selectedOpt && globalQuantity > 0) {
        onAddToCart(item, selectedOpt, globalQuantity, calculatedTotal);
      }
    } else {
      let addedAny = false;
      item.options.forEach((opt) => {
        const qty = optionQuantities[opt.id] || 0;
        if (qty > 0) {
          onAddToCart(item, opt, qty, opt.price * qty);
          addedAny = true;
        }
      });
      if (!addedAny && item.options[0]) {
        onAddToCart(item, item.options[0], 1, item.options[0].price);
      }
    }
    onClose();
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheetContainer, { backgroundColor: theme.surface }]}>
        {/* Modal Header */}
        <View style={[styles.modalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <View style={styles.headerTitleGroup}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              {item.name}
            </Text>
            {item.subtitle && (
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>({item.subtitle})</Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={theme.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Modal Body */}
        <ScrollView style={[styles.modalBody, { backgroundColor: theme.surfaceSecondary }]} contentContainerStyle={styles.bodyContent}>
          {isRadioType && (
            <Text style={[styles.selectLabel, { color: theme.textSecondary }]}>Select any one</Text>
          )}

          {isRadioType ? (
            <View style={[styles.radioContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {item.options.map((opt) => {
                const isSelected = selectedRadioOptionId === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    onPress={() => setSelectedRadioOptionId(opt.id)}
                    activeOpacity={0.7}
                    style={styles.radioOptionRow}
                  >
                    <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{opt.label}</Text>
                    <View style={styles.radioRightGroup}>
                      <Text style={[styles.optionPrice, { color: theme.textPrimary }]}>
                        ₹{opt.price.toLocaleString('en-IN')}
                      </Text>
                      <View
                        style={[
                          styles.outerRadioCircle,
                          isSelected
                            ? { borderColor: theme.primary }
                            : { borderColor: theme.border },
                        ]}
                      >
                        {isSelected && <View style={[styles.innerRadioCircle, { backgroundColor: theme.primary }]} />}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={[styles.stepperListContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {item.options.map((opt) => {
                const qty = optionQuantities[opt.id] || 0;
                return (
                  <View key={opt.id} style={[styles.stepperRow, { borderBottomColor: theme.borderLight }]}>
                    <Text style={[styles.stepperOptionLabel, { color: theme.textPrimary }]}>{opt.label}</Text>
                    <Text style={[styles.stepperOptionPrice, { color: theme.textPrimary }]}>₹{opt.price}</Text>
                    <View style={[styles.stepperBox, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
                      <TouchableOpacity
                        onPress={() => handleUpdateOptionQty(opt.id, -1)}
                        style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                      >
                        <Minus size={14} color={theme.textPrimary} strokeWidth={2.5} />
                      </TouchableOpacity>
                      <Text style={[styles.stepQtyText, { color: theme.textPrimary }]}>{qty}</Text>
                      <TouchableOpacity
                        onPress={() => handleUpdateOptionQty(opt.id, 1)}
                        style={[styles.stepBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
                        activeOpacity={0.7}
                      >
                        <Plus size={14} color={theme.textPrimary} strokeWidth={2.5} />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Modal Footer */}
        <View style={[styles.modalFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          {isRadioType && (
            <View style={[styles.globalStepperBox, { borderColor: theme.border, backgroundColor: theme.surfaceSecondary }]}>
              <TouchableOpacity
                onPress={() => setGlobalQuantity((q) => Math.max(1, q - 1))}
                style={styles.globalStepBtn}
                activeOpacity={0.7}
              >
                <Minus size={16} color={theme.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
              <Text style={[styles.globalQtyText, { color: theme.textPrimary }]}>{globalQuantity}</Text>
              <TouchableOpacity
                onPress={() => setGlobalQuantity((q) => q + 1)}
                style={styles.globalStepBtn}
                activeOpacity={0.7}
              >
                <Plus size={16} color={theme.textPrimary} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={handlePrimaryAdd}
            style={[styles.primaryAddCta, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <ShoppingCart size={16} color="#FFFFFF" />
            <Text style={styles.primaryAddCtaText}>
              Add to Cart | ₹{calculatedTotal.toLocaleString('en-IN')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    zIndex: 9999,
  },
  backdrop: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flex: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  bodyContent: {
    gap: 12,
    paddingBottom: 16,
  },
  selectLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  radioContainer: {
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
  },
  radioOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  radioRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  optionPrice: {
    fontSize: 14,
    fontWeight: '800',
  },
  outerRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRadioCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepperListContainer: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  stepperOptionLabel: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  stepperOptionPrice: {
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
  },
  stepBtn: {
    width: 24,
    height: 24,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepQtyText: {
    width: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  globalStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  globalStepBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  globalQtyText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
  },
  primaryAddCta: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryAddCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
