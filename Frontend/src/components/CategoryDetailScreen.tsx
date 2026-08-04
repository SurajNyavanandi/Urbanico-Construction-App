import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Heart, ShoppingCart } from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface CategoryDetailScreenProps {
  categoryId: CategoryId | 'all';
  onSelectItem: (item: MaterialItem) => void;
  onSelectCategoryTab: (catId: CategoryId) => void;
  searchQuery: string;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const CategoryDetailScreen: React.FC<CategoryDetailScreenProps> = ({
  categoryId,
  onSelectItem,
  onSelectCategoryTab,
  searchQuery,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const { theme, typography } = useTheme();

  // Filter materials based on selected category and search query
  const items = MATERIAL_ITEMS.filter((item) => {
    const matchesCat =
      categoryId === 'all'
        ? true
        : categoryId === 'services-catalog'
        ? item.categoryId === 'services'
        : item.categoryId === categoryId;
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const filteredCategories = CATEGORIES.filter((c) =>
    !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredServices = SERVICES.filter((srv) =>
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
      {/* Category Pills horizontal scroller for fast filtering */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsScroll}
      >
        <TouchableOpacity
          onPress={() => onSelectCategoryTab('all')}
          activeOpacity={0.7}
          style={[
            styles.pillButton,
            { backgroundColor: categoryId === 'all' ? theme.primary : theme.surfaceSecondary },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              { color: categoryId === 'all' ? '#FFFFFF' : theme.textSecondary },
            ]}
          >
            Materials Catalog
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onSelectCategoryTab('services-catalog')}
          activeOpacity={0.7}
          style={[
            styles.pillButton,
            {
              backgroundColor:
                categoryId === 'services-catalog' || categoryId === 'services'
                  ? theme.primary
                  : theme.surfaceSecondary,
            },
          ]}
        >
          <Text
            style={[
              styles.pillText,
              {
                color:
                  categoryId === 'services-catalog' || categoryId === 'services'
                    ? '#FFFFFF'
                    : theme.textSecondary,
              },
            ]}
          >
            Services Catalog
          </Text>
        </TouchableOpacity>

        {CATEGORIES.map((cat) => {
          const isSelected = categoryId === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => onSelectCategoryTab(cat.id)}
              activeOpacity={0.7}
              style={[
                styles.pillButton,
                { backgroundColor: isSelected ? theme.primary : theme.surfaceSecondary },
              ]}
            >
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 1. Materials Catalog Grid (categoryId === 'all') */}
      {categoryId === 'all' && (
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {filteredCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onSelectCategoryTab(cat.id)}
                activeOpacity={0.8}
                style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={{ uri: cat.image }}
                    style={styles.cardImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.cardTextWrapper}>
                  <Text style={[styles.catName, { color: theme.textPrimary }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {cat.priceLabel && (
                    <Text style={[styles.priceLabel, { color: theme.primaryDark }]} numberOfLines={1}>
                      {cat.priceLabel}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* 2. Services Catalog Grid (categoryId === 'services-catalog') - Two Row Grid Layout */}
      {categoryId === 'services-catalog' && (
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {filteredServices.map((srv) => {
              const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
              return (
                <TouchableOpacity
                  key={srv.id}
                  onPress={() => {
                    if (matchingItem) {
                      onSelectItem(matchingItem);
                    }
                  }}
                  activeOpacity={0.8}
                  style={[styles.gridCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
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
        </View>
      )}

      {/* 3. Detailed Item List */}
      {!isCatalogMode && (
        <View style={styles.itemList}>
          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.textMuted }]}>No items found matching your search.</Text>
            </View>
          ) : (
            items.map((item) => {
              const isFav = favoriteIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectItem(item)}
                  activeOpacity={0.8}
                  style={[styles.itemCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                >
                  {/* Thumbnail Image */}
                  <View style={[styles.itemThumbnailWrapper, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderLight }]}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.itemImage}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Title & Subtitle & Price */}
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {item.subtitle && (
                      <Text style={[styles.itemSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    )}
                    {item.defaultPrice && (
                      <Text style={[styles.itemPrice, { color: theme.primaryDark }]}>
                        ₹{item.defaultPrice.toLocaleString('en-IN')}
                        {item.categoryId === 'services'
                          ? ' / Day'
                          : item.categoryId === 'cement'
                          ? ' / Bag'
                          : item.categoryId === 'sand' && item.defaultPrice < 100
                          ? ' / Bag'
                          : ''}
                      </Text>
                    )}
                  </View>

                  {/* Actions: Symmetrical Heart + Cart Icon Buttons */}
                  <View style={styles.actionButtonsRow}>
                    {onToggleFavorite && (
                      <TouchableOpacity
                        onPress={() => onToggleFavorite(item.id)}
                        activeOpacity={0.7}
                        style={[
                          styles.circleIconButton,
                          isFav
                            ? { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }
                            : { backgroundColor: theme.surfaceSecondary, borderColor: theme.border },
                        ]}
                      >
                        <Heart
                          size={16}
                          color={isFav ? '#EF4444' : theme.textMuted}
                          fill={isFav ? '#EF4444' : 'none'}
                        />
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      onPress={() => onSelectItem(item)}
                      activeOpacity={0.7}
                      style={[styles.cartCircleButton, { backgroundColor: theme.primary }]}
                    >
                      <ShoppingCart size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
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
  itemList: {
    gap: 12,
    paddingTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
  },
  itemCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  itemThumbnailWrapper: {
    width: 76,
    height: 76,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '800',
  },
  itemSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cartCircleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
