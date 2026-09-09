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
  Bell,
  Sparkles,
} from 'lucide-react-native';
import { ScreenType, MaterialItem } from '../types';
import { MATERIAL_ITEMS, SERVICES, CATEGORIES } from '../data/materialsData';
import { useTheme } from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './common/BrandLogo';
import { NotificationsModal } from './NotificationsModal';
import { soundService } from '../utils/soundHelper';
import {
  normalizeSearchQuery,
  searchAndRankMaterials,
  getSearchAutocompletions,
  getDidYouMeanSuggestion,
} from '../services/searchService';

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

  // Notification Center Modal State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

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

  const { cleanQuery, normalizedQuery, wasCorrected, correctionNotice } = normalizeSearchQuery(queryLower);

  // Predictive autocompletions (Amazon/Flipkart predictive search chips)
  const autocompletions = queryLower ? getSearchAutocompletions(searchInputText, 4) : [];

  // Ranked matching materials using tokenized multi-word search
  const matchingItems = queryLower
    ? searchAndRankMaterials(MATERIAL_ITEMS, searchInputText).slice(0, 6)
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

  // "Did you mean?" suggestion if zero results
  const didYouMean =
    queryLower && matchingItems.length === 0 && matchingServices.length === 0
      ? getDidYouMeanSuggestion(queryLower)
      : null;

  const handleOpenSearch = () => {
    soundService.playTap();
    setSearchInputText(searchQuery);
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const handleCloseSearch = () => {
    soundService.playTap();
    setIsSearchOpen(false);
  };

  const handleExecuteSearch = (queryStr: string) => {
    const clean = queryStr.trim();
    if (!clean) return;
    soundService.playTap();
    onSearchChange(clean);
    onSelectSearchQuery(clean);
    setIsSearchOpen(false);
    if (onNavigateScreen && currentScreen !== 'category') {
      onNavigateScreen('category');
    }
  };

  const handleSelectProductItem = (item: MaterialItem) => {
    soundService.playTap();
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
          <BrandLogo size={36} borderRadius={10} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onOpenLocationModal}
          activeOpacity={0.75}
          style={styles.locationButton}
        >
          <View style={styles.locationPinBox}>
            <MapPin color="#111111" size={14} strokeWidth={2.4} />
          </View>
          <View style={styles.locationTextWrapper}>
            <Text style={styles.locationDeliverLabel}>DELIVER TO</Text>
            <View style={styles.locationNameRow}>
              <Text style={styles.locationText} numberOfLines={1}>
                {locationName}
              </Text>
              <ChevronDown color="#111111" size={13} strokeWidth={2.4} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setIsNotificationsOpen(true)}
          activeOpacity={0.7}
          style={styles.notificationButton}
        >
          <Bell color="#111111" size={16} strokeWidth={2.2} />
          <View style={styles.notificationDot} />
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
          style={[styles.searchModalRoot, { backgroundColor: theme.surface }]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Top Search Input Bar */}
          <View style={[styles.searchModalHeader, { backgroundColor: theme.surface, borderBottomColor: theme.borderLight }]}>
            <View style={[styles.modalInputWrapper, { backgroundColor: theme.mode === 'dark' ? theme.surfaceSecondary : '#F4F4F5' }]}>
              <Search color={theme.mode === 'dark' ? theme.textSecondary : '#111111'} size={18} strokeWidth={2.2} />
              <TextInput
                ref={searchInputRef}
                value={searchInputText}
                onChangeText={(txt) => {
                  setSearchInputText(txt);
                  onSearchChange(txt);
                }}
                placeholder="Search materials, grades, trades..."
                placeholderTextColor={theme.textMuted || '#8E8E93'}
                style={[styles.modalTextInput, { color: theme.textPrimary }]}
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
                  <X color={theme.textMuted || '#707072'} size={16} strokeWidth={2.2} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={handleCloseSearch}
              style={styles.cancelSearchBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelSearchBtnText, { color: theme.textPrimary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Search Content Scroll Area */}
          <ScrollView
            style={[styles.searchModalScroll, { backgroundColor: theme.surface }]}
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
                {/* A. Typo / Contractor Normalization Notice */}
                {wasCorrected && (
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

                {/* B. Predictive Autocompletions (Flipkart/Amazon style text completion chips) */}
                {autocompletions.length > 0 && (
                  <View style={styles.searchBlock}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.autocompletionsRow}>
                      {autocompletions.map((term, i) => (
                        <TouchableOpacity
                          key={`${term}-${i}`}
                          onPress={() => {
                            setSearchInputText(term);
                            handleExecuteSearch(term);
                          }}
                          style={[styles.autocompletionChip, { backgroundColor: theme.surfaceSecondary }]}
                          activeOpacity={0.7}
                        >
                          <Search size={12} color={theme.textSecondary} strokeWidth={2} />
                          <Text style={[styles.autocompletionText, { color: theme.textPrimary }]} numberOfLines={1}>
                            {term}
                          </Text>
                          <ArrowUpRight size={12} color={theme.textMuted} strokeWidth={2} />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* C. Direct Matching Products with Keyword Highlighting */}
                {matchingItems.length > 0 && (
                  <View style={styles.searchBlock}>
                    <View style={styles.sectionTitleRow}>
                      <Package size={15} color="#111111" strokeWidth={2.2} />
                      <Text style={styles.searchSectionTitle}>
                        Materials & Products ({matchingItems.length})
                      </Text>
                    </View>

                    <View style={[styles.productListContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      {matchingItems.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => handleSelectProductItem(item)}
                          style={[styles.productSearchRow, { borderBottomColor: theme.borderLight }]}
                          activeOpacity={0.7}
                        >
                          <Image
                            source={{ uri: item.image }}
                            style={styles.productThumb}
                            resizeMode="cover"
                          />
                          <View style={styles.productInfoCol}>
                            <Text style={[styles.productRowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                              {item.name}
                            </Text>
                            <Text style={[styles.productRowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                              {item.subtitle || `${item.categoryId.toUpperCase()} • Direct Yard`}
                            </Text>
                            <View style={styles.stockBadgeRow}>
                              <CheckCircle2 size={11} color="#059669" strokeWidth={2.2} />
                              <Text style={styles.stockBadgeText}>In Stock • Fast Yard Dispatch</Text>
                            </View>
                          </View>
                          {item.defaultPrice && (
                            <View style={styles.productPriceCol}>
                              <Text style={[styles.productPriceText, { color: theme.textPrimary }]}>
                                ₹{item.defaultPrice.toLocaleString('en-IN')}
                              </Text>
                              <Text style={[styles.productPriceUnit, { color: theme.textSecondary }]}>
                                {item.options[0]?.label || 'Base Unit'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* D. Matching Trades / Site Services */}
                {matchingServices.length > 0 && (
                  <View style={styles.searchBlock}>
                    <View style={styles.sectionTitleRow}>
                      <Wrench size={15} color={theme.textPrimary} strokeWidth={2.2} />
                      <Text style={[styles.searchSectionTitle, { color: theme.textPrimary }]}>
                        Site Services & Trades ({matchingServices.length})
                      </Text>
                    </View>

                    <View style={[styles.productListContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                      {matchingServices.map((srv) => (
                        <TouchableOpacity
                          key={srv.id}
                          onPress={() => {
                            const serviceMat = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
                            if (serviceMat && onSelectItemModal) {
                              handleCloseSearch();
                              onSelectItemModal(serviceMat);
                            } else {
                              handleExecuteSearch(srv.name);
                            }
                          }}
                          style={[styles.productSearchRow, { borderBottomColor: theme.borderLight }]}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.serviceIconThumb, { backgroundColor: theme.surfaceSecondary }]}>
                            <Wrench size={18} color={theme.textPrimary} strokeWidth={2} />
                          </View>
                          <View style={styles.productInfoCol}>
                            <Text style={[styles.productRowTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                              {srv.name} Service
                            </Text>
                            <Text style={[styles.productRowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                              {srv.subtitle}
                            </Text>
                          </View>
                          <View style={styles.serviceRateBadge}>
                            <Text style={styles.serviceRateText}>{srv.rate || '₹99 / demo'}</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* E. Matching Categories */}
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

                {/* F. Zero-Result Fallback & Did You Mean */}
                {matchingItems.length === 0 && matchingServices.length === 0 && matchingCategories.length === 0 && (
                  <View style={styles.searchZeroContainer}>
                    <Text style={[styles.searchZeroTitle, { color: theme.textPrimary }]}>
                      No products matched "{searchInputText}"
                    </Text>
                    <Text style={[styles.searchZeroSub, { color: theme.textSecondary }]}>
                      Check your spelling or try popular construction keywords
                    </Text>
                    {didYouMean && (
                      <TouchableOpacity
                        onPress={() => {
                          setSearchInputText(didYouMean);
                          handleExecuteSearch(didYouMean);
                        }}
                        style={[styles.didYouMeanBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                        activeOpacity={0.75}
                      >
                        <Sparkles size={14} color="#2563EB" strokeWidth={2.2} />
                        <Text style={styles.didYouMeanBtnText}>
                          Did you mean: <Text style={{ fontWeight: '700', textDecorationLine: 'underline' }}>{didYouMean}</Text>?
                        </Text>
                      </TouchableOpacity>
                    )}
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
                    Search Entire Catalog for "{searchInputText}"
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* 3. Site Notifications Center Modal */}
      {isNotificationsOpen && (
        <NotificationsModal
          visible={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onNavigateScreen={onNavigateScreen}
        />
      )}
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
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  notificationButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F4F5',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#0284C7',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minHeight: 38,
    marginHorizontal: 4,
  },
  locationPinBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  locationDeliverLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    lineHeight: 11,
    textTransform: 'uppercase',
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
    lineHeight: 16,
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
  correctionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  correctionBannerText: {
    fontSize: 12,
    color: '#78350F',
    flex: 1,
  },
  autocompletionsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  autocompletionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  autocompletionText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 180,
  },
  searchZeroContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  searchZeroTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  searchZeroSub: {
    fontSize: 12.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  didYouMeanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  didYouMeanBtnText: {
    fontSize: 13,
    color: '#1D4ED8',
  },
});
