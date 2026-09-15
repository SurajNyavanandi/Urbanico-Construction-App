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
import { Heart, Plus, ShoppingCart, ArrowRight } from 'lucide-react-native';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { useToast } from '../context/ToastContext';
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
  const { showToast } = useToast();
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
      favorites.forEach((fav) => onSelectItemModal(fav));
    }
    showToast(`Added ${favorites.length} saved supplies to Cart!`, 'success');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#111111"
            colors={['#111111']}
          />
        }
      >
        {/* Header (Matches n3.jpeg) */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Favourites</Text>
            <Text style={styles.headerSubtitle}>
              {favorites.length} Saved {favorites.length === 1 ? 'Material' : 'Materials'}
            </Text>
          </View>

          {favorites.length > 0 && (
            <TouchableOpacity
              onPress={handleAddAllFavorites}
              style={styles.addAllBtn}
              activeOpacity={0.85}
            >
              <ShoppingCart size={14} color="#FFFFFF" />
              <Text style={styles.addAllBtnText}>Add All to Cart</Text>
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
            {favorites.map((item) => {
              const price = item.defaultPrice || item.options[0]?.price || 0;
              return (
                <View key={item.id} style={styles.productCard}>
                  <View style={styles.imageContainer}>
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
                        style={styles.heartButton}
                        activeOpacity={0.7}
                      >
                        <Heart size={16} color="#E11D48" fill="#E11D48" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.cardBody}>
                    <Text style={styles.productTag}>
                      {(item?.categoryId || 'MATERIALS').toUpperCase()}
                    </Text>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productSub} numberOfLines={1}>
                      {item.subtitle || 'Direct Yard Supply'}
                    </Text>

                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>
                        ₹{price.toLocaleString('en-IN')}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          soundService.playTap();
                          onSelectItemModal(item);
                        }}
                        style={styles.addBtn}
                        activeOpacity={0.8}
                      >
                        <Plus size={14} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Add</Text>
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
            <View style={styles.emptyIconCircle}>
              <Heart size={32} color="#111111" strokeWidth={1.5} />
            </View>

            <Text style={styles.emptyNoticeText}>
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
              style={styles.loginPill}
              activeOpacity={0.85}
            >
              <Text style={styles.loginPillText}>Log In or Sign Up</Text>
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
              <Text style={styles.exploreLinkText}>Explore Catalog</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Logged In Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Heart size={32} color="#111111" strokeWidth={1.5} />
            </View>

            <Text style={styles.emptyNoticeText}>
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
              style={styles.loginPill}
              activeOpacity={0.85}
            >
              <Text style={styles.loginPillText}>Explore Materials & Services</Text>
            </TouchableOpacity>
          </View>
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
  headerRow: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
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
