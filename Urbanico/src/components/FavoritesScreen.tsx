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
import { Heart, Plus, ShoppingCart, ArrowRight, Bookmark, Trash2 } from 'lucide-react-native';
import { MaterialItem } from '../types';
import { MATERIAL_ITEMS } from '../data/materialsData';
import { useToast } from '../context/ToastContext';
import { useCart } from '../context/CartContext';
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
        {/* Segmented Switcher for Favourites & Saved for Later */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            onPress={() => setActiveTab('favorites')}
            style={[styles.segmentBtn, activeTab === 'favorites' && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Heart
              size={15}
              color={activeTab === 'favorites' ? '#111111' : '#6B7280'}
              fill={activeTab === 'favorites' ? '#E11D48' : 'transparent'}
            />
            <Text style={[styles.segmentBtnText, activeTab === 'favorites' && styles.segmentBtnTextActive]}>
              Favourites ({favorites.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('saved_for_later')}
            style={[styles.segmentBtn, activeTab === 'saved_for_later' && styles.segmentBtnActive]}
            activeOpacity={0.8}
          >
            <Bookmark
              size={15}
              color={activeTab === 'saved_for_later' ? '#059669' : '#6B7280'}
              fill={activeTab === 'saved_for_later' ? '#059669' : 'transparent'}
            />
            <Text style={[styles.segmentBtnText, activeTab === 'saved_for_later' && styles.segmentBtnTextActive]}>
              Saved for Later ({savedForLaterItems.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>
              {activeTab === 'favorites' ? 'Favourites' : 'Saved for Later'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {activeTab === 'favorites'
                ? `${favorites.length} Saved ${favorites.length === 1 ? 'Material' : 'Materials'}`
                : `${savedForLaterItems.length} ${savedForLaterItems.length === 1 ? 'Item' : 'Items'} kept from Cart`}
            </Text>
          </View>

          {((activeTab === 'favorites' && favorites.length > 0) ||
            (activeTab === 'saved_for_later' && savedForLaterItems.length > 0)) && (
            <TouchableOpacity
              onPress={handleAddAllFavorites}
              style={[
                styles.addAllBtn,
                activeTab === 'saved_for_later' && { backgroundColor: '#059669' },
              ]}
              activeOpacity={0.85}
            >
              <ShoppingCart size={14} color="#FFFFFF" />
              <Text style={styles.addAllBtnText}>
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
          )
        ) : (
          /* Saved for Later Tab Content */
          savedForLaterItems.length > 0 ? (
            <View style={{ gap: 12 }}>
              {savedForLaterItems.map((item) => {
                const price = item.unitPrice || 0;
                const total = price * (item.quantity || 1);
                return (
                  <View
                    key={item.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      padding: 12,
                      flexDirection: 'row',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <View style={{ width: 72, height: 72, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F3F4F6' }}>
                      <ShimmerImage
                        source={{ uri: item.image }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                        preset="thumbnail"
                        borderRadius={10}
                      />
                    </View>

                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text
                        style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}
                        numberOfLines={1}
                      >
                        {item.itemName}
                      </Text>
                      <Text
                        style={{ fontSize: 11.5, color: '#6B7280', marginTop: 2 }}
                        numberOfLines={1}
                      >
                        {item.selectedOptionLabel || item.categoryName || 'Standard Supply'} • Qty: {item.quantity || 1}
                      </Text>
                      <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#111827', marginTop: 4 }}>
                        ₹{total.toLocaleString('en-IN')}
                        <Text style={{ fontSize: 11, fontWeight: '500', color: '#6B7280' }}>
                          {' '}(₹{price}/unit)
                        </Text>
                      </Text>
                    </View>

                    <View style={{ gap: 6, alignItems: 'flex-end' }}>
                      <TouchableOpacity
                        onPress={() => {
                          moveToCart(item);
                          showToast(`Moved ${item.itemName} to Cart`, 'success');
                        }}
                        style={{
                          backgroundColor: '#111827',
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        activeOpacity={0.85}
                      >
                        <ShoppingCart size={13} color="#FFFFFF" />
                        <Text style={{ color: '#FFFFFF', fontSize: 11.5, fontWeight: '700' }}>
                          Move to Cart
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          removeSavedForLater(item.id);
                          showToast(`Removed from saved for later`, 'info');
                        }}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={13} color="#EF4444" />
                        <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '600' }}>
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
              <View style={styles.emptyIconCircle}>
                <Bookmark size={32} color="#059669" strokeWidth={1.5} />
              </View>

              <Text style={styles.emptyNoticeText}>
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
                style={[styles.loginPill, { backgroundColor: '#059669' }]}
                activeOpacity={0.85}
              >
                <Text style={styles.loginPillText}>Explore Materials</Text>
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

