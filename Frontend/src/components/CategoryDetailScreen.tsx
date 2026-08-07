import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { Heart, ShoppingCart, LayoutList, Grid2X2, ChevronRight } from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ProductCard } from './common/ProductCard';
import { TopNavTab } from './common/TopNavTab';
import { EmptyState } from './common/EmptyState';
import { CatalogSkeleton } from './common/SkeletonLoader';
import { Toast } from './common/Toast';

interface CategoryDetailScreenProps {
  categoryId: CategoryId | 'all';
  onSelectItem: (item: MaterialItem) => void;
  onSelectCategoryTab: (catId: CategoryId) => void;
  searchQuery: string;
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
  favoriteIds = [],
  onToggleFavorite,
  viewMode: externalViewMode = 'grid',
  onViewModeChange,
}) => {
  const { theme, typography } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setToastMessage('Category inventory updated');
    }, 800);
  };

  // Display View Mode Option: Global setting defaulting to two-column 'grid'
  const [internalViewMode, setInternalViewMode] = useState<'list' | 'grid'>('grid');
  const viewMode = onViewModeChange ? externalViewMode : internalViewMode;
  const setViewMode = (mode: 'list' | 'grid') => {
    if (onViewModeChange) onViewModeChange(mode);
    else setInternalViewMode(mode);
  };

  // Determine whether current context is Services mode or Materials mode
  const isServicesMode =
    categoryId === 'services-catalog' ||
    categoryId === 'services' ||
    SERVICES.some((s) => s.id === categoryId);

  const activeCategoryObj = CATEGORIES.find((c) => c.id === categoryId);

  // Filter items strictly based on current flow (Services vs Materials) and search query
  const items = MATERIAL_ITEMS.filter((item) => {
    if (isServicesMode) {
      if (item.categoryId !== 'services') return false;
      if (categoryId !== 'services-catalog' && categoryId !== 'services') {
        // Specific service trade filter
        if (
          !item.id.toLowerCase().includes(categoryId.toLowerCase()) &&
          !item.name.toLowerCase().includes(categoryId.toLowerCase())
        ) {
          return false;
        }
      }
    } else {
      // Materials mode
      if (item.categoryId === 'services') return false;
      if (categoryId !== 'all' && item.categoryId !== categoryId) {
        return false;
      }
    }

    // Smart search match: if query is category name (e.g. "sand"), show all items in sand
    const query = searchQuery ? searchQuery.trim().toLowerCase() : '';
    const categoryName = activeCategoryObj ? activeCategoryObj.name.toLowerCase() : '';
    const isCategoryQuery = query && (query === categoryId.toLowerCase() || query === categoryName);

    const matchesSearch =
      !query ||
      isCategoryQuery ||
      item.name.toLowerCase().includes(query) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(query));
    return matchesSearch;
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

  const isCatalogMode = categoryId === 'all' || categoryId === 'services-catalog';

  return (
    <View style={{ flex: 1 }}>
      <Toast
        visible={Boolean(toastMessage)}
        message={toastMessage || ''}
        type="info"
        onDismiss={() => setToastMessage(null)}
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
      {/* Context-Aware Navigation Bar:
          - If browsing Services, displays ONLY 'All Services' + Service Trades.
          - If browsing Materials, displays ONLY 'All Materials' + Material Subcategories. */}
      <View style={[styles.navBarWrapper, { borderBottomColor: theme.borderLight }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsScroll}
        >
          {isServicesMode ? (
            /* ================= SERVICES FLOW NAVIGATION ================= */
            <>
              <TopNavTab
                label="All Services"
                isActive={categoryId === 'services-catalog' || categoryId === 'services'}
                onPress={() => onSelectCategoryTab('services-catalog')}
              />
              {SERVICES.map((srv) => (
                <TopNavTab
                  key={srv.id}
                  label={srv.name}
                  isActive={categoryId === srv.id}
                  onPress={() => onSelectCategoryTab(srv.id as any)}
                />
              ))}
            </>
          ) : (
            /* ================= MATERIALS FLOW NAVIGATION ================= */
            <>
              <TopNavTab
                label="All Materials"
                isActive={categoryId === 'all'}
                onPress={() => onSelectCategoryTab('all')}
              />
              {CATEGORIES.map((cat) => (
                <TopNavTab
                  key={cat.id}
                  label={cat.name}
                  isActive={categoryId === cat.id}
                  onPress={() => onSelectCategoryTab(cat.id)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </View>

      {/* 1. Materials Catalog (categoryId === 'all') */}
      {categoryId === 'all' && (
        <View style={styles.itemsSectionContainer}>
          {/* Display Header Bar */}
          <View style={styles.viewToggleHeaderBar}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                {filteredCategories.length} Material Categories
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: theme.textMuted }]}>
                Select category to explore subcategories & items
              </Text>
            </View>
          </View>

          {/* Materials List / Grid Layout */}
          {filteredCategories.length === 0 ? (
            <EmptyState
              type="no-search"
              title="No Categories Found"
              description="No material categories matched your search term."
            />
          ) : viewMode === 'grid' ? (
            /* 2-Column Grid View Layout */
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
            /* 1-Column Single List View Layout */
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

      {/* 2. Services Catalog (categoryId === 'services-catalog') */}
      {categoryId === 'services-catalog' && (
        <View style={styles.itemsSectionContainer}>
          {/* Display Header Bar */}
          <View style={styles.viewToggleHeaderBar}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                {filteredServices.length} Skilled Services
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: theme.textMuted }]}>
                Select service to view details & book
              </Text>
            </View>
          </View>

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

          {/* Header Bar */}
          <View style={styles.viewToggleHeaderBar}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                {items.length} Products
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: theme.textMuted }]}>
                Select item to customize & add
              </Text>
            </View>
          </View>

          {/* Product Items List / Grid */}
          {items.length === 0 ? (
            <EmptyState
              type="no-search"
              title="No Products Found"
              description="No products matched your search or subcategory filter."
            />
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
    borderBottomWidth: 1,
    marginBottom: 8,
    paddingBottom: 2,
  },
  pillsScroll: {
    paddingHorizontal: 2,
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
  togglePillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  twoColumnGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '800',
  },
  categoryHeaderSub: {
    fontSize: 12,
    fontWeight: '600',
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
    fontWeight: '800',
  },
  categoryListSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  categoryListArrowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
