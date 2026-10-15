/**
 * =============================================================================
 * 📐 GLOBAL SPACING & LAYOUT DESIGN SYSTEM (Single Source of Truth)
 * =============================================================================
 * 
 * Changing any padding, margin, border-radius, or layout dimension here
 * will automatically update everywhere across the application!
 */

export interface SpacingTokens {
  none: number;    // 0
  '3xs': number;   // 2px
  '2xs': number;   // 4px
  xs: number;      // 6px
  sm: number;      // 8px
  md: number;      // 12px
  lg: number;      // 16px
  xl: number;      // 20px
  '2xl': number;   // 24px
  '3xl': number;   // 32px
  '4xl': number;   // 40px
  '5xl': number;   // 48px
  '6xl': number;   // 64px
}

export interface RadiusTokens {
  none: number;    // 0
  '2xs': number;   // 2px
  xs: number;      // 4px
  sm: number;      // 6px
  md: number;      // 8px
  lg: number;      // 12px
  xl: number;      // 16px
  '2xl': number;   // 20px
  '3xl': number;   // 24px
  full: number;    // 9999px (pills, circles)
}

export interface LayoutTokens {
  screenPadding: number;      // 16px
  screenGutter: number;       // 12px
  headerHeight: number;       // 56px
  bottomBarHeight: number;    // 64px
  maxAppWidth: number;        // 480px (mobile app constraint on desktop)
  modalMaxHeight: string;     // '88%'
  cardPadding: number;        // 14px
}

export const GLOBAL_SPACING_TOKENS: SpacingTokens = {
  none: 0,
  '3xs': 2,
  '2xs': 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const GLOBAL_RADIUS_TOKENS: RadiusTokens = {
  none: 0,
  '2xs': 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const GLOBAL_LAYOUT_TOKENS: LayoutTokens = {
  screenPadding: 16,
  screenGutter: 12,
  headerHeight: 56,
  bottomBarHeight: 64,
  maxAppWidth: 480,
  modalMaxHeight: '88%',
  cardPadding: 14,
};
