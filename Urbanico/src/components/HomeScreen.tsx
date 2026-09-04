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
import { useTheme } from '../context/ThemeContext';
import { ProductCard } from './common/ProductCard';
import { ShimmerImage } from './common/ShimmerImage';
import { Toast } from './common/Toast';
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

export const PROJECT_BUNDLES: ProjectBundle[] = [
  {
    id: 'bundle-masonry-plaster',
    title: 'Masonry & Plastering Starter Combo',
    subtitle: 'Bricks + Sand + Cement (1:4 Mortar Ratio)',
    tag: 'MOST ORDERED • 1:4 RATIO',
    description: 'The exact civil construction ratio for 100 sq.ft of brickwork plus 2-sided plastering. Perfectly bundles 1,000 Kiln Red Bricks with 1 Auto of washed Plastering Sand and 10 Bags of UltraTech PPC Cement to prevent mortar dry cracks.',
    itemsSummary: '1,000 Red Clay Bricks + 1 Auto Plastering Sand + 10 Bags UltraTech PPC',
    itemsIncluded: [
      '1,000 Red Clay Bricks (Kiln-Fired 1st Class)',
      '1 Auto Plastering Sand (~1 Ton Washed)',
      '10 Bags UltraTech Super PPC (500 KG)',
    ],
    savings: 'Save ₹450 / combo',
    price: 14080,
    originalPrice: 14530,
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931567/Red_Bricks_paggbp.png',
    targetCategory: 'bricks',
    bundleItems: [
      {
        itemId: 'red-bricks',
        itemName: 'Red Clay Bricks',
        optionLabel: 'Batch of 1000 Bricks',
        unitPrice: 8800,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931567/Red_Bricks_paggbp.png',
        categoryName: 'bricks',
      },
      {
        itemId: 'plastering-sand',
        itemName: 'Plastering Sand',
        optionLabel: 'Auto (~1 Ton)',
        unitPrice: 1700,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931576/Plastering_Sand_mvhxto.png',
        categoryName: 'sand',
      },
      {
        itemId: 'ultratech-ppc',
        itemName: 'UltraTech Super',
        optionLabel: '10 Bags (500 KG)',
        unitPrice: 3580,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
        categoryName: 'cement',
      },
    ],
  },
  {
    id: 'bundle-slab-casting',
    title: 'RCC Slab & Beam Casting Kit',
    subtitle: 'TMT Steel + 20mm Stone + 53G Cement',
    tag: 'STRUCTURAL CASTING (M25)',
    description: 'Engineered for dense, crack-resistant M25 grade RCC roof slabs and load beams. High tensile 12mm Fe550D TMT rebar paired with angular 20mm blue metal aggregate and 53 Grade cement for rapid early curing strength.',
    itemsSummary: '1 Bundle 12mm TMT Steel + 1 Tractor 20mm Stone + 10 Bags UltraTech 53G',
    itemsIncluded: [
      '1 Bundle TMT Steel 12mm (5 Rods - 12m)',
      '1 Tractor Stone 20mm (~3 Tons Full Level)',
      '10 Bags UltraTech 53 Grade OPC (500 KG)',
    ],
    savings: 'Save ₹380 / combo',
    price: 9250,
    originalPrice: 9630,
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931575/Stone_20mm_qvbriu.png',
    targetCategory: 'iron_bars',
    bundleItems: [
      {
        itemId: 'tmt-12mm',
        itemName: 'Iron Bar 12mm',
        optionLabel: '1 Bundle (5 Rods - 12m)',
        unitPrice: 2800,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931568/Iron_bar_wz80t5.png',
        categoryName: 'iron_bars',
      },
      {
        itemId: 'stone-20mm',
        itemName: 'Stone 20mm',
        optionLabel: 'Tractor Full level (~3 Tons)',
        unitPrice: 2700,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931575/Stone_20mm_qvbriu.png',
        categoryName: 'stone',
      },
      {
        itemId: 'ultratech-53',
        itemName: 'UltraTech Cement',
        optionLabel: '10 Bags (500 KG)',
        unitPrice: 3750,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
        categoryName: 'cement',
      },
    ],
  },
  {
    id: 'bundle-foundation-footing',
    title: 'Foundation & Footing Substructure Pack',
    subtitle: '40mm Stone + M-Sand + Ambuja Cement',
    tag: 'SUB-BASE PCC & FOOTING',
    description: 'Designed for solid sub-base PCC leveling and deep column footing. Combines heavy 40mm angular aggregate with silt-free manufactured sand and waterproof Ambuja Kawach cement to shield reinforcement from ground moisture.',
    itemsSummary: '1 Tractor 40mm Stone + 1 Tractor M-Sand + 10 Bags Ambuja Kawach',
    itemsIncluded: [
      '1 Tractor Stone 40mm (~3 Tons Full Level)',
      '1 Tractor Regular M-Sand (~3 Tons Full Level)',
      '10 Bags Ambuja Kawach Waterproof (500 KG)',
    ],
    savings: 'Save ₹350 / combo',
    price: 8880,
    originalPrice: 9230,
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931569/Stone_40mm_gze9gj.png',
    targetCategory: 'stone',
    bundleItems: [
      {
        itemId: 'stone-40mm',
        itemName: 'Stone 40mm',
        optionLabel: 'Tractor Full level (~3 Tons)',
        unitPrice: 2600,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931569/Stone_40mm_gze9gj.png',
        categoryName: 'stone',
      },
      {
        itemId: 'm-sand-concrete',
        itemName: 'Regular Sand',
        optionLabel: 'Tractor Full level (~3 Tons)',
        unitPrice: 2400,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785931585/Regular_Sand_ajv0wc.png',
        categoryName: 'sand',
      },
      {
        itemId: 'ambuja-kawach',
        itemName: 'Ambuja Cement',
        optionLabel: '10 Bags (500 KG)',
        unitPrice: 3880,
        quantity: 1,
        image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_3894293894293894_nqgrsm.jpg',
        categoryName: 'cement',
      },
    ],
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  headerComponent,
  onSelectCategory,
  onNavigateAllMaterials,
  onNavigateAllServices,
  onSelectItem,
  favoriteIds = [],
  onToggleFavorite,
  onAddBundleToCartAndNavigate,
}) => {
  const { theme, typography } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  // Card width for horizontal scroll: gives comfortable width matching Shop section aesthetics
  const CARD_WIDTH = Math.max(168, Math.round((windowWidth - 44) / 2.2));
  const BUNDLE_CARD_WIDTH = Math.max(290, Math.min(350, Math.round(windowWidth * 0.84)));

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setToastMessage('Catalog rates refreshed');
    }, 1000);
  };

  // Preload critical above-the-fold assets in the background
  useEffect(() => {
    preloadImages([
      { url: HERO_CARD_IMAGE_URL, preset: 'hero' as const },
      ...MATERIAL_CHILD_PILLS.map((p) => ({ url: p.image, preset: 'pill' as const })),
      ...SERVICE_CHILD_PILLS.map((p) => ({ url: p.image, preset: 'pill' as const })),
      ...SERVICES.map((s) => ({ url: s.image, preset: 'card' as const })),
      ...CATEGORIES.map((c) => ({ url: c.image, preset: 'card' as const })),
    ]);
  }, []);

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
        {/* Header component embedded at top of scrollview so it scrolls naturally */}
        {headerComponent}

        {refreshing ? (
          <HomeSkeleton />
        ) : (
          <>
            {/* ========================================================================= */}
            {/* 1. 4:3 RATIO HERO CARD (Replaced Carousel) */}
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
                style={styles.heroCardContainer}
              >
                <ShimmerImage
                  source={{ uri: HERO_CARD_IMAGE_URL }}
                  style={styles.heroCardImage}
                  resizeMode="cover"
                  preset="hero"
                  priority="high"
                  borderRadius={20}
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
              <Text style={styles.childNavSectionTitle}>Materials</Text>
              <TouchableOpacity
                onPress={onNavigateAllMaterials}
                activeOpacity={0.7}
              >
                <Text style={styles.childNavViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childNavScroll}
            >
              {MATERIAL_CHILD_PILLS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => onSelectCategory(item.categoryId || (item.id as CategoryId))}
                  activeOpacity={0.75}
                  style={styles.childPillCard}
                >
                  <View style={styles.childPillIconBox}>
                    <ShimmerImage
                      source={{ uri: item.image }}
                      style={styles.childPillImage}
                      resizeMode="cover"
                      preset="pill"
                      borderRadius={10}
                    />
                  </View>
                  <Text style={styles.childPillLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Row 2: Services Navigation Pills */}
          <View style={styles.childNavRowWrapper}>
            <View style={styles.childNavHeader}>
              <Text style={styles.childNavSectionTitle}>Trade Services</Text>
              <TouchableOpacity
                onPress={onNavigateAllServices || (() => onSelectCategory('services-catalog'))}
                activeOpacity={0.7}
              >
                <Text style={styles.childNavViewAll}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.childNavScroll}
            >
              {SERVICE_CHILD_PILLS.map((item) => {
                const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${item.id}`);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      if (matchingItem && onSelectItem) {
                        onSelectItem(matchingItem);
                      } else if (onNavigateAllServices) {
                        onNavigateAllServices();
                      } else {
                        onSelectCategory('services-catalog');
                      }
                    }}
                    activeOpacity={0.75}
                    style={styles.childPillCard}
                  >
                    <View style={styles.childPillIconBox}>
                      <ShimmerImage
                        source={{ uri: item.image }}
                        style={styles.childPillImage}
                        resizeMode="cover"
                        preset="pill"
                        borderRadius={10}
                      />
                    </View>
                    <Text style={styles.childPillLabel} numberOfLines={1}>
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
              <Text style={styles.sectionHeading}>Building Materials</Text>
              <Text style={styles.sectionSubtitle}>
                Essential yard supplies & wholesale direct rates
              </Text>
            </View>
            <TouchableOpacity
              onPress={onNavigateAllMaterials}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Materials Horizontal Scroll Row with Shop Card Layout */}
          <View style={styles.horizontalScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {CATEGORIES.map((cat) => (
                <ProductCard
                  key={cat.id}
                  title={cat.name}
                  subtitle={cat.subcategoriesText || cat.count || 'Direct Yard Supply'}
                  tag={cat.tag || cat.id.toUpperCase()}
                  priceLabel={cat.priceLabel || 'Direct Yard Rates'}
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
        {/* 6. TRADE SERVICES SECTION (Arranged Above Bundles with Coming Soon Badge) */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>Trade Services</Text>
                <View style={styles.comingSoonBadge}>
                  <Clock size={11} color="#B45309" strokeWidth={2.2} />
                  <Text style={styles.comingSoonBadgeText}>Coming soon</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Skilled masons, plumbers, electricians & contractors
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
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Services Horizontal Scroll Row with Shop Card Layout */}
          <View style={styles.horizontalScrollWrapper}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {SERVICES.map((srv) => {
                const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
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
        {/* 7. GENUINELY USEFUL SECTION: TRENDING PROJECT BUNDLES (Below Trade Services) */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>Trending Project Bundles</Text>
                <View style={styles.bundleSparkleBadge}>
                  <Sparkles size={10} color="#D97706" />
                  <Text style={styles.bundleSparkleText}>YARD COMBO</Text>
                </View>
              </View>
              <Text style={styles.sectionSubtitle}>
                Pre-calibrated material packages with direct yard bulk savings
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if (onAddBundleToCartAndNavigate) {
                  onAddBundleToCartAndNavigate(PROJECT_BUNDLES[0]);
                } else {
                  onNavigateAllMaterials();
                }
              }}
              style={styles.viewAllButton}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllText}>Explore</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {PROJECT_BUNDLES.map((bundle) => (
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
                style={[styles.bundleCard, { width: BUNDLE_CARD_WIDTH }]}
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
                  <View style={styles.bundleTagBadge}>
                    <Text style={styles.bundleTagText}>{bundle.tag}</Text>
                  </View>
                  <View style={styles.bundleSavingsTopBadge}>
                    <Tag size={10} color="#047857" />
                    <Text style={styles.bundleSavingsTopText}>{bundle.savings}</Text>
                  </View>
                </View>

                {/* Bundle Header */}
                <View style={styles.bundleBody}>
                  <Text style={styles.bundleTitle} numberOfLines={1}>
                    {bundle.title}
                  </Text>
                  <Text style={styles.bundleSubtitle} numberOfLines={1}>
                    {bundle.subtitle}
                  </Text>

                  {/* Why this combo is useful - Light description box */}
                  <View style={styles.bundleWhyBox}>
                    <View style={styles.bundleWhyHeader}>
                      <Sparkles size={11} color="#B45309" />
                      <Text style={styles.bundleWhyTitle}>WHY THIS COMBO IS USEFUL</Text>
                    </View>
                    <Text style={styles.bundleWhyDescription}>
                      {bundle.description}
                    </Text>
                  </View>

                  {/* Items Included List */}
                  <View style={styles.bundleItemsList}>
                    <Text style={styles.bundleItemsHeading}>INCLUDED IN PACKAGE (3 ITEMS):</Text>
                    {bundle.itemsIncluded.map((itemStr, idx) => (
                      <View key={idx} style={styles.bundleItemRow}>
                        <CheckCircle2 size={12} color="#059669" strokeWidth={2.5} />
                        <Text style={styles.bundleItemRowText} numberOfLines={1}>
                          {itemStr}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Pricing and Direct Explore CTA */}
                  <View style={styles.bundleActionSection}>
                    <View style={styles.bundlePriceCol}>
                      <Text style={styles.bundlePriceLabel}>COMBO PACKAGE RATE</Text>
                      <View style={styles.bundlePriceRow}>
                        <Text style={styles.bundlePrice}>₹{bundle.price.toLocaleString('en-IN')}</Text>
                        <Text style={styles.bundleOriginalPrice}>₹{bundle.originalPrice.toLocaleString('en-IN')}</Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.bundleExploreBtn}
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
                      <Text style={styles.bundleExploreBtnText}>Explore & Add</Text>
                      <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.5} />
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 96,
    gap: 22,
  },

  /* ---------------- HERO CARD (4:3 RATIO) STYLES ---------------- */
  heroSectionWrapper: {
    paddingHorizontal: 16,
  },
  heroCardContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  /* ---------------- CHILD NAVIGATION PILLS ---------------- */
  childNavSection: {
    paddingTop: 0,
    paddingBottom: 2,
    gap: 14,
  },
  childNavRowWrapper: {
    gap: 8,
  },
  childNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  childNavSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111111',
    letterSpacing: -0.2,
  },
  childNavViewAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#707072',
  },
  childNavScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  childPillCard: {
    width: 68,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  childPillIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  childPillImage: {
    width: '100%',
    height: '100%',
  },
  childPillLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
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
    color: '#111111',
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
    color: '#111111',
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
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    padding: 12,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  bundleImageWrapper: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  bundleImage: {
    width: '100%',
    height: '100%',
  },
  bundleTagBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#111111',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
  },
  bundleTagText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#111111',
    letterSpacing: -0.3,
  },
  bundleSubtitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0284C7',
    letterSpacing: 0.1,
    marginTop: -4,
  },
  bundleWhyBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  bundleWhyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bundleWhyTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  bundleWhyDescription: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '500',
  },
  bundleItemsList: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  bundleItemsHeading: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
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
    color: '#111111',
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
    backgroundColor: '#111111',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  bundleExploreBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
