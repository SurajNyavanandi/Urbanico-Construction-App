import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Heart, ShoppingCart, ArrowRight, Sparkles, Check } from 'lucide-react-native';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';

interface FavoritesScreenProps {
  onSelectItemModal: (item: MaterialItem) => void;
  onNavigateHome: () => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  onSelectItemModal,
  onNavigateHome,
  favoriteIds = ['plastering-sand', 'stone-20mm'],
  onToggleFavorite,
}) => {
  const { theme, typography } = useTheme();
  const favorites = MATERIAL_ITEMS.filter((item) => favoriteIds.includes(item.id));
  const [addedToast, setAddedToast] = useState<string | null>(null);

  const triggerToast = (itemName: string) => {
    setAddedToast(`Added ${itemName} to Order Modal`);
    setTimeout(() => setAddedToast(null), 2000);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Toast Alert */}
      {addedToast && (
        <View style={[styles.toastContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}>
          <Check size={16} color={theme.primary} />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>{addedToast}</Text>
        </View>
      )}

      {/* Favorites List */}
      {favorites.length > 0 ? (
        <View style={styles.favoritesList}>
          {favorites.map((item) => (
            <View key={item.id} style={[styles.favoriteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {/* Product Thumbnail */}
              <View style={[styles.thumbnailWrapper, { backgroundColor: theme.surfaceSecondary }]}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.thumbnailImage}
                  resizeMode="cover"
                />
              </View>

              {/* Material Details */}
              <View style={styles.itemContent}>
                <View style={[styles.categoryBadge, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.categoryBadgeText, { color: theme.primaryDark }]}>
                    {item.categoryId.toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.subtitle || 'Premium Grade Supply'}
                </Text>

                <View style={[styles.cardBottomRow, { borderTopColor: theme.borderLight }]}>
                  <Text style={[styles.priceText, { color: theme.textPrimary }]}>
                    From ₹{(item.defaultPrice || item.options[0]?.price || 0).toLocaleString('en-IN')}
                  </Text>

                  <View style={styles.actionButtonsGroup}>
                    {onToggleFavorite && (
                      <TouchableOpacity
                        onPress={() => onToggleFavorite(item.id)}
                        activeOpacity={0.7}
                        style={styles.heartBtn}
                      >
                        <Heart size={14} color="#EF4444" fill="#EF4444" />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        onSelectItemModal(item);
                        triggerToast(item.name);
                      }}
                      activeOpacity={0.7}
                      style={[styles.cartBtn, { backgroundColor: theme.primary }]}
                    >
                      <ShoppingCart size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        /* Empty State */
        <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: theme.primaryLight }]}>
            <Heart size={28} color={theme.primaryDark} />
          </View>
          <View style={styles.emptyTextContainer}>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Favorites Saved</Text>
            <Text style={[styles.emptySubTitle, { color: theme.textSecondary }]}>
              Tap the heart icon on any material in the catalog to save it for instant reordering.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onNavigateHome}
            style={[styles.browseCatalogCta, { backgroundColor: theme.primary }]}
            activeOpacity={0.8}
          >
            <Text style={styles.browseCatalogText}>Browse Catalog</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 96,
    gap: 16,
  },
  toastContainer: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 8,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerBanner: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeftText: {
    gap: 2,
    flex: 1,
  },
  frequentTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frequentTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  bannerSubText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  countBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  favoritesList: {
    gap: 12,
  },
  favoriteCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  itemSubtitle: {
    fontSize: 11,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    borderWidth: 1,
    alignItems: 'center',
    gap: 16,
    marginVertical: 16,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTextContainer: {
    alignItems: 'center',
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubTitle: {
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  browseCatalogCta: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  browseCatalogText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
