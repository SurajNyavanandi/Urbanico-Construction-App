import React from 'react';
import { Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../../context/ThemeContext';
import { useSkeletonAnimation } from './useSkeletonAnimation';

export interface SkeletonItemProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
}

export const SkeletonItem: React.FC<SkeletonItemProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  children,
}) => {
  const { theme } = useTheme();
  const { opacity } = useSkeletonAnimation();

  const baseBg = theme.mode === 'dark' ? '#27272A' : '#E2E8F0';
  const AnimatedView = Animated.View as any;

  return (
    <AnimatedView
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor: baseBg,
          opacity,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </AnimatedView>
  );
};

export default SkeletonItem;
