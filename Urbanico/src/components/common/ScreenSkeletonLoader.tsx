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
          steps: [
            'Fetching verified wholesale construction rates...',
            'Checking real-time factory inventory & rates...',
            'Verifying BIS & IS-456 standard certifications...',
            'Preparing best direct-from-mill pricing...',
          ],
        };
      case 'detail':
      case 'product-detail':
        return {
          message: 'Loading Product Details...',
          steps: [
            'Fetching verified specifications & bulk tiers...',
            'Verifying supplier quality test certificates...',
            'Calculating immediate site delivery timelines...',
          ],
        };
      case 'services':
      case 'trade':
        return {
          message: 'Loading Trade Contractors...',
          steps: [
            'Connecting with verified site professionals...',
            'Checking contractor availability in your zone...',
            'Compiling standard visit & quotation tariffs...',
          ],
        };
      case 'cart':
      case 'basket':
        return {
          message: 'Loading Your Basket...',
          steps: [
            'Verifying item stock at regional supply depot...',
            'Calculating freight rates & active wholesale coupons...',
            'Synchronizing GSTIN tax breakdown...',
          ],
        };
      case 'profile':
        return {
          message: 'Loading Contractor Profile...',
          steps: [
            'Retrieving saved delivery locations & sites...',
            'Syncing company GST credentials...',
            'Loading recent order dispatches...',
          ],
        };
      case 'orders':
      case 'tracking':
      case 'live-tracking':
        return {
          message: 'Connecting to Live Tracking...',
          steps: [
            'Syncing GPS telemetry & vehicle location...',
            'Connecting directly with transport dispatcher...',
            'Estimating real-time arrival at delivery gate...',
          ],
        };
      case 'invoice':
        return {
          message: 'Generating Tax Invoice...',
          steps: [
            'Compiling GST compliance breakdown...',
            'Signing invoice with digital verification...',
            'Rendering printable PDF document...',
          ],
        };
      case 'home':
      default:
        return {
          message: 'Loading Urbanico...',
          steps: [
            'Fetching verified wholesale construction rates...',
            'Checking real-time stock at nearest regional hub...',
            'Verifying BIS & IS-456 standard certifications...',
            'Preparing best direct-from-mill pricing...',
          ],
        };
    }
  };

  const { message, steps } = getLoaderDetails();

  return (
    <View style={styles.centerContainer}>
      <UrbanicoLoadingSpinner
        size="large"
        message={message}
        dynamicSteps={steps}
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
