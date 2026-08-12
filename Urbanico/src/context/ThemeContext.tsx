import React, { createContext, useContext, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'amber' | 'violet' | 'green' | 'blue' | 'black';
export type TypographyFontFamily = 'system' | 'inter' | 'jakarta' | 'mono';

export interface ThemeColors {
  mode: ThemeMode;
  accent: AccentColor;
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
    name: 'Nike Black & White',
    hex: '#000000',
    light: {
      primary: '#000000',
      primaryLight: '#F4F4F5',
      primaryDark: '#18181B',
      cardShadow: 'rgba(0, 0, 0, 0.06)',
      surfaceSecondary: '#F4F4F5',
      surfaceTertiary: '#E4E4E7',
    },
    dark: {
      primary: '#FFFFFF',
      primaryLight: '#27272A',
      primaryDark: '#FAFAFA',
      cardShadow: 'rgba(255, 255, 255, 0.1)',
    },
  },
  amber: {
    name: 'Safety Amber',
    hex: '#F59E0B',
    light: {
      primary: '#F59E0B',
      primaryLight: '#FEF3C7',
      primaryDark: '#D97706',
      cardShadow: 'rgba(245, 158, 11, 0.15)',
      surfaceSecondary: '#FFFBEB',
      surfaceTertiary: '#FEF3C7',
    },
    dark: {
      primary: '#F59E0B',
      primaryLight: '#332308',
      primaryDark: '#FBBF24',
      cardShadow: 'rgba(245, 158, 11, 0.25)',
    },
  },
  violet: {
    name: 'Monochrome Slate',
    hex: '#18181B',
    light: {
      primary: '#18181B',
      primaryLight: '#F4F4F5',
      primaryDark: '#09090B',
      cardShadow: 'rgba(0, 0, 0, 0.06)',
      surfaceSecondary: '#F4F4F5',
      surfaceTertiary: '#E4E4E7',
    },
    dark: {
      primary: '#FFFFFF',
      primaryLight: '#27272A',
      primaryDark: '#F4F4F5',
      cardShadow: 'rgba(255, 255, 255, 0.1)',
    },
  },
  green: {
    name: 'Eco Green',
    hex: '#059669',
    light: {
      primary: '#059669',
      primaryLight: '#D1FAE5',
      primaryDark: '#047857',
      cardShadow: 'rgba(5, 150, 105, 0.15)',
      surfaceSecondary: '#F0FDF4',
      surfaceTertiary: '#DCFCE7',
    },
    dark: {
      primary: '#10B981',
      primaryLight: '#064E3B',
      primaryDark: '#34D399',
      cardShadow: 'rgba(16, 185, 129, 0.25)',
    },
  },
  blue: {
    name: 'Blueprint Blue',
    hex: '#2563EB',
    light: {
      primary: '#2563EB',
      primaryLight: '#DBEAFE',
      primaryDark: '#1E40AF',
      cardShadow: 'rgba(37, 99, 235, 0.15)',
      surfaceSecondary: '#EFF6FF',
      surfaceTertiary: '#DBEAFE',
    },
    dark: {
      primary: '#3B82F6',
      primaryLight: '#1E3A8A',
      primaryDark: '#60A5FA',
      cardShadow: 'rgba(59, 130, 246, 0.25)',
    },
  },
};

export const FONT_CONFIGS: Record<TypographyFontFamily, { name: string; family: string; headingFamily: string }> = {
  system: {
    name: 'Nike System Font',
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    headingFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  inter: {
    name: 'Inter Technical',
    family: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  jakarta: {
    name: 'Plus Jakarta Display',
    family: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  mono: {
    name: 'Site Spec Mono',
    family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    headingFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
};

export function getThemeColors(mode: ThemeMode, accent: AccentColor): ThemeColors {
  const accentDef = ACCENT_DEFINITIONS[accent] || ACCENT_DEFINITIONS.black;
  const isLight = mode === 'light';

  if (isLight) {
    return {
      mode: 'light',
      accent,
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSecondary: accentDef.light.surfaceSecondary || '#F4F4F5',
      surfaceTertiary: accentDef.light.surfaceTertiary || '#E4E4E7',
      textPrimary: '#000000',
      textSecondary: '#666666',
      textMuted: '#999999',
      primary: accentDef.light.primary,
      primaryLight: accentDef.light.primaryLight,
      primaryDark: accentDef.light.primaryDark,
      border: '#E4E4E7',
      borderLight: '#F4F4F5',
      cardShadow: accentDef.light.cardShadow,
      headerBg: '#FFFFFF',
      headerText: '#000000',
      statusBarStyle: 'dark',
    };
  } else {
    return {
      mode: 'dark',
      accent,
      background: '#000000',
      surface: '#121212',
      surfaceSecondary: '#1C1C1E',
      surfaceTertiary: '#2C2C2E',
      textPrimary: '#FFFFFF',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      primary: accentDef.dark.primary,
      primaryLight: accentDef.dark.primaryLight,
      primaryDark: accentDef.dark.primaryDark,
      border: '#27272A',
      borderLight: '#18181B',
      cardShadow: accentDef.dark.cardShadow,
      headerBg: '#000000',
      headerText: '#FFFFFF',
      statusBarStyle: 'light',
    };
  }
}

export function getTypographyConfig(fontFamilyKey: TypographyFontFamily): TypographyConfig {
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
      wide: 0.4,
    },
  };
}

export type ThemeKey = string;

interface ThemeContextType {
  theme: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
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
  theme: getThemeColors('light', 'black'),
  themeMode: 'light',
  setThemeMode: () => {},
  accentColor: 'black',
  setAccentColor: () => {},
  typography: getTypographyConfig('system'),
  typographyFont: 'system',
  setTypographyFont: () => {},
  themeKey: 'black',
  setThemeKey: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('black');
  const [typographyFont, setTypographyFont] = useState<TypographyFontFamily>('system');

  const theme = getThemeColors(themeMode, accentColor);
  const typography = getTypographyConfig(typographyFont);

  // Backwards compatibility handler for legacy setThemeKey callers
  const setThemeKey = (key: string) => {
    if (key === 'dark') {
      setThemeMode('dark');
    } else if (key === 'light') {
      setThemeMode('light');
    } else if (key in ACCENT_DEFINITIONS) {
      setAccentColor(key as AccentColor);
    } else if (key === 'urbanico') {
      setAccentColor('violet');
    } else if (key === 'emerald') {
      setAccentColor('green');
    }
  };

  const themeKey = themeMode === 'dark' ? 'dark' : accentColor;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        setThemeMode,
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
