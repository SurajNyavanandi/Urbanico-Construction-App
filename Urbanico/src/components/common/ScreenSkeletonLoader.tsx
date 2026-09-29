import React from 'react';
import { View, StyleSheet } from 'react-native';
import { UrbanicoLoadingSpinner } from './UrbanicoLoadingSpinner';

export type ScreenSkeletonType =
  | 'home'
  | 'catalog'
  | 'materials'
  | 'services'
  | 'trade'
  | 'cart'
  | 'basket'
  | 'profile'
  | 'detail'
  | 'product-detail'
  | 'orders'
  | 'tracking'
  | 'live-tracking'
  | 'invoice';

export interface ScreenSkeletonLoaderProps {
  type?: ScreenSkeletonType;
  viewMode?: 'grid' | 'list';
}

export const ScreenSkeletonLoader: React.FC<ScreenSkeletonLoaderProps> = ({
  type = 'home',
}) => {
  const getLoaderDetails = () => {
    switch (type) {
      case 'catalog':
      case 'materials':
        return {
          message: 'Loading Materials Catalog...',
          subMessage: 'Checking real-time factory inventory & rates',
        };
      case 'detail':
      case 'product-detail':
        return {
          message: 'Loading Product Details...',
          subMessage: 'Fetching verified specifications & bulk tiers',
        };
      case 'services':
      case 'trade':
        return {
          message: 'Loading Trade Contractors...',
          subMessage: 'Connecting with verified site professionals',
        };
      case 'cart':
      case 'basket':
        return {
          message: 'Loading Your Basket...',
          subMessage: 'Calculating freight rates & active coupons',
        };
      case 'profile':
        return {
          message: 'Loading Contractor Profile...',
          subMessage: 'Retrieving saved delivery locations',
        };
      case 'orders':
      case 'tracking':
      case 'live-tracking':
        return {
          message: 'Connecting to Live Tracking...',
          subMessage: 'Syncing GPS telemetry & driver dispatch',
        };
      case 'invoice':
        return {
          message: 'Generating Tax Invoice...',
          subMessage: 'Compiling GST compliance breakdown',
        };
      case 'home':
      default:
        return {
          message: 'Loading Urbanico...',
          subMessage: 'Fetching verified wholesale construction rates',
        };
    }
  };

  const { message, subMessage } = getLoaderDetails();

  return (
    <View style={styles.centerContainer}>
      <UrbanicoLoadingSpinner
        size="large"
        message={message}
        subMessage={subMessage}
        showLogo={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    minHeight: 380,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});

export default ScreenSkeletonLoader;
