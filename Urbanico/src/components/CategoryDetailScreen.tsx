import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import {
  Heart,
  ShoppingCart,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ShieldCheck,
  Sparkles,
  Filter,
  X,
  Zap,
  RotateCcw,
} from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ProductCard } from './common/ProductCard';
import { TopNavTab } from './common/TopNavTab';
import { EmptyState } from './common/EmptyState';
import { CatalogSkeleton } from './common/SkeletonLoader';
import { useToast } from '../context/ToastContext';
import { soundService } from '../utils/soundHelper';
import {
  normalizeSearchQuery,
  searchAndRankMaterials,
  getDidYouMeanSuggestion,
} from '../services/searchService';

interface CategoryDetailScreenProps {
  categoryId: CategoryId | 'all';
  onSelectItem: (item: MaterialItem) => void;
  onSelectCategoryTab: (catId: CategoryId | 'all') => void;
  searchQuery: string;
  onClearSearch?: () => void;
  onBack?: () => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

export const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({
  categoryId,
  onSelectItem,
  onSelectCategoryTab,
  searchQuery,
  onClearSearch,
  onBack,
  favoriteIds = [],
  onToggleFavorite,
  viewMode: externalViewMode = 'grid',
  onViewModeChange,
}) => {
  const { theme, typography } = useTheme();
  const { showToast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Category inventory updated', 'info');
    }, 800);
  };

  // Display View Mode Option: Global setting defaulting to two-column 'grid'
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'grid'>('grid');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'savings'>('default');
  const [selectedPriceRange, setSelectedPriceRange] = useState<'all' | 'under-500' | '500-5000' | 'above-5000'>('all');
  const [fastDispatchOnly, setFastDispatchOnly] = useState<boolean>(false);
  const [forceAllCategories, setForceAllCategories] = useState<boolean>(false);

  // Reset facet filters when switching categories to prevent sticky zero-result states
  useEffect(() => {
    setSelectedPriceRange('all');
    setFastDispatchOnly(false);
  }, [categoryId]);

  const viewMode = onViewModeChange ? externalViewMode : internalViewMode;
  const setViewMode = (mode: 'list' | 'grid') => {
    if (onViewModeChange) onViewModeChange(mode);
    else setInternalViewMode(mode);
  };

  const isPriceSortActive = sortBy === 'price-asc' || sortBy === 'price-desc';

  const handlePriceToggle = () => {
    soundService.playTap();
    if (sortBy === 'price-asc') {
      setSortBy('price-desc');
    } else {
      setSortBy('price-asc');
    }
  };

  // Typo & query normalization
  const { normalizedQuery, wasCorrected, cleanQuery } = normalizeSearchQuery(searchQuery);
  const didYouMean = !wasCorrected && searchQuery.trim() ? getDidYouMeanSuggestion(searchQuery) : null;

  // Determine whether current context is Services mode or Materials mode
  const isServicesMode =
    categoryId === 'services-catalog' ||
    categoryId === 'services' ||
    SERVICES.some((s) => s.id === categoryId);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === categoryId);

  // Filter items based on current flow (Services vs Materials) and search query
  const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
  const isTradeServiceSearch =
    query &&
    ['plumber', 'mason', 'electrician', 'painter', 'fabricator', 'carpenter', 'trade', 'service'].some((t) =>
      query.includes(t)
    );

  // Determine Candidate Pool with Cross-Category Silo Prevention (Bug #2)
  let candidatePool = MATERIAL_ITEMS;
  let isGlobalFallback = false;

  if (isTradeServiceSearch) {
    candidatePool = MATERIAL_ITEMS.filter((item) => item.categoryId === 'services');
  } else if (isServicesMode) {
    if (query && !SERVICES.some((s) => s.name.toLowerCase().includes(query))) {
      // User typed a material while on services page
      candidatePool = MATERIAL_ITEMS.filter((item) => item.categoryId !== 'services');
      isGlobalFallback = true;
    } else {
      candidatePool = MATERIAL_ITEMS.filter((item) => item.categoryId === 'services');
      if (categoryId !== 'services-catalog' && categoryId !== 'services') {
        const targetTrade = categoryId.toLowerCase();
        candidatePool = candidatePool.filter(
          (m) =>
            m.id.toLowerCase().includes(targetTrade) ||
            m.name.toLowerCase().includes(targetTrade)
        );
      }
    }
  } else {
    // Materials & Combined Flow
    if (query) {
      if (categoryId === 'all' || forceAllCategories) {
        candidatePool = MATERIAL_ITEMS;
      } else if (categoryId === 'materials') {
        candidatePool = MATERIAL_ITEMS.filter((item) => item.categoryId !== 'services');
      } else {
        // Test if current category has matches
        const inCatItems = MATERIAL_ITEMS.filter((item) => item.categoryId === categoryId);
        const inCatMatches = searchAndRankMaterials(inCatItems, query);
        if (inCatMatches.length > 0) {
          candidatePool = inCatItems;
        } else {
          // Cross-category breakout: 0 items matched in current category, auto-expand to all items!
          candidatePool = MATERIAL_ITEMS;
          isGlobalFallback = true;
        }
      }
    } else {
      if (categoryId === 'all') {
        candidatePool = MATERIAL_ITEMS;
      } else if (categoryId === 'materials') {
        candidatePool = MATERIAL_ITEMS.filter((item) => item.categoryId !== 'services');
      } else {
        candidatePool = MATERIAL_ITEMS.filter((item) => item.categoryId === categoryId);
      }
    }
  }

  // Multi-word Tokenized Search, Deep Specs Matching, and Scoring
  const rankedItems = query
    ? searchAndRankMaterials(candidatePool, query, { sortBy })
    : [...candidatePool].sort((a, b) => {
        const priceA = a.defaultPrice || a.options?.[0]?.price || 0;
        const priceB = b.defaultPrice || b.options?.[0]?.price || 0;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'savings') return (b.options?.length || 0) - (a.options?.length || 0);
        return 0;
      });

  // Apply Facet Filters (Price Range, Fast Dispatch)
  const items = rankedItems.filter((item) => {
    // Price facet
    const price = item.defaultPrice || item.options?.[0]?.price || 0;
    if (selectedPriceRange === 'under-500' && price >= 500) return false;
    if (selectedPriceRange === '500-5000' && (price < 500 || price > 5000)) return false;
    if (selectedPriceRange === 'above-5000' && price <= 5000) return false;

    return true;
  });

  const filteredCategories = CATEGORIES.filter(
    (c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = SERVICES.filter(
    (srv) =>
      !searchQuery ||
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSmartBack = () => {
    soundService.playTap();
    if (categoryId !== 'all') {
      onSelectCategoryTab('all' as any);
      return;
    }
    if (onBack) {
      onBack();
    }
  };

  const isCatalogMode =
    categoryId === 'all' ||
    categoryId === 'materials' ||
    categoryId === 'services-catalog' ||
    categoryId === 'services';

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
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
      {/* Context-Aware Navigation Bar */}
      <View style={[styles.navBarWrapper, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
        <TouchableOpacity
          onPress={handleSmartBack}
          style={[styles.fixedBackBtn, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}
          activeOpacity={0.7}
          accessibilityLabel="Go Back"
        >
          <ArrowLeft color={theme.textPrimary} size={18} strokeWidth={2.2} />
        </TouchableOpacity>
        <View style={styles.scrollWithIndicatorWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillsScroll}
          >
            {/* 1. All (Overview) */}
            <TopNavTab
              label="All"
              isActive={categoryId === 'all'}
              onPress={() => {
                soundService.playTap();
                onSelectCategoryTab('all');
              }}
            />

            {/* 2. Materials (All Building Materials) */}
            <TopNavTab
              label="Materials"
              isActive={categoryId === 'materials'}
              onPress={() => {
                soundService.playTap();
                onSelectCategoryTab('materials');
              }}
            />

            {/* 3. Services (Skilled Trade Services) */}
            <TopNavTab
              label="Services"
              isActive={categoryId === 'services-catalog' || categoryId === 'services'}
              onPress={() => {
                soundService.playTap();
                onSelectCategoryTab('services');
              }}
            />

            {/* 4. Building Material Categories Only */}
            {CATEGORIES.map((cat) => (
              <TopNavTab
                key={cat.id}
                label={cat.name}
                isActive={categoryId === cat.id}
                onPress={() => {
                  soundService.playTap();
                  onSelectCategoryTab(cat.id);
                }}
              />
            ))}
          </ScrollView>
          {/* Subtle Right Edge Fade Indicator to signal more horizontal pills */}
          <View style={[styles.horizontalFadeIndicator, { backgroundColor: theme.surface, pointerEvents: 'none' as any }]} />
        </View>
      </View>

      {refreshing ? (
        <CatalogSkeleton />
      ) : (
        <>
          {/* 1. All Combination: Materials & Skilled Services (categoryId === 'all') */}
          {categoryId === 'all' && (
            <View style={styles.itemsSectionContainer}>
              {/* Display Header Bar */}
              <View style={styles.viewToggleHeaderBar}>
                <View>
                  <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                    Categories & Services
                  </Text>
                  <Text style={[styles.sectionSubtitleText, { color: theme.textSecondary }]}>
                    Building materials and certified trade services
                  </Text>
                </View>
              </View>

              {filteredCategories.length === 0 && filteredServices.length === 0 ? (
                <EmptyState
                  type="no-search"
                  title="No Categories or Services Found"
                  description="No material categories or trade services matched your search term."
                />
              ) : (
                <>
                  {/* Building Materials Group */}
                  {filteredCategories.length > 0 && (
                    <View style={{ marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 4 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                          Building Materials
                        </Text>
                      </View>

                      {viewMode === 'grid' ? (
                        <View style={styles.twoColumnGridRow}>
                          {filteredCategories.map((cat) => (
                            <ProductCard
                              key={cat.id}
                              title={cat.name}
                              subtitle={cat.count}
                              priceLabel={cat.priceLabel}
                              image={cat.image}
                              viewMode="grid"
                              onPress={() => onSelectCategoryTab(cat.id)}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.oneColumnListContainer}>
                          {filteredCategories.map((cat) => (
                            <ProductCard
                              key={cat.id}
                              title={cat.name}
                              subtitle={cat.count}
                              priceLabel={cat.priceLabel}
                              image={cat.image}
                              viewMode="list"
                              onPress={() => onSelectCategoryTab(cat.id)}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Skilled Trade Services Group */}
                  {filteredServices.length > 0 && (
                    <View style={{ marginBottom: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                          Skilled Trade Services
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            soundService.playTap();
                            onSelectCategoryTab('services');
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 12, fontWeight: '600', color: theme.primary }}>
                            View Services →
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {viewMode === 'grid' ? (
                        <View style={styles.twoColumnGridRow}>
                          {filteredServices.map((srv) => {
                            const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                            return (
                              <ProductCard
                                key={srv.id}
                                title={srv.name}
                                subtitle={srv.subtitle}
                                priceLabel={srv.rate}
                                image={srv.image}
                                item={matchingItem}
                                viewMode="grid"
                                onPress={() => {
                                  if (matchingItem) onSelectItem(matchingItem);
                                  else onSelectCategoryTab(srv.id as any);
                                }}
                                onAddToCartPress={matchingItem ? () => onSelectItem(matchingItem) : undefined}
                                isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                                onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                              />
                            );
                          })}
                        </View>
                      ) : (
                        <View style={styles.oneColumnListContainer}>
                          {filteredServices.map((srv) => {
                            const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                            return (
                              <ProductCard
                                key={srv.id}
                                title={srv.name}
                                subtitle={srv.subtitle}
                                priceLabel={srv.rate}
                                image={srv.image}
                                item={matchingItem}
                                viewMode="list"
                                onPress={() => {
                                  if (matchingItem) onSelectItem(matchingItem);
                                  else onSelectCategoryTab(srv.id as any);
                                }}
                                onAddToCartPress={matchingItem ? () => onSelectItem(matchingItem) : undefined}
                                isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                                onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                              />
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </>
              )}
            </View>
          )}

      {/* 2. Materials Catalog (categoryId === 'materials') */}
      {categoryId === 'materials' && (
        <View style={styles.itemsSectionContainer}>
          {filteredCategories.length === 0 ? (
            <EmptyState
              type="no-search"
              title="No Categories Found"
              description="No material categories matched your search term."
            />
          ) : (
            <View style={{ marginBottom: 20 }}>
              {viewMode === 'grid' ? (
                <View style={styles.twoColumnGridRow}>
                  {filteredCategories.map((cat) => (
                    <ProductCard
                      key={cat.id}
                      title={cat.name}
                      subtitle={cat.count}
                      priceLabel={cat.priceLabel}
                      image={cat.image}
                      viewMode="grid"
                      onPress={() => onSelectCategoryTab(cat.id)}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.oneColumnListContainer}>
                  {filteredCategories.map((cat) => (
                    <ProductCard
                      key={cat.id}
                      title={cat.name}
                      subtitle={cat.count}
                      priceLabel={cat.priceLabel}
                      image={cat.image}
                      viewMode="list"
                      onPress={() => onSelectCategoryTab(cat.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* 3. Services Catalog (categoryId === 'services-catalog' || categoryId === 'services') */}
      {(categoryId === 'services-catalog' || categoryId === 'services') && (
        <View style={styles.itemsSectionContainer}>
          {/* Services List / Grid Layout */}
          {filteredServices.length === 0 ? (
            <EmptyState
              type="no-search"
              title="No Services Found"
              description="No trade services matched your search term."
            />
          ) : viewMode === 'grid' ? (
            /* 2-Column Grid View Layout */
            <View style={styles.twoColumnGridRow}>
              {filteredServices.map((srv) => {
                const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                return (
                  <ProductCard
                    key={srv.id}
                    title={srv.name}
                    subtitle={srv.subtitle}
                    priceLabel={srv.rate}
                    image={srv.image}
                    item={matchingItem}
                    viewMode="grid"
                    onPress={() => {
                      if (matchingItem) onSelectItem(matchingItem);
                      else onSelectCategoryTab(srv.id as any);
                    }}
                    onAddToCartPress={matchingItem ? () => onSelectItem(matchingItem) : undefined}
                    isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                    onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                  />
                );
              })}
            </View>
          ) : (
            /* 1-Column Single List View Layout */
            <View style={styles.oneColumnListContainer}>
              {filteredServices.map((srv) => {
                const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                return (
                  <ProductCard
                    key={srv.id}
                    title={srv.name}
                    subtitle={srv.subtitle}
                    priceLabel={srv.rate}
                    image={srv.image}
                    item={matchingItem}
                    viewMode="list"
                    onPress={() => {
                      if (matchingItem) onSelectItem(matchingItem);
                      else onSelectCategoryTab(srv.id as any);
                    }}
                    onAddToCartPress={matchingItem ? () => onSelectItem(matchingItem) : undefined}
                    isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                    onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 3. Subcategory Detailed Item List */}
      {!isCatalogMode && (
        <View style={styles.itemsSectionContainer}>

          {/* Typo Correction Banner (Bug #4) */}
          {Boolean(query && wasCorrected) && (
            <View style={[styles.correctionBanner, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
              <Sparkles size={14} color="#D97706" strokeWidth={2.2} />
              <Text style={styles.correctionBannerText}>
                Showing results for <Text style={{ fontWeight: '700', color: '#92400E' }}>"{normalizedQuery}"</Text>
                {cleanQuery.toLowerCase() !== normalizedQuery && (
                  <Text style={{ color: '#B45309', fontSize: 11 }}> (searched "{cleanQuery}")</Text>
                )}
              </Text>
            </View>
          )}

          {/* Cross-Category Breakout Notice (Bug #2) */}
          {Boolean(query && isGlobalFallback) && (
            <View style={[styles.globalNoticeBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={styles.globalNoticeText}>
                No items in {activeCategoryObj?.name || 'this category'} matched "{searchQuery}". Showing matches from <Text style={{ fontWeight: '700' }}>All Materials</Text>.
              </Text>
            </View>
          )}

          {/* Search Result Bar (Displayed only during active search query) */}
          {query ? (
            <View style={styles.viewToggleHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                  Results for "{searchQuery}"
                </Text>
                {onClearSearch && (
                  <TouchableOpacity
                    onPress={onClearSearch}
                    style={[styles.resetFiltersMiniBtn, { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}
                    activeOpacity={0.7}
                  >
                    <X size={11} color="#DC2626" strokeWidth={2.4} />
                    <Text style={[styles.resetFiltersMiniBtnText, { color: '#DC2626', fontWeight: '700' }]}>Clear Search</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null}

          {/* Quick Sort Row: Featured & Single Price Toggle */}
          <View style={styles.sortChipsScroll}>
            {/* Sort: Featured */}
            <TouchableOpacity
              onPress={() => {
                soundService.playTap();
                setSortBy('default');
              }}
              style={[
                styles.sortChip,
                sortBy === 'default'
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              ]}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.sortChipText,
                  {
                    color: sortBy === 'default' ? '#FFFFFF' : theme.textSecondary,
                    fontWeight: sortBy === 'default' ? '700' : '500',
                  },
                ]}
              >
                Featured
              </Text>
            </TouchableOpacity>

            {/* Sort: Single Price Toggle Button (Low to High / High to Low) */}
            <TouchableOpacity
              onPress={handlePriceToggle}
              style={[
                styles.sortChip,
                isPriceSortActive
                  ? { backgroundColor: theme.primary, borderColor: theme.primary }
                  : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
              ]}
              activeOpacity={0.75}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Text
                  style={[
                    styles.sortChipText,
                    {
                      color: isPriceSortActive ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: isPriceSortActive ? '700' : '500',
                    },
                  ]}
                >
                  {sortBy === 'price-desc' ? 'Price: High to Low' : 'Price: Low to High'}
                </Text>
                {sortBy === 'price-asc' && <ArrowUp size={12} color="#FFFFFF" strokeWidth={2.4} />}
                {sortBy === 'price-desc' && <ArrowDown size={12} color="#FFFFFF" strokeWidth={2.4} />}
                {!isPriceSortActive && <ArrowUpDown size={11} color={theme.textMuted} strokeWidth={2} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* Product Items List / Grid */}
          {items.length === 0 ? (
            <View style={styles.zeroResultCard}>
              <Text style={[styles.zeroResultTitle, { color: theme.textPrimary }]}>
                No products found {query ? `for "${searchQuery}"` : ''}
              </Text>
              <Text style={[styles.zeroResultSub, { color: theme.textSecondary }]}>
                Try adjusting your brand, price filters, or search terms.
              </Text>

              {/* Did you mean suggestion (Bug #9) */}
              {Boolean(didYouMean) && (
                <TouchableOpacity
                  onPress={() => onSelectCategoryTab && onSelectCategoryTab('all')}
                  style={[styles.didYouMeanPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                  activeOpacity={0.8}
                >
                  <Sparkles size={14} color="#2563EB" strokeWidth={2.2} />
                  <Text style={styles.didYouMeanText}>
                    Did you mean: <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>{didYouMean}</Text>?
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setSelectedPriceRange('all');
                  setSortBy('default');
                  if (onClearSearch) onClearSearch();
                  onSelectCategoryTab('all');
                }}
                style={[styles.resetFiltersBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <RotateCcw size={14} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.resetFiltersBtnText}>Clear Filters & Browse All Catalog</Text>
              </TouchableOpacity>

              {/* Popular Construction Essentials Recommendations */}
              <View style={styles.recommendedSection}>
                <Text style={[styles.recommendedSectionTitle, { color: theme.textPrimary }]}>
                  Popular Construction Essentials
                </Text>
                <View style={styles.twoColumnGridRow}>
                  {MATERIAL_ITEMS.filter((m) =>
                    ['mat-cement-1', 'mat-steel-1', 'mat-sand-1', 'mat-bricks-1'].includes(m.id)
                  ).map((recItem) => (
                    <ProductCard
                      key={recItem.id}
                      item={recItem}
                      viewMode="grid"
                      onPress={() => onSelectItem(recItem)}
                      onAddToCartPress={() => onSelectItem(recItem)}
                      isFavorite={favoriteIds.includes(recItem.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(recItem.id) : undefined}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : viewMode === 'grid' ? (
            /* 2-Column Grid View Layout (Reference Image 1) */
            <View style={styles.twoColumnGridRow}>
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  viewMode="grid"
                  onPress={() => onSelectItem(item)}
                  onAddToCartPress={() => onSelectItem(item)}
                  isFavorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                />
              ))}
            </View>
          ) : (
            /* 1-Column Single List View Layout */
            <View style={styles.oneColumnListContainer}>
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  viewMode="list"
                  onPress={() => onSelectItem(item)}
                  onAddToCartPress={() => onSelectItem(item)}
                  isFavorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                />
              ))}
            </View>
          )}
        </View>
      )}
        </>
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
    gap: 16,
  },
  gridContainer: {
    paddingTop: 4,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '30%',
    flexGrow: 1,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 140,
  },
  cardImageWrapper: {
    width: '100%',
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTextWrapper: {
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  catName: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  priceLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  navBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 2,
  },
  fixedBackBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  scrollWithIndicatorWrapper: {
    flex: 1,
    position: 'relative',
  },
  horizontalFadeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 20,
    opacity: 0.85,
  },
  pillsScroll: {
    paddingRight: 24,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  itemsSectionContainer: {
    gap: 12,
    paddingTop: 4,
  },
  viewToggleHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitleText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sortChipsScroll: {
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    marginBottom: 4,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  twoColumnGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
  },
  oneColumnListContainer: {
    flexDirection: 'column',
    gap: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
    marginBottom: 4,
  },
  categoryHeaderImageWrapper: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryHeaderImage: {
    width: '100%',
    height: '100%',
  },
  categoryHeaderTextGroup: {
    flex: 1,
  },
  categoryHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  categoryHeaderSub: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  categoryListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  categoryListImageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  categoryListImage: {
    width: '100%',
    height: '100%',
  },
  categoryListContent: {
    flex: 1,
  },
  categoryListTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.1,
  },
  categoryListSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
  },
  categoryListArrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  correctionBannerText: {
    fontSize: 12,
    color: '#78350F',
    flex: 1,
  },
  globalNoticeBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  globalNoticeText: {
    fontSize: 12,
    color: '#1E40AF',
  },
  resetFiltersMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  resetFiltersMiniBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  zeroResultCard: {
    paddingVertical: 24,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  zeroResultTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  zeroResultSub: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 4,
  },
  didYouMeanPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginVertical: 4,
  },
  didYouMeanText: {
    fontSize: 13,
    color: '#1D4ED8',
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    marginTop: 6,
  },
  resetFiltersBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  recommendedSection: {
    width: '100%',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recommendedSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
});

export default CategoryDetailScreen;
