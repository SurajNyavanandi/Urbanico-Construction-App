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
const DEFAULT_CHILD_ITEMS: ChildNavItem[] = [
  {
    id: 'featured',
    label: 'Featured',
    iconType: 'star',
    isFeatured: true,
  },
  {
    id: 'sand',
    label: 'Sand',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533906/sand_orm3ji.jpg',
  },
  {
    id: 'bricks',
    label: 'Bricks',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533906/bricks_jsfo9r.jpg',
  },
  {
    id: 'cement',
    label: 'Cement',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533909/cement_ewzwf3.jpg',
  },
  {
    id: 'iron_bars',
    label: 'Steel',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533914/ironbars_lyebwh.jpg',
  },
  {
    id: 'stone',
    label: 'Stone',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533906/stones_kvqy16.jpg',
  },
  {
    id: 'centring',
    label: 'Centring',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533910/centering_euuz3q.jpg',
  },
  {
    id: 'mason',
    label: 'Mason',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533919/mason_ipgxhc.jpg',
  },
  {
    id: 'fabricator',
    label: 'Fabricator',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533913/fabricator_rwtwsu.jpg',
  },
  {
    id: 'painter',
    label: 'Painter',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533919/painter_q3wypn.jpg',
  },
  {
    id: 'electrician',
    label: 'Electrician',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533911/electrician_y491o4.jpg',
  },
  {
    id: 'plumber',
    label: 'Plumber',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533905/plumber_kjuubn.jpg',
  },
  {
    id: 'carpenter',
    label: 'Carpenter',
    iconType: 'image',
    image: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786533907/carpenter_zoqlyn.jpg',
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

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelectChild(item.id)}
              activeOpacity={0.8}
              style={[
                styles.childCard,
                {
                  backgroundColor: isSelected
                    ? theme.surface
                    : theme.surfaceSecondary,
                  borderColor: isSelected ? theme.primary : theme.borderLight,
                },
              ]}
            >
              {/* Top Icon / Image Box (1:1 Ratio) */}
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: item.isFeatured
                      ? '#000000'
                      : theme.surface,
                    borderColor: item.isFeatured ? '#000000' : theme.borderLight,
                  },
                ]}
              >
                {item.iconType === 'star' ? (
                  <Star size={18} color="#FFFFFF" fill="#FFFFFF" />
                ) : item.image ? (
                  <ShimmerImage
                    source={{ uri: item.image }}
                    style={styles.imageThumbnail}
                    resizeMode="cover"
                    borderRadius={8}
                  />
                ) : (
                  <View style={[styles.placeholderBox, { backgroundColor: theme.borderLight }]} />
                )}
              </View>

              {/* Bottom Label Text */}
              <Text
                style={[
                  styles.label,
                  {
                    color: isSelected ? theme.primary : theme.textPrimary,
                    fontWeight: isSelected ? '700' : '500',
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
