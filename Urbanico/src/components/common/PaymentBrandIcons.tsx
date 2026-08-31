import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Smartphone, CreditCard, ShieldCheck, Zap } from 'lucide-react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Official Google Pay Styled Badge (Cross-platform React Native)
 */
export const GooglePayIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.gpayBadge,
      { width: size * 1.2, height: size, borderRadius: size * 0.22 },
    ]}
  >
    <Text style={[styles.gpayG, { fontSize: size * 0.46 }]}>G</Text>
    <Text style={[styles.gpayPay, { fontSize: size * 0.44 }]}>Pay</Text>
  </View>
);

/**
 * Official PhonePe Styled Badge
 */
export const PhonePeIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.phonepeBadge,
      { width: size * 1.2, height: size, borderRadius: size * 0.22 },
    ]}
  >
    <Text style={[styles.phonepeText, { fontSize: size * 0.44 }]}>पे</Text>
  </View>
);

/**
 * Official BHIM UPI Vector Badge
 */
export const UpiIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.upiBadge,
      { width: size * 1.2, height: size, borderRadius: size * 0.22 },
    ]}
  >
    <Text style={[styles.upiText, { fontSize: size * 0.4 }]}>UPI</Text>
  </View>
);

/**
 * Official Full UPI Logo Badge
 */
export const UpiBadgeIcon: React.FC<{ width?: number; height?: number }> = ({ width = 48, height = 20 }) => (
  <View style={[styles.iconBase, styles.upiBadgeFull, { width, height, borderRadius: 4 }]}>
    <View style={styles.upiBadgeTriangles}>
      <View style={[styles.upiPillLeft, { backgroundColor: '#008450' }]} />
      <View style={[styles.upiPillRight, { backgroundColor: '#F47920' }]} />
    </View>
    <Text style={styles.upiBadgeFullText}>UPI</Text>
  </View>
);

/**
 * Official Paytm Icon
 */
export const PaytmIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.paytmBadge,
      { width: size * 1.3, height: size, borderRadius: size * 0.22 },
    ]}
  >
    <Text style={[styles.paytmText, { fontSize: size * 0.4 }]}>Paytm</Text>
  </View>
);

/**
 * Official Amazon Pay Icon
 */
export const AmazonPayIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.amazonBadge,
      { width: size * 1.4, height: size, borderRadius: size * 0.22 },
    ]}
  >
    <Text style={[styles.amazonText, { fontSize: size * 0.36 }]}>amazon</Text>
    <Text style={[styles.amazonPayText, { fontSize: size * 0.36 }]}>pay</Text>
  </View>
);

/**
 * Official Visa Vector
 */
export const VisaIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.visaBadge,
      { width: size * 1.5, height: size, borderRadius: 4 },
    ]}
  >
    <Text style={[styles.visaText, { fontSize: size * 0.45 }]}>VISA</Text>
  </View>
);

/**
 * Official Mastercard Vector
 */
export const MastercardIcon: React.FC<IconProps> = ({ size = 24 }) => {
  const circleSize = size * 0.52;
  return (
    <View
      style={[
        styles.iconBase,
        styles.mastercardBadge,
        { width: size * 1.5, height: size, borderRadius: 4 },
      ]}
    >
      <View
        style={[
          styles.mcCircleLeft,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
        ]}
      />
      <View
        style={[
          styles.mcCircleRight,
          { width: circleSize, height: circleSize, borderRadius: circleSize / 2 },
        ]}
      />
    </View>
  );
};

/**
 * Official RuPay Vector
 */
export const RupayIcon: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.rupayBadge,
      { width: size * 1.5, height: size, borderRadius: 4 },
    ]}
  >
    <Text style={[styles.rupayGreen, { fontSize: size * 0.4 }]}>Ru</Text>
    <Text style={[styles.rupayBlue, { fontSize: size * 0.4 }]}>Pay</Text>
    <View style={styles.rupayOrangeArrow} />
  </View>
);

/**
 * Apple Pay Badge (Apple Minimalist Monochrome)
 */
export const ApplePayBadge: React.FC<IconProps> = ({ size = 24 }) => (
  <View
    style={[
      styles.iconBase,
      styles.applePayBadge,
      { width: size * 1.6, height: size, borderRadius: 4 },
    ]}
  >
    <Text style={[styles.applePayText, { fontSize: size * 0.44 }]}> Pay</Text>
  </View>
);

const styles = StyleSheet.create({
  iconBase: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  gpayBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E5E5E7',
    paddingHorizontal: 4,
  },
  gpayG: {
    fontWeight: '900',
    color: '#4285F4',
    marginRight: 1,
  },
  gpayPay: {
    fontWeight: '700',
    color: '#5F6368',
  },
  phonepeBadge: {
    backgroundColor: '#5F259F',
    paddingHorizontal: 4,
  },
  phonepeText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  upiBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E5E5E7',
    paddingHorizontal: 4,
  },
  upiText: {
    fontWeight: '900',
    color: '#0071E3',
    letterSpacing: 0.5,
  },
  upiBadgeFull: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E5E5E7',
    paddingHorizontal: 6,
    gap: 4,
  },
  upiBadgeTriangles: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  upiPillLeft: {
    width: 6,
    height: 10,
    borderRadius: 2,
  },
  upiPillRight: {
    width: 6,
    height: 10,
    borderRadius: 2,
  },
  upiBadgeFullText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#1D1D1F',
    letterSpacing: 0.5,
  },
  paytmBadge: {
    backgroundColor: '#002970',
    paddingHorizontal: 4,
  },
  paytmText: {
    color: '#00BAF2',
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  amazonBadge: {
    backgroundColor: '#131921',
    paddingHorizontal: 4,
    gap: 2,
  },
  amazonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  amazonPayText: {
    color: '#FF9900',
    fontWeight: '800',
  },
  visaBadge: {
    backgroundColor: '#1A1F71',
    paddingHorizontal: 4,
  },
  visaText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 0.8,
  },
  mastercardBadge: {
    backgroundColor: '#111111',
    paddingHorizontal: 4,
    position: 'relative',
  },
  mcCircleLeft: {
    backgroundColor: '#EB001B',
    marginRight: -4,
  },
  mcCircleRight: {
    backgroundColor: '#F79E1B',
    opacity: 0.9,
  },
  rupayBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.8,
    borderColor: '#E5E5E7',
    paddingHorizontal: 4,
  },
  rupayGreen: {
    color: '#097939',
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rupayBlue: {
    color: '#0071E3',
    fontWeight: '900',
    fontStyle: 'italic',
  },
  rupayOrangeArrow: {
    width: 4,
    height: 4,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: '#F47920',
    transform: [{ rotate: '45deg' }],
    marginLeft: 2,
  },
  applePayBadge: {
    backgroundColor: '#000000',
    paddingHorizontal: 6,
  },
  applePayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

