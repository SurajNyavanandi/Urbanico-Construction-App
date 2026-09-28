import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ShoppingBag, Trash2 } from 'lucide-react-native';
import { AppText } from '../../common/AppText';
import { ShimmerImage } from '../../common/ShimmerImage';
import { PriceTag } from '../../common/PriceTag';
import { CartItem } from '../../../types';
import { useTheme } from '../../../context/ThemeContext';

export interface SavedForLaterListProps {
  items: CartItem[];
  onMoveToCart: (item: CartItem) => void;
  onRemove: (id: string) => void;
}

export const SavedForLaterList: React.FC<SavedForLaterListProps> = ({
  items,
  onMoveToCart,
  onRemove,
}) => {
  const { theme } = useTheme();

  if (!items || items.length === 0) return null;

  return (
    <View style={styles.container}>
      <AppText style={[styles.sectionTitle, { color: theme.textPrimary }]} weight="bold">
        Saved For Later ({items.length})
      </AppText>

      <View style={styles.list}>
        {items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.cardContent}>
              <View style={styles.imageWrapper}>
                <ShimmerImage source={{ uri: item.image }} style={styles.image} contentFit="cover" />
              </View>

              <View style={styles.info}>
                <AppText style={[styles.name, { color: theme.textPrimary }]} weight="bold" numberOfLines={1}>
                  {item.itemName}
                </AppText>
                <AppText style={[styles.spec, { color: theme.textSecondary }]}>
                  {item.selectedOptionLabel || 'Standard Spec'}
                </AppText>
                <PriceTag price={item.unitPrice * (item.quantity || 1)} size="sm" />
              </View>
            </View>

            <View style={[styles.actions, { borderTopColor: theme.borderLight }]}>
              <TouchableOpacity
                onPress={() => onMoveToCart(item)}
                activeOpacity={0.8}
                style={[styles.moveBtn, { backgroundColor: theme.primary }]}
              >
                <ShoppingBag size={14} color="#18181B" />
                <AppText style={styles.moveBtnText} weight="bold">
                  Move to Cart
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onRemove(item.id)}
                activeOpacity={0.7}
                style={styles.removeBtn}
              >
                <Trash2 size={14} color={theme.error || '#EF4444'} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  imageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F4F4F5',
    marginRight: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 13,
  },
  spec: {
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  moveBtnText: {
    fontSize: 11,
    color: '#18181B',
  },
  removeBtn: {
    padding: 6,
  },
});
