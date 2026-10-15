/**
 * =============================================================================
 * 🔤 GLOBAL TYPOGRAPHY DESIGN SYSTEM (Single Source of Truth)
 * =============================================================================
 * 
 * Changing any font family, font size, weight, line-height, or letter-spacing
 * here will automatically update everywhere across the application!
 */

export interface TypographyTokens {
  // Font Families
  fontFamily: string;
  fontFamilyHeading: string;
  fontFamilyMono: string;

  // Font Sizes (Scalable px values)
  fontSize: {
    '2xs': number;   // 10px - Micro badges, tiny metadata
    xs: number;      // 11px - Captions, tags, status pills
    sm: number;      // 12px - Secondary text, auxiliary labels
    base: number;    // 13.5px - Standard body text
    md: number;      // 14px - Body prominent, form inputs
    lg: number;      // 15px - Subheaders, card titles
    xl: number;      // 17px - Section titles, item headings
    '2xl': number;   // 19px - Screen titles, prominent headers
    '3xl': number;   // 22px - Hero headlines, modal titles
    '4xl': number;   // 26px - Display numbers, large banners
    '5xl': number;   // 32px - Massive hero highlights
  };

  // Font Weights
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    extraBold: '800';
    black: '900';
  };

  // Line Heights (Unitless multipliers or pixel values)
  lineHeight: {
    none: number;     // 1
    tight: number;    // 1.2
    snug: number;     // 1.3
    normal: number;   // 1.45
    relaxed: number;  // 1.6
    loose: number;    // 1.8
  };

  // Letter Spacings (px values for React Native / CSS)
  letterSpacing: {
    tighter: number;  // -0.4
    tight: number;    // -0.2
    normal: number;   // 0
    wide: number;     // 0.2
    wider: number;    // 0.4
    widest: number;   // 0.8
  };
}

/**
 * 🛠️ ACTIVE FONT FAMILY CONFIGURATION
 * Default UI Font: Plus Jakarta Sans with refined system fallbacks
 */
export const GLOBAL_FONT_FAMILIES = {
  sans: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  heading: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  apple: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Inter, sans-serif',
};

export const GLOBAL_FONT_SIZES = {
  '2xs': 10,
  xs: 11,
  sm: 12,
  base: 13.5,
  md: 14,
  lg: 15,
  xl: 17,
  '2xl': 19,
  '3xl': 22,
  '4xl': 26,
  '5xl': 32,
} as const;

export const GLOBAL_FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};

export const GLOBAL_LINE_HEIGHTS = {
  none: 1,
  tight: 1.2,
  snug: 1.3,
  normal: 1.45,
  relaxed: 1.6,
  loose: 1.8,
} as const;

export const GLOBAL_LETTER_SPACINGS = {
  tighter: -0.4,
  tight: -0.2,
  normal: 0,
  wide: 0.2,
  wider: 0.4,
  widest: 0.8,
} as const;

/**
 * Resolves standard TypographyTokens
 */
export function resolveTypographyTokens(isAppleDesign: boolean = false): TypographyTokens {
  const family = isAppleDesign ? GLOBAL_FONT_FAMILIES.apple : GLOBAL_FONT_FAMILIES.sans;
  const headingFamily = isAppleDesign ? GLOBAL_FONT_FAMILIES.apple : GLOBAL_FONT_FAMILIES.heading;

  return {
    fontFamily: family,
    fontFamilyHeading: headingFamily,
    fontFamilyMono: GLOBAL_FONT_FAMILIES.mono,
    fontSize: { ...GLOBAL_FONT_SIZES },
    fontWeight: { ...GLOBAL_FONT_WEIGHTS },
    lineHeight: { ...GLOBAL_LINE_HEIGHTS },
    letterSpacing: { ...GLOBAL_LETTER_SPACINGS },
  };
}

export const GLOBAL_TYPOGRAPHY_TOKENS = resolveTypographyTokens(false);
