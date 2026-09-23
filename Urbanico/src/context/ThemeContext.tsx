import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { safeStorage } from '../utils/safeStorage';
import {
  ThemeColorTokens,
  ThemePresetKey,
  resolveThemeColors,
  ACTIVE_THEME_PRESET,
} from '../theme/colors';
import {
  TypographyTokens,
  resolveTypographyTokens,
  GLOBAL_TYPOGRAPHY_TOKENS,
} from '../theme/typography';
import {
  SpacingTokens,
  RadiusTokens,
  LayoutTokens,
  GLOBAL_SPACING_TOKENS,
  GLOBAL_RADIUS_TOKENS,
  GLOBAL_LAYOUT_TOKENS,
} from '../theme/spacing';
import { injectGlobalCssTokens } from '../theme/tokens';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'yellow' | 'black' | 'blue' | 'amber' | 'violet' | 'green' | 'red' | 'purple';
export type TypographyFontFamily = 'system' | 'inter' | 'jakarta' | 'mono';

export interface ThemeColors extends ThemeColorTokens {
  accent: AccentColor;
}

export type TypographyConfig = TypographyTokens;


export interface AccentDefinition {
  name: string;
  hex: string;
  light: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    cardShadow: string;
    surfaceSecondary?: string;
    surfaceTertiary?: string;
  };
  dark: {
    primary: string;
    primaryLight: string;
    primaryDark: string;
    cardShadow: string;
  };
}

export const ACCENT_DEFINITIONS: Record<AccentColor, AccentDefinition> = {
  yellow: {
    name: 'Urbanico Yellow & Black',
    hex: '#FCB026',
    light: {
      primary: '#FCB026',
      primaryLight: '#FFF8EB',
      primaryDark: '#B45309',
      cardShadow: 'rgba(252, 176, 38, 0.12)',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#F1F5F9',
    },
    dark: {
      primary: '#FCB026',
      primaryLight: '#2D1F00',
      primaryDark: '#FDBA74',
      cardShadow: 'rgba(252, 176, 38, 0.25)',
    },
  },
  black: {
    name: 'Modern Onyx',
    hex: '#0F172A',
    light: {
      primary: '#0F172A',
      primaryLight: '#F1F5F9',
      primaryDark: '#020617',
      cardShadow: 'rgba(0, 0, 0, 0.05)',
      surfaceSecondary: '#F9FAFB',
      surfaceTertiary: '#F3F4F6',
    },
    dark: {
      primary: '#FFFFFF',
      primaryLight: '#1E293B',
      primaryDark: '#F8FAFC',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
    },
  },
  blue: {
    name: 'Deep Navy',
    hex: '#1E3A8A',
    light: {
      primary: '#1E3A8A',
      primaryLight: '#EFF6FF',
      primaryDark: '#172554',
      cardShadow: 'rgba(30, 58, 138, 0.08)',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#EDF2F7',
    },
    dark: {
      primary: '#60A5FA',
      primaryLight: '#1E293B',
      primaryDark: '#93C5FD',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
    },
  },
  amber: {
    name: 'Amber Construction',
    hex: '#D97706',
    light: {
      primary: '#111111',
      primaryLight: '#FEF3C7',
      primaryDark: '#B45309',
      cardShadow: 'rgba(217, 119, 6, 0.12)',
      surfaceSecondary: '#F4F4F5',
      surfaceTertiary: '#E5E7EB',
    },
    dark: {
      primary: '#F59E0B',
      primaryLight: '#3B240B',
      primaryDark: '#FCD34D',
      cardShadow: 'rgba(217, 119, 6, 0.25)',
    },
  },
  violet: {
    name: 'Onyx Monochrome',
    hex: '#111111',
    light: {
      primary: '#111111',
      primaryLight: '#F4F4F5',
      primaryDark: '#000000',
      cardShadow: 'rgba(0, 0, 0, 0.04)',
      surfaceSecondary: '#F4F4F5',
      surfaceTertiary: '#E5E7EB',
    },
    dark: {
      primary: '#FFFFFF',
      primaryLight: '#27272A',
      primaryDark: '#F4F4F5',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
    },
  },
  green: {
    name: 'Emerald Verified',
    hex: '#059669',
    light: {
      primary: '#059669',
      primaryLight: '#ECFDF5',
      primaryDark: '#047857',
      cardShadow: 'rgba(5, 150, 105, 0.12)',
      surfaceSecondary: '#F4F4F5',
      surfaceTertiary: '#E5E7EB',
    },
    dark: {
      primary: '#10B981',
      primaryLight: '#064E3B',
      primaryDark: '#34D399',
      cardShadow: 'rgba(5, 150, 105, 0.25)',
    },
  },
  red: {
    name: 'Crimson Red',
    hex: '#DC2626',
    light: {
      primary: '#DC2626',
      primaryLight: '#FEF2F2',
      primaryDark: '#991B1B',
      cardShadow: 'rgba(220, 38, 38, 0.12)',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#F1F5F9',
    },
    dark: {
      primary: '#EF4444',
      primaryLight: '#450A0A',
      primaryDark: '#FCA5A5',
      cardShadow: 'rgba(220, 38, 38, 0.25)',
    },
  },
  purple: {
    name: 'Royal Purple',
    hex: '#7C3AED',
    light: {
      primary: '#7C3AED',
      primaryLight: '#F5F3FF',
      primaryDark: '#5B21B6',
      cardShadow: 'rgba(124, 58, 237, 0.12)',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#F1F5F9',
    },
    dark: {
      primary: '#A78BFA',
      primaryLight: '#2E1065',
      primaryDark: '#DDD6FE',
      cardShadow: 'rgba(124, 58, 237, 0.25)',
    },
  },
};

