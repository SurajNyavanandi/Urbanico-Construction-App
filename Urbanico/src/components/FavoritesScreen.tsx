import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { Heart, Plus, ShoppingCart, Bookmark, Trash2 } from 'lucide-react-native';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
import { useTheme, useTypography, useSpacing, useRadius } from '../theme';
import { ShimmerImage } from './common/ShimmerImage';
import { soundService } from '../utils/soundHelper';
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
  isLoggedIn = true,
  onOpenLoginModal,
}) => {
  const { theme } = useTheme();
  const typography = useTypography();
  const spacing = useSpacing();
  const radius = useRadius();

  const { showToast } = useToast();
  const { savedForLaterItems, moveToCart, removeSavedForLater } = useCart();
  const [activeTab, setActiveTab] = useState<'favorites' | 'saved_for_later'>('favorites');
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
    if (activeTab === 'favorites') {
      if (favorites.length === 0) return;
      if (onAddAllToCart) {
        onAddAllToCart(favorites);
      } else {
        favorites.forEach((fav) => onSelectItemModal(fav));
      }
      showToast(`Added ${favorites.length} saved supplies to Cart!`, 'success');
    } else {
      if (savedForLaterItems.length === 0) return;
      savedForLaterItems.forEach((it) => moveToCart(it));
      showToast(`Moved all ${savedForLaterItems.length} items to Cart!`, 'success');
    }
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
        {/* Segmented Switcher for Favourites & Saved for Later */}
        <View style={[styles.segmentedContainer, { backgroundColor: theme.surfaceSecondary, borderRadius: radius.lg }]}>
          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            style={[
              styles.segmentBtn,
              activeTab === 'favorites' && [styles.segmentBtnActive, { backgroundColor: theme.surface }],
            ]}
            activeOpacity={0.8}
          >
            <Heart
              size={15}
              color={activeTab === 'favorites' ? theme.primary : theme.textSecondary}
              fill={activeTab === 'favorites' ? theme.primary : 'transparent'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                { color: activeTab === 'favorites' ? theme.textPrimary : theme.textSecondary },
                activeTab === 'favorites' && styles.segmentBtnTextActive,
              ]}
            >
              Favourites ({favorites.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('saved_for_later')}
            style={[
              styles.segmentBtn,
              activeTab === 'saved_for_later' && [styles.segmentBtnActive, { backgroundColor: theme.surface }],
            ]}
            activeOpacity={0.8}
          >
            <Bookmark
              size={15}
              color={activeTab === 'saved_for_later' ? theme.primary : theme.textSecondary}
              fill={activeTab === 'saved_for_later' ? theme.primary : 'transparent'}
            />
            <Text
              style={[
                styles.segmentBtnText,
                { color: activeTab === 'saved_for_later' ? theme.textPrimary : theme.textSecondary },
                activeTab === 'saved_for_later' && styles.segmentBtnTextActive,
              ]}
            >
              Saved for Later ({savedForLaterItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.textPrimary, fontSize: typography.fontSize['3xl'] }]}>
              {activeTab === 'favorites' ? 'Favourites' : 'Saved for Later'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.textSecondary, fontSize: typography.fontSize.sm }]}>
              {activeTab === 'favorites'
                ? `${favorites.length} Saved ${favorites.length === 1 ? 'Material' : 'Materials'}`
                : `${savedForLaterItems.length} ${savedForLaterItems.length === 1 ? 'Item' : 'Items'} kept from Cart`}
            </Text>
          </View>

          {((activeTab === 'favorites' && favorites.length > 0) ||
            (activeTab === 'saved_for_later' && savedForLaterItems.length > 0)) && (
            <TouchableOpacity
              onPress={handleAddAllFavorites}
              style={[styles.addAllBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
              activeOpacity={0.85}
            >
              <ShoppingCart size={14} color={theme.buttonText || '#FFFFFF'} />
              <Text style={[styles.addAllBtnText, { color: theme.buttonText || '#FFFFFF' }]}>
                {activeTab === 'favorites' ? 'Add All to Cart' : 'Move All to Cart'}
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
        ) : activeTab === 'favorites' ? (
          favorites.length > 0 ? (
            <View style={styles.gridContainer}>
              {favorites.map((item) => {
                const price = item.defaultPrice || item.options[0]?.price || 0;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.productCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                        borderRadius: radius.xl,
                      },
                    ]}
                  >
                    <View style={[styles.imageContainer, { backgroundColor: theme.surfaceSecondary }]}>
                      <ShimmerImage
                        source={{ uri: item.image }}
                        style={styles.productImage}
                        resizeMode="cover"
                        preset="card"
                        borderRadius={12}
                      />
                      {onToggleFavorite && (
                        <TouchableOpacity
                          onPress={() => {
                            soundService.playFavorite();
                            onToggleFavorite(item.id);
                          }}
                          style={[styles.heartButton, { backgroundColor: theme.surface }]}
                          activeOpacity={0.7}
                        >
                          <Heart size={16} color={theme.primary} fill={theme.primary} />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.cardBody}>
                      <Text style={[styles.productTag, { color: theme.textMuted, fontSize: typography.fontSize['2xs'] }]}>
                        {(item?.categoryId || 'MATERIALS').toUpperCase()}
                      </Text>
                      <Text style={[styles.productName, { color: theme.textPrimary, fontSize: typography.fontSize.base }]} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={[styles.productSub, { color: theme.textSecondary, fontSize: typography.fontSize.xs }]} numberOfLines={1}>
                        {item.subtitle || ''}
                      </Text>

                      <View style={[styles.priceRow, { borderTopColor: theme.borderLight }]}>
                        <Text style={[styles.priceText, { color: theme.textPrimary, fontSize: typography.fontSize.base }]}>
                          ₹{price.toLocaleString('en-IN')}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            soundService.playTap();
                            onSelectItemModal(item);
                          }}
                          style={[styles.addBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
                          activeOpacity={0.8}
                        >
                          <Plus size={14} color={theme.buttonText || '#FFFFFF'} />
                          <Text style={[styles.addBtnText, { color: theme.buttonText || '#FFFFFF' }]}>Add</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : !isLoggedIn ? (
            /* Guest Empty State */
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <Heart size={32} color={theme.primary} strokeWidth={1.5} />
              </View>

              <Text style={[styles.emptyNoticeText, { color: theme.textSecondary }]}>
                Log in to start adding and managing your favourite supplies here.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  if (onOpenLoginModal) {
                    onOpenLoginModal();
                  } else {
                    onNavigateHome();
                  }
                }}
                style={[styles.loginPill, { backgroundColor: theme.buttonBg || theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.loginPillText, { color: theme.buttonText || '#FFFFFF' }]}>Log In or Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (onExploreCatalog) {
                    onExploreCatalog();
                  } else {
                    onNavigateHome();
                  }
                }}
                style={styles.exploreLink}
                activeOpacity={0.7}
              >
                <Text style={[styles.exploreLinkText, { color: theme.primary }]}>Explore Catalog</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Logged In Empty State */
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <Heart size={32} color={theme.primary} strokeWidth={1.5} />
              </View>

              <Text style={[styles.emptyNoticeText, { color: theme.textSecondary }]}>
                You haven't saved any favourites yet. Tap the heart icon on any product to save it here for fast re-ordering.
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
                <Text style={[styles.loginPillText, { color: theme.buttonText || '#FFFFFF' }]}>Explore Materials & Services</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          /* Saved for Later Tab Content */
          savedForLaterItems.length > 0 ? (
            <View style={{ gap: spacing.md }}>
              {savedForLaterItems.map((item) => {
                const price = item.unitPrice || 0;
                const total = price * (item.quantity || 1);
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: theme.surface,
                      borderRadius: radius.xl,
                      borderWidth: 1,
                      borderColor: theme.border,
                      padding: spacing.md,
                      flexDirection: 'row',
                      gap: spacing.md,
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 72, height: 72, borderRadius: radius.md, overflow: 'hidden', backgroundColor: theme.surfaceSecondary }}>
                      <ShimmerImage
                        source={{ uri: item.image }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        preset="thumbnail"
                        borderRadius={radius.md}
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontSize: typography.fontSize.md, fontWeight: '700', color: theme.textPrimary }}
                        numberOfLines={1}
                      >
                        {item.itemName}
                      </Text>
                      <Text
                        style={{ fontSize: typography.fontSize.xs, color: theme.textSecondary, marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {item.selectedOptionLabel || item.categoryName || 'Standard Supply'} • Qty: {item.quantity || 1}
                      </Text>
                      <Text style={{ fontSize: typography.fontSize.base, fontWeight: '800', color: theme.textPrimary, marginTop: 4 }}>
                        ₹{total.toLocaleString('en-IN')}
                        <Text style={{ fontSize: typography.fontSize.xs, fontWeight: '500', color: theme.textSecondary }}>
                          {' '}(₹{price}/unit)
                        </Text>
                      </Text>
                    </View>

                    <View style={{ gap: spacing.xs, alignItems: 'flex-end' }}>
                      <TouchableOpacity
                        onPress={() => {
                          moveToCart(item);
                          showToast(`Moved ${item.itemName} to Cart`, 'success');
                        }}
                        style={{
                          backgroundColor: theme.buttonBg || theme.primary,
                          paddingHorizontal: spacing.md,
                          paddingVertical: 7,
                          borderRadius: radius.md,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        activeOpacity={0.85}
                      >
                        <ShoppingCart size={13} color={theme.buttonText || '#FFFFFF'} />
                        <Text style={{ color: theme.buttonText || '#FFFFFF', fontSize: typography.fontSize.xs, fontWeight: '700' }}>
                          Move to Cart
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          removeSavedForLater(item.id);
                          showToast(`Removed from saved for later`, 'info');
                        }}
                        style={{
                          paddingHorizontal: spacing.sm,
                          paddingVertical: 4,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color={theme.error} />
                        <Text style={{ color: theme.error, fontSize: typography.fontSize.xs, fontWeight: '600' }}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceSecondary }]}>
                <Bookmark size={32} color={theme.primary} strokeWidth={1.5} />
              </View>

              <Text style={[styles.emptyNoticeText, { color: theme.textSecondary }]}>
                No items saved for later. When you save supplies in your cart, they will be kept here for easy ordering anytime.
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
                <Text style={[styles.loginPillText, { color: theme.buttonText || '#FFFFFF' }]}>Explore Materials</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5F7',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 96,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  segmentBtnTextActive: {
    fontWeight: '700',
    color: '#111827',
  },
  headerRow: {
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#707072',
    marginTop: 2,
    fontWeight: '500',
  },
  addAllBtn: {
    backgroundColor: '#111111',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginBottom: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.03)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    padding: 10,
  },
  productTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#707072',
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 17,
    marginBottom: 2,
    height: 34,
  },
  productSub: {
    fontSize: 11,
    color: '#707072',
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 90,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyNoticeText: {
    fontSize: 14,
    color: '#707072',
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 240,
    lineHeight: 20,
  },
  loginPill: {
    backgroundColor: '#111111',
    paddingVertical: 12,
    paddingHorizontal: 36,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginPillText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  exploreLink: {
    marginTop: 16,
    paddingVertical: 6,
  },
  exploreLinkText: {
    fontSize: 13,
    color: '#111111',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default FavoritesScreen;

