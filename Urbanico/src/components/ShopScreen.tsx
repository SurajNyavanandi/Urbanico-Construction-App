import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  RefreshControl,
} from 'react-native';
import {
  Search,
  Filter,
  ArrowRight,
  Heart,
  Plus,
  Truck,
  Sparkles,
  Layers,
  Wrench,
  Check,
} from 'lucide-react-native';
import { MaterialItem, CategoryId } from '../types';
import { MATERIAL_ITEMS, CATEGORIES, SERVICES } from '../data/materialsData';
import { ShimmerImage } from './common/ShimmerImage';
import { useToast } from '../context/ToastContext';

interface ShopScreenProps {
  onSelectItem: (item: MaterialItem) => void;
  onSelectCategoryTab: (categoryId: CategoryId) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const ShopScreen: React.FC<ShopScreenProps> = ({
  onSelectItem,
  onSelectCategoryTab,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const { showToast } = useToast();
  const [activeSegment, setActiveSegment] = useState<'all' | 'materials' | 'services'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Catalog updated', 'info');
    }, 700);
  };

  const filteredItems = MATERIAL_ITEMS.filter((item) => {
    const matchesSearch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.categoryId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeSegment === 'materials') {
      return item.categoryId !== 'services-catalog' && item.categoryId !== 'services';
    }
    if (activeSegment === 'services') {
      return item.categoryId === 'services-catalog' || item.categoryId === 'services';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchHeader}>
        <View style={styles.searchBar}>
          <Search size={18} color="#707072" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search materials & trade services..."
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

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
        {/* Segment Filter Pills */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            onPress={() => setActiveSegment('all')}
            style={[
              styles.segmentPill,
              activeSegment === 'all' && styles.segmentPillActive,
            ]}
          >
            <Text
              style={[
                styles.segmentPillText,
                activeSegment === 'all' && styles.segmentPillTextActive,
              ]}
            >
              All Items ({MATERIAL_ITEMS.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSegment('materials')}
            style={[
              styles.segmentPill,
              activeSegment === 'materials' && styles.segmentPillActive,
            ]}
          >
            <Text
              style={[
                styles.segmentPillText,
                activeSegment === 'materials' && styles.segmentPillTextActive,
              ]}
            >
              Building Materials
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveSegment('services')}
            style={[
              styles.segmentPill,
              activeSegment === 'services' && styles.segmentPillActive,
            ]}
          >
            <Text
              style={[
                styles.segmentPillText,
                activeSegment === 'services' && styles.segmentPillTextActive,
              ]}
            >
              Trade Services
            </Text>
          </TouchableOpacity>
        </View>

        {/* Categories Horizontal Carousel */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionHeading}>Shop By Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => onSelectCategoryTab(cat.id)}
                style={styles.categoryCard}
                activeOpacity={0.8}
              >
                <View style={styles.categoryImageContainer}>
                  <ShimmerImage
                    source={{ uri: cat.image }}
                    style={styles.categoryImage}
                    resizeMode="cover"
                    preset="thumbnail"
                    borderRadius={12}
                  />
                </View>
                <Text style={styles.categoryName} numberOfLines={1}>
                  {cat.name}
                </Text>
                <Text style={styles.categoryPrice}>{cat.priceLabel || 'Direct Yard'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Grid */}
        <View style={styles.productGridSection}>
          <View style={styles.gridHeader}>
            <Text style={styles.sectionHeading}>
              {activeSegment === 'materials'
                ? 'Building Materials'
                : activeSegment === 'services'
                ? 'Verified Trade Services'
                : 'All Products & Services'}
            </Text>
            <Text style={styles.itemCountText}>
              {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
            </Text>
          </View>

          <View style={styles.gridContainer}>
            {filteredItems.map((item) => {
              const isFav = favoriteIds.includes(item.id);
              const price = item.defaultPrice || item.options[0]?.price || 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectItem(item)}
                  style={styles.productCard}
                  activeOpacity={0.85}
                >
                  <View style={styles.productImageWrapper}>
                    <ShimmerImage
                      source={{ uri: item.image }}
                      style={styles.productImage}
                      resizeMode="cover"
                      preset="card"
                      borderRadius={12}
                    />
                    {onToggleFavorite && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item.id);
                        }}
                        style={styles.favButton}
                        activeOpacity={0.7}
                      >
                        <Heart
                          size={16}
                          color={isFav ? '#E11D48' : '#111111'}
                          fill={isFav ? '#E11D48' : 'transparent'}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.productInfo}>
                    <Text style={styles.productTag}>
                      {item.categoryId.toUpperCase()}
                    </Text>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productSubtitle} numberOfLines={1}>
                      {item.subtitle || 'Direct Yard Supply'}
                    </Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.productPrice}>
                        ₹{price.toLocaleString('en-IN')}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          onSelectItem(item);
                        }}
                        style={styles.addPill}
                        activeOpacity={0.8}
                      >
                        <Plus size={14} color="#FFFFFF" />
                        <Text style={styles.addPillText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 14,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    paddingVertical: 0,
  },
  clearText: {
    fontSize: 12,
    color: '#707072',
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 96,
  },
  segmentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  segmentPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  segmentPillActive: {
    backgroundColor: '#111111',
  },
  segmentPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707072',
  },
  segmentPillTextActive: {
    color: '#FFFFFF',
  },
  categoriesSection: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: 108,
    alignItems: 'center',
  },
  categoryImageContainer: {
    width: 108,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F5F5F5',
    marginBottom: 6,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  categoryPrice: {
    fontSize: 10,
    color: '#707072',
    textAlign: 'center',
  },
  productGridSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  itemCountText: {
    fontSize: 12,
    color: '#707072',
    fontWeight: '500',
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
    borderColor: '#EEEEEE',
    overflow: 'hidden',
    marginBottom: 12,
  },
  productImageWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#F5F5F5',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfo: {
    padding: 10,
  },
  productTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#707072',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
    lineHeight: 17,
    marginBottom: 2,
    height: 34,
  },
  productSubtitle: {
    fontSize: 11,
    color: '#707072',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111111',
  },
  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addPillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
