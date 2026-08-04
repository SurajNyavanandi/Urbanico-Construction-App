import React from 'react';
import { Text as RNText, TextProps as RNTextProps, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export type TextVariant =
  | 'display'
  | 'screenTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'subtitle'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'label'
  | 'button'
  | 'badge';

interface AppTextProps extends RNTextProps {
  variant?: TextVariant;
  color?: string;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold' | 'extraBold' | 'black';
  align?: 'auto' | 'left' | 'right' | 'center' | 'justify';
  style?: TextStyle | TextStyle[];
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color,
  weight,
  align,
  style,
  children,
  ...rest
}) => {
  const { theme, typography } = useTheme();

  const getVariantStyles = (): TextStyle => {
    const family = typography.fontFamily;
    const headingFamily = typography.fontFamilyHeading;

    switch (variant) {
      case 'display':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize['3xl'], // 22px
          fontWeight: typography.fontWeight.black,
          letterSpacing: -0.4,
          lineHeight: 28,
        };
      case 'screenTitle':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize['2xl'], // 19px
          fontWeight: typography.fontWeight.extraBold,
          letterSpacing: -0.3,
          lineHeight: 24,
        };
      case 'sectionTitle':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize.xl, // 17px
          fontWeight: typography.fontWeight.bold,
          letterSpacing: -0.2,
          lineHeight: 22,
        };
      case 'cardTitle':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize.lg, // 15px
          fontWeight: typography.fontWeight.bold,
          lineHeight: 20,
        };
      case 'subtitle':
        return {
          fontFamily: family,
          fontSize: typography.fontSize.base, // 13.5px
          fontWeight: typography.fontWeight.medium,
          lineHeight: 18,
        };
      case 'bodyBold':
        return {
          fontFamily: family,
          fontSize: typography.fontSize.base, // 13.5px
          fontWeight: typography.fontWeight.bold,
          lineHeight: 19,
        };
      case 'caption':
        return {
          fontFamily: family,
          fontSize: typography.fontSize.sm, // 12px
          fontWeight: typography.fontWeight.normal,
          lineHeight: 16,
        };
      case 'label':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize.sm, // 12px
          fontWeight: typography.fontWeight.bold,
          letterSpacing: 0.2,
          lineHeight: 16,
        };
      case 'button':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize.base, // 13.5px
          fontWeight: typography.fontWeight.bold,
          letterSpacing: 0.2,
          lineHeight: 18,
        };
      case 'badge':
        return {
          fontFamily: headingFamily,
          fontSize: typography.fontSize.xs, // 10px
          fontWeight: typography.fontWeight.extraBold,
          letterSpacing: 0.4,
          lineHeight: 14,
        };
      case 'body':
      default:
        return {
          fontFamily: family,
          fontSize: typography.fontSize.base, // 13.5px
          fontWeight: typography.fontWeight.normal,
          lineHeight: 19,
        };
    }
  };

  const textColor = color || (variant === 'caption' || variant === 'subtitle' ? theme.textSecondary : theme.textPrimary);
  const selectedWeight = weight ? typography.fontWeight[weight] : undefined;

  return (
    <RNText
      style={[
        getVariantStyles(),
        { color: textColor },
        selectedWeight ? { fontWeight: selectedWeight } : undefined,
        align ? { textAlign: align } : undefined,
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  );
};
