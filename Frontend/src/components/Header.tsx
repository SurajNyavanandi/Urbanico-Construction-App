import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ScrollView,
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
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const isHome = currentScreen === 'home';
  const showSearchBar = isHome;
  const locationName = activeLocation.split(',')[0] || 'Home';

  const queryLower = searchQuery.toLowerCase().trim();

  // Filter ONLY materials (excluding services category) for materials search
  const matchingItems = queryLower
    ? MATERIAL_ITEMS.filter(
        (m) =>
          m.categoryId !== 'services' &&
          (m.name.toLowerCase().includes(queryLower) ||
            (m.subtitle && m.subtitle.toLowerCase().includes(queryLower)))
      ).slice(0, 5)
    : [];

  const matchingServices = queryLower
    ? SERVICES.filter(
        (s) =>
          s.name.toLowerCase().includes(queryLower) ||
          s.subtitle.toLowerCase().includes(queryLower)
      ).slice(0, 3)
    : [];

  const matchingCategories = queryLower
    ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(queryLower)).slice(0, 3)
    : [];

  const POPULAR_SUGGESTIONS = [
    'UltraTech Cement 53 Grade',
    'Plastering Sand',
    'TMT 12mm Rebar',
    'Red Clay Bricks',
    'AAC Blocks',
    'Bamboo Planks',
  ];

  const handleInputChange = (text: string) => {
    onSearchChange(text);
    if (text.trim().length > 0) {
      setIsSearching(true);
      setTimeout(() => setIsSearching(false), 120);
    } else {
      setIsSearching(false);
    }
  };

  const handleExecuteSearch = (queryStr: string) => {
    onSelectSearchQuery(queryStr);
    setIsFocused(false);
    if (onNavigateScreen && currentScreen !== 'category') {
      onNavigateScreen('category');
    }
  };

  const handleSelectProductItem = (item: MaterialItem) => {
    onSelectSearchQuery(item.name);
    setIsFocused(false);
    if (onSelectItemModal) {
      onSelectItemModal(item);
    }
  };

  return (
    <View style={[styles.headerContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      {/* 1. Location Bar & Brand Identity */}
      <View style={styles.locationRow}>
        <TouchableOpacity
          onPress={onOpenLocationModal}
          activeOpacity={0.7}
          style={styles.locationButton}
        >
          <MapPin color={theme.primary} size={18} />
          <Text style={[styles.locationText, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
            {locationName}
          </Text>
          <ChevronDown color={theme.textPrimary} size={16} strokeWidth={2.5} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigateScreen && onNavigateScreen('home')}
          activeOpacity={0.8}
        >
          <BrandLogo size={30} borderRadius={8} />
        </TouchableOpacity>
      </View>

      {/* 2. Sub-header line (Back Arrow + Category Title) for non-home screens when not focused */}
      {!isHome && !isFocused && (
        <View style={styles.subHeaderRow}>
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={styles.backButton}
              accessibilityLabel="Go Back"
              activeOpacity={0.7}
            >
              <ArrowLeft color={theme.textPrimary} size={22} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 28 }} />
          )}
          <Text style={[styles.headerTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
            {title || 'Materials'}
          </Text>
          <View style={{ width: 28 }} />
        </View>
      )}

      {/* 3. Search Bar Container */}
      {showSearchBar && (
        <View style={styles.searchRow}>
          <View style={[styles.searchContainer, isFocused && { flex: 1 }]}>
            <TextInput
              value={searchQuery}
              onChangeText={handleInputChange}
              onFocus={() => setIsFocused(true)}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={theme.textMuted}
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.surfaceSecondary,
                  color: theme.textPrimary,
                  borderColor: theme.border,
                  fontFamily: typography.fontFamily,
                },
              ]}
              returnKeyType="search"
              onSubmitEditing={() => handleExecuteSearch(searchQuery)}
            />
            <View style={styles.searchIconContainer}>
              <Search color={theme.primary} size={16} strokeWidth={2.2} />
            </View>

            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => handleInputChange('')}
                style={styles.clearIconContainer}
                activeOpacity={0.7}
              >
                <X color={theme.textMuted} size={16} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          {isFocused && (
            <TouchableOpacity
              onPress={() => {
                setIsFocused(false);
              }}
              style={styles.cancelBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelBtnText, { color: theme.primary, fontFamily: typography.fontFamilyHeading }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 4. Dropdown Suggestions & Recent Searches Overlay (Absolute Floating) */}
      {isFocused && (
        <View style={[styles.dropdownOverlay, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Loading Indicator when user is typing */}
            {isSearching && (
              <View style={styles.loadingBox}>
                <Text style={[styles.loadingText, { color: theme.primary }]}>Searching catalog...</Text>
              </View>
            )}

            {/* Case A: Query is empty - Show Recent Searches */}
            {!queryLower && !isSearching && (
              <View style={styles.dropdownSection}>
                {recentSearches.length > 0 ? (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={styles.sectionTitleGroup}>
                        <History size={14} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Recent Searches</Text>
                      </View>
                      <TouchableOpacity
                        onPress={onClearRecentSearches}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.clearAllText}>Clear All</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.recentList}>
                      {recentSearches.map((term, idx) => (
                        <View key={`${term}-${idx}`} style={[styles.recentRow, { backgroundColor: theme.surfaceSecondary }]}>
                          <TouchableOpacity
                            onPress={() => handleExecuteSearch(term)}
                            style={styles.recentTouchArea}
                            activeOpacity={0.7}
                          >
                            <History size={13} color={theme.textMuted} />
                            <Text style={[styles.recentTermText, { color: theme.textPrimary }]}>{term}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onRemoveRecentSearch(term)}
                            style={styles.removeRecentBtn}
                            activeOpacity={0.7}
                          >
                            <X size={12} color={theme.textMuted} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.loadingBox}>
                    <Text style={[styles.loadingText, { color: theme.textMuted }]}>Type to search materials catalog...</Text>
                  </View>
                )}
              </View>
            )}

            {/* Case B: User typed text - Show Dynamic Matches matching Materials Catalog layout */}
            {queryLower && !isSearching && (
              <View style={styles.dropdownSection}>
                {matchingItems.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionTitleGroup}>
                      <Package size={14} color={theme.primary} />
                      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Materials & Products</Text>
                    </View>
                    {matchingItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => handleSelectProductItem(item)}
                        style={[styles.suggestionItemRow, { borderBottomColor: theme.borderLight }]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.suggestionInfo}>
                          <Text style={[styles.suggestionTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          {item.subtitle && (
                            <Text style={[styles.suggestionSub, { color: theme.textSecondary }]} numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          )}
                        </View>
                        {item.defaultPrice && (
                          <Text style={[styles.suggestionPrice, { color: theme.primaryDark }]}>
                            ₹{item.defaultPrice.toLocaleString('en-IN')}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {matchingServices.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionTitleGroup}>
                      <Wrench size={14} color={theme.primary} />
                      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Site Services & Trades</Text>
                    </View>
                    {matchingServices.map((srv) => (
                      <TouchableOpacity
                        key={srv.id}
                        onPress={() => handleExecuteSearch(srv.name)}
                        style={[styles.suggestionItemRow, { borderBottomColor: theme.borderLight }]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.suggestionInfo}>
                          <Text style={[styles.suggestionTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                            {srv.name} Service
                          </Text>
                          <Text style={[styles.suggestionSub, { color: theme.textSecondary }]} numberOfLines={1}>
                            {srv.subtitle} • {srv.rate}
                          </Text>
                        </View>
                        <View style={[styles.serviceBadge, { backgroundColor: theme.primaryLight }]}>
                          <Text style={[styles.serviceBadgeText, { color: theme.primaryDark }]}>Labor Trade</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {matchingCategories.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <View style={styles.sectionTitleGroup}>
                      <Tag size={14} color={theme.primary} />
                      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>Categories</Text>
                    </View>
                    {matchingCategories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => handleExecuteSearch(cat.name)}
                        style={[styles.suggestionItemRow, { borderBottomColor: theme.borderLight }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.suggestionTitle, { color: theme.textPrimary }]}>{cat.name} Catalog</Text>
                        <Text style={[styles.suggestionSub, { color: theme.textSecondary }]}>{cat.count}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {matchingItems.length === 0 &&
                  matchingServices.length === 0 &&
                  matchingCategories.length === 0 && (
                    <View style={styles.noMatchBox}>
                      <Text style={[styles.noMatchText, { color: theme.textMuted }]}>
                        No exact product found for "{searchQuery}".
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleExecuteSearch(searchQuery)}
                        style={[styles.searchAllBtn, { backgroundColor: theme.primary }]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.searchAllBtnText}>
                          Search Catalog for "{searchQuery}"
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
              </View>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    position: 'relative',
    zIndex: 9999,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
  },
  brandBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
    flex: 1,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchInput: {
    borderRadius: 999,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 13,
    fontWeight: '600',
    borderWidth: 1,
  },
  searchIconContainer: {
    position: 'absolute',
    left: 14,
  },
  clearIconContainer: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
  },
  dropdownOverlay: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    maxHeight: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
    zIndex: 99999,
  },
  dropdownScroll: {
    padding: 12,
  },
  loadingBox: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 12,
    fontWeight: '700',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dropdownSection: {
    gap: 16,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  recentList: {
    gap: 4,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  recentTouchArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  recentTermText: {
    fontSize: 12,
    fontWeight: '600',
  },
  removeRecentBtn: {
    padding: 4,
  },
  suggestionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  suggestionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  suggestionPrice: {
    fontSize: 12,
    fontWeight: '800',
  },
  serviceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  serviceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  noMatchBox: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  noMatchText: {
    fontSize: 12,
    textAlign: 'center',
  },
  searchAllBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  searchAllBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
