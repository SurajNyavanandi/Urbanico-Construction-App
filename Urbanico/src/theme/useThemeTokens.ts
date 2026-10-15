import { useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { ThemeColorTokens } from './colors';
import { TypographyTokens } from './typography';
import { SpacingTokens, RadiusTokens, LayoutTokens } from './spacing';
import { AppDesignTokens } from './tokens';

/**
 * ⚡ Full Design Tokens Hook
 * Returns colors, typography, spacing, radius, layout, and dark mode flag.
 */
export function useThemeTokens(): AppDesignTokens {
  const { theme, typography, spacing, radius, layout, themeMode } = useTheme();
  return useMemo(
    () => ({
      colors: theme,
      typography,
      spacing,
      radius,
      layout,
      isDark: themeMode === 'dark',
    }),
    [theme, typography, spacing, radius, layout, themeMode]
  );
}

/**
 * ⚡ Reusable Theme Colors Hook
 * Returns reactive ThemeColorTokens
 */
export function useThemeColors(): ThemeColorTokens {
  const { theme } = useTheme();
  return theme;
}

/**
 * ⚡ Reusable Typography Hook
 * Returns font families, scalable font sizes, font weights, line heights, and letter spacings
 */
export function useTypography(): TypographyTokens {
  const { typography } = useTheme();
  return typography;
}

/**
 * ⚡ Reusable Spacing Hook
 * Returns spacing scale (none, 3xs, 2xs, xs, sm, md, lg, xl, 2xl, 3xl, etc.)
 */
export function useSpacing(): SpacingTokens {
  const { spacing } = useTheme();
  return spacing;
}

/**
 * ⚡ Reusable Border Radius Hook
 * Returns radius scale (none, xs, sm, md, lg, xl, 2xl, 3xl, full)
 */
export function useRadius(): RadiusTokens {
  const { radius } = useTheme();
  return radius;
}

/**
 * ⚡ Reusable Layout Dimensions Hook
 * Returns screenPadding, headerHeight, bottomBarHeight, maxAppWidth, etc.
 */
export function useLayout(): LayoutTokens {
  const { layout } = useTheme();
  return layout;
}

/**
 * ⚡ Fast boolean check for dark mode
 */
export function useIsDarkMode(): boolean {
  const { themeMode } = useTheme();
  return themeMode === 'dark';
}

/**
 * ⚡ Status semantic colors
 */
export function useStatusColors() {
  const { theme } = useTheme();
  return useMemo(
    () => ({
      success: theme.success,
      successBg: theme.successBg,
      warning: theme.warning,
      warningBg: theme.warningBg,
      error: theme.error,
      errorBg: theme.errorBg,
      info: theme.info,
      infoBg: theme.infoBg,
    }),
    [
      theme.success,
      theme.successBg,
      theme.warning,
      theme.warningBg,
      theme.error,
      theme.errorBg,
      theme.info,
      theme.infoBg,
    ]
  );
}
