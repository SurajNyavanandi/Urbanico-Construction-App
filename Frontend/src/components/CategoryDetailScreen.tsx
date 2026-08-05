import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Heart, ShoppingCart, LayoutList, Grid2X2, ChevronRight } from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { PillButton } from './common/PillButton';
import { ProductCard } from './common/ProductCard';

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
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Context-Aware Navigation Bar:
          - If browsing Services, displays ONLY 'All Services' + Service Trades.
          - If browsing Materials, displays ONLY 'All Materials' + Material Subcategories. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        {isServicesMode ? (
          /* ================= SERVICES FLOW NAVIGATION ================= */
          <>
            <PillButton
              label="All Services"
              isActive={categoryId === 'services-catalog'}
              onPress={() => onSelectCategoryTab('services-catalog')}
            />
            {SERVICES.map((srv) => (
              <PillButton
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
            <PillButton
              label="All Materials"
              isActive={categoryId === 'all'}
              onPress={() => onSelectCategoryTab('all')}
            />
            {CATEGORIES.map((cat) => (
              <PillButton
                key={cat.id}
                label={cat.name}
                isActive={categoryId === cat.id}
                onPress={() => onSelectCategoryTab(cat.id)}
              />
            ))}
          </>
        )}
      </ScrollView>

      {/* 1. Materials Catalog (categoryId === 'all') */}
      {categoryId === 'all' && (
        <View style={styles.itemsSectionContainer}>
          {/* Display View Toggle Header Bar */}
          <View style={styles.viewToggleHeaderBar}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                {filteredCategories.length} Material Categories
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: theme.textMuted }]}>
                Select category to explore subcategories & items
              </Text>
            </View>

            {/* Display View Toggle Controls (1-Column List vs 2-Column Grid) */}
            <View style={[styles.togglePillContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}
                style={[
                  styles.toggleBtn,
                  viewMode === 'list' && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <LayoutList size={15} color={viewMode === 'list' ? theme.primary : theme.textMuted} />
                <Text style={[styles.toggleBtnText, { color: viewMode === 'list' ? theme.primary : theme.textMuted }]}>
                  List
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                activeOpacity={0.7}
                style={[
                  styles.toggleBtn,
                  viewMode === 'grid' && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Grid2X2 size={15} color={viewMode === 'grid' ? theme.primary : theme.textMuted} />
                <Text style={[styles.toggleBtnText, { color: viewMode === 'grid' ? theme.primary : theme.textMuted }]}>
                  Grid (2x)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Materials List / Grid Layout */}
          {filteredCategories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No categories found matching your search.</Text>
            </View>
          ) : viewMode === 'grid' ? (
            /* 2-Column Grid View Layout (Identical to Subcategories Grid View) */
            <View style={styles.twoColumnGridRow}>
              {filteredCategories.map((cat) => {
                const priceVal = parseInt(cat.priceLabel?.replace(/[^0-9]/g, '') || '0', 10);
                const catItem: MaterialItem = {
                  id: `cat-${cat.id}`,
                  categoryId: cat.id as any,
                  name: cat.name,
                  image: cat.image,
                  actionType: 'add_to_cart',
                  options: [],
                  defaultPrice: priceVal,
                  subtitle: `${cat.count} • ${cat.priceLabel}`,
                };
                return (
                  <ProductCard
                    key={cat.id}
                    item={catItem}
                    viewMode="grid"
                    onPress={() => onSelectCategoryTab(cat.id)}
                    onAddToCartPress={() => onSelectCategoryTab(cat.id)}
                    isFavorite={favoriteIds.includes(catItem.id)}
                    onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(catItem.id) : undefined}
                  />
                );
              })}
            </View>
          ) : (
            /* 1-Column Single List View Layout (Identical to Subcategories List View) */
            <View style={styles.oneColumnListContainer}>
              {filteredCategories.map((cat) => {
                const priceVal = parseInt(cat.priceLabel?.replace(/[^0-9]/g, '') || '0', 10);
                const catItem: MaterialItem = {
                  id: `cat-${cat.id}`,
                  categoryId: cat.id as any,
                  name: cat.name,
                  image: cat.image,
                  actionType: 'add_to_cart',
                  options: [],
                  defaultPrice: priceVal,
                  subtitle: `${cat.count} • ${cat.priceLabel}`,
                };
                return (
                  <ProductCard
                    key={cat.id}
                    item={catItem}
                    viewMode="list"
                    onPress={() => onSelectCategoryTab(cat.id)}
                    onAddToCartPress={() => onSelectCategoryTab(cat.id)}
                    isFavorite={favoriteIds.includes(catItem.id)}
                    onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(catItem.id) : undefined}
                  />
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 2. Services Catalog (categoryId === 'services-catalog') */}
      {categoryId === 'services-catalog' && (
        <View style={styles.itemsSectionContainer}>
          {/* Display View Toggle Header Bar */}
          <View style={styles.viewToggleHeaderBar}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                {filteredServices.length} Skilled Services
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: theme.textMuted }]}>
                Select service to view details & book
              </Text>
            </View>

            {/* Display View Toggle Controls (1-Column List vs 2-Column Grid) */}
            <View style={[styles.togglePillContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}
                style={[
                  styles.toggleBtn,
                  viewMode === 'list' && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <LayoutList size={15} color={viewMode === 'list' ? theme.primary : theme.textMuted} />
                <Text style={[styles.toggleBtnText, { color: viewMode === 'list' ? theme.primary : theme.textMuted }]}>
                  List
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                activeOpacity={0.7}
                style={[
                  styles.toggleBtn,
                  viewMode === 'grid' && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Grid2X2 size={15} color={viewMode === 'grid' ? theme.primary : theme.textMuted} />
                <Text style={[styles.toggleBtnText, { color: viewMode === 'grid' ? theme.primary : theme.textMuted }]}>
                  Grid (2x)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Services List / Grid Layout */}
          {filteredServices.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No services found matching your search.</Text>
            </View>
          ) : viewMode === 'grid' ? (
            /* 2-Column Grid View Layout (2 services per row) */
            <View style={styles.twoColumnGridRow}>
              {filteredServices.map((srv) => {
                const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                if (matchingItem) {
                  return (
                    <ProductCard
                      key={srv.id}
                      item={matchingItem}
                      viewMode="grid"
                      onPress={() => onSelectItem(matchingItem)}
                      onAddToCartPress={() => onSelectItem(matchingItem)}
                      isFavorite={favoriteIds.includes(matchingItem.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                    />
                  );
                }
                return (
                  <TouchableOpacity
                    key={srv.id}
                    onPress={() => onSelectCategoryTab(srv.id as any)}
                    activeOpacity={0.8}
                    style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border, width: '48%' }]}
                  >
                    <View style={styles.cardImageWrapper}>
                      <Image
                        source={{ uri: srv.image }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.cardTextWrapper}>
                      <Text style={[styles.catName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {srv.name}
                      </Text>
                      <Text style={[styles.priceLabel, { color: theme.primaryDark }]} numberOfLines={1}>
                        {srv.rate}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            /* 1-Column Single List View Layout (List View - Default) */
            <View style={styles.oneColumnListContainer}>
              {filteredServices.map((srv) => {
                const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                if (matchingItem) {
                  return (
                    <ProductCard
                      key={srv.id}
                      item={matchingItem}
                      viewMode="list"
                      onPress={() => onSelectItem(matchingItem)}
                      onAddToCartPress={() => onSelectItem(matchingItem)}
                      isFavorite={favoriteIds.includes(matchingItem.id)}
                      onToggleFavorite={onToggleFavorite ? () => onToggleFavorite(matchingItem.id) : undefined}
                    />
                  );
                }
                return (
                  <TouchableOpacity
                    key={srv.id}
                    onPress={() => onSelectCategoryTab(srv.id as any)}
                    activeOpacity={0.8}
                    style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border, width: '100%' }]}
                  >
                    <View style={styles.cardImageWrapper}>
                      <Image
                        source={{ uri: srv.image }}
                        style={styles.cardImage}
                        resizeMode="contain"
                      />
                    </View>
                    <View style={styles.cardTextWrapper}>
                      <Text style={[styles.catName, { color: theme.textPrimary }]} numberOfLines={1}>
                        {srv.name}
                      </Text>
                      <Text style={[styles.priceLabel, { color: theme.primaryDark }]} numberOfLines={1}>
                        {srv.rate}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      )}

      {/* 3. Subcategory Detailed Item List */}
      {!isCatalogMode && (
        <View style={styles.itemsSectionContainer}>

          {/* View Mode Toggle Header Bar */}
          <View style={styles.viewToggleHeaderBar}>
            <View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                {items.length} Products
              </Text>
              <Text style={[styles.sectionSubtitleText, { color: theme.textMuted }]}>
                Select item to customize & add
              </Text>
            </View>

            {/* Display View Toggle Controls (1-Column List vs 2-Column Grid) */}
            <View style={[styles.togglePillContainer, { backgroundColor: theme.surfaceSecondary, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                activeOpacity={0.7}
                style={[
                  styles.toggleBtn,
                  viewMode === 'list' && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <LayoutList size={15} color={viewMode === 'list' ? theme.primary : theme.textMuted} />
                <Text style={[styles.toggleBtnText, { color: viewMode === 'list' ? theme.primary : theme.textMuted }]}>
                  List
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                activeOpacity={0.7}
                style={[
                  styles.toggleBtn,
                  viewMode === 'grid' && { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Grid2X2 size={15} color={viewMode === 'grid' ? theme.primary : theme.textMuted} />
                <Text style={[styles.toggleBtnText, { color: viewMode === 'grid' ? theme.primary : theme.textMuted }]}>
                  Grid (2x)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Product Items List / Grid */}
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No items found matching your search.</Text>
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
  pillsScroll: {
    gap: 8,
    paddingBottom: 4,
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
