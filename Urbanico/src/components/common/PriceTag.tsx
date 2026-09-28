import React from 'react';
import { View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../context/ThemeContext';
import { formatINR } from '../../utils/priceHelper';

export interface PriceTagProps {
  price: number;
  originalPrice?: number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGstBadge?: boolean;
  gstText?: string;
  containerStyle?: ViewStyle;
  priceStyle?: TextStyle;
  textColor?: string;
}

export const PriceTag: React.FC<PriceTagProps> = ({
  price,
  originalPrice,
  unit,
  size = 'md',
  showGstBadge = false,
  gstText = 'incl. GST',
  containerStyle,
  priceStyle,
  textColor,
}) => {
  const { theme } = useTheme();

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return 13;
      case 'lg':
        return 18;
      case 'xl':
        return 22;
      case 'md':
      default:
        return 15;
    }
  };

  const getSymbolSize = () => {
    switch (size) {
      case 'sm':
        return 11;
      case 'lg':
        return 15;
      case 'xl':
        return 18;
      case 'md':
      default:
        return 13;
    }
  };

  const hasDiscount = originalPrice && originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const resolvedColor = textColor || theme.textPrimary || '#18181B';

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.priceRow}>
        <AppText
          style={[
            styles.symbol,
            { fontSize: getSymbolSize(), color: resolvedColor },
          ]}
          weight="bold"
        >
          ₹
        </AppText>
        <AppText
          style={[
            styles.mainPrice,
            { fontSize: getFontSize(), color: resolvedColor },
            priceStyle,
          ]}
          weight="bold"
        >
          {formatINR(price).replace('₹', '').trim()}
        </AppText>

        {unit && (
          <AppText
            style={[
              styles.unitText,
              { color: theme.textSecondary || '#71717A', fontSize: getSymbolSize() },
            ]}
            weight="medium"
          >
            {unit.startsWith('/') ? unit : ` / ${unit}`}
          </AppText>
        )}
      </View>

      {hasDiscount && (
        <View style={styles.discountRow}>
          <AppText
            style={[
              styles.strikethrough,
              { color: theme.textMuted || '#A1A1AA', fontSize: getSymbolSize() - 1 },
            ]}
          >
            ₹{formatINR(originalPrice).replace('₹', '').trim()}
          </AppText>
          <View style={[styles.discountBadge, { backgroundColor: theme.primary }]}>
            <AppText style={styles.discountBadgeText} weight="bold">
              {discountPercent}% OFF
            </AppText>
          </View>
        </View>
      )}

      {showGstBadge && (
        <View style={[styles.gstContainer, { backgroundColor: theme.surface }]}>
          <AppText style={[styles.gstText, { color: theme.textSecondary }]} weight="medium">
            {gstText}
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  symbol: {
    marginRight: 1,
  },
  mainPrice: {
    letterSpacing: -0.2,
  },
  unitText: {
    marginLeft: 3,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#18181B',
    fontSize: 9,
    letterSpacing: 0.2,
  },
  gstContainer: {
    marginTop: 2,
  },
  gstText: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
