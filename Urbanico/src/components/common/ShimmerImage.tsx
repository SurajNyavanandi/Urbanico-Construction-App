import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Animated, ImageProps, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface ShimmerImageProps extends ImageProps {
  aspectRatio?: number;
  borderRadius?: number;
}

export const ShimmerImage: React.FC<ShimmerImageProps> = ({
  source,
  style,
  resizeMode = 'cover',
  aspectRatio,
  borderRadius = 0,
  ...props
}) => {
  const { theme } = useTheme();
  const [loaded, setLoaded] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (!loaded) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.8,
            duration: 700,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [loaded, pulseAnim]);

  const skeletonBg = theme.mode === 'dark' ? '#27272A' : '#E4E4E7';
  const AnimatedView = Animated.View as any;

  return (
    <View style={[styles.container, { borderRadius }, style]}>
      {!loaded && (
        <AnimatedView
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: skeletonBg,
              opacity: pulseAnim,
              borderRadius,
            },
          ]}
        />
      )}
      <Image
        {...props}
        source={source}
        resizeMode={resizeMode}
        style={[
          style,
          styles.image,
          { opacity: loaded ? 1 : 0 },
        ]}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
