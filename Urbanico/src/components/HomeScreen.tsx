import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
  ImageBackground,
  Platform,
  Pressable,
  Animated,
} from 'react-native';
import {
  ArrowRight,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS, ServiceItem } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';

import { useTheme, useTypography, useSpacing, useRadius } from '../theme';
import { ProductCard } from './common/ProductCard';
import { ShimmerImage } from './common/ShimmerImage';
import { AmbujaVideoAd } from './common/AmbujaVideoAd';
import { ProjectShowcaseCarousel } from './common/ProjectShowcaseCarousel';
import { preloadImages } from '../utils/imageOptimization';
import { BRAND_LOGO_URL } from '../constants';
import { soundService } from '../utils/soundHelper';
import { HomeSkeleton } from './common/SkeletonLoader';
import { useImagePrefetch } from '../hooks/useImagePrefetch';
import { SectionHeader } from './common/SectionHeader';

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

const HERO_CARD_IMAGE_URL = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1790577407/herocard0.1_kms4vj.jpg';

interface CategoryGridItem {
  id: string;
  label: string;
  image: string;
  type: 'material' | 'service';
  categoryId?: CategoryId;
}

const URBAN_COMPANY_CATEGORY_GRID: CategoryGridItem[] = [
  {
    id: 'cement',
    label: 'Cement',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-cement_pwrzsr.jpg',
    type: 'material',
    categoryId: 'cement',
  },
  {
    id: 'bricks',
    label: 'Bricks & Blocks',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-bricks_bbywkp.jpg',
    type: 'material',
    categoryId: 'bricks',
  },
  {
    id: 'sand',
    label: 'Sand & Robo',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-sand_qmbdo6.jpg',
    type: 'material',
    categoryId: 'sand',
  },
  {
    id: 'iron_bars',
    label: 'Steel & TMT',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-ironbars_ayo0id.jpg',
    type: 'material',
    categoryId: 'iron_bars',
  },
  {
    id: 'tiles',
    label: 'Vitrified Tiles',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    type: 'material',
    categoryId: 'tiles',
  },
  {
    id: 'centring',
    label: 'Centring & Formwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-centering_nikj90.jpg',
    type: 'material',
    categoryId: 'centring',
  },
  {
    id: 'painter',
    label: 'Painting & Waterproofing',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-painter_eoyox2.jpg',
    type: 'service',
  },
  {
    id: 'electrician',
    label: 'Electrician & Wiring',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-electrician_iggrlv.jpg',
    type: 'service',
  },
  {
    id: 'plumber',
    label: 'Plumber & Sanitary',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-plumber_se4nd6.jpg',
    type: 'service',
  },
  {
    id: 'mason',
    label: 'Mason & Civil',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693450/child-mason_mv6ulz.jpg',
    type: 'service',
  },
  {
    id: 'carpenter',
    label: 'Carpenter & Woodwork',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-carpenter_fr1fjp.jpg',
    type: 'service',
  },
  {
    id: 'fabricator',
    label: 'Fabricator & Welding',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-fabricator_btw9ek.jpg',
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

interface UrbanCategoryGridCardProps {
  label: string;
  image: string;
  theme: any;
  onPress: () => void;
}

const UrbanCategoryGridCard: React.FC<UrbanCategoryGridCardProps> = React.memo(({
  label,
  image,
  theme,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 8,
      tension: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 140,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const AnimatedView = Animated.View as any;

  return (
    <Pressable
      onPress={() => {
        soundService.playTap();
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.urbanGridCol}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <AnimatedView style={{ alignItems: 'center', width: '100%', transform: [{ scale: scaleAnim }] }}>
        <View
          style={[
            styles.urbanSquircleCard,
            {
              backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#F8FAFC',
              borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            },
          ]}
        >
          <ShimmerImage
            source={{ uri: image }}
            style={styles.urbanSquircleImage}
            resizeMode="cover"
            preset="pill"
            borderRadius={18}
          />
        </View>
        <Text
          style={[styles.urbanCardTitle, { color: theme.textPrimary }]}
          numberOfLines={2}
        >
          {label}
        </Text>
      </AnimatedView>
    </Pressable>
  );
});

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

  // Intelligent multi-tier image prefetching
  const { prefetchCategoryImages } = useImagePrefetch({
    currentScreen: 'home',
    items: activeMaterials,
  });

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
        {/* 2. URBAN COMPANY STYLE CATEGORY & SERVICE NAVIGATION GRID (4 items/row) */}
        {/* ========================================================================= */}
        <View style={styles.urbanGridSection}>
          <View style={styles.urbanGridHeader}>
            <View>
              <Text style={[styles.urbanGridTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
                Categories & Services
              </Text>
              <Text style={[styles.urbanGridSubtitle, { color: theme.textSecondary, fontFamily: typography.fontFamily }]}>
                Direct yard materials & certified site technicians
              </Text>
            </View>
          </View>

          <View style={styles.urbanGridRow}>
            {URBAN_COMPANY_CATEGORY_GRID.slice(0, 8).map((item) => {
              const matchingItem = item.type === 'service'
                ? activeMaterials.find((m) => m.id === `service-${item.id}`)
                : undefined;

              const handleCategoryPress = () => {
                if (item.type === 'material') {
                  onSelectCategory(item.categoryId || (item.id as CategoryId));
                } else {
                  if (matchingItem && onSelectItem) {
                    onSelectItem(matchingItem);
                  } else if (onNavigateAllServices) {
                    onNavigateAllServices();
                  } else {
                    onSelectCategory('services-catalog');
                  }
                }
              };

              return (
                <UrbanCategoryGridCard
                  key={item.id}
                  label={item.label}
                  image={item.image}
                  theme={theme}
                  onPress={handleCategoryPress}
                />
              );
            })}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 4. BUILDING MATERIALS SECTION (Unchanged Cards & Functionality) */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          <SectionHeader
            title="Building Materials"
            subtitle="Materials & supplies"
            onAction={onNavigateAllMaterials}
          />

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
          <SectionHeader
            title="Trade Services"
            subtitle="Trade & equipment assistance"
            onAction={() => {
              if (onNavigateAllServices) onNavigateAllServices();
              else onSelectCategory('services-catalog');
            }}
          />

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
        {/* 7. PROJECT SHOWCASE 4:3 CAROUSEL (Minimalist Smooth Transition Slider)    */}
        {/* ========================================================================= */}
        <ProjectShowcaseCarousel
          onPressImage={() => {
            if (onNavigateAllMaterials) {
              onNavigateAllMaterials();
            } else {
              onSelectCategory('cement');
            }
          }}
        />
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
    aspectRatio: 16 / 9,
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

  /* ---------------- URBAN COMPANY CATEGORY GRID (4 ITEMS / ROW) ---------------- */
  urbanGridSection: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
  },
  urbanGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  urbanGridTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  urbanGridSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  urbanGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: -4,
  },
  urbanGridCol: {
    width: '25%',
    alignItems: 'center',
    paddingHorizontal: 3,
    marginBottom: 14,
  },
  urbanSquircleCard: {
    width: 62,
    height: 62,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  urbanSquircleImage: {
    width: '100%',
    height: '100%',
  },
  urbanCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    minHeight: 28,
    letterSpacing: -0.1,
    paddingHorizontal: 2,
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
});

export default HomeScreen;
