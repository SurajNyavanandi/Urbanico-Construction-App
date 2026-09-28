import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Trash2, Bookmark } from 'lucide-react-native';
import { AppText } from '../../common/AppText';
import { ShimmerImage } from '../../common/ShimmerImage';
import { QuantityStepper } from '../../common/QuantityStepper';
import { PriceTag } from '../../common/PriceTag';
import { CartItem } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

export interface CartItemListProps {
  items: CartItem[];
  onIncrement: (cartId: string, currentQty: number) => void;
  onDecrement: (cartId: string, currentQty: number) => void;
  onRemove: (cartId: string) => void;
  onSaveForLater: (item: CartItem) => void;
}

export const CartItemList: React.FC<CartItemListProps> = ({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onSaveForLater,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.listContainer}>
      {items.map((item) => {
        const isService = item.categoryName === 'services' || item.itemId.startsWith('service-');

        return (
          <View
            key={item.id}
            style={[
              styles.itemCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.imageWrapper}>
                <ShimmerImage
                  source={{ uri: item.image }}
                  style={styles.image}
                  contentFit="cover"
                />
              </View>

              <View style={styles.detailsWrapper}>
                <AppText style={[styles.itemName, { color: theme.textPrimary }]} weight="bold" numberOfLines={2}>
                  {item.itemName}
                </AppText>

                <View style={styles.optionBadge}>
                  <AppText style={[styles.optionText, { color: theme.textSecondary }]} weight="medium">
                    {item.selectedOptionLabel || 'Standard Spec'}
                  </AppText>
                </View>

                <PriceTag
                  price={item.unitPrice * (item.quantity || 1)}
                  size="md"
                  unit={isService ? 'Service Fee' : undefined}
                />
              </View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: theme.borderLight }]}>
              <View style={styles.actionsLeft}>
                <TouchableOpacity
                  onPress={() => onSaveForLater(item)}
                  activeOpacity={0.7}
                  style={styles.actionBtn}
                >
                  <Bookmark size={14} color={theme.textSecondary} />
                  <AppText style={[styles.actionBtnText, { color: theme.textSecondary }]} weight="medium">
                    Save for Later
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onRemove(item.id)}
                  activeOpacity={0.7}
                  style={styles.actionBtn}
                >
                  <Trash2 size={14} color={theme.error || '#EF4444'} />
                  <AppText style={[styles.actionBtnText, { color: theme.error || '#EF4444' }]} weight="medium">
                    Remove
                  </AppText>
                </TouchableOpacity>
              </View>

              <QuantityStepper
                quantity={item.quantity || 1}
                onIncrement={() => onIncrement(item.id, item.quantity || 1)}
                onDecrement={() => onDecrement(item.id, item.quantity || 1)}
                size="sm"
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: 12,
    marginBottom: 16,
  },
  itemCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  imageWrapper: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#F4F4F5',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  detailsWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    lineHeight: 18,
  },
  optionBadge: {
    marginVertical: 4,
  },
  optionText: {
    fontSize: 11,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 11,
  },
});
