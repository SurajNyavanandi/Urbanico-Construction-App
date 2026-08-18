import React, { createContext, useContext, useState } from 'react';

export type ThemeMode = 'light' | 'dark';
export type AccentColor = 'blue' | 'black' | 'amber' | 'violet' | 'green';
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
  blue: {
    name: 'Apple Blue',
    hex: '#0071E3',
    light: {
      primary: '#0071E3',
      primaryLight: '#EBF4FF',
      primaryDark: '#0058B6',
      cardShadow: 'rgba(0, 113, 227, 0.12)',
      surfaceSecondary: '#F5F5F7',
      surfaceTertiary: '#E5E5EA',
    },
    dark: {
      primary: '#0071E3',
      primaryLight: '#1C2536',
      primaryDark: '#2997FF',
      cardShadow: 'rgba(0, 113, 227, 0.25)',
    },
  },
  black: {
    name: 'Monochrome',
    hex: '#000000',
    light: {
      primary: '#0071E3',
      primaryLight: '#EBF4FF',
      primaryDark: '#0058B6',
      cardShadow: 'rgba(0, 0, 0, 0.04)',
      surfaceSecondary: '#F5F5F7',
      surfaceTertiary: '#E5E5EA',
    },
    dark: {
      primary: '#0071E3',
      primaryLight: '#1C2536',
      primaryDark: '#2997FF',
      cardShadow: 'rgba(255, 255, 255, 0.08)',
    },
  },
  amber: {
    name: 'Apple Blue',
    hex: '#0071E3',
    light: {
      primary: '#0071E3',
      primaryLight: '#EBF4FF',
      primaryDark: '#0058B6',
      cardShadow: 'rgba(0, 113, 227, 0.12)',
      surfaceSecondary: '#F5F5F7',
      surfaceTertiary: '#E5E5EA',
    },
    dark: {
      primary: '#0071E3',
      primaryLight: '#1C2536',
      primaryDark: '#2997FF',
      cardShadow: 'rgba(0, 113, 227, 0.25)',
    },
  },
  violet: {
    name: 'Apple Blue',
    hex: '#0071E3',
    light: {
      primary: '#0071E3',
      primaryLight: '#EBF4FF',
      primaryDark: '#0058B6',
      cardShadow: 'rgba(0, 113, 227, 0.12)',
      surfaceSecondary: '#F5F5F7',
      surfaceTertiary: '#E5E5EA',
    },
    dark: {
      primary: '#0071E3',
      primaryLight: '#1C2536',
      primaryDark: '#2997FF',
      cardShadow: 'rgba(0, 113, 227, 0.25)',
    },
  },
  green: {
    name: 'Apple Blue',
    hex: '#0071E3',
    light: {
      primary: '#0071E3',
      primaryLight: '#EBF4FF',
      primaryDark: '#0058B6',
      cardShadow: 'rgba(0, 113, 227, 0.12)',
      surfaceSecondary: '#F5F5F7',
      surfaceTertiary: '#E5E5EA',
    },
    dark: {
      primary: '#0071E3',
      primaryLight: '#1C2536',
      primaryDark: '#2997FF',
      cardShadow: 'rgba(0, 113, 227, 0.25)',
    },
  },
};

export const FONT_CONFIGS: Record<TypographyFontFamily, { name: string; family: string; headingFamily: string }> = {
  system: {
    name: 'SF Pro System',
    family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
    headingFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif',
  },
  inter: {
    name: 'Inter Minimal',
    family: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    headingFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  jakarta: {
    name: 'Plus Jakarta Display',
    family: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
    headingFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  mono: {
    name: 'SF Mono',
    family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    headingFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  },
};

export function getThemeColors(mode: ThemeMode, accent: AccentColor): ThemeColors {
  const accentDef = ACCENT_DEFINITIONS[accent] || ACCENT_DEFINITIONS.blue;
  const isLight = mode === 'light';

  if (isLight) {
    return {
      mode: 'light',
      accent,
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSecondary: '#F5F5F7',
      surfaceTertiary: '#E5E5EA',
      textPrimary: '#1D1D1F',
      textSecondary: '#86868B',
      textMuted: '#AEAEB2',
      primary: '#0071E3',
      primaryLight: '#EBF4FF',
      primaryDark: '#0058B6',
      border: '#E5E5EA',
      borderLight: '#F5F5F7',
      cardShadow: 'rgba(0, 0, 0, 0.04)',
      headerBg: '#FFFFFF',
      headerText: '#1D1D1F',
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
      textPrimary: '#F5F5F7',
      textSecondary: '#A1A1A6',
      textMuted: '#636366',
      primary: '#0071E3',
      primaryLight: '#1C2536',
      primaryDark: '#2997FF',
      border: '#2C2C2E',
      borderLight: '#1C1C1E',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
      headerBg: '#000000',
      headerText: '#F5F5F7',
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
      wide: 0.2,
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
  theme: getThemeColors('light', 'blue'),
  themeMode: 'light',
  setThemeMode: () => {},
  accentColor: 'blue',
  setAccentColor: () => {},
  typography: getTypographyConfig('system'),
  typographyFont: 'system',
  setTypographyFont: () => {},
  themeKey: 'blue',
  setThemeKey: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('blue');
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
