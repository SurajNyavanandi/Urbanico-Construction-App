import React, { createContext, useContext, useState, useEffect } from 'react';
import { safeStorage } from '../utils/safeStorage';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'blue' | 'black' | 'amber' | 'violet' | 'green';
export type TypographyFontFamily = 'system' | 'inter' | 'jakarta' | 'mono';

export interface ThemeColors {
  mode: ThemeMode;
  accent: AccentColor;
  isAppleDesign: boolean;
  background: string;
  surface: string;
  surfaceSecondary: string;
  surfaceTertiary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  primaryDark: string;
  border: string;
  borderLight: string;
  cardShadow: string;
  headerBg: string;
  headerText: string;
  statusBarStyle: 'light' | 'dark';
}

export interface TypographyConfig {
  fontFamily: string;
  fontFamilyHeading: string;
  fontFamilyMono: string;
  fontSize: {
    xs: number;
    sm: number;
    base: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  fontWeight: {
    normal: '400';
    medium: '500';
    semibold: '600';
    bold: '700';
    extraBold: '800';
    black: '900';
  };
  letterSpacing: {
    tight: number;
    normal: number;
    wide: number;
  };
}

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
  black: {
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
  blue: {
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
  accent: AccentColor,
  isAppleDesign: boolean = false
): ThemeColors {
  const isLight = mode === 'light';

  // 1. Apple-Inspired Design System Palette
  // Pure White (#FFFFFF) & Crisp Subtle Neutral (#F5F5F7)
  // Deep Black (#1D1D1F) & Slate Gray (#86868B)
  // Apple Blue (#007AFF) accent
  if (isAppleDesign) {
    if (isLight) {
      return {
        mode: 'light',
        accent,
        isAppleDesign: true,
        background: '#F5F5F7', // Apple Crisp Subtle Neutral
        surface: '#FFFFFF', // Apple Pure White
        surfaceSecondary: '#F5F5F7',
        surfaceTertiary: '#E5E5EA', // Apple system gray 6
        textPrimary: '#1D1D1F', // Apple Deep Black
        textSecondary: '#86868B', // Apple Slate Gray
        textMuted: '#86868B', // Apple Slate Gray
        primary: '#007AFF', // Apple Blue Accent
        primaryLight: '#EBF5FF',
        primaryDark: '#0055B3',
        border: '#E5E5EA', // 1px hairline border
        borderLight: '#F2F2F7',
        cardShadow: 'rgba(0, 0, 0, 0.04)',
        headerBg: '#FFFFFF',
        headerText: '#1D1D1F',
        statusBarStyle: 'dark',
      };
    } else {
      return {
        mode: 'dark',
        accent,
        isAppleDesign: true,
        background: '#000000', // Apple Pure Black
        surface: '#1C1C1E', // Apple Dark Secondary System Background
        surfaceSecondary: '#2C2C2E', // Apple Dark Tertiary System Background
        surfaceTertiary: '#3A3A3C',
        textPrimary: '#F5F5F7',
        textSecondary: '#86868B', // Apple Slate Gray
        textMuted: '#636366',
        primary: '#007AFF', // Apple Blue Accent
        primaryLight: '#152E4D',
        primaryDark: '#64D2FF',
        border: '#38383A',
        borderLight: '#2C2C2E',
        cardShadow: 'rgba(0, 0, 0, 0.4)',
        headerBg: '#000000',
        headerText: '#F5F5F7',
        statusBarStyle: 'light',
      };
    }
  }

  // 2. Default Existing Palette (Unmodified fallback)
  if (isLight) {
    return {
      mode: 'light',
      accent,
      isAppleDesign: false,
      background: '#FAFAFA',
      surface: '#FFFFFF',
      surfaceSecondary: '#F4F4F5',
      surfaceTertiary: '#E5E7EB',
      textPrimary: '#111111',
      textSecondary: '#707072',
      textMuted: '#9CA3AF',
      primary: '#111111',
      primaryLight: '#F4F4F5',
      primaryDark: '#000000',
      border: '#EEEEEE',
      borderLight: '#F5F5F5',
      cardShadow: 'rgba(0, 0, 0, 0.04)',
      headerBg: '#FFFFFF',
      headerText: '#111111',
      statusBarStyle: 'dark',
    };
  } else {
    return {
      mode: 'dark',
      accent,
      isAppleDesign: false,
      background: '#000000',
      surface: '#121212',
      surfaceSecondary: '#1C1C1E',
      surfaceTertiary: '#2C2C2E',
      textPrimary: '#F5F5F7',
      textSecondary: '#A1A1A6',
      textMuted: '#636366',
      primary: '#FFFFFF',
      primaryLight: '#27272A',
      primaryDark: '#F4F4F5',
      border: '#2C2C2E',
      borderLight: '#1C1C1E',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
      headerBg: '#000000',
      headerText: '#F5F5F7',
      statusBarStyle: 'light',
    };
  }
}

export function getTypographyConfig(
  fontFamilyKey: TypographyFontFamily,
  isAppleDesign: boolean = false
): TypographyConfig {
  if (isAppleDesign) {
    const appleFamily =
      '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "SF Pro", "Helvetica Neue", Inter, sans-serif';
    return {
      fontFamily: appleFamily,
      fontFamilyHeading: appleFamily,
      fontFamilyMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: {
        xs: 11,
        sm: 12,
        base: 13,
        lg: 14,
        xl: 16,
        '2xl': 18,
        '3xl': 20,
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extraBold: '800',
        black: '900',
      },
      letterSpacing: {
        tight: -0.4,
        normal: -0.1,
        wide: 0.1,
      },
    };
  }

  const fontConf = FONT_CONFIGS[fontFamilyKey] || FONT_CONFIGS.system;
  return {
    fontFamily: fontConf.family,
    fontFamilyHeading: fontConf.headingFamily,
    fontFamilyMono: FONT_CONFIGS.mono.family,
    fontSize: {
      xs: 11,
      sm: 12,
      base: 13,
      lg: 14,
      xl: 16,
      '2xl': 18,
      '3xl': 20,
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extraBold: '800',
      black: '900',
    },
    letterSpacing: {
      tight: -0.3,
      normal: 0,
      wide: 0.2,
    },
  };
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
  // Backwards compatibility props
  themeKey: ThemeKey;
  setThemeKey: (key: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: getThemeColors('light', 'black', false),
  themeMode: 'light',
  setThemeMode: () => {},
  isAppleDesign: false,
  setAppleDesign: () => {},
  toggleAppleDesign: () => {},
  accentColor: 'black',
  setAccentColor: () => {},
  typography: getTypographyConfig('jakarta', false),
  typographyFont: 'jakarta',
  setTypographyFont: () => {},
  themeKey: 'black',
  setThemeKey: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('black');
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
        themeKey,
        setThemeKey,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
