import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { useToast } from '../context/ToastContext';
import { useCartActions } from '../hooks/useCartActions';
import { useTheme, useTypography, useRadius } from '../theme';
import { ProductCard } from './common/ProductCard';
import { ProductCardSkeleton } from './common/SkeletonLoader';

interface FavoritesScreenProps {
  items?: MaterialItem[];
  onSelectItemModal: (item: MaterialItem) => void;
  onNavigateHome: () => void;
  onExploreCatalog?: () => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  onAddAllToCart?: (items: MaterialItem[]) => void;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  items,
  onSelectItemModal,
  onNavigateHome,
  onExploreCatalog,
  favoriteIds = [],
  onToggleFavorite,
  onAddAllToCart,
  isLoggedIn = false,
  onOpenLoginModal,
}) => {
  const { theme } = useTheme();
  const typography = useTypography();
  const radius = useRadius();

  const { showToast } = useToast();
  const { addMaterialWithFeedback } = useCartActions();
  const sourceItems = items && items.length > 0 ? items : MATERIAL_ITEMS;
  const favorites = sourceItems.filter((item) => favoriteIds.includes(item.id));
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const handleAddAllFavorites = () => {
    if (favorites.length === 0) return;
    if (onAddAllToCart) {
      onAddAllToCart(favorites);
    } else {
      favorites.forEach((fav) => addMaterialWithFeedback(fav, undefined, 1, { silent: true }));
    }
    showToast(`Added ${favorites.length} favorite items to Cart!`, 'success');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary, fontSize: typography.fontSize['3xl'] }]}>
              Favorites
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
              {favorites.length} Saved {favorites.length === 1 ? 'Material' : 'Materials'}
            </Text>
          </View>

          {favorites.length > 0 && (
            <TouchableOpacity
              onPress={handleAddAllFavorites}
              style={[styles.addAllBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Add all favorites to cart"
            >
              <ShoppingCart size={14} color={theme.buttonText || '#18181B'} />
              <Text style={[styles.addAllBtnText, { color: theme.buttonText || '#18181B' }]}>
                Add All to Cart
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {refreshing ? (
          <View style={styles.gridContainer}>
            <ProductCardSkeleton width="48%" />
            <ProductCardSkeleton width="48%" />
            <ProductCardSkeleton width="48%" />
            <ProductCardSkeleton width="48%" />
          </View>
        ) : favorites.length > 0 ? (
          <View style={styles.gridContainer}>
            {favorites.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                width="48%"
                viewMode="grid"
                isFavorite={true}
                onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                onPress={() => onSelectItemModal(item)}
              />
            ))}
          </View>
        ) : (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
              <Heart size={36} color={theme.primary} strokeWidth={1.6} />
            </View>

            <Text style={[styles.emptyTitleText, { color: theme.textPrimary }]}>
              Your Favorites list is empty
            </Text>

            <Text style={[styles.emptyNoticeText, { color: theme.textSecondary }]}>
              Tap the heart icon on any building material or trade service to save it here for fast re-ordering.
            </Text>

            <TouchableOpacity
              onPress={() => {
                if (onExploreCatalog) {
                  onExploreCatalog();
                } else {
                  onNavigateHome();
                }
              }}
              style={[styles.loginPill, { backgroundColor: theme.buttonBg || theme.primary }]}
              activeOpacity={0.85}
            >
              <Text style={[styles.loginPillText, { color: theme.buttonText || '#18181B' }]}>
                Explore Materials
              </Text>
            </TouchableOpacity>

            {!isLoggedIn && (
              <TouchableOpacity
                onPress={() => {
                  if (onOpenLoginModal) {
                    onOpenLoginModal();
                  } else {
                    onNavigateHome();
                  }
                }}
                style={styles.exploreLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.exploreLinkText, { color: theme.primary }]}>
                  Log In to sync Favorites across devices
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
    padding: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  addAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitleText: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptyNoticeText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 280,
    lineHeight: 19,
  },
  loginPill: {
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPillText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  exploreLink: {
    marginTop: 14,
    paddingVertical: 6,
  },
  exploreLinkText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});

export default FavoritesScreen;
