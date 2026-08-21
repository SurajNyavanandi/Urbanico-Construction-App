import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
  Modal,
  Image,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import {
  MapPin,
  Search,
  ChevronDown,
  ArrowLeft,
  X,
  History,
  Package,
  Wrench,
  Tag,
  TrendingUp,
  Flame,
  ArrowUpRight,
  CheckCircle2,
} from 'lucide-react-native';
import { ScreenType, MaterialItem } from '../types';
import { MATERIAL_ITEMS, SERVICES, CATEGORIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './common/BrandLogo';

interface HeaderProps {
  currentScreen: ScreenType;
  title?: string;
  selectedLocation?: string;
  onOpenLocationModal: () => void;
  onBack?: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  recentSearches: string[];
  onSelectSearchQuery: (query: string) => void;
  onClearRecentSearches: () => void;
  onRemoveRecentSearch: (query: string) => void;
  onSelectItemModal?: (item: MaterialItem) => void;
  onNavigateScreen?: (screen: ScreenType) => void;
}

const POPULAR_SEARCH_PILLS = [
  'UltraTech Cement 53',
  'Plastering Sand',
  'TMT 12mm Rebar',
  'Red Clay Bricks',
  'AAC Blocks 8-inch',
  'M-Sand Manufactured',
  'Centring Iron Sheets',
  'Civil Mason Crew',
  'River Sand Bulk',
  'Blue Metal 20mm',
];

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  title,
  selectedLocation: propLocation,
  onOpenLocationModal,
  onBack,
  searchQuery,
  onSearchChange,
  recentSearches,
  onSelectSearchQuery,
  onClearRecentSearches,
  onRemoveRecentSearch,
  onSelectItemModal,
  onNavigateScreen,
}) => {
  const { theme, typography } = useTheme();
  const { t } = useLanguage();
  const { selectedLocation: globalLocation } = useLocation();
  const activeLocation = globalLocation || propLocation || 'Miyapur Site, Phase 2, Hyderabad';
  
  // Nike/Adidas Style Full Search Overlay State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInputText, setSearchInputText] = useState(searchQuery);
  const searchInputRef = useRef<TextInput>(null);

  // Sync external search query
  useEffect(() => {
    setSearchInputText(searchQuery);
  }, [searchQuery]);

  // Close search overlay if screen changes
  useEffect(() => {
    setIsSearchOpen(false);
  }, [currentScreen]);

  const locationName = activeLocation.split(',')[0] || 'Home';
  const queryLower = searchInputText.toLowerCase().trim();

  // Synonyms and typo mapping for Indian construction terms
  const normalizeContractorQuery = (q: string) => {
    const raw = q.toLowerCase().trim();
    if (raw.includes('cemet') || raw.includes('semant') || raw.includes('ciment')) return 'cement';
    if (raw.includes('msand') || raw.includes('m sand') || raw.includes('psand') || raw.includes('p sand') || raw.includes('reti') || raw.includes('ret')) return 'sand';
    if (raw.includes('saria') || raw.includes('rebar') || raw.includes('iron rod') || raw.includes('tmt rod') || raw.includes('daria')) return 'steel';
    if (raw.includes('gitti') || raw.includes('kankad') || raw.includes('agregate') || raw.includes('blue metal') || raw.includes('gravel')) return 'stone';
    if (raw.includes('eent') || raw.includes('int') || raw.includes('aac block')) return 'bricks';
    if (raw.includes('formwork') || raw.includes('centring') || raw.includes('prop')) return 'centring';
    return raw;
  };

  const normalizedQuery = normalizeContractorQuery(queryLower);

  // Filter matching materials
  const matchingItems = queryLower
    ? MATERIAL_ITEMS.filter(
        (m) =>
          m.categoryId !== 'services' &&
          (m.name.toLowerCase().includes(queryLower) ||
            m.name.toLowerCase().includes(normalizedQuery) ||
            (m.subtitle && (m.subtitle.toLowerCase().includes(queryLower) || m.subtitle.toLowerCase().includes(normalizedQuery))) ||
            m.categoryId.toLowerCase().includes(queryLower) ||
            m.categoryId.toLowerCase().includes(normalizedQuery))
      ).slice(0, 6)
    : [];

  // Filter matching services
  const matchingServices = queryLower
    ? SERVICES.filter(
        (s) =>
          s.name.toLowerCase().includes(queryLower) ||
          s.name.toLowerCase().includes(normalizedQuery) ||
          (s.subtitle && (s.subtitle.toLowerCase().includes(queryLower) || s.subtitle.toLowerCase().includes(normalizedQuery)))
      ).slice(0, 3)
    : [];

  // Filter matching categories
  const matchingCategories = queryLower
    ? CATEGORIES.filter(
        (c) =>
          c.name.toLowerCase().includes(queryLower) ||
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.id.toLowerCase().includes(normalizedQuery)
      ).slice(0, 3)
    : [];

  const handleOpenSearch = () => {
    setSearchInputText(searchQuery);
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

  const handleExecuteSearch = (queryStr: string) => {
    const clean = queryStr.trim();
    if (!clean) return;
    onSearchChange(clean);
    onSelectSearchQuery(clean);
    setIsSearchOpen(false);
    if (onNavigateScreen && currentScreen !== 'category') {
      onNavigateScreen('category');
    }
  };

  const handleSelectProductItem = (item: MaterialItem) => {
    onSearchChange(item.name);
    onSelectSearchQuery(item.name);
    setIsSearchOpen(false);
    if (onSelectItemModal) {
      onSelectItemModal(item);
    }
  };

  const handleSelectCategoryPill = (catId: string) => {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (cat) {
      handleExecuteSearch(cat.name);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* 1. Location Bar & Brand Identity (Home screen exclusive) */}
      <View style={styles.locationRow}>
        <TouchableOpacity
          onPress={() => onNavigateScreen && onNavigateScreen('home')}
          activeOpacity={0.8}
          style={styles.brandContainer}
        >
          <BrandLogo size={32} borderRadius={8} />
          <View style={styles.brandTextGroup}>
            <Text style={styles.brandTitle}>DIRECT YARD</Text>
            <Text style={styles.brandSub}>Wholesale Supplies</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenLocationModal}
          activeOpacity={0.7}
          style={styles.locationButton}
        >
          <MapPin color="#111111" size={13} strokeWidth={2.2} />
          <View style={styles.locationTextWrapper}>
            <Text style={styles.locationDeliverLabel}>DELIVER TO</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
          <ChevronDown color="#111111" size={13} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {/* 2. Nike-style Search Bar Trigger on Home screen */}
      <TouchableOpacity
        onPress={handleOpenSearch}
        activeOpacity={0.85}
        style={styles.searchBarTrigger}
      >
        <Search color="#111111" size={17} strokeWidth={2.2} />
        <Text style={styles.searchPlaceholderText} numberOfLines={1}>
          {searchQuery ? searchQuery : t.searchPlaceholder || 'Search cement, sand, TMT steel, tools...'}
        </Text>
        {searchQuery ? (
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onSearchChange('');
            }}
            style={styles.triggerClearBtn}
            activeOpacity={0.7}
          >
            <X color="#707072" size={14} strokeWidth={2.2} />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>

      {/* ========================================================================= */}
      {/* NIKE / ADIDAS / PUMA FULL-SCREEN SEARCH OVERLAY */}
      {/* ========================================================================= */}
      <Modal
        visible={isSearchOpen}
        animationType="fade"
        transparent={false}
        onRequestClose={handleCloseSearch}
      >
        <KeyboardAvoidingView
          style={styles.searchModalRoot}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Top Search Input Bar */}
          <View style={styles.searchModalHeader}>
            <View style={styles.modalInputWrapper}>
              <Search color="#111111" size={18} strokeWidth={2.2} />
              <TextInput
                ref={searchInputRef}
                value={searchInputText}
                onChangeText={(txt) => {
                  setSearchInputText(txt);
                  onSearchChange(txt);
                }}
                placeholder="Search materials, grades, trades..."
                placeholderTextColor="#8E8E93"
                style={styles.modalTextInput}
                returnKeyType="search"
                onSubmitEditing={() => handleExecuteSearch(searchInputText)}
                autoFocus
              />
              {searchInputText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchInputText('');
                    onSearchChange('');
                    searchInputRef.current?.focus();
                  }}
                  style={styles.modalClearBtn}
                  activeOpacity={0.7}
                >
                  <X color="#707072" size={16} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleCloseSearch}
              style={styles.cancelSearchBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelSearchBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Search Content Scroll Area */}
          <ScrollView
            style={styles.searchModalScroll}
            contentContainerStyle={styles.searchModalScrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ------------------------------------------------------------- */}
            {/* VIEW A: EMPTY QUERY (Recent Searches & Trending Tags) */}
            {/* ------------------------------------------------------------- */}
            {!queryLower && (
              <View style={styles.searchSectionGap}>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <View style={styles.searchBlock}>
                    <View style={styles.searchSectionHeader}>
                      <View style={styles.sectionTitleRow}>
                        <History size={15} color="#111111" strokeWidth={2.2} />
                        <Text style={styles.searchSectionTitle}>Recent Searches</Text>
                      </View>
                      <TouchableOpacity
                        onPress={onClearRecentSearches}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearAllBtnText}>Clear All</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.recentPillsContainer}>
                      {recentSearches.map((term, idx) => (
                        <View key={`${term}-${idx}`} style={styles.recentChip}>
                          <TouchableOpacity
                            onPress={() => handleExecuteSearch(term)}
                            style={styles.recentChipTextBtn}
                            activeOpacity={0.7}
                          >
                            <History size={13} color="#707072" strokeWidth={1.8} />
                            <Text style={styles.recentChipText} numberOfLines={1}>
                              {term}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onRemoveRecentSearch(term)}
                            style={styles.recentChipRemoveBtn}
                            activeOpacity={0.7}
                          >
                            <X size={13} color="#8E8E93" strokeWidth={2} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Popular & Trending Now (Nike Style Rounded Pills) */}
                <View style={styles.searchBlock}>
                  <View style={styles.sectionTitleRow}>
                    <Flame size={15} color="#E11D48" strokeWidth={2.2} />
                    <Text style={styles.searchSectionTitle}>Trending Searches</Text>
                  </View>

                  <View style={styles.trendingPillsContainer}>
                    {POPULAR_SEARCH_PILLS.map((term) => (
                      <TouchableOpacity
                        key={term}
                        onPress={() => handleExecuteSearch(term)}
                        style={styles.trendingPill}
                        activeOpacity={0.75}
                      >
                        <TrendingUp size={12} color="#111111" strokeWidth={2} />
                        <Text style={styles.trendingPillText}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Quick Browse Categories */}
                <View style={styles.searchBlock}>
                  <View style={styles.sectionTitleRow}>
                    <Tag size={15} color="#111111" strokeWidth={2.2} />
                    <Text style={styles.searchSectionTitle}>Explore Categories</Text>
                  </View>

                  <View style={styles.categoryChipsGrid}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => handleSelectCategoryPill(cat.id)}
                        style={styles.categoryChipCard}
                        activeOpacity={0.75}
                      >
                        <Text style={styles.categoryChipName}>{cat.name}</Text>
                        <ArrowUpRight size={14} color="#707072" strokeWidth={2} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* ------------------------------------------------------------- */}
            {/* VIEW B: ACTIVE QUERY (Live Matching Materials, Services, Cats) */}
            {/* ------------------------------------------------------------- */}
            {queryLower && (
              <View style={styles.searchSectionGap}>
                {/* 1. Direct Matching Products */}
                {matchingItems.length > 0 && (
                  <View style={styles.searchBlock}>
                    <View style={styles.sectionTitleRow}>
                      <Package size={15} color="#111111" strokeWidth={2.2} />
                      <Text style={styles.searchSectionTitle}>
                        Materials & Products ({matchingItems.length})
                      </Text>
                    </View>

                    <View style={styles.productListContainer}>
                      {matchingItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => handleSelectProductItem(item)}
                          style={styles.productSearchRow}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: item.image }}
                            style={styles.productThumb}
                            resizeMode="cover"
                          />
                          <View style={styles.productInfoCol}>
                            <Text style={styles.productRowTitle} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={styles.productRowSub} numberOfLines={1}>
                              {item.subtitle || `${item.categoryId.toUpperCase()} • Direct Yard`}
                            </Text>
                            <View style={styles.stockBadgeRow}>
                              <CheckCircle2 size={11} color="#059669" strokeWidth={2.2} />
                              <Text style={styles.stockBadgeText}>In Stock • Fast Yard Dispatch</Text>
                            </View>
                          </View>
                          {item.defaultPrice && (
                            <View style={styles.productPriceCol}>
                              <Text style={styles.productPriceText}>
                                ₹{item.defaultPrice.toLocaleString('en-IN')}
                              </Text>
                              <Text style={styles.productPriceUnit}>
                                {item.options[0]?.label || 'Base Unit'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* 2. Matching Trades / Site Services */}
                {matchingServices.length > 0 && (
                  <View style={styles.searchBlock}>
                    <View style={styles.sectionTitleRow}>
                      <Wrench size={15} color="#111111" strokeWidth={2.2} />
                      <Text style={styles.searchSectionTitle}>
                        Site Services & Trades ({matchingServices.length})
                      </Text>
                    </View>

                    <View style={styles.productListContainer}>
                      {matchingServices.map((srv) => (
                        <TouchableOpacity
                          key={srv.id}
                          onPress={() => handleExecuteSearch(srv.name)}
                          style={styles.productSearchRow}
                          activeOpacity={0.7}
                        >
                          <View style={styles.serviceIconThumb}>
                            <Wrench size={18} color="#111111" strokeWidth={2} />
                          </View>
                          <View style={styles.productInfoCol}>
                            <Text style={styles.productRowTitle} numberOfLines={1}>
                              {srv.name} Service
                            </Text>
                            <Text style={styles.productRowSub} numberOfLines={1}>
                              {srv.subtitle}
                            </Text>
                          </View>
                          <View style={styles.serviceRateBadge}>
                            <Text style={styles.serviceRateText}>{srv.rate}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* 3. Matching Categories */}
                {matchingCategories.length > 0 && (
                  <View style={styles.searchBlock}>
                    <View style={styles.sectionTitleRow}>
                      <Tag size={15} color="#111111" strokeWidth={2.2} />
                      <Text style={styles.searchSectionTitle}>Categories</Text>
                    </View>

                    <View style={styles.categoryChipsGrid}>
                      {matchingCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => handleExecuteSearch(cat.name)}
                          style={styles.categoryChipCard}
                          activeOpacity={0.75}
                        >
                          <Text style={styles.categoryChipName}>{cat.name} Catalog</Text>
                          <ArrowUpRight size={14} color="#707072" strokeWidth={2} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Action CTA: Search Entire Catalog */}
                <TouchableOpacity
                  onPress={() => handleExecuteSearch(searchInputText)}
                  style={styles.searchAllCatalogBtn}
                  activeOpacity={0.85}
                >
                  <Search size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.searchAllCatalogBtnText}>
                    Search Catalog for "{searchInputText}"
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTextGroup: {
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#111111',
    letterSpacing: 0.5,
    lineHeight: 16,
  },
  brandSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#707072',
    letterSpacing: 0.3,
    lineHeight: 12,
    textTransform: 'uppercase',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
    maxWidth: '54%',
  },
  locationTextWrapper: {
    flexShrink: 1,
  },
  locationDeliverLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#707072',
    letterSpacing: 0.5,
    lineHeight: 10,
  },
  locationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
    lineHeight: 14,
  },

  /* Search Trigger Bar (Nike/Adidas look) */
  searchBarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F4F4F5',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchPlaceholderText: {
    flex: 1,
    fontSize: 13,
    color: '#707072',
    fontWeight: '500',
  },
  triggerClearBtn: {
    padding: 2,
  },

  /* Full Screen Search Modal */
  searchModalRoot: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  modalInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    gap: 8,
  },
  modalTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#111111',
    fontWeight: '500',
    padding: 0,
  },
  modalClearBtn: {
    padding: 4,
  },
  cancelSearchBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelSearchBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111111',
  },

  /* Scroll Content */
  searchModalScroll: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchModalScrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  searchSectionGap: {
    gap: 22,
  },
  searchBlock: {
    gap: 10,
  },
  searchSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#111111',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearAllBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E11D48',
  },

  /* Recent Chips */
  recentPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F4F5',
    borderRadius: 999,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 6,
  },
  recentChipTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111111',
    maxWidth: 160,
  },
  recentChipRemoveBtn: {
    padding: 4,
  },

  /* Trending Pills */
  trendingPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  trendingPillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111111',
  },

  /* Category Chips Grid */
  categoryChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '48%',
  },
  categoryChipName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#111111',
  },

  /* Products Search Rows */
  productListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },
  productSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  serviceIconThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#F4F4F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfoCol: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    gap: 2,
  },
  productRowTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#111111',
  },
  productRowSub: {
    fontSize: 11.5,
    color: '#707072',
  },
  stockBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  stockBadgeText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#059669',
  },
  productPriceCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    marginLeft: 6,
  },
  productPriceText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#111111',
  },
  productPriceUnit: {
    fontSize: 10.5,
    color: '#707072',
  },
  serviceRateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#F4F4F5',
  },
  serviceRateText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111111',
  },

  /* Search All Catalog CTA */
  searchAllCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#111111',
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 6,
  },
  searchAllCatalogBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
