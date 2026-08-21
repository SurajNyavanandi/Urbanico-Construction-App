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

interface MidPromoCardData {
  id: string;
  badge: string;
  title: string;
  highlight: string;
  description: string;
  ctaText: string;
  image: string;
  categoryId: CategoryId;
}

const MID_PROMO_CARDS: MidPromoCardData[] = [
  {
    id: 'promo-steel',
    badge: 'DIRECT YARD PROMOTION',
    title: 'UP TO ₹1,500 OFF',
    highlight: 'STRUCTURAL STEEL & REBARS',
    description: 'Fe-550D primary brand rebars (Tata Tiscon, JSW) with free site crane offloading.',
    ctaText: 'Claim Steel Offer',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
    categoryId: 'iron_bars',
  },
  {
    id: 'promo-sand-stone',
    badge: 'BULK LOGISTICS SPECIAL',
    title: 'TRIPLE-TRUCK SAVINGS',
    highlight: 'SAND & CRUSHED STONE',
    description: 'Order 3+ tipper loads of River Sand & 20mm Blue Metal for instant yard freight cashback.',
    ctaText: 'Explore Yard Rates',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg',
    categoryId: 'sand',
  },
  {
    id: 'promo-cement',
    badge: 'CONTRACTOR WHOLESALE',
    title: 'FRESH YARD PALLETS',
    highlight: 'OPC & PPC CEMENT BAGS',
    description: 'UltraTech & Dalmia 50-bag pallets with certified lab test sheets and rainproof dispatch.',
    ctaText: 'Order Cement Pallets',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614395/cement2_s1pf60.jpg',
    categoryId: 'cement',
  },
  {
    id: 'promo-services',
    badge: 'SKILLED CREW ON-DEMAND',
    title: 'VERIFIED TRADES',
    highlight: 'MASONS & FABRICATORS',
    description: 'Book certified civil masons, welders, electricians & plumbers at fixed transparent day rates.',
    ctaText: 'Book Verified Crew',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg',
    categoryId: 'services-catalog',
  },
];

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

