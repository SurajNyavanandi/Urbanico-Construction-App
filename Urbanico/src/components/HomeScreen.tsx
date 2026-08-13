import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS, ServiceItem } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme } from '../context/ThemeContext';
import { ProductCard } from './common/ProductCard';
import { HomeSkeleton } from './common/SkeletonLoader';
import { ShimmerImage } from './common/ShimmerImage';
import { Toast } from './common/Toast';
import { HeroDisplayCard, DisplaySlide } from './common/HeroDisplayCard';
import { ChildNavPills } from './common/ChildNavPills';

interface HomeScreenProps {
  onSelectCategory: (catId: CategoryId) => void;
  onNavigateAllMaterials: () => void;
  onNavigateAllServices?: () => void;
  onSelectItem?: (item: MaterialItem) => void;
  searchQuery: string;
  onOpenServicesModal?: (service?: ServiceItem) => void;
}

interface BannerData {
  id: string;
  image: string;
}

const PROMO_BANNERS: BannerData[] = [
  {
    id: 'promo-ad-1',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/add1_zx1dzj.jpg',
  },
  {
    id: 'promo-ad-2',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/add3_ysql65.jpg',
  },
  {
    id: 'promo-ad-3',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786614393/add2_sfwmp0.jpg',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectCategory,
  onNavigateAllMaterials,
  onNavigateAllServices,
  onSelectItem,
}) => {
  const { theme, typography } = useTheme();
  const [bannerIndex, setBannerIndex] = useState(0);
  const [selectedChildNav, setSelectedChildNav] = useState<string>('featured');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const bannerScrollRef = useRef<ScrollView>(null);

  const windowWidth = Dimensions.get('window').width;
  // Dynamic Card Width: 2 cards fully visible, 3rd card ~45% visible
  const CARD_WIDTH = Math.round((windowWidth - 40) / 2.45);
  const IMAGE_BOX_HEIGHT = Math.round(CARD_WIDTH * 1.12);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      setToastMessage('Catalog rates refreshed');
    }, 1000);
  };

  // Auto-rotate banner every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => {
        const next = (prev + 1) % PROMO_BANNERS.length;
        if (bannerScrollRef.current) {
          bannerScrollRef.current.scrollTo({
            x: next * (Dimensions.get('window').width - 32),
            animated: true,
          });
        }
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

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
        x: idx * (Dimensions.get('window').width - 32),
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
        {/* TOP FEATURED DISPLAY CARD (Hero Promo Banner with CTA & Pagination Dots) */}
        <HeroDisplayCard
          onCtaPress={(slide: DisplaySlide) => {
            if (slide.id === 'slide-2') onSelectCategory('iron_bars');
            else if (slide.id === 'slide-3') onSelectCategory('cement');
            else onSelectCategory('cement');
          }}
        />

        {/* SMALL CHILD COMPONENTS ROW (Horizontal Quick Category Pills) */}
        <ChildNavPills
          selectedId={selectedChildNav}
          onSelectChild={(id: string) => {
            setSelectedChildNav(id);
            if (id !== 'featured') {
              onSelectCategory(id as CategoryId);
            }
          }}
        />

        {/* 1. MATERIALS SECTION */}
      <View style={styles.sectionContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Materials
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Essential building supplies
            </Text>
          </View>
          <TouchableOpacity
            onPress={onNavigateAllMaterials}
            style={styles.viewAllButton}
            activeOpacity={0.7}
          >
            <Text style={[styles.viewAllText, { color: theme.textSecondary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Materials Horizontal Scroll Row */}
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
                subtitle={cat.count}
                priceLabel={cat.priceLabel}
                image={cat.image}
                width={CARD_WIDTH}
                onPress={() => onSelectCategory(cat.id)}
              />
            ))}
          </ScrollView>
        </View>
      </View>

      {/* 2. PROMOTIONAL BANNERS CAROUSEL */}
      <View style={styles.bannerCarouselContainer}>
        <ScrollView
          ref={bannerScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={handleBannerScroll}
          style={styles.bannerScrollView}
        >
          {PROMO_BANNERS.map((banner) => (
            <TouchableOpacity
              key={banner.id}
              activeOpacity={0.9}
              onPress={() => onSelectCategory('cement')}
              style={[styles.bannerCard, { borderColor: theme.border }]}
            >
              <ShimmerImage
                source={{ uri: banner.image }}
                style={styles.fullBannerImage}
                resizeMode="cover"
                borderRadius={16}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Banner Dots */}
        <View style={styles.dotsContainer}>
          {PROMO_BANNERS.map((banner, idx) => (
            <TouchableOpacity
              key={banner.id}
              onPress={() => handleSelectBannerDot(idx)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === bannerIndex ? theme.primary : '#CBD5E1',
                    width: idx === bannerIndex ? 20 : 8,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 3. SERVICES SECTION */}
      <View style={styles.sectionContainer}>
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading }]}>
              Services
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              Expert skilled trade professionals
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
            <Text style={[styles.viewAllText, { color: theme.textSecondary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        {/* Services Horizontal Scroll Row */}
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
                  priceLabel={srv.rate}
                  image={srv.image}
                  width={CARD_WIDTH}
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
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 96,
    gap: 24,
  },
  sectionContainer: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    gap: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  viewAllButton: {
    paddingVertical: 2,
    paddingLeft: 8,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  horizontalScrollWrapper: {
    marginHorizontal: -16,
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    gap: 8,
  },
  imageBox: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productTextWrapper: {
    gap: 3,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  productSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
  },
  productPrice: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  bannerCarouselContainer: {
    gap: 8,
  },
  bannerScrollView: {
    borderRadius: 16,
  },
  bannerCard: {
    width: Dimensions.get('window').width - 32,
    height: Math.round((Dimensions.get('window').width - 32) / 2.5),
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1,
  },
  fullBannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    height: 12,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
