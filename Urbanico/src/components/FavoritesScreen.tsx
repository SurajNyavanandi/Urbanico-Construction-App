import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Heart, ShoppingCart, ArrowRight, Sparkles, Check } from 'lucide-react-native';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { ShimmerImage } from './common/ShimmerImage';
import { EmptyState } from './common/EmptyState';
import { Toast } from './common/Toast';

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

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setAddedToast('Favorites list updated');
    }, 800);
  };

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={Boolean(addedToast)}
        message={addedToast || ''}
        type="info"
        onDismiss={() => setAddedToast(null)}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
      {/* Toast Alert */}
      {addedToast && (
        <View style={[styles.toastContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.primary }]}>
          <Check size={16} color={theme.primary} />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>{addedToast}</Text>
        </View>
      )}

        {/* Header Info */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Saved Favorites</Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
              {favorites.length} {favorites.length === 1 ? 'material' : 'materials'} saved for quick ordering
            </Text>
          </View>
        </View>

        {/* Favorites List */}
        {favorites.length > 0 ? (
          <View style={styles.favoritesList}>
            {favorites.map((item) => (
              <View key={item.id} style={[styles.favoriteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                {/* Product Thumbnail */}
                <View style={[styles.thumbnailWrapper, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderLight }]}>
                  <ShimmerImage
                    source={{ uri: item.image }}
                    style={styles.thumbnailImage}
                    resizeMode="cover"
                    borderRadius={10}
                    preset="thumbnail"
                  />
                </View>

                {/* Material Details */}
                <View style={styles.itemContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {onToggleFavorite && (
                      <TouchableOpacity
                        onPress={() => onToggleFavorite(item.id)}
                        activeOpacity={0.7}
                        style={[styles.heartBtn, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}
                      >
                        <Heart size={13} color="#EF4444" fill="#EF4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                    {item.categoryId.toUpperCase()} • {item.subtitle || 'Premium Grade'}
                  </Text>

                  <View style={styles.cardBottomRow}>
                    <Text style={[styles.priceText, { color: theme.textPrimary }]}>
                      From ₹{(item.defaultPrice || item.options[0]?.price || 0).toLocaleString('en-IN')}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        onSelectItemModal(item);
                        triggerToast(item.name);
                      }}
                      activeOpacity={0.8}
                      style={[styles.cartBtn, { backgroundColor: theme.primary }]}
                    >
                      <ShoppingCart size={13} color="#FFFFFF" />
                      <Text style={styles.cartBtnText}>Order</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
        <EmptyState
          type="empty-favorites"
          onAction={onNavigateHome}
          actionLabel="Browse Catalog"
        />
      )}
    </ScrollView>
    </View>
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
    gap: 14,
  },
  toastContainer: {
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    marginBottom: 4,
  },
  toastText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 2,
  },
  favoritesList: {
    gap: 10,
  },
  favoriteCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  thumbnailWrapper: {
    width: 68,
    height: 68,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '400',
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
  },
  heartBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cartBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
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