interface HeroSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  ctaText: string;
  image: string;
  categoryId: CategoryId;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'hero-1',
    badge: 'DIRECT YARD DISPATCH',
    title: 'DIRECT FROM\nTHE YARD.',
    subtitle: 'Factory-direct cement, river sand, TMT steel & aggregates at wholesale site rates.',
    ctaText: 'Explore Materials',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786620810/herocard3_ytzfhm.jpg',
    categoryId: 'cement',
  },
  {
    id: 'hero-2',
    badge: 'FE-550D TESTED REBARS',
    title: 'STRUCTURAL\nSTEEL & REBAR.',
    subtitle: 'Tata Tiscon, JSW Neosteel & Kamdhenu bundles ready with instant crane unloading.',
    ctaText: 'Shop Steel Rebars',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614394/ironbars2_t1ktel.jpg',
    categoryId: 'iron_bars',
  },
  {
    id: 'hero-3',
    badge: 'ON-DEMAND CREWS',
    title: 'VERIFIED TRADE\nPROFESSIONALS.',
    subtitle: 'Book skilled masons, fabricators, electricians & plumbers with zero advance markup.',
    ctaText: 'Book Verified Trades',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786705284/mason_nxpwh5.jpg',
    categoryId: 'services-catalog',
  },
  {
    id: 'hero-4',
    badge: 'BULK CONTRACTOR RATES',
    title: 'WHOLESALE\nPROJECT BUNDLES.',
    subtitle: 'Special yard discounts for multi-truck sand, aggregate tippers and bulk cement.',
    ctaText: 'View Bulk Rates',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/sand2_wj9sly.jpg',
    categoryId: 'sand',
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

const VALUE_PILLARS = [
  {
    icon: '⚡',
    title: '3-Hour Dispatch',
    sub: 'Direct tipper & truck delivery',
  },
  {
    icon: '🛡️',
    title: '100% Tested',
    sub: 'IS-standard lab certified',
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
  const [heroIndex, setHeroIndex] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const heroScrollRef = useRef<ScrollView>(null);
  const bannerScrollRef = useRef<ScrollView>(null);

  const { width: windowWidth } = useWindowDimensions();
  const HERO_CARD_WIDTH = windowWidth - 32;
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
      ...HERO_SLIDES.map((s) => ({ url: s.image, preset: 'hero' as const })),
      ...MATERIAL_CHILD_PILLS.map((p) => ({ url: p.image, preset: 'pill' as const })),
      ...SERVICE_CHILD_PILLS.map((p) => ({ url: p.image, preset: 'pill' as const })),
      ...MID_PROMO_CARDS.map((b) => ({ url: b.image, preset: 'card' as const })),
      ...SERVICES.map((s) => ({ url: s.image, preset: 'card' as const })),
      ...CATEGORIES.map((c) => ({ url: c.image, preset: 'card' as const })),
    ]);
  }, []);

  // Auto-rotate Hero Carousel every 4.8 seconds
  useEffect(() => {
    const heroTimer = setInterval(() => {
      setHeroIndex((prev) => {
        const next = (prev + 1) % HERO_SLIDES.length;
        if (heroScrollRef.current) {
          heroScrollRef.current.scrollTo({
            x: next * HERO_CARD_WIDTH,
            animated: true,
          });
        }
        return next;
      });
    }, 4800);

    return () => clearInterval(heroTimer);
  }, [HERO_CARD_WIDTH]);

  // Auto-rotate mid-page promo carousel every 4.5 seconds
  useEffect(() => {
    const bannerTimer = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % MID_PROMO_CARDS.length;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: next * (windowWidth - 32),
            animated: true,
          });
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(bannerTimer);
  }, [windowWidth]);

  const handleHeroScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    if (HERO_CARD_WIDTH > 0) {
      const idx = Math.round(contentOffsetX / HERO_CARD_WIDTH);
      if (idx >= 0 && idx < HERO_SLIDES.length && idx !== heroIndex) {
        setHeroIndex(idx);
      }
    }
  };

  const handleSelectHeroDot = (idx: number) => {
    setHeroIndex(idx);
    if (heroScrollRef.current) {
      heroScrollRef.current.scrollTo({
        x: idx * HERO_CARD_WIDTH,
        animated: true,
      });
    }
  };

  const handleBannerScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const bannerWidth = e?.nativeEvent?.layoutMeasurement?.width || 1;
    if (bannerWidth > 0) {
      const idx = Math.round(contentOffsetX / bannerWidth);
      setBannerIndex(idx);
    }
  };

  const handleSelectBannerDot = (idx: number) => {
    setBannerIndex(idx);
    if (bannerScrollRef.current) {
      bannerScrollRef.current.scrollTo({
        x: idx * (windowWidth - 32),
        animated: true,
      });
    }
  };

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
        {/* 1. HERO CAROUSEL (Nike / Adidas Commerce Style Hero Section) */}
        {/* ========================================================================= */}
        <View style={styles.heroSectionWrapper}>
          <ScrollView
            ref={heroScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleHeroScroll}
            style={styles.heroScrollView}
            contentContainerStyle={styles.heroScrollContent}
          >
            {HERO_SLIDES.map((slide) => (
              <View
                key={slide.id}
                style={[styles.heroCardOuter, { width: HERO_CARD_WIDTH }]}
              >
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => onSelectCategory(slide.categoryId)}
                  style={styles.heroCardTouchable}
                >
                  <ShimmerImage
                    source={{ uri: slide.image }}
                    style={styles.heroBackgroundImage}
                    resizeMode="cover"
                    preset="hero"
                    priority="high"
                    borderRadius={20}
                  />

                  {/* High Contrast Gradient Overlay for crystal clear readability */}
                  <View style={styles.heroGradientOverlay} />

                  {/* Hero Content Overlay */}
                  <View style={styles.heroContent}>
                    {/* Top Eyebrow Badge & Counter */}
                    <View style={styles.heroTopRow}>
                      <View style={styles.heroBadge}>
                        <Text style={styles.heroBadgeText}>{slide.badge}</Text>
                      </View>
                      <View style={styles.heroCounterPill}>
                        <Text style={styles.heroCounterText}>
                          0{heroIndex + 1} / 0{HERO_SLIDES.length}
                        </Text>
                      </View>
                    </View>

                    {/* Main Headline & Subtitle */}
                    <View style={styles.heroTextContainer}>
                      <Text style={styles.heroTitle}>
                        {slide.title}
                      </Text>
                      <Text style={styles.heroSubtitle} numberOfLines={2}>
                        {slide.subtitle}
                      </Text>
                    </View>

                    {/* Nike-Style Call To Action Pill Button */}
                    <View style={styles.heroCtaRow}>
                      <View style={styles.heroCtaButton}>
                        <Text style={styles.heroCtaText}>{slide.ctaText}</Text>
                        <ArrowRight size={14} color="#000000" strokeWidth={2.5} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Hero Pagination Indicators */}
          <View style={styles.heroDotsWrapper}>
            {HERO_SLIDES.map((slide, idx) => (
              <TouchableOpacity
                key={slide.id}
                onPress={() => handleSelectHeroDot(idx)}
                activeOpacity={0.7}
                style={styles.dotTouchTarget}
              >
                <View
                  style={[
                    styles.heroDot,
                    {
                      backgroundColor: idx === heroIndex ? '#111111' : '#CBD5E1',
                      width: idx === heroIndex ? 22 : 6,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 2. DIRECT YARD VALUE & TRUST ASSURANCE STRIP (Nike Speed/Assurance Pattern) */}
        {/* ========================================================================= */}
        <View style={styles.valuePillarsSection}>
          <View style={styles.valuePillarsGrid}>
            {VALUE_PILLARS.map((pillar, idx) => (
              <View key={`pillar-${idx}`} style={styles.valuePillarCard}>
                <View style={styles.pillarIconBadge}>
                  <Text style={styles.pillarIconText}>{pillar.icon}</Text>
                </View>
                <View style={styles.pillarTextGroup}>
                  <Text style={styles.pillarTitle} numberOfLines={1}>{pillar.title}</Text>
                  <Text style={styles.pillarSub} numberOfLines={1}>{pillar.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* 3. MATERIAL & TRADE SERVICES CHILD NAVIGATION PILLS (Unchanged Sections) */}
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
        {/* 5. COMMERCE PROMOTIONAL SPOTLIGHT CAROUSEL (Nike Editorial Card Pattern) */}
        {/* ========================================================================= */}
        <View style={styles.promoCarouselContainer}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleBannerScroll}
            style={styles.promoScrollView}
          >
            {MID_PROMO_CARDS.map((card) => (
              <View
                key={card.id}
                style={[styles.promoCardOuter, { width: windowWidth - 32 }]}
              >
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => onSelectCategory(card.categoryId)}
                  style={styles.promoCardTouchable}
                >
                  <ShimmerImage
                    source={{ uri: card.image }}
                    style={styles.promoBackgroundImage}
                    resizeMode="cover"
                    preset="card"
                    priority="high"
                    borderRadius={18}
                  />

                  {/* Gradient Scrim for crisp readability */}
                  <View style={styles.promoGradientOverlay} />

                  {/* Editorial Promo Content Layout */}
                  <View style={styles.promoCardContent}>
                    {/* Top Row: Eyebrow Badge + Slide Counter */}
                    <View style={styles.promoTopRow}>
                      <View style={styles.promoBadge}>
                        <Text style={styles.promoBadgeText}>{card.badge}</Text>
                      </View>
                      <View style={styles.promoCounterPill}>
                        <Text style={styles.promoCounterText}>
                          0{bannerIndex + 1} / 0{MID_PROMO_CARDS.length}
                        </Text>
                      </View>
                    </View>

                    {/* Middle: Headline + Accent Highlight + Description */}
                    <View style={styles.promoTextContainer}>
                      <Text style={styles.promoTitle}>
                        {card.title}
                      </Text>
                      <Text style={styles.promoHighlight}>
                        {card.highlight}
                      </Text>
                      <Text style={styles.promoDescription} numberOfLines={2}>
                        {card.description}
                      </Text>
                    </View>

                    {/* Bottom Row: Nike-Style Pill Call To Action */}
                    <View style={styles.promoCtaRow}>
                      <View style={styles.promoCtaButton}>
                        <Text style={styles.promoCtaText}>{card.ctaText}</Text>
                        <ArrowRight size={13} color="#000000" strokeWidth={2.5} />
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {/* Subtle Modern Pagination Indicators */}
          <View style={styles.promoDotsContainer}>
            {MID_PROMO_CARDS.map((card, idx) => (
              <TouchableOpacity
                key={card.id}
                onPress={() => handleSelectBannerDot(idx)}
                activeOpacity={0.7}
                style={styles.dotTouchTarget}
              >
                <View
                  style={[
                    styles.promoDot,
                    {
                      backgroundColor: idx === bannerIndex ? '#111111' : '#CBD5E1',
                      width: idx === bannerIndex ? 22 : 6,
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

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

  /* ---------------- HERO CAROUSEL STYLES ---------------- */
  heroSectionWrapper: {
    gap: 10,
  },
  heroScrollView: {
    borderRadius: 20,
  },
  heroScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCardOuter: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  heroCardTouchable: {
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111111',
  },
  heroBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  heroGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
  },
  heroContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  heroBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  heroCounterPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  heroCounterText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  heroTextContainer: {
    gap: 4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 26,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 0, height: 1.5 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#F1F5F9',
    lineHeight: 16,
    maxWidth: '92%',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  heroCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  heroCtaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.1,
  },
  heroDotsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    height: 12,
  },
  dotTouchTarget: {
    padding: 2,
  },
  heroDot: {
    height: 5,
    borderRadius: 3,
  },

  /* ---------------- VALUE PILLARS STRIP ---------------- */
  valuePillarsSection: {
    paddingHorizontal: 16,
  },
  valuePillarsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    gap: 16,
  },
  valuePillarCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pillarIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pillarIconText: {
    fontSize: 15,
  },
  pillarTextGroup: {
    flex: 1,
  },
  pillarTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#111111',
    letterSpacing: -0.2,
  },
  pillarSub: {
    fontSize: 10,
    fontWeight: '500',
    color: '#707072',
    marginTop: 1,
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

  /* ---------------- COMMERCE PROMOTIONAL SPOTLIGHT CAROUSEL ---------------- */
  promoCarouselContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  promoScrollView: {
    borderRadius: 18,
  },
  promoCardOuter: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  promoCardTouchable: {
    width: '100%',
    height: 195,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111111',
  },
  promoBackgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  promoGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  promoCardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
    zIndex: 2,
  },
  promoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
  },
  promoBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  promoCounterPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  promoCounterText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  promoTextContainer: {
    gap: 2,
  },
  promoTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  promoHighlight: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FCD34D',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  promoDescription: {
    fontSize: 11,
    fontWeight: '400',
    color: '#E2E8F0',
    lineHeight: 14,
    maxWidth: '92%',
    marginTop: 1,
  },
  promoCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCtaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  promoCtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.1,
  },
  promoDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    height: 12,
  },
  promoDot: {
    height: 5,
    borderRadius: 3,
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
