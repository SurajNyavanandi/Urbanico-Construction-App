import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Platform,
  LayoutChangeEvent,
} from 'react-native';
import { ShimmerImage } from './ShimmerImage';
import { useTheme } from '../../theme';
import { soundService } from '../../utils/soundHelper';

export const SHOWCASE_IMAGES = [
  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1790677852/apartment1_crmfut.jpg',
  'https://res.cloudinary.com/dfr0zghtc/image/upload/v1790677852/apartment2_ivkw78.jpg',
];

export interface ProjectShowcaseCarouselProps {
  onPressImage?: (index: number) => void;
}

export const ProjectShowcaseCarousel: React.FC<ProjectShowcaseCarouselProps> = ({
  onPressImage,
}) => {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();

  const [measuredWidth, setMeasuredWidth] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const scrollRef = useRef<any>(null);

  // Exact screen fitted width with 16px horizontal margins on each side (32px total), capped at 600px for tablets/desktops
  const sliderWidth = measuredWidth > 0 ? measuredWidth : Math.min(windowWidth - 32, 600);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - measuredWidth) > 1) {
      setMeasuredWidth(w);
    }
  };

  // Auto-play interval with smooth transition
  useEffect(() => {
    if (isInteracting || sliderWidth <= 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const nextIndex = (prev + 1) % SHOWCASE_IMAGES.length;
        if (scrollRef.current) {
          scrollRef.current.scrollTo({
            x: nextIndex * sliderWidth,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isInteracting, sliderWidth]);

  const handleScroll = useCallback(
    (e: any) => {
      const offsetX = e?.nativeEvent?.contentOffset?.x || 0;
      const index = Math.round(offsetX / sliderWidth);
      if (index >= 0 && index < SHOWCASE_IMAGES.length && index !== activeIndex) {
        setActiveIndex(index);
      }
    },
    [sliderWidth, activeIndex]
  );

  const scrollToIndex = useCallback(
    (index: number) => {
      soundService.playTap();
      const clampedIndex = Math.max(0, Math.min(index, SHOWCASE_IMAGES.length - 1));
      setActiveIndex(clampedIndex);
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: clampedIndex * sliderWidth,
          animated: true,
        });
      }
    },
    [sliderWidth]
  );

  return (
    <View style={styles.container}>
      <View
        style={styles.carouselWrapper}
        onLayout={handleLayout}
      >
        {/* Responsive 4:3 Aspect Ratio Card Frame */}
        <View
          style={[
            styles.sliderFrame,
            {
              backgroundColor: theme.mode === 'dark' ? '#1E293B' : '#FFFFFF',
              borderColor: theme.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
            },
          ]}
        >
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onTouchStart={() => setIsInteracting(true)}
            onTouchEnd={() => setTimeout(() => setIsInteracting(false), 3000)}
            onScrollBeginDrag={() => setIsInteracting(true)}
            onScrollEndDrag={() => setTimeout(() => setIsInteracting(false), 3000)}
            contentContainerStyle={styles.scrollContent}
            snapToInterval={sliderWidth}
            snapToAlignment="start"
            decelerationRate="fast"
          >
            {SHOWCASE_IMAGES.map((imageUrl, index) => (
              <TouchableOpacity
                key={imageUrl}
                activeOpacity={0.95}
                onPress={() => {
                  soundService.playTap();
                  if (onPressImage) {
                    onPressImage(index);
                  }
                }}
                style={[styles.slideItem, { width: sliderWidth }]}
              >
                <ShimmerImage
                  source={{ uri: imageUrl }}
                  style={styles.image}
                  resizeMode="contain"
                  contentFit="contain"
                  preset="banner"
                  lazy={true}
                  aspectRatio={4 / 3}
                  borderRadius={14}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Minimalist Pagination Dots */}
        <View style={styles.paginationRow}>
          {SHOWCASE_IMAGES.map((_, index) => {
            const isActive = index === activeIndex;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => scrollToIndex(index)}
                style={[
                  styles.paginationDot,
                  isActive
                    ? [styles.paginationDotActive, { backgroundColor: theme.primary }]
                    : [
                        styles.paginationDotInactive,
                        {
                          backgroundColor:
                            theme.mode === 'dark'
                              ? 'rgba(255,255,255,0.25)'
                              : 'rgba(0,0,0,0.18)',
                        },
                      ],
                ]}
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 8,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
  },
  carouselWrapper: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 8,
  },
  sliderFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
      },
    }),
  },
  scrollContent: {
    flexDirection: 'row',
  },
  slideItem: {
    aspectRatio: 4 / 3,
    height: '100%',
    overflow: 'hidden',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
  },
  paginationDot: {
    height: 5,
    borderRadius: 3,
  },
  paginationDotActive: {
    width: 22,
  },
  paginationDotInactive: {
    width: 6,
  },
});