export const FONT_CONFIGS: Record<TypographyFontFamily, { name: string; family: string; headingFamily: string }> = {
  jakarta: {
    name: 'Plus Jakarta Sans',
    family: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  system: {
    name: 'Plus Jakarta Sans',
    family: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  inter: {
    name: 'Plus Jakarta Sans',
    family: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  mono: {
    name: 'SF Mono',
    family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    headingFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
};

export function getThemeColors(
  mode: ThemeMode,
  accent: AccentColor = 'yellow',
  isAppleDesign: boolean = false
): ThemeColors {
  let presetKey: ThemePresetKey = 'urbanico_yellow';
  if (accent === 'yellow') presetKey = 'urbanico_yellow';
  else if (accent === 'amber') presetKey = 'construction_amber';
  else if (accent === 'green') presetKey = 'emerald_pro';
  else if (accent === 'blue') presetKey = 'deep_navy';
  else if (accent === 'black') presetKey = 'modern_onyx';

  const tokens = resolveThemeColors(mode, presetKey, isAppleDesign);
  return {
    ...tokens,
    accent,
  };
}

export function getTypographyConfig(
  fontFamilyKey: TypographyFontFamily = 'jakarta',
  isAppleDesign: boolean = false
): TypographyConfig {
  const baseTokens = resolveTypographyTokens(isAppleDesign);
  const fontConf = FONT_CONFIGS[fontFamilyKey];
  if (fontConf && !isAppleDesign) {
    return {
      ...baseTokens,
      fontFamily: fontConf.family,
      fontFamilyHeading: fontConf.headingFamily,
    };
  }
  return baseTokens;
}

export type ThemeKey = string;

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isAppleDesign: boolean;
  setAppleDesign: (enabled: boolean) => void;
  toggleAppleDesign: () => void;
  accentColor: AccentColor;
  setAccentColor: (accent: AccentColor) => void;
  typography: TypographyConfig;
  typographyFont: TypographyFontFamily;
  setTypographyFont: (font: TypographyFontFamily) => void;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  layout: LayoutTokens;
  // Backwards compatibility props
  themeKey: ThemeKey;
  setThemeKey: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: getThemeColors('light', 'yellow', false),
  themeMode: 'light',
  setThemeMode: () => {},
  isAppleDesign: false,
  setAppleDesign: () => {},
  toggleAppleDesign: () => {},
  accentColor: 'yellow',
  setAccentColor: () => {},
  typography: getTypographyConfig('jakarta', false),
  typographyFont: 'jakarta',
  setTypographyFont: () => {},
  spacing: GLOBAL_SPACING_TOKENS,
  radius: GLOBAL_RADIUS_TOKENS,
  layout: GLOBAL_LAYOUT_TOKENS,
  themeKey: 'yellow',
  setThemeKey: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('yellow');
  const [typographyFont, setTypographyFont] = useState<TypographyFontFamily>('jakarta');
  const [isAppleDesign, setIsAppleDesignState] = useState<boolean>(() => {
    return safeStorage.getItem('apple_design_mode') === 'true';
  });

  const setAppleDesign = (val: boolean) => {
    setIsAppleDesignState(val);
    safeStorage.setItem('apple_design_mode', val ? 'true' : 'false');
  };

  const toggleAppleDesign = () => {
    setAppleDesign(!isAppleDesign);
  };

  // Sync class on document / body for CSS typography and surface styling
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isAppleDesign) {
        document.documentElement.classList.add('apple-design-active');
        document.body.classList.add('apple-design-active');
      } else {
        document.documentElement.classList.remove('apple-design-active');
        document.body.classList.remove('apple-design-active');
      }
    }
  }, [isAppleDesign]);

  const theme = getThemeColors(themeMode, accentColor, isAppleDesign);
  const typography = getTypographyConfig(typographyFont, isAppleDesign);
  const spacing = GLOBAL_SPACING_TOKENS;
  const radius = GLOBAL_RADIUS_TOKENS;
  const layout = GLOBAL_LAYOUT_TOKENS;

  // Apply complete theme design tokens (colors, fonts, sizes, weights, spacing, radii) to CSS variables (:root)
  useEffect(() => {
    injectGlobalCssTokens({
      colors: theme,
      typography,
      spacing,
      radius,
      layout,
      isDark: themeMode === 'dark',
    });
  }, [theme, typography, spacing, radius, layout, themeMode]);

  // Backwards compatibility handler for legacy setThemeKey callers
  const setThemeKey = (key: string) => {
    if (key === 'dark') {
      setThemeMode('dark');
    } else if (key === 'light') {
      setThemeMode('light');
    } else if (key in ACCENT_DEFINITIONS) {
      setAccentColor(key as AccentColor);
    }
  };

  const themeKey = themeMode === 'dark' ? 'dark' : accentColor;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
        isAppleDesign,
        setAppleDesign,
        toggleAppleDesign,
        accentColor,
        setAccentColor,
        typography,
        typographyFont,
        setTypographyFont,
        spacing,
        radius,
        layout,
        themeKey,
        setThemeKey,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useThemeColors = () => useContext(ThemeContext).theme;
export const useTypography = () => useContext(ThemeContext).typography;
export const useSpacing = () => useContext(ThemeContext).spacing;
export const useRadius = () => useContext(ThemeContext).radius;
export const useLayout = () => useContext(ThemeContext).layout;
