import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ShimmerImage } from './ShimmerImage';

export interface DisplaySlide {
  id: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  image: string;
  bgColor?: string;
  accentColor?: string;
}

interface HeroDisplayCardProps {
  slides?: DisplaySlide[];
  onCtaPress?: (slide: DisplaySlide) => void;
}

/**
 * DEFAULT DISPLAY SLIDES (Image Ratio: 16:9 or 2:1 - Recommended resolution: 800x450 px)
 */
const DEFAULT_SLIDES: DisplaySlide[] = [
  {
    id: 'slide-1',
    headline: 'MATERIALS CRAFTED.\nSITE PERFECTED.',
    subheadline: 'Bulk supply. Verified GST rates.',
    ctaText: 'Order Now',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785842565/Gemini_Generated_Image_4rlspn4rlspn4rls_wbly6k.png',
    bgColor: '#7F1D1D', // Burgundy maroon matching reference design
    accentColor: '#EF4444',
  },
  {
    id: 'slide-2',
    headline: 'SUPERIOR STEEL.\nUNMATCHED GRADES.',
    subheadline: 'Fe550D TMT Rebars direct from mill.',
    ctaText: 'Explore Steel',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785842566/Gemini_Generated_Image_8xdvjn8xdvjn8xdv_phm0ve.png',
    bgColor: '#1E293B', // Slate dark
    accentColor: '#3B82F6',
  },
  {
    id: 'slide-3',
    headline: 'READY MIX CEMENT.\nGUARANTEED WEIGHT.',
    subheadline: 'UltraTech, ACC & Dalmia at wholesale.',
    ctaText: 'View Cement',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/f_auto,q_auto/v1785842566/Gemini_Generated_Image_nyb7xqnyb7xqnyb7_rbizwp.png',
    bgColor: '#15803D', // Forest green
    accentColor: '#22C55E',
  },
];

export const HeroDisplayCard: React.FC<HeroDisplayCardProps> = ({
  slides = DEFAULT_SLIDES,
  onCtaPress,
}) => {
  const { theme, typography } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 32; // 16px horizontal margin
  // 16:9 ratio -> height = cardWidth / (16/9) ~ 190-200px
  const cardHeight = Math.round(cardWidth * 0.52);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: next * cardWidth,
            animated: true,
          });
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [slides.length, cardWidth]);

  const handleScroll = (e: any) => {
    const offsetX = e?.nativeEvent?.contentOffset?.x || 0;
    const idx = Math.round(offsetX / cardWidth);
    if (idx >= 0 && idx < slides.length) {
      setActiveIndex(idx);
    }
  };

  const handleDotPress = (index: number) => {
    setActiveIndex(index);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        x: index * cardWidth,
        animated: true,
      });
    }
  };

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={{ borderRadius: 20 }}
      >
        {slides.map((slide) => (
          <View
            key={slide.id}
            style={[
              styles.cardFrame,
              {
                width: cardWidth,
                height: cardHeight,
                backgroundColor: slide.bgColor || '#7F1D1D',
                borderColor: theme.border,
              },
            ]}
          >
            {/* Background / Right Side Image (Ratio: 16:9) */}
            <View style={styles.imageOverlayContainer}>
              <ShimmerImage
                source={{ uri: slide.image }}
                style={styles.rightImage}
                resizeMode="cover"
              />
            </View>

            {/* Left Content Column */}
            <View style={styles.leftContent}>
              <Text
                style={[
                  styles.headlineText,
                  { fontFamily: typography.fontFamilyHeading },
                ]}
              >
                {slide.headline}
              </Text>
              <Text style={styles.subheadlineText}>{slide.subheadline}</Text>

              {/* Order Now Pill Button */}
              <TouchableOpacity
                onPress={() => onCtaPress && onCtaPress(slide)}
                style={styles.ctaPillBtn}
                activeOpacity={0.85}
              >
                <Text style={styles.ctaPillBtnText}>{slide.ctaText}</Text>
                <ArrowRight size={14} color="#7F1D1D" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            {/* Pagination Dots at Bottom Center/Right */}
            <View style={styles.paginationDotsRow}>
              {slides.map((s, idx) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => handleDotPress(idx)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dotItem,
                      idx === activeIndex
                        ? styles.dotActive
                        : styles.dotInactive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardFrame: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
  },
  imageOverlayContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '55%',
    opacity: 0.9,
  },
  rightImage: {
    width: '100%',
    height: '100%',
  },
  leftContent: {
    width: '60%',
    zIndex: 2,
    gap: 8,
  },
  headlineText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
    letterSpacing: -0.3,
    textTransform: 'uppercase',
  },
  subheadlineText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 12,
    fontWeight: '400',
  },
  ctaPillBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ctaPillBtnText: {
    color: '#7F1D1D',
    fontSize: 12,
    fontWeight: '700',
  },
  paginationDotsRow: {
    position: 'absolute',
    bottom: 12,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 3,
  },
  dotItem: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
});
