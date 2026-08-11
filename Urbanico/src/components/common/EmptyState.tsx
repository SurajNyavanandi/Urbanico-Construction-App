import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import {
  SearchX,
  ShoppingBag,
  HeartOff,
  PackageX,
  WifiOff,
  AlertCircle,
  RotateCcw,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { LoadingButton } from './LoadingButton';

export type EmptyStateType =
  | 'no-search'
  | 'empty-cart'
  | 'empty-favorites'
  | 'no-orders'
  | 'no-internet'
  | 'error';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  isActionLoading?: boolean;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-search',
  title,
  description,
  actionLabel,
  onAction,
  isActionLoading = false,
  style,
}) => {
  const { theme, typography } = useTheme();

  let defaultTitle = 'No Items Found';
  let defaultDesc = 'We could not find anything matching your request.';
  let IconComponent = SearchX;
  let defaultActionLabel = 'Retry';

  switch (type) {
    case 'no-search':
      defaultTitle = 'No Search Results';
      defaultDesc = 'Try searching with different keywords or check spelling.';
      IconComponent = SearchX;
      defaultActionLabel = 'Clear Search';
      break;
    case 'empty-cart':
      defaultTitle = 'Your Basket is Empty';
      defaultDesc = 'Explore construction materials and trade services to add items.';
      IconComponent = ShoppingBag;
      defaultActionLabel = 'Explore Products';
      break;
    case 'empty-favorites':
      defaultTitle = 'No Favorites Saved';
      defaultDesc = 'Tap the heart icon on any material or service to save it here.';
      IconComponent = HeartOff;
      defaultActionLabel = 'Browse Materials';
      break;
    case 'no-orders':
      defaultTitle = 'No Orders Yet';
      defaultDesc = 'Active site delivery tracking and booking history will appear here.';
      IconComponent = PackageX;
      defaultActionLabel = 'Start Ordering';
      break;
    case 'no-internet':
      defaultTitle = 'No Internet Connection';
      defaultDesc = 'Please check your network settings and try again.';
      IconComponent = WifiOff;
      defaultActionLabel = 'Retry Connection';
      break;
    case 'error':
      defaultTitle = 'Something Went Wrong';
      defaultDesc = 'Failed to load content. Please try again.';
      IconComponent = AlertCircle;
      defaultActionLabel = 'Try Again';
      break;
  }

  const finalTitle = title || defaultTitle;
  const finalDesc = description || defaultDesc;
  const finalActionLabel = actionLabel || defaultActionLabel;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconBox, { backgroundColor: theme.surfaceSecondary }]}>
        <IconComponent size={36} color={theme.primary} />
      </View>

      <Text
        style={[
          styles.title,
          { color: theme.textPrimary, fontFamily: typography.fontFamilyHeading },
        ]}
      >
        {finalTitle}
      </Text>

      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {finalDesc}
      </Text>

      {onAction && (
        <LoadingButton
          title={finalActionLabel}
          onPress={onAction}
          isLoading={isActionLoading}
          variant="primary"
          style={{ marginTop: 18, minWidth: 160 }}
          icon={type === 'error' || type === 'no-internet' ? <RotateCcw size={16} color="#FFFFFF" /> : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
});
