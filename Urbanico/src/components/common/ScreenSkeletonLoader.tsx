import React from 'react';
import {
  HomeSkeleton,
  CatalogSkeleton,
  ProfileSkeleton,
  OrderHistorySkeleton,
} from './SkeletonLoader';

export interface ScreenSkeletonLoaderProps {
  type?: 'home' | 'catalog' | 'cart' | 'profile' | 'detail';
}

export const ScreenSkeletonLoader: React.FC<ScreenSkeletonLoaderProps> = ({ type = 'home' }) => {
  switch (type) {
    case 'catalog':
    case 'detail':
      return <CatalogSkeleton />;
    case 'profile':
      return <ProfileSkeleton />;
    case 'cart':
      return <OrderHistorySkeleton />;
    case 'home':
    default:
      return <HomeSkeleton />;
  }
};

