import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { BRAND_LOGO_URL } from '../../constants';
import { ShimmerImage } from './ShimmerImage';

interface BrandLogoProps {
  size?: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  borderRadius?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 72,
  style,
  imageStyle,
  borderRadius = 18,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: borderRadius,
        },
        style,
      ]}
    >
      <ShimmerImage
        source={{ uri: BRAND_LOGO_URL }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: borderRadius,
          },
          imageStyle,
        ]}
        resizeMode="contain"
        preset="logo"
        borderRadius={borderRadius}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
