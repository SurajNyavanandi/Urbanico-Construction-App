import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { CATEGORIES, SERVICES, MATERIAL_ITEMS, ServiceItem } from '../data/materialsData';
import { CategoryId, MaterialItem } from '../types';
import { useTheme } from '../context/ThemeContext';

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
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785842565/Gemini_Generated_Image_4rlspn4rlspn4rls_wbly6k.png',
  },
  {
    id: 'promo-ad-2',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785842566/Gemini_Generated_Image_8xdvjn8xdvjn8xdv_phm0ve.png',
  },
  {
    id: 'promo-ad-3',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785842566/Gemini_Generated_Image_nyb7xqnyb7xqnyb7_rbizwp.png',
  },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectCategory,
  onNavigateAllMaterials,
  onNavigateAllServices,
  onSelectItem,
  searchQuery,
}) => {
  const { theme } = useTheme();
  const [selectedMaterialId, setSelectedMaterialId] = useState<CategoryId>('sand');
  const [activeMaterialPage, setActiveMaterialPage] = useState(0);
  const [activeServicePage, setActiveServicePage] = useState(0);
  const [bannerIndex, setBannerIndex] = useState(0);

  const bannerScrollRef = useRef<ScrollView>(null);
  const materialsScrollRef = useRef<ScrollView>(null);
  const servicesScrollRef = useRef<ScrollView>(null);

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

  // 2 distinct pages for 6 material items (3 cards per view)
  const MATERIAL_PAGES = [0, 1];
  const handleMaterialsScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const pagePx = 118 * 3;
    const newPage = Math.min(1, Math.max(0, Math.round(contentOffsetX / pagePx)));
    setActiveMaterialPage(newPage);
  };

  // 3 distinct pages for 8 service items
  const SERVICE_PAGES = [0, 1, 2];
  const handleServicesScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const pagePx = 118 * 3;
    const newPage = Math.min(2, Math.max(0, Math.round(contentOffsetX / pagePx)));
    setActiveServicePage(newPage);
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
        x: idx * (Dimensions.get('window').width - 32),
        animated: true,
      });
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Materials Header & Arrow */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
          Materials
        </Text>
        <TouchableOpacity
          onPress={onNavigateAllMaterials}
          style={[styles.iconCircleButton, { backgroundColor: theme.primaryLight }]}
          accessibilityLabel="View all materials"
          activeOpacity={0.7}
        >
          <ArrowRight color={theme.primaryDark} size={20} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* 2. Materials Horizontal Smooth Carousel */}
      <View style={styles.materialsCarouselWrapper}>
        <ScrollView
          ref={materialsScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleMaterialsScroll}
          contentContainerStyle={styles.materialsScrollRow}
        >
          {CATEGORIES.map((cat) => {
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  setSelectedMaterialId(cat.id);
                  onSelectCategory(cat.id);
                }}
                activeOpacity={0.8}
                style={[
                  styles.categoryCard,
                  {
                    borderColor: theme.border,
                    backgroundColor: theme.surface,
                  },
                ]}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: cat.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardTextWrapper}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                  {cat.priceLabel && (
                    <Text style={[styles.cardPriceLabel, { color: theme.primaryDark }]} numberOfLines={1}>
                      {cat.priceLabel}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Materials Pagination Dots (Exactly 3 dots for 3 snap pages) */}
      <View style={styles.dotsContainer}>
        {MATERIAL_PAGES.map((pageIdx) => (
          <TouchableOpacity
            key={pageIdx}
            onPress={() => {
              setActiveMaterialPage(pageIdx);
              if (materialsScrollRef.current) {
                materialsScrollRef.current.scrollTo({
                  x: pageIdx * 118 * 3,
                  animated: true,
                });
              }
            }}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    pageIdx === activeMaterialPage ? theme.primary : '#CBD5E1',
                  width: pageIdx === activeMaterialPage ? 18 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Promotional Banners Auto-Sliding Carousel */}
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
              <Image
                source={{ uri: banner.image }}
                style={styles.fullBannerImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Banner Pagination Dots (2 Dots for 2 Banners) */}
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

      {/* 4. Services Section with Carousel Indicator Dots */}
      <View style={styles.servicesSection}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            onPress={() => {
              if (onNavigateAllServices) onNavigateAllServices();
              else onSelectCategory('services-catalog');
            }}
            style={styles.servicesTitleRow}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Services</Text>
            <View style={[styles.tradesBadge, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.tradesBadgeText, { color: theme.primaryDark }]}>
                {SERVICES.length} Skilled Trades
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (onNavigateAllServices) onNavigateAllServices();
              else onSelectCategory('services-catalog');
            }}
            style={[styles.iconCircleButton, { backgroundColor: theme.primaryLight }]}
            accessibilityLabel="View all services catalog"
            activeOpacity={0.7}
          >
            <ArrowRight color={theme.primaryDark} size={20} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Services Horizontal Scroll View */}
        <ScrollView
          ref={servicesScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleServicesScroll}
          contentContainerStyle={styles.materialsScrollRow}
        >
          {SERVICES.map((srv) => {
            const matchingItem = MATERIAL_ITEMS.find((m) => m.id === `service-${srv.id}`);
            return (
              <TouchableOpacity
                key={srv.id}
                onPress={() => {
                  if (matchingItem && onSelectItem) {
                    onSelectItem(matchingItem);
                  } else if (onNavigateAllServices) {
                    onNavigateAllServices();
                  } else {
                    onSelectCategory('services-catalog');
                  }
                }}
                activeOpacity={0.8}
                style={[styles.categoryCard, { borderColor: theme.border, backgroundColor: theme.surface }]}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: srv.image }}
                    style={styles.cardImage}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardTextWrapper}>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {srv.name}
                  </Text>
                  <Text style={[styles.cardPriceLabel, { color: theme.primaryDark }]} numberOfLines={1}>
                    {srv.rate}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Services Carousel Indicator Dots (Exactly 3 dots for 3 snap pages) */}
        <View style={styles.dotsContainer}>
          {SERVICE_PAGES.map((pageIdx) => (
            <TouchableOpacity
              key={pageIdx}
              onPress={() => {
                setActiveServicePage(pageIdx);
                if (servicesScrollRef.current) {
                  servicesScrollRef.current.scrollTo({
                    x: pageIdx * 118 * 3,
                    animated: true,
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      pageIdx === activeServicePage ? theme.primary : '#CBD5E1',
                    width: pageIdx === activeServicePage ? 18 : 8,
                  },
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
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
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  iconCircleButton: {
    padding: 8,
    borderRadius: 999,
  },
  materialsCarouselWrapper: {
    minHeight: 144,
  },
  materialsScrollRow: {
    gap: 12,
    paddingVertical: 4,
    minHeight: 144,
    alignItems: 'center',
  },
  categoryCard: {
    width: 108,
    borderRadius: 16,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 136,
    borderWidth: 1.5,
  },
  emptySearchCard: {
    width: Dimensions.get('window').width - 32,
    height: 136,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptySearchText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardTextWrapper: {
    alignItems: 'center',
    width: '100%',
    marginTop: 4,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardPriceLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    height: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
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
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  bannerLeftText: {
    maxWidth: '58%',
    gap: 4,
  },
  bannerHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FDE68A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bannerAmbassadorText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#E0E7FF',
    letterSpacing: 0.5,
  },
  bannerBigText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 0.5,
  },
  bannerTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  bannerTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D1FAE5',
    letterSpacing: 1,
  },
  bannerRightImageWrapper: {
    width: '38%',
  },
  bannerImage: {
    height: 88,
    width: '100%',
    borderRadius: 14,
  },
  servicesSection: {
    gap: 12,
  },
  servicesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tradesBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  tradesBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
