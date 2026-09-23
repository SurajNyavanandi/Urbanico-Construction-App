import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
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
import { soundService } from '../utils/soundHelper';
import { useCartActions } from '../hooks/useCartActions';
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
  materials?: MaterialItem[];
  categories?: any[];
  services?: any[];
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
  materials,
  categories,
  services,
}) => {
  const { theme, typography } = useTheme();
  const { addMaterialWithFeedback } = useCartActions();
  const [refreshing, setRefreshing] = useState(false);

  const activeMaterials = (materials && materials.length > 0) ? materials : MATERIAL_ITEMS;
  const activeCategories = (categories && categories.length > 0) ? categories : CATEGORIES;
  const activeServices = (services && services.length > 0) ? services : SERVICES;

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
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
    activeServices.some((s) => s.id === categoryId);

  const activeCategoryObj = activeCategories.find((c) => c.id === categoryId);

  // Filter items based on current flow (Services vs Materials) and search query
  const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
  const isTradeServiceSearch =
    query &&
    ['plumber', 'mason', 'electrician', 'painter', 'fabricator', 'carpenter', 'trade', 'service'].some((t) =>
      query.includes(t)
    );

  // Determine Candidate Pool with Cross-Category Silo Prevention
  let candidatePool = activeMaterials;
  let isGlobalFallback = false;

  if (isTradeServiceSearch) {
    candidatePool = activeMaterials.filter((item) => item.categoryId === 'services');
  } else if (isServicesMode) {
    if (query && !activeServices.some((s) => s.name.toLowerCase().includes(query))) {
      // User typed a material while on services page
      candidatePool = activeMaterials.filter((item) => item.categoryId !== 'services');
      isGlobalFallback = true;
    } else {
      candidatePool = activeMaterials.filter((item) => item.categoryId === 'services');
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
        candidatePool = activeMaterials;
      } else if (categoryId === 'materials') {
        candidatePool = activeMaterials.filter((item) => item.categoryId !== 'services');
      } else {
        // Test if current category has matches
        const inCatItems = activeMaterials.filter((item) => item.categoryId === categoryId);
        const inCatMatches = searchAndRankMaterials(inCatItems, query);
        if (inCatMatches.length > 0) {
          candidatePool = inCatItems;
        } else {
          // Cross-category breakout: 0 items matched in current category, auto-expand to all items!
          candidatePool = activeMaterials;
          isGlobalFallback = true;
        }
      }
    } else {
      if (categoryId === 'all') {
        candidatePool = activeMaterials;
      } else if (categoryId === 'materials') {
        candidatePool = activeMaterials.filter((item) => item.categoryId !== 'services');
      } else {
        candidatePool = activeMaterials.filter((item) => item.categoryId === categoryId);
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

  // Direct matching collections for multi-tab contextual displays
  const directMatchingMaterials = query
    ? searchAndRankMaterials(
        activeMaterials.filter((item) => item.categoryId !== 'services'),
        query,
        { sortBy }
      )
    : [];

  const directMatchingServices = query
    ? activeServices.filter(
        (srv) =>
          srv.name.toLowerCase().includes(query) ||
          srv.subtitle.toLowerCase().includes(query) ||
          (srv.id && query.includes(srv.id))
      )
    : [];

  // Helper sort function to consistently sort product arrays according to active sortBy mode
  const sortProductsByPreference = (list: MaterialItem[]) => {
    return [...list].sort((a, b) => {
      const priceA = a.defaultPrice || a.options?.[0]?.price || 0;
      const priceB = b.defaultPrice || b.options?.[0]?.price || 0;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'savings') return (b.options?.length || 0) - (a.options?.length || 0);
      return 0;
    });
  };

  // Helper filter for price facet
  const filterByPriceRange = (item: MaterialItem) => {
    const price = item.defaultPrice || item.options?.[0]?.price || 0;
    if (selectedPriceRange === 'under-500' && price >= 500) return false;
    if (selectedPriceRange === '500-5000' && (price < 500 || price > 5000)) return false;
    if (selectedPriceRange === 'above-5000' && price <= 5000) return false;
    return true;
  };

  // Apply Facet Filters (Price Range, Fast Dispatch)
  const items = rankedItems.filter(filterByPriceRange);

  const isCatalogMode =
    categoryId === 'all' ||
    categoryId === 'materials' ||
    categoryId === 'services-catalog' ||
    categoryId === 'services';

  // Split items for "All" tab when query is active:
  // 1. Direct matched items (Rank 1)
  const allTabMatchingItems = query
    ? searchAndRankMaterials(activeMaterials, query, { sortBy }).filter(filterByPriceRange)
    : items;

  // Find the primary category matched (e.g., if user searched "ultra tech cement", matched category is "cement")
  const primaryMatchedCategories = Array.from(
    new Set(allTabMatchingItems.map((m) => m.categoryId))
  );

  // 2. Related category cluster items (Rank 2: e.g. all other cement products like ACC, Ambuja if user searched UltraTech)
  const allTabRelatedItems = query && primaryMatchedCategories.length > 0
    ? sortProductsByPreference(
        activeMaterials.filter(
          (m) =>
            primaryMatchedCategories.includes(m.categoryId) &&
            !allTabMatchingItems.some((match) => match.id === m.id)
        ).filter(filterByPriceRange)
      )
    : [];

  // 3. Remaining catalog items (Rank 3: all other products like steel, sand, bricks, services)
  const allTabRemainingItems = query
    ? sortProductsByPreference(
        activeMaterials.filter(
          (m) =>
            !allTabMatchingItems.some((match) => match.id === m.id) &&
            !allTabRelatedItems.some((rel) => rel.id === m.id)
        ).filter(filterByPriceRange)
      )
    : [];

  // Dedicated Category-Specific Search Split (e.g., when browsing Cement category and searching "ultra tech cement53"):
  // 1. Direct search match(es) within this category
  const categoryMatchingItems = query && !isCatalogMode
    ? searchAndRankMaterials(
        activeMaterials.filter((m) => m.categoryId === categoryId),
        query,
        { sortBy }
      ).filter(filterByPriceRange)
    : [];

  // 2. All other items in this same category (e.g. Ambuja, ACC, Birla, Dalmia, JSW cement bags)
  const categoryOtherItems = query && !isCatalogMode
    ? sortProductsByPreference(
        activeMaterials.filter(
          (m) =>
            m.categoryId === categoryId &&
            !categoryMatchingItems.some((match) => match.id === m.id)
        ).filter(filterByPriceRange)
      )
    : [];

  // Get human friendly primary category label for section header
  const primaryCategoryLabel = primaryMatchedCategories.length > 0
    ? activeCategories.find((c) => c.id === primaryMatchedCategories[0])?.name || 'Related Products'
    : 'Related Products';

  const filteredCategories = activeCategories.filter(
    (c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = activeServices.filter(
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
              badgeCount={query ? (directMatchingMaterials.length + directMatchingServices.length) : undefined}
              onPress={() => {
                soundService.playTap();
                onSelectCategoryTab('all');
              }}
            />

            {/* 2. Materials (All Building Materials) */}
            <TopNavTab
              label="Materials"
              isActive={categoryId === 'materials'}
              badgeCount={query ? directMatchingMaterials.length : undefined}
              onPress={() => {
                soundService.playTap();
                onSelectCategoryTab('materials');
              }}
            />

            {/* 3. Services (Skilled Trade Services) */}
            <TopNavTab
              label="Services"
              isActive={categoryId === 'services-catalog' || categoryId === 'services'}
              badgeCount={query ? directMatchingServices.length : undefined}
              onPress={() => {
                soundService.playTap();
                onSelectCategoryTab('services');
              }}
            />

            {/* 4. Building Material Categories Only */}
            {activeCategories.map((cat) => {
              const catMatches = query
                ? searchAndRankMaterials(activeMaterials.filter((m) => m.categoryId === cat.id), query).length
                : undefined;
              return (
                <TopNavTab
                  key={cat.id}
                  label={cat.name}
                  isActive={categoryId === cat.id}
                  badgeCount={catMatches}
                  onPress={() => {
                    soundService.playTap();
                    onSelectCategoryTab(cat.id);
                  }}
                />
              );
            })}
          </ScrollView>
          {/* Subtle Right Edge Fade Indicator to signal more horizontal pills */}
          <View style={[styles.horizontalFadeIndicator, { backgroundColor: theme.surface, pointerEvents: 'none' as any }]} />
        </View>
      </View>

      {refreshing ? (
        <CatalogSkeleton />
      ) : (
        <>
          {/* 1. All Products Feed (categoryId === 'all') */}
          {categoryId === 'all' && (
            <View style={styles.itemsSectionContainer}>
              {/* Header Bar with Count & Active Search Clear Action */}
              <View style={styles.viewToggleHeaderBar}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                  <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                    {query ? `Results for "${searchQuery}"` : 'All Products'}
                  </Text>
                  <Text style={[styles.sectionSubtitleText, { color: theme.textSecondary, marginLeft: 2 }]}>
                    ({query ? (allTabMatchingItems.length + allTabRelatedItems.length + allTabRemainingItems.length) : items.length})
                  </Text>
                  {Boolean(query && onClearSearch) && (
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

              {/* Quick Sort Row: Featured & Single Price Toggle (Matching Material Sub-section) */}
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

              {/* When a query is active: Show matched products on top, related category cluster, then remaining items */}
              {query ? (
                <>
                  {/* Rank 1: Exact / High Match Products */}
                  {allTabMatchingItems.length > 0 ? (
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                          Top Matching Results ({allTabMatchingItems.length})
                        </Text>
                      </View>
                      {viewMode === 'grid' ? (
                        <View style={styles.twoColumnGridRow}>
                          {allTabMatchingItems.map((item) => (
                            <ProductCard
                              key={item.id}
                              item={item}
                              viewMode="grid"
                              searchQuery={searchQuery}
                              onPress={() => onSelectItem(item)}
                              onAddToCartPress={() => addMaterialWithFeedback(item)}
                              isFavorite={favoriteIds.includes(item.id)}
                              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.oneColumnListContainer}>
                          {allTabMatchingItems.map((item) => (
                            <ProductCard
                              key={item.id}
                              item={item}
                              viewMode="list"
                              searchQuery={searchQuery}
                              onPress={() => onSelectItem(item)}
                              onAddToCartPress={() => addMaterialWithFeedback(item)}
                              isFavorite={favoriteIds.includes(item.id)}
                              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={[styles.globalNoticeBanner, { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', marginBottom: 16 }]}>
                      <Text style={styles.globalNoticeText}>
                        No exact match for "{searchQuery}". Showing all available construction catalog products below:
                      </Text>
                    </View>
                  )}

                  {/* Rank 2: Related Category Cluster (e.g. Other Cements if searched UltraTech) */}
                  {allTabRelatedItems.length > 0 && (
                    <View style={{ marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight, marginBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ gap: 2 }}>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                            All {primaryCategoryLabel} Bags & Alternatives ({allTabRelatedItems.length})
                          </Text>
                          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                            Compare alternative brands, grades, and prices in {primaryCategoryLabel}
                          </Text>
                        </View>
                        <View style={{ backgroundColor: theme.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>Same Category</Text>
                        </View>
                      </View>
                      {viewMode === 'grid' ? (
                        <View style={styles.twoColumnGridRow}>
                          {allTabRelatedItems.map((item) => (
                            <ProductCard
                              key={item.id}
                              item={item}
                              viewMode="grid"
                              searchQuery={searchQuery}
                              onPress={() => onSelectItem(item)}
                              onAddToCartPress={() => addMaterialWithFeedback(item)}
                              isFavorite={favoriteIds.includes(item.id)}
                              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.oneColumnListContainer}>
                          {allTabRelatedItems.map((item) => (
                            <ProductCard
                              key={item.id}
                              item={item}
                              viewMode="list"
                              searchQuery={searchQuery}
                              onPress={() => onSelectItem(item)}
                              onAddToCartPress={() => addMaterialWithFeedback(item)}
                              isFavorite={favoriteIds.includes(item.id)}
                              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Rank 3: Remaining Catalog Products (Steel, Sand, Bricks, Tiles, Services, etc.) */}
                  {allTabRemainingItems.length > 0 && (
                    <View style={{ marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                          All Other Products & Services ({allTabRemainingItems.length})
                        </Text>
                      </View>
                      {viewMode === 'grid' ? (
                        <View style={styles.twoColumnGridRow}>
                          {allTabRemainingItems.map((item) => (
                            <ProductCard
                              key={item.id}
                              item={item}
                              viewMode="grid"
                              searchQuery={searchQuery}
                              onPress={() => onSelectItem(item)}
                              onAddToCartPress={() => addMaterialWithFeedback(item)}
                              isFavorite={favoriteIds.includes(item.id)}
                              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                            />
                          ))}
                        </View>
                      ) : (
                        <View style={styles.oneColumnListContainer}>
                          {allTabRemainingItems.map((item) => (
                            <ProductCard
                              key={item.id}
                              item={item}
                              viewMode="list"
                              searchQuery={searchQuery}
                              onPress={() => onSelectItem(item)}
                              onAddToCartPress={() => addMaterialWithFeedback(item)}
                              isFavorite={favoriteIds.includes(item.id)}
                              onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                            />
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </>
              ) : (
                /* When no query is active: Show all individual items */
                viewMode === 'grid' ? (
                  <View style={styles.twoColumnGridRow}>
                    {items.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        viewMode="grid"
                        onPress={() => onSelectItem(item)}
                        onAddToCartPress={() => addMaterialWithFeedback(item)}
                        isFavorite={favoriteIds.includes(item.id)}
                        onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                      />
                    ))}
                  </View>
                ) : (
                  <View style={styles.oneColumnListContainer}>
                    {items.map((item) => (
                      <ProductCard
                        key={item.id}
                        item={item}
                        viewMode="list"
                        onPress={() => onSelectItem(item)}
                        onAddToCartPress={() => addMaterialWithFeedback(item)}
                        isFavorite={favoriteIds.includes(item.id)}
                        onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                      />
                    ))}
                  </View>
                )
              )}
            </View>
          )}

      {/* 2. Materials Catalog (categoryId === 'materials') */}
      {categoryId === 'materials' && (
        <View style={styles.itemsSectionContainer}>
          {query ? (
            <View style={styles.viewToggleHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                  Materials matching "{searchQuery}"
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

          {/* Matched Products directly on top */}
          {Boolean(query && directMatchingMaterials.length > 0) && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                  Matching Products ({directMatchingMaterials.length})
                </Text>
              </View>

              {viewMode === 'grid' ? (
                <View style={styles.twoColumnGridRow}>
                  {directMatchingMaterials.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      viewMode="grid"
                      onPress={() => onSelectItem(item)}
                      onAddToCartPress={() => addMaterialWithFeedback(item)}
                      isFavorite={favoriteIds.includes(item.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.oneColumnListContainer}>
                  {directMatchingMaterials.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      viewMode="list"
                      onPress={() => onSelectItem(item)}
                      onAddToCartPress={() => addMaterialWithFeedback(item)}
                      isFavorite={favoriteIds.includes(item.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Material Categories to browse (Never dead-end!) */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                {query ? 'All Material Categories' : 'Material Categories'}
              </Text>
            </View>

            {viewMode === 'grid' ? (
              <View style={styles.twoColumnGridRow}>
                {activeCategories.map((cat) => (
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
                {activeCategories.map((cat) => (
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

          {/* Popular Construction Essentials */}
          <View style={styles.recommendedSection}>
            <Text style={[styles.recommendedSectionTitle, { color: theme.textPrimary }]}>
              Popular Construction Essentials
            </Text>
            <View style={styles.twoColumnGridRow}>
              {activeMaterials.slice(0, 4).map((recItem) => (
                <ProductCard
                  key={recItem.id}
                  item={recItem}
                  viewMode="grid"
                  onPress={() => onSelectItem(recItem)}
                  onAddToCartPress={() => addMaterialWithFeedback(recItem)}
                  isFavorite={favoriteIds.includes(recItem.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(recItem.id) : undefined}
                />
              ))}
            </View>
          </View>
        </View>
      )}

      {/* 3. Services Catalog (categoryId === 'services-catalog' || categoryId === 'services') */}
      {(categoryId === 'services-catalog' || categoryId === 'services') && (
        <View style={styles.itemsSectionContainer}>
          {query ? (
            <View style={styles.viewToggleHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                  Services for "{searchQuery}"
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

          {/* Matched Trade Services directly on top */}
          {Boolean(query && directMatchingServices.length > 0) && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                  Matching Trade Services ({directMatchingServices.length})
                </Text>
              </View>

              {viewMode === 'grid' ? (
                <View style={styles.twoColumnGridRow}>
                  {directMatchingServices.map((srv) => {
                    const matchingItem = activeMaterials.find((m) => m.id === `service-${srv.id}`);
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
                        onAddToCartPress={matchingItem ? () => addMaterialWithFeedback(matchingItem) : undefined}
                        isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                        onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                      />
                    );
                  })}
                </View>
              ) : (
                <View style={styles.oneColumnListContainer}>
                  {directMatchingServices.map((srv) => {
                    const matchingItem = activeMaterials.find((m) => m.id === `service-${srv.id}`);
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
                        onAddToCartPress={matchingItem ? () => addMaterialWithFeedback(matchingItem) : undefined}
                        isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                        onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* If user searched a material while on Services tab, show matching material products on top! */}
          {Boolean(query && directMatchingMaterials.length > 0) && (
            <View style={{ marginBottom: 16 }}>
              <View style={[styles.globalNoticeBanner, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', marginBottom: 10 }]}>
                <Text style={styles.globalNoticeText}>
                  Found <Text style={{ fontWeight: '700' }}>{directMatchingMaterials.length} materials</Text> matching "{searchQuery}"
                </Text>
              </View>

              {viewMode === 'grid' ? (
                <View style={styles.twoColumnGridRow}>
                  {directMatchingMaterials.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      viewMode="grid"
                      onPress={() => onSelectItem(item)}
                      onAddToCartPress={() => addMaterialWithFeedback(item)}
                      isFavorite={favoriteIds.includes(item.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.oneColumnListContainer}>
                  {directMatchingMaterials.map((item) => (
                    <ProductCard
                      key={item.id}
                      item={item}
                      viewMode="list"
                      onPress={() => onSelectItem(item)}
                      onAddToCartPress={() => addMaterialWithFeedback(item)}
                      isFavorite={favoriteIds.includes(item.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                    />
                  ))}
                </View>
              )}
            </View>
          )}

          {/* All Site Services & Trades (Never dead end!) */}
          <View style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
                {query ? 'All Available Site Services' : 'Site Services & Trades'}
              </Text>
            </View>

            {viewMode === 'grid' ? (
              <View style={styles.twoColumnGridRow}>
                {activeServices.map((srv) => {
                  const matchingItem = activeMaterials.find((m) => m.id === `service-${srv.id}`);
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
                      onAddToCartPress={matchingItem ? () => addMaterialWithFeedback(matchingItem) : undefined}
                      isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                      onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={styles.oneColumnListContainer}>
                {activeServices.map((srv) => {
                  const matchingItem = activeMaterials.find((m) => m.id === `service-${srv.id}`);
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
                      onAddToCartPress={matchingItem ? () => addMaterialWithFeedback(matchingItem) : undefined}
                      isFavorite={matchingItem ? favoriteIds.includes(matchingItem.id) : false}
                      onToggleFavorite={matchingItem && onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>
      )}

      {/* 4. Specific Category Detailed Item List (e.g. cement, steel, bricks, sand) */}
      {!isCatalogMode && (
        <View style={styles.itemsSectionContainer}>

          {/* Active Search & Clear Action */}
          {Boolean(query) && (
            <View style={styles.viewToggleHeaderBar}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                  {activeCategoryObj?.name || 'Products'}
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
          )}

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
          {Boolean(query) && (categoryMatchingItems.length > 0 || categoryOtherItems.length > 0) ? (
            /* Search Active: 2-Tier Structured Category Search (Exact User Searched Item First, Followed by All Category Bags) */
            <View style={{ gap: 20 }}>
              {/* Tier 1: Direct Matching Item(s) in this category */}
              {categoryMatchingItems.length > 0 && (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                        Top Match ({categoryMatchingItems.length})
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        Direct match for your search in {activeCategoryObj?.name || 'this category'}
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#86EFAC' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803D' }}>Exact Match</Text>
                    </View>
                  </View>

                  {viewMode === 'grid' ? (
                    <View style={styles.twoColumnGridRow}>
                      {categoryMatchingItems.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          viewMode="grid"
                          searchQuery={searchQuery}
                          onPress={() => onSelectItem(item)}
                          onAddToCartPress={() => addMaterialWithFeedback(item)}
                          isFavorite={favoriteIds.includes(item.id)}
                          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.oneColumnListContainer}>
                      {categoryMatchingItems.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          viewMode="list"
                          searchQuery={searchQuery}
                          onPress={() => onSelectItem(item)}
                          onAddToCartPress={() => addMaterialWithFeedback(item)}
                          isFavorite={favoriteIds.includes(item.id)}
                          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Tier 2: All Other Category Bags & Options (e.g. all other cement bags to compare brands & grades) */}
              {categoryOtherItems.length > 0 && (
                <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                        All {activeCategoryObj?.name || 'Category'} Bags & Alternatives ({categoryOtherItems.length})
                      </Text>
                      <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                        Compare other available {activeCategoryObj?.name?.toLowerCase() || 'category'} brands, grades & pricing
                      </Text>
                    </View>
                    <View style={{ backgroundColor: theme.surfaceSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.textSecondary }}>Same Category</Text>
                    </View>
                  </View>

                  {viewMode === 'grid' ? (
                    <View style={styles.twoColumnGridRow}>
                      {categoryOtherItems.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          viewMode="grid"
                          onPress={() => onSelectItem(item)}
                          onAddToCartPress={() => addMaterialWithFeedback(item)}
                          isFavorite={favoriteIds.includes(item.id)}
                          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.oneColumnListContainer}>
                      {categoryOtherItems.map((item) => (
                        <ProductCard
                          key={item.id}
                          item={item}
                          viewMode="list"
                          onPress={() => onSelectItem(item)}
                          onAddToCartPress={() => addMaterialWithFeedback(item)}
                          isFavorite={favoriteIds.includes(item.id)}
                          onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                        />
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          ) : items.length === 0 ? (
            <View style={styles.zeroResultCard}>
              <Text style={[styles.zeroResultTitle, { color: theme.textPrimary }]}>
                No products found {query ? `for "${searchQuery}"` : ''}
              </Text>
              <Text style={[styles.zeroResultSub, { color: theme.textSecondary }]}>
                Try adjusting your brand, price filters, or search terms.
              </Text>

              {/* Did you mean suggestion */}
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
                  {activeMaterials.slice(0, 4).map((recItem) => (
                    <ProductCard
                      key={recItem.id}
                      item={recItem}
                      viewMode="grid"
                      onPress={() => onSelectItem(recItem)}
                      onAddToCartPress={() => addMaterialWithFeedback(recItem)}
                      isFavorite={favoriteIds.includes(recItem.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(recItem.id) : undefined}
                    />
                  ))}
                </View>
              </View>
            </View>
          ) : viewMode === 'grid' ? (
            /* 2-Column Grid View Layout */
            <View style={styles.twoColumnGridRow}>
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  viewMode="grid"
                  onPress={() => onSelectItem(item)}
                  onAddToCartPress={() => addMaterialWithFeedback(item)}
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
                  onAddToCartPress={() => addMaterialWithFeedback(item)}
                  isFavorite={favoriteIds.includes(item.id)}
                  onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(item.id) : undefined}
                />
              ))}
            </View>
          )}

          {/* If there's a search query and we showed items, also show other categories below to keep exploration seamless */}
          {Boolean(query) && (
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.borderLight }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary, marginBottom: 12 }}>
                Explore Other Categories
              </Text>
              <View style={styles.twoColumnGridRow}>
                {activeCategories.filter((c) => c.id !== categoryId).map((cat) => (
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
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
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
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
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
    flexWrap: 'wrap',
    gap: 8,
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
