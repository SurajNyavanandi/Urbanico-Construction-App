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

interface HomeScreenProps {
  onSelectCategory: (catId: CategoryId) => void;
  onNavigateAllMaterials: () => void;
  onNavigateAllServices?: () => void;
  onSelectItem?: (item: MaterialItem) => void;
  searchQuery: string;
  onOpenServicesModal?: (service?: ServiceItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

const HERO_CARD_IMAGE_URL = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787725157/herocard4_gouvid.jpg';

interface ChildPillItem {
  id: string;
  label: string;
  image: string;
  type: 'material' | 'service';
  categoryId?: CategoryId;
}

const MATERIAL_CHILD_PILLS: ChildPillItem[] = [
  {
    id: 'sand',
    label: 'Sand',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-sand_qmbdo6.jpg',
    type: 'material',
    categoryId: 'sand',
  },
  {
    id: 'cement',
    label: 'Cement',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-cement_pwrzsr.jpg',
    type: 'material',
    categoryId: 'cement',
  },
  {
    id: 'iron_bars',
    label: 'Steel',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-ironbars_ayo0id.jpg',
    type: 'material',
    categoryId: 'iron_bars',
  },
  {
    id: 'stone',
    label: 'Stone',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-stones_oqaced.jpg',
    type: 'material',
    categoryId: 'stone',
  },
  {
    id: 'bricks',
    label: 'Bricks',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-bricks_bbywkp.jpg',
    type: 'material',
    categoryId: 'bricks',
  },
  {
    id: 'tiles',
    label: 'Tiles',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
    type: 'material',
    categoryId: 'tiles',
  },
  {
    id: 'centring',
    label: 'Centring',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-centering_nikj90.jpg',
    type: 'material',
    categoryId: 'centring',
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

interface ProjectBundle {
  id: string;
  title: string;
  tag: string;
  itemsSummary: string;
  savings: string;
  image: string;
  targetCategory: CategoryId;
}

const PROJECT_BUNDLES: ProjectBundle[] = [
  {
    id: 'bundle-foundation',
    title: 'Foundation Pour Pack',
    tag: 'MOST POPULAR',
    itemsSummary: 'UltraTech Cement (50 Bags) + Robo Sand + 20mm Blue Metal Stone',
    savings: 'Save ₹450 / combo',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
    targetCategory: 'cement',
  },
  {
    id: 'bundle-masonry',
    title: 'Brickwork & Plastering Kit',
    tag: 'BEST VALUE',
    itemsSummary: 'Red Clay Bricks (2000 Pcs) + River Sand + Dalmia OPC 43G',
    savings: 'Save ₹320 / combo',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614403/brick2_gjzbjh.jpg',
    targetCategory: 'bricks',
  },
  {
    id: 'bundle-slab',
    title: 'RCC Slab & Framing Kit',
    tag: 'CONTRACTOR CHOICE',
    itemsSummary: 'Tata Tiscon 550D Rebars + Steel Centring Props + M25 RMC',
    savings: 'Direct Yard Delivery Included',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
    targetCategory: 'iron_bars',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectCategory,
  onNavigateAllMaterials,
  onNavigateAllServices,
  onSelectItem,
  favoriteIds = [],
  onToggleFavorite,
}) => {
  const { theme, typography } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { width: windowWidth } = useWindowDimensions();
  // Card width for horizontal scroll: gives comfortable width matching Shop section aesthetics
  const CARD_WIDTH = Math.max(168, Math.round((windowWidth - 44) / 2.2));
  const BUNDLE_CARD_WIDTH = Math.max(260, Math.round(windowWidth * 0.76));

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
        style={[styles.container, { backgroundColor: '#FFFFFF' }]}
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
        {/* ========================================================================= */}
        {/* 1. 4:3 RATIO HERO CARD (Replaced Carousel) */}
        {/* ========================================================================= */}
        <View style={styles.heroSectionWrapper}>
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => {
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
        {/* 6. GENUINELY USEFUL NEW SECTION: TRENDING PROJECT BUNDLES */}
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
                Curated material packages with bulk contractor pricing
              </Text>
            </View>
            <TouchableOpacity
              onPress={onNavigateAllMaterials}
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
                activeOpacity={0.88}
                onPress={() => onSelectCategory(bundle.targetCategory)}
                style={[styles.bundleCard, { width: BUNDLE_CARD_WIDTH }]}
              >
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
                </View>

                <View style={styles.bundleBody}>
                  <Text style={styles.bundleTitle} numberOfLines={1}>
                    {bundle.title}
                  </Text>
                  <Text style={styles.bundleSummary} numberOfLines={2}>
                    {bundle.itemsSummary}
                  </Text>
                  <View style={styles.bundleFooter}>
                    <View style={styles.bundleSavingsBadge}>
                      <Tag size={11} color="#059669" />
                      <Text style={styles.bundleSavingsText}>{bundle.savings}</Text>
                    </View>
                    <View style={styles.bundleArrowButton}>
                      <ChevronRight size={14} color="#111111" strokeWidth={2.5} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ========================================================================= */}
        {/* 7. TRADE SERVICES SECTION (Unchanged Cards & Functionality) */}
        {/* ========================================================================= */}
        <View style={styles.sectionContainer}>
          {/* Section Header */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>Trade Services</Text>
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#059669" />
                  <Text style={styles.verifiedBadgeText}>Verified</Text>
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
        {/* 8. 15-SECOND DIRECT YARD PROMOTIONAL SPOTLIGHT VIDEO */}
        {/* ========================================================================= */}
        <PromotionalVideoPlayer onExploreCatalog={onNavigateAllMaterials} />
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
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    padding: 10,
    gap: 10,
  },
  bundleImageWrapper: {
    width: '100%',
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
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
    paddingVertical: 3,
    borderRadius: 6,
  },
  bundleTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bundleBody: {
    gap: 4,
  },
  bundleTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.2,
  },
  bundleSummary: {
    fontSize: 11,
    fontWeight: '400',
    color: '#4B5563',
    lineHeight: 15,
  },
  bundleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  bundleSavingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bundleSavingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  bundleArrowButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
});
