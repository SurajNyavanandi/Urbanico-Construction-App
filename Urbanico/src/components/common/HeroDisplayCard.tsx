import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface DisplaySlide {
  id: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  image?: string;
}

interface HeroDisplayCardProps {
  slides?: DisplaySlide[];
  onCtaPress?: (slide?: any) => void;
  onPressCta?: () => void;
}

export const HeroDisplayCard: React.FC<HeroDisplayCardProps> = ({
  onCtaPress,
  onPressCta,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (onCtaPress) {
      onCtaPress({ id: 'hero-card' });
    } else if (onPressCta) {
      onPressCta();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={handlePress}
        style={[styles.cardContainer, { borderColor: theme.borderLight || '#E2E8F0' }]}
      >
        <Image
          source={{ uri: 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1786620810/herocard3_ytzfhm.jpg' }}
          style={styles.image}
          resizeMode="cover"
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
  },
  cardContainer: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
