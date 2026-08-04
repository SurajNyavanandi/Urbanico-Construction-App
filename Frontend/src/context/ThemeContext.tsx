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
    name: 'Urbanico Violet',
    hex: '#7C3AED',
    light: {
      primary: '#7C3AED',
      primaryLight: '#EDE9FE',
      primaryDark: '#5B21B6',
      cardShadow: 'rgba(124, 58, 237, 0.15)',
      surfaceSecondary: '#F5F3FF',
      surfaceTertiary: '#EDE9FE',
    },
    dark: {
      primary: '#8B5CF6',
      primaryLight: '#2E1065',
      primaryDark: '#A78BFA',
      cardShadow: 'rgba(139, 92, 246, 0.25)',
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
  black: {
    name: 'Contractor Black',
    hex: '#0F172A',
    light: {
      primary: '#0F172A',
      primaryLight: '#F1F5F9',
      primaryDark: '#020617',
      cardShadow: 'rgba(15, 23, 42, 0.15)',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#E2E8F0',
    },
    dark: {
      primary: '#F8FAFC',
      primaryLight: '#334155',
      primaryDark: '#CBD5E1',
      cardShadow: 'rgba(255, 255, 255, 0.15)',
    },
  },
};

export const FONT_CONFIGS: Record<TypographyFontFamily, { name: string; family: string; headingFamily: string }> = {
  system: {
    name: 'System Default',
    family: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    headingFamily: 'System, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  inter: {
    name: 'Inter Technical',
    family: '"Inter", sans-serif',
    headingFamily: '"Inter", sans-serif',
  },
  jakarta: {
    name: 'Plus Jakarta Display',
    family: '"Plus Jakarta Sans", sans-serif',
    headingFamily: '"Plus Jakarta Sans", sans-serif',
  },
  mono: {
    name: 'Site Spec Mono',
    family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    headingFamily: '"Plus Jakarta Sans", sans-serif',
  },
};

export function getThemeColors(mode: ThemeMode, accent: AccentColor): ThemeColors {
  const accentDef = ACCENT_DEFINITIONS[accent] || ACCENT_DEFINITIONS.amber;
  const isLight = mode === 'light';

  if (isLight) {
    return {
      mode: 'light',
      accent,
      background: '#FFFFFF',
      surface: '#FFFFFF',
      surfaceSecondary: accentDef.light.surfaceSecondary || '#F8FAFC',
      surfaceTertiary: accentDef.light.surfaceTertiary || '#F1F5F9',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      primary: accentDef.light.primary,
      primaryLight: accentDef.light.primaryLight,
      primaryDark: accentDef.light.primaryDark,
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      cardShadow: accentDef.light.cardShadow,
      headerBg: '#FFFFFF',
      headerText: '#0F172A',
      statusBarStyle: 'dark',
    };
  } else {
    return {
      mode: 'dark',
      accent,
      background: '#0F172A',
      surface: '#1E293B',
      surfaceSecondary: '#334155',
      surfaceTertiary: '#0F172A',
      textPrimary: '#F8FAFC',
      textSecondary: '#CBD5E1',
      textMuted: '#64748B',
      primary: accentDef.dark.primary,
      primaryLight: accentDef.dark.primaryLight,
      primaryDark: accentDef.dark.primaryDark,
      border: '#334155',
      borderLight: '#1E293B',
      cardShadow: accentDef.dark.cardShadow,
      headerBg: '#1E293B',
      headerText: '#F8FAFC',
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
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 22,
      '3xl': 26,
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
      tight: -0.5,
      normal: 0,
      wide: 0.5,
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
  theme: getThemeColors('light', 'violet'),
  themeMode: 'light',
  setThemeMode: () => {},
  accentColor: 'violet',
  setAccentColor: () => {},
  typography: getTypographyConfig('system'),
  typographyFont: 'system',
  setTypographyFont: () => {},
  themeKey: 'violet',
  setThemeKey: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [accentColor, setAccentColor] = useState<AccentColor>('violet');
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
