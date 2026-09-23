import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  RefreshControl,
  ImageBackground,
  Platform,
} from 'react-native';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS, ServiceItem } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme, useTypography, useSpacing, useRadius } from '../theme';
import { ProductCard } from './common/ProductCard';
import { ShimmerImage } from './common/ShimmerImage';
import { PromotionalVideoPlayer } from './common/PromotionalVideoPlayer';
import { AmbujaVideoAd } from './common/AmbujaVideoAd';
import { preloadImages } from '../utils/imageOptimization';
import { BRAND_LOGO_URL } from '../constants';
import { soundService } from '../utils/soundHelper';
import { HomeSkeleton } from './common/SkeletonLoader';

interface HomeScreenProps {
  headerComponent?: React.ReactNode;
  onSelectCategory: (catId: CategoryId) => void;
  onNavigateAllMaterials: () => void;
  onNavigateAllServices?: () => void;
  onSelectItem?: (item: MaterialItem) => void;
  searchQuery: string;
  onOpenServicesModal?: (service?: ServiceItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  onAddBundleToCartAndNavigate?: (bundle: ProjectBundle) => void;
  materials?: MaterialItem[];
  categories?: any[];
  services?: any[];
  bundles?: any[];
}

const HERO_CARD_IMAGE_URL = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1788333084/herocard_hwvlhi.jpg';

interface ChildPillItem {
  id: string;
  label: string;
  image: string;
  type: 'material' | 'service';
  categoryId?: CategoryId;
}

const MATERIAL_CHILD_PILLS: ChildPillItem[] = [
  {
    id: 'cement',
    label: 'Cement',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-cement_pwrzsr.jpg',
    type: 'material',
    categoryId: 'cement',
  },
  {
    id: 'bricks',
    label: 'Bricks',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-bricks_bbywkp.jpg',
    type: 'material',
    categoryId: 'bricks',
  },
  {
    id: 'sand',
    label: 'Sand',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-sand_qmbdo6.jpg',
    type: 'material',
    categoryId: 'sand',
  },
  {
    id: 'stone',
    label: 'Stone',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-stones_oqaced.jpg',
    type: 'material',
    categoryId: 'stone',
  },
  {
    id: 'iron_bars',
    label: 'Steel',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-ironbars_ayo0id.jpg',
    type: 'material',
    categoryId: 'iron_bars',
  },
  {
    id: 'centring',
    label: 'Centring',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-centering_nikj90.jpg',
    type: 'material',
    categoryId: 'centring',
  },
  {
    id: 'tiles',
    label: 'Tiles',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    type: 'material',
    categoryId: 'tiles',
  },
];

const SERVICE_CHILD_PILLS: ChildPillItem[] = [
  {
    id: 'mason',
    label: 'Mason',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693450/child-mason_mv6ulz.jpg',
    type: 'service',
  },
  {
    id: 'fabricator',
    label: 'Fabricator',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-fabricator_btw9ek.jpg',
    type: 'service',
  },
  {
    id: 'painter',
    label: 'Painter',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-painter_eoyox2.jpg',
    type: 'service',
  },
  {
    id: 'electrician',
    label: 'Electrician',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-electrician_iggrlv.jpg',
    type: 'service',
  },
  {
    id: 'plumber',
    label: 'Plumber',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-plumber_se4nd6.jpg',
    type: 'service',
  },
  {
    id: 'carpenter',
    label: 'Carpenter',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-carpenter_fr1fjp.jpg',
    type: 'service',
  },
];

export interface BundleItemDetail {
  itemId: string;
  itemName: string;
  optionLabel: string;
  unitPrice: number;
  quantity: number;
  image: string;
  categoryName: string;
}

export interface ProjectBundle {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  description: string;
  itemsSummary: string;
  itemsIncluded: string[];
  savings: string;
  price: number;
  originalPrice: number;
  image: string;
  targetCategory: CategoryId;
  bundleItems: BundleItemDetail[];
}

export const PROJECT_BUNDLES: ProjectBundle[] = [];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  headerComponent,
  onSelectCategory,
  onNavigateAllMaterials,
  onNavigateAllServices,
  onSelectItem,
  favoriteIds = [],
  onToggleFavorite,
  onAddBundleToCartAndNavigate,
  materials,
  categories,
  services,
  bundles,
}) => {
  const { theme, typography } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  const activeMaterials = (materials && materials.length > 0) ? materials : MATERIAL_ITEMS;
  const activeCategories = (categories && categories.length > 0) ? categories : CATEGORIES;
  const activeServices = (services && services.length > 0) ? services : SERVICES;
  const activeBundles = (bundles && bundles.length > 0) ? bundles : PROJECT_BUNDLES;

  const { width: windowWidth } = useWindowDimensions();
  const maxAppWidth = Platform.OS === 'web' ? Math.min(windowWidth, 480) : windowWidth;
  // Card width for horizontal scroll: gives comfortable width matching Shop section aesthetics
  const CARD_WIDTH = Math.max(168, Math.round((maxAppWidth - 44) / 2.2));
  const BUNDLE_CARD_WIDTH = Math.max(290, Math.min(350, Math.round(maxAppWidth * 0.84)));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // Above-the-fold hero visual priority handled via direct priority prop; catalog images lazy load on-demand via IntersectionObserver
  useEffect(() => {
    // Only preload the single above-the-fold hero card banner
    preloadImages([
      { url: HERO_CARD_IMAGE_URL, preset: 'hero' as const },
    ]);
  }, []);

  return (
    <View style={{ flex: 1 }}>
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
        {/* Header component embedded at top of scrollview so it scrolls naturally */}
        {headerComponent}

        {refreshing ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. MODERN MINIMALIST HERO CARD */}
            {/* ========================================================================= */}
            <View style={styles.heroSectionWrapper}>
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => {
                  soundService.playTap();
                  if (onNavigateAllServices) {
                    onNavigateAllServices();
                  } else {
                    onSelectCategory('services-catalog');
                  }
                }}
                style={[
                  styles.heroCardContainer,
                  {
                    backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                    borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                  },
                ]}
              >
                <ShimmerImage
                  source={{ uri: HERO_CARD_IMAGE_URL }}
                  style={styles.heroCardImage}
                  resizeMode="cover"
                  preset="hero"
                  priority="high"
                  borderRadius={16}
                />
              </TouchableOpacity>
            </View>

        {/* ========================================================================= */}
        {/* 2. MATERIAL & TRADE SERVICES CHILD NAVIGATION PILLS */}
        {/* ========================================================================= */}
        <View style={styles.childNavSection}>
          {/* Row 1: Materials Navigation Pills */}
          <View style={styles.childNavRowWrapper}>
            <View style={styles.childNavHeader}>
              <Text style={[styles.childNavSectionTitle, { color: theme.textPrimary }]}>Materials</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childNavScroll}
            >
              {MATERIAL_CHILD_PILLS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => {
                    soundService.playTap();
                    onSelectCategory(item.categoryId || (item.id as CategoryId));
                  }}
                  activeOpacity={0.7}
                  style={styles.childPillItem}
                >
                  <View
                    style={[
                      styles.childPillAvatarBox,
                      {
                        backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                        borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                      },
                    ]}
                  >
                    <ShimmerImage
                      source={{ uri: item.image }}
                      style={styles.childPillAvatarImage}
                      resizeMode="cover"
                      preset="pill"
                      borderRadius={18}
                    />
                  </View>
                  <Text style={[styles.childPillLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Row 2: Services Navigation Pills */}
          <View style={styles.childNavRowWrapper}>
            <View style={styles.childNavHeader}>
              <Text style={[styles.childNavSectionTitle, { color: theme.textPrimary }]}>Trade Services</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childNavScroll}
            >
              {SERVICE_CHILD_PILLS.map((item) => {
                const matchingItem = activeMaterials.find((m) => m.id === `service-${item.id}`);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      soundService.playTap();
                      if (matchingItem && onSelectItem) {
                        onSelectItem(matchingItem);
                      } else if (onNavigateAllServices) {
                        onNavigateAllServices();
                      } else {
                        onSelectCategory('services-catalog');
                      }
                    }}
                    activeOpacity={0.7}
                    style={styles.childPillItem}
                  >
                    <View
                      style={[
                        styles.childPillAvatarBox,
                        {
                          backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                          borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                        },
                      ]}
                    >
                      <ShimmerImage
                        source={{ uri: item.image }}
                        style={styles.childPillAvatarImage}
                        resizeMode="cover"
                        preset="pill"
                        borderRadius={18}
                      />
                    </View>
                    <Text style={[styles.childPillLabel, { color: theme.textPrimary }]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 4. BUILDING MATERIALS SECTION (Unchanged Cards & Functionality) */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>Building Materials</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
                Materials & supplies
              </Text>
            </View>
            <TouchableOpacity
              onPress={onNavigateAllMaterials}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewAllText, { color: theme.primary, fontFamily: typography.fontFamily }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Materials Horizontal Scroll Row with Shop Card Layout */}
          <View style={styles.horizontalScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {activeCategories.map((cat) => (
                <ProductCard
                  key={cat.id}
                  title={cat.name}
                  subtitle={cat.subcategoriesText || cat.count || ''}
                  tag={cat.tag || (cat.id || '').toUpperCase()}
                  priceLabel={cat.priceLabel || ''}
                  image={cat.image}
                  width={CARD_WIDTH}
                  showAddButton={false}
                  onPress={() => {
                    onSelectCategory(cat.id);
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 5. 16:9 AMBUJA CEMENT FEATURED BRAND VIDEO AD (Below Building Materials) */}
        {/* ========================================================================= */}
        <AmbujaVideoAd onPressAd={() => onSelectCategory('cement')} />

        {/* ========================================================================= */}
        {/* 6. TRADE SERVICES SECTION (Steve Jobs Minimalist UI)                      */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>Trade Services</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
                Trade & equipment assistance
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (onNavigateAllServices) onNavigateAllServices();
                else onSelectCategory('services-catalog');
              }}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewAllText, { color: theme.primary, fontFamily: typography.fontFamily }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Services Horizontal Scroll Row with Shop Card Layout */}
          <View style={styles.horizontalScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {activeServices.map((srv) => {
                const matchingItem = activeMaterials.find((m) => m.id === `service-${srv.id}`);
                return (
                  <ProductCard
                    key={srv.id}
                    title={srv.name}
                    subtitle={srv.subtitle}
                    tag="SERVICES"
                    priceLabel={srv.rate || 'Standard Rate'}
                    image={srv.image}
                    width={CARD_WIDTH}
                    item={matchingItem}
                    showAddButton={false}
                    onPress={() => {
                      if (matchingItem && onSelectItem) {
                        onSelectItem(matchingItem);
                      } else if (onNavigateAllServices) {
                        onNavigateAllServices();
                      } else {
                        onSelectCategory('services-catalog');
                      }
                    }}
                  />
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 7. GENUINELY USEFUL SECTION: PROJECT BUNDLES (Below Trade Services) */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={[styles.sectionHeading, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>Project Bundles</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
                Pre-calibrated material packages with direct yard bulk savings
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                onNavigateAllMaterials();
              }}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={[styles.viewAllText, { color: theme.primary, fontFamily: typography.fontFamily }]}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {activeBundles.map((bundle) => (
              <TouchableOpacity
                key={bundle.id}
                activeOpacity={0.9}
                onPress={() => {
                  if (onAddBundleToCartAndNavigate) {
                    onAddBundleToCartAndNavigate(bundle);
                  } else {
                    onSelectCategory(bundle.targetCategory);
                  }
                }}
                style={[
                  styles.bundleCard,
                  {
                    width: BUNDLE_CARD_WIDTH,
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Image & Badges */}
                <View style={styles.bundleImageWrapper}>
                  <ShimmerImage
                    source={{ uri: bundle.image }}
                    style={styles.bundleImage}
                    resizeMode="cover"
                    borderRadius={14}
                    preset="card"
                  />
                  <View style={[styles.bundleTagBadge, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.bundleTagText, { color: theme.primaryText || '#18181B' }]}>{bundle.tag}</Text>
                  </View>
                  <View style={styles.bundleSavingsTopBadge}>
                    <Tag size={10} color="#047857" />
                    <Text style={styles.bundleSavingsTopText}>{bundle.savings}</Text>
                  </View>
                </View>

                {/* Bundle Header */}
                <View style={styles.bundleBody}>
                  <Text style={[styles.bundleTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]} numberOfLines={1}>
                    {bundle.title}
                  </Text>
                  <Text style={styles.bundleSubtitle} numberOfLines={1}>
                    {bundle.subtitle}
                  </Text>

                  {/* Clean concise description */}
                  <Text style={[styles.bundleCleanDescription, { color: theme.textSecondary, fontFamily: typography.fontFamily }]} numberOfLines={2}>
                    {bundle.description}
                  </Text>

                  {/* Items Included List */}
                  <View style={[styles.bundleItemsList, { backgroundColor: theme.surfaceSecondary, borderColor: theme.borderLight }]}>
                    {bundle.itemsIncluded.map((itemStr, idx) => (
                      <View key={idx} style={styles.bundleItemRow}>
                        <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
                        <Text style={[styles.bundleItemRowText, { color: theme.textPrimary }]} numberOfLines={1}>
                          {itemStr}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Pricing and Direct Explore CTA */}
                  <View style={[styles.bundleActionSection, { borderTopColor: theme.borderLight }]}>
                    <View style={styles.bundlePriceCol}>
                      <Text style={[styles.bundlePriceLabel, { color: theme.textMuted }]}>PACKAGE PRICE</Text>
                      <View style={styles.bundlePriceRow}>
                        <Text style={[styles.bundlePrice, { color: theme.textPrimary }]}>₹{bundle.price.toLocaleString('en-IN')}</Text>
                        <Text style={[styles.bundleOriginalPrice, { color: theme.textMuted }]}>₹{bundle.originalPrice.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.bundleExploreBtn, { backgroundColor: theme.buttonBg || theme.primary }]}
                      activeOpacity={0.85}
                      onPress={(e) => {
                        e.stopPropagation();
                        if (onAddBundleToCartAndNavigate) {
                          onAddBundleToCartAndNavigate(bundle);
                        } else {
                          onSelectCategory(bundle.targetCategory);
                        }
                      }}
                    >
                      <Text style={[styles.bundleExploreBtnText, { color: theme.buttonText || '#18181B' }]}>Explore</Text>
                      <ArrowRight size={13} color={theme.buttonText || '#18181B'} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* 8. 15-SECOND DIRECT YARD PROMOTIONAL SPOTLIGHT VIDEO */}
        {/* ========================================================================= */}
        <PromotionalVideoPlayer onExploreCatalog={onNavigateAllMaterials} />
          </>
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
    paddingTop: 10,
    paddingBottom: 96,
    gap: 22,
  },

  /* ---------------- HERO CARD (MODERN MINIMALIST) ---------------- */
  heroSectionWrapper: {
    paddingHorizontal: 16,
  },
  heroCardContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },

  /* ---------------- CHILD NAVIGATION PILLS (MODERN MINIMALIST) ---------------- */
  childNavSection: {
    paddingTop: 0,
    paddingBottom: 2,
    gap: 16,
  },
  childNavRowWrapper: {
    gap: 10,
  },
  childNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  childNavSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  childNavScroll: {
    paddingHorizontal: 16,
    gap: 14,
  },
  childPillItem: {
    alignItems: 'center',
    width: 64,
    gap: 6,
  },
  childPillAvatarBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childPillAvatarImage: {
    width: '100%',
    height: '100%',
  },
  childPillLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.1,
  },

  /* ---------------- SECTION HEADINGS & CONTAINERS ---------------- */
  sectionContainer: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  sectionHeaderLeft: {
    gap: 2,
    flex: 1,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#707072',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#047857',
    letterSpacing: 0.1,
  },
  comingSoonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.1,
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingLeft: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FCB026',
  },
  horizontalScrollWrapper: {
    marginHorizontal: 0,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingTop: 4,
    paddingBottom: 4,
  },

  /* ---------------- TRENDING PROJECT BUNDLES ---------------- */
  bundleSparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bundleSparkleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
  },
  bundleCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    padding: 14,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 3,
      },
    }),
  },
  bundleImageWrapper: {
    width: '100%',
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  bundleImage: {
    width: '100%',
    height: '100%',
  },
  bundleTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FCB026',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  bundleTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bundleSavingsTopBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bundleSavingsTopText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.2,
  },
  bundleBody: {
    gap: 8,
  },
  bundleTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  bundleSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.1,
    marginTop: -4,
  },
  bundleCleanDescription: {
    fontSize: 11.5,
    color: '#4B5563',
    lineHeight: 16,
    fontWeight: '400',
  },
  bundleItemsList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bundleItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bundleItemRowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
    flexShrink: 1,
  },
  bundleActionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  bundlePriceCol: {
    flexShrink: 1,
  },
  bundlePriceLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    lineHeight: 10,
  },
  bundlePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 1,
  },
  bundlePrice: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FCB026',
    letterSpacing: -0.4,
  },
  bundleOriginalPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  bundleExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FCB026',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  bundleExploreBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#18181B',
    letterSpacing: 0.2,
  },
});
