import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Star } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { ShimmerImage } from './ShimmerImage';

export interface ChildNavItem {
  id: string;
  label: string;
  iconType?: 'star' | 'image';
  image?: string;
  isFeatured?: boolean;
}

interface ChildNavPillsProps {
  selectedId?: string;
  onSelectChild: (id: string) => void;
  items?: ChildNavItem[];
}

/**
 * DEFAULT CHILD NAVIGATION ITEMS
 * Image Ratio Requirement for Child Items: 1:1 Square (Recommended: 120x120 px or 200x200 px)
 */
export const DEFAULT_CHILD_ITEMS: ChildNavItem[] = [
  {
    id: 'featured',
    label: 'Featured',
    iconType: 'star',
    isFeatured: true,
  },
  {
    id: 'tiles',
    label: 'Tiles',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1787033354/Tiles_kw4xbl.jpg',
  },
  {
    id: 'cement',
    label: 'Cement',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-cement_pwrzsr.jpg',
  },
  {
    id: 'bricks',
    label: 'Bricks',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-bricks_bbywkp.jpg',
  },
  {
    id: 'sand',
    label: 'Sand',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-sand_qmbdo6.jpg',
  },
  {
    id: 'iron_bars',
    label: 'Steel',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-ironbars_ayo0id.jpg',
  },
  {
    id: 'stone',
    label: 'Stone',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-stones_oqaced.jpg',
  },
  {
    id: 'centring',
    label: 'Centring',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-centering_nikj90.jpg',
  },
  {
    id: 'mason',
    label: 'Mason',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693450/child-mason_mv6ulz.jpg',
  },
  {
    id: 'fabricator',
    label: 'Fabricator',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693449/child-fabricator_btw9ek.jpg',
  },
  {
    id: 'painter',
    label: 'Painter',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-painter_eoyox2.jpg',
  },
  {
    id: 'electrician',
    label: 'Electrician',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-electrician_iggrlv.jpg',
  },
  {
    id: 'plumber',
    label: 'Plumber',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693430/child-plumber_se4nd6.jpg',
  },
  {
    id: 'carpenter',
    label: 'Carpenter',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786693431/child-carpenter_fr1fjp.jpg',
  },
];

export const ChildNavPills: React.FC<ChildNavPillsProps> = ({
  selectedId = 'featured',
  onSelectChild,
  items = DEFAULT_CHILD_ITEMS,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          const isFeatured = item.id === 'featured' || item.isFeatured;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectChild(item.id)}
              activeOpacity={0.8}
              style={[
                styles.childCard,
                {
                  backgroundColor: isFeatured
                    ? (isSelected ? theme.surface : theme.surfaceSecondary)
                    : (isSelected ? theme.surface : theme.surfaceSecondary),
                  borderColor: isFeatured
                    ? 'transparent'
                    : (isSelected ? theme.primary : theme.border),
                  borderWidth: isFeatured ? 0 : 1,
                },
              ]}
            >
              {/* Top Icon / Image Box (1:1 Ratio) */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isFeatured
                      ? (theme.mode === 'dark' ? '#27272A' : '#1D1D1F')
                      : theme.surface,
                    borderColor: isFeatured ? 'transparent' : theme.border,
                    borderWidth: isFeatured ? 0 : 1,
                  },
                ]}
              >
                {item.iconType === 'star' ? (
                  <Star size={17} color="#FFFFFF" fill="#FFFFFF" />
                ) : item.image ? (
                  <ShimmerImage
                    source={{ uri: item.image }}
                    style={styles.imageThumbnail}
                    resizeMode="cover"
                    borderRadius={8}
                    preset="pill"
                    priority="high"
                    recyclingKey={`pill-${item.id}`}
                  />
                ) : (
                  <View style={[styles.placeholderBox, { backgroundColor: theme.surfaceSecondary }]} />
                )}
              </View>

              {/* Bottom Label Text */}
              <Text
                style={[
                  styles.label,
                  {
                    color: isFeatured
                      ? theme.textPrimary
                      : (isSelected ? theme.primary : theme.textPrimary),
                    fontWeight: isFeatured ? '500' : (isSelected ? '600' : '400'),
                  },
                ]}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  childCard: {
    width: 68,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  imageThumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
  },
  label: {
    fontSize: 10,
    textAlign: 'center',
  },
});
