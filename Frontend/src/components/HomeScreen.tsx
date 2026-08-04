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
  bgGradient: string;
  borderColor: string;
  title: string;
  bigText: string;
  tagText: string;
  image: string;
  tagBg: string;
}

const PROMO_BANNERS: BannerData[] = [
  {
    id: 'ultratech',
    bgGradient: '#1E1B4B',
    borderColor: '#312E81',
    title: 'ULTRATECH SUPER CONCRETE',
    bigText: '15% OFF',
    tagText: 'BULK DISPATCH REBATE • EXCLUSIVE CONTRACTOR DEAL',
    tagBg: '#3730A3',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477602/Gemini_Generated_Image_krt598krt598krt5_uqgizg.jpg',
  },
  {
    id: 'tatatiscon',
    bgGradient: '#064E3B',
    borderColor: '#047857',
    title: 'TATA TISCON 550D TMT REBAR',
    bigText: 'SAME DAY',
    tagText: 'DIRECT SITE DELIVERY • FREE WEIGHBRIDGE SLIP',
    tagBg: '#065F46',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_4o5vmt4o5vmt4o5v_ff1zly.jpg',
  },
  {
    id: 'greenply',
    bgGradient: '#701A75',
    borderColor: '#86198F',
    title: 'GREENPLY ZERO-EMISSION PLYWOOD',
    bigText: 'E-0 GRADE',
    tagText: '100% WATERPROOF MARINE PLY • ISO CERTIFIED',
    tagBg: '#9D174D',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1785477601/Gemini_Generated_Image_aqgxocaqgxocaqgx_mzsmtr.jpg',
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

  const filteredCategories = CATEGORIES.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Auto-slide promotional banner every 3.5s
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
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleMaterialsScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const cardWidth = 118; // approx width of category card + gap
    const newPage = Math.min(
      Math.max(0, Math.round(contentOffsetX / cardWidth)),
      Math.max(0, filteredCategories.length - 1)
    );
    setActiveMaterialPage(newPage);
  };

  const handleServicesScroll = (e: any) => {
    const contentOffsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const cardWidth = 118;
    const newPage = Math.min(
      Math.max(0, Math.round(contentOffsetX / cardWidth)),
      SERVICES.length - 1
    );
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
          {filteredCategories.length > 0 ? (
            filteredCategories.map((cat) => {
              const isSelected = selectedMaterialId === cat.id;
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
                      borderColor: isSelected ? theme.primary : theme.border,
                      backgroundColor: isSelected ? theme.surfaceSecondary : theme.surface,
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
            })
          ) : (
            <View style={[styles.emptySearchCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.emptySearchText, { color: theme.textMuted }]}>
                No materials match "{searchQuery}"
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Materials Pagination Dots reflecting total categories */}
      <View style={styles.dotsContainer}>
        {filteredCategories.map((cat, idx) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => {
              setActiveMaterialPage(idx);
              if (materialsScrollRef.current) {
                materialsScrollRef.current.scrollTo({
                  x: idx * 118,
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
                    idx === activeMaterialPage ? theme.primary : '#CBD5E1',
                  width: idx === activeMaterialPage ? 18 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* 3. Two Promotional Banners Auto-Sliding Carousel */}
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
            <View
              key={banner.id}
              style={[
                styles.bannerCard,
                { backgroundColor: banner.bgGradient, borderColor: banner.borderColor },
              ]}
            >
              <View style={styles.bannerContent}>
                <View style={styles.bannerLeftText}>
                  <Text style={styles.bannerHeaderTitle}>{banner.title}</Text>
                  <Text style={styles.bannerBigText}>{banner.bigText}</Text>
                  <View style={[styles.bannerTag, { backgroundColor: banner.tagBg }]}>
                    <Text style={styles.bannerTagText}>{banner.tagText}</Text>
                  </View>
                </View>
                <View style={styles.bannerRightImageWrapper}>
                  <Image
                    source={{ uri: banner.image }}
                    style={styles.bannerImage}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </View>
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

        {/* Services Carousel Indicator Dots */}
        <View style={styles.dotsContainer}>
          {SERVICES.map((srv, idx) => (
            <TouchableOpacity
              key={srv.id}
              onPress={() => {
                setActiveServicePage(idx);
                if (servicesScrollRef.current) {
                  servicesScrollRef.current.scrollTo({
                    x: idx * 118,
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
                      idx === activeServicePage ? theme.primary : '#CBD5E1',
                    width: idx === activeServicePage ? 18 : 8,
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
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
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
    borderRadius: 20,
  },
  bannerCard: {
    width: Dimensions.get('window').width - 32,
    borderRadius: 20,
    padding: 16,
    minHeight: 135,
    justifyContent: 'center',
    borderWidth: 1,
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
  bannerBigText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FBBF24',
    letterSpacing: 1,
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
