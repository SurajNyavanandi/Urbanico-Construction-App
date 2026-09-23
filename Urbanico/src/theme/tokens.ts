/**
 * =============================================================================
 * 🌐 UNIFIED GLOBAL DESIGN TOKENS (Urbanico Design System)
 * =============================================================================
 * 
 * Central registry uniting:
 * - Colors (ThemeColorTokens)
 * - Typography (TypographyTokens)
 * - Spacing (SpacingTokens)
 * - Radius (RadiusTokens)
 * - Layout (LayoutTokens)
 * 
 * Changing any value here or in its respective sub-token file automatically
 * updates the entire app and all UI elements.
 */

import {
  ThemeColorTokens,
  ThemeMode,
  ThemePresetKey,
  ACTIVE_THEME_PRESET,
  resolveThemeColors,
  GLOBAL_THEME_COLORS,
} from './colors';
import {
  TypographyTokens,
  resolveTypographyTokens,
  GLOBAL_TYPOGRAPHY_TOKENS,
  GLOBAL_FONT_FAMILIES,
  GLOBAL_FONT_SIZES,
  GLOBAL_FONT_WEIGHTS,
  GLOBAL_LINE_HEIGHTS,
  GLOBAL_LETTER_SPACINGS,
} from './typography';
import {
  SpacingTokens,
  RadiusTokens,
  LayoutTokens,
  GLOBAL_SPACING_TOKENS,
  GLOBAL_RADIUS_TOKENS,
  GLOBAL_LAYOUT_TOKENS,
} from './spacing';

export interface AppDesignTokens {
  colors: ThemeColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  layout: LayoutTokens;
  isDark: boolean;
}

/**
 * Resolves full AppDesignTokens for any mode / preset / apple style configuration.
 */
export function resolveDesignTokens(
  mode: ThemeMode = 'light',
  presetKey: ThemePresetKey = ACTIVE_THEME_PRESET,
  isAppleDesign: boolean = false
): AppDesignTokens {
  return {
    colors: resolveThemeColors(mode, presetKey, isAppleDesign),
    typography: resolveTypographyTokens(isAppleDesign),
    spacing: { ...GLOBAL_SPACING_TOKENS },
    radius: { ...GLOBAL_RADIUS_TOKENS },
    layout: { ...GLOBAL_LAYOUT_TOKENS },
    isDark: mode === 'dark',
  };
}

/**
 * Global static design tokens for use outside of React hooks / components.
 */
export const GLOBAL_DESIGN_TOKENS: AppDesignTokens = {
  colors: GLOBAL_THEME_COLORS,
  typography: GLOBAL_TYPOGRAPHY_TOKENS,
  spacing: GLOBAL_SPACING_TOKENS,
  radius: GLOBAL_RADIUS_TOKENS,
  layout: GLOBAL_LAYOUT_TOKENS,
  isDark: false,
};

/**
 * Injects ALL design tokens (colors, typography, spacing, radius) as CSS Custom Properties
 * onto document.documentElement (:root).
 */
export function injectGlobalCssTokens(tokens: AppDesignTokens): void {
  if (typeof document === 'undefined' || !document.documentElement) return;

  const root = document.documentElement;
  const { colors, typography, spacing, radius, layout } = tokens;

  // Colors
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-light', colors.primaryLight);
  root.style.setProperty('--color-primary-dark', colors.primaryDark);
  root.style.setProperty('--color-primary-text', colors.primaryText);
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-bg', colors.background);
  root.style.setProperty('--color-surface', colors.surface);
  root.style.setProperty('--color-surface-secondary', colors.surfaceSecondary);
  root.style.setProperty('--color-surface-tertiary', colors.surfaceTertiary);
  root.style.setProperty('--color-text-primary', colors.textPrimary);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-text-muted', colors.textMuted);
  root.style.setProperty('--color-text-inverse', colors.textInverse);
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-border-light', colors.borderLight);
  root.style.setProperty('--color-border-focus', colors.borderFocus);
  root.style.setProperty('--color-btn-bg', colors.buttonBg);
  root.style.setProperty('--color-btn-text', colors.buttonText);
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-info', colors.info);

  // Typography - Font Families
  root.style.setProperty('--font-sans', typography.fontFamily);
  root.style.setProperty('--font-heading', typography.fontFamilyHeading);
  root.style.setProperty('--font-mono', typography.fontFamilyMono);

  // Typography - Font Sizes
  Object.entries(typography.fontSize).forEach(([key, val]) => {
    root.style.setProperty(`--font-size-${key}`, `${val}px`);
  });

  // Typography - Font Weights
  Object.entries(typography.fontWeight).forEach(([key, val]) => {
    root.style.setProperty(`--font-weight-${key}`, String(val));
  });

  // Typography - Line Heights
  Object.entries(typography.lineHeight).forEach(([key, val]) => {
    root.style.setProperty(`--line-height-${key}`, String(val));
  });

  // Spacing
  Object.entries(spacing).forEach(([key, val]) => {
    root.style.setProperty(`--spacing-${key}`, `${val}px`);
  });

  // Border Radii
  Object.entries(radius).forEach(([key, val]) => {
    root.style.setProperty(`--radius-${key}`, `${val}px`);
  });

  // Layout
  root.style.setProperty('--layout-header-height', `${layout.headerHeight}px`);
  root.style.setProperty('--layout-bottom-bar-height', `${layout.bottomBarHeight}px`);
  root.style.setProperty('--layout-max-width', `${layout.maxAppWidth}px`);
}
