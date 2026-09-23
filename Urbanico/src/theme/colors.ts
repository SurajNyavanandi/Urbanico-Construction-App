/**
 * =============================================================================
 * 🎨 GLOBAL APP THEME & COLOR SYSTEM (Single Source of Truth)
 * =============================================================================
 * 
 * Need to change the app's colors?
 * Simply edit ACTIVE_THEME_PRESET or tweak the values in THEME_PRESETS below!
 * Everything (screens, buttons, cards, modals, razorpay header) will update
 * instantly and automatically.
 */

export type ThemeMode = 'light' | 'dark';
export type ThemePresetKey = 'urbanico_yellow' | 'modern_onyx' | 'deep_navy' | 'construction_amber' | 'emerald_pro' | 'custom';

export interface ThemeColorTokens {
  // Brand & Identity
  primary: string;              // Main brand CTA / highlight color
  primaryLight: string;         // Light tint of primary
  primaryDark: string;          // Deep shade of primary
  primaryText: string;          // High contrast text on top of primary button (usually #FFFFFF)
  accent: string;               // Accent highlight color

  // Surfaces & Canvas
  background: string;           // Global screen canvas background
  surface: string;              // Card, sheet, popover background
  surfaceSecondary: string;     // Nested cards, input containers, subtle pills
  surfaceTertiary: string;      // Lightest gray / dark dividers
  headerBg: string;             // Top header navigation bar background
  headerText: string;           // Top header title color
  overlay: string;              // Modal & backdrop blur overlay color

  // Typography
  textPrimary: string;          // Headings, prices, bold titles
  textSecondary: string;        // Subtitles, descriptions, metadata
  textMuted: string;            // Placeholder text, disabled labels
  textInverse: string;          // Text on inverted background

  // Hairline Borders & Dividers
  border: string;               // Standard border (1px hairline)
  borderLight: string;          // Subtle divider between list rows
  borderFocus: string;          // Focused input border

  // Status & Feedback Semantics
  success: string;              // Success green
  successBg: string;            // Success subtle tint
  warning: string;              // Warning amber / caution
  warningBg: string;            // Warning subtle tint
  error: string;                // Error red / declined
  errorBg: string;              // Error subtle tint
  info: string;                 // Info blue / notice
  infoBg: string;               // Info subtle tint

  // Buttons & CTAs
  buttonBg: string;             // Primary action button background
  buttonText: string;           // Primary action button text
  buttonSecondaryBg: string;    // Secondary action button background
  buttonSecondaryText: string;  // Secondary action button text

  // Elevation & Shadows
  cardShadow: string;           // Shadow for cards
  elevationShadow: string;      // Shadow for floating modals & popovers

  // System & Context flags
  statusBarStyle: 'light' | 'dark';
  mode: ThemeMode;
  isAppleDesign: boolean;
}

/**
 * 🛠️ ACTIVE THEME SELECTION:
 * Change this string to quickly switch the active theme preset:
 * Options: 'urbanico_yellow' | 'modern_onyx' | 'deep_navy' | 'construction_amber' | 'emerald_pro' | 'custom'
 */
export const ACTIVE_THEME_PRESET: ThemePresetKey = 'urbanico_yellow';

/**
 * 🎨 PRESET PALETTES:
 * Define light & dark tokens for each preset.
 */
export const THEME_PRESETS: Record<
  ThemePresetKey,
  {
    name: string;
    description: string;
    light: Omit<ThemeColorTokens, 'mode' | 'statusBarStyle' | 'isAppleDesign'>;
    dark: Omit<ThemeColorTokens, 'mode' | 'statusBarStyle' | 'isAppleDesign'>;
  }
> = {
  // 1. URBANICO YELLOW & BLACK (Official Brand Scheme: Hex #FCB026, RGB 252, 176, 38 & Bold Contrast Black)
  urbanico_yellow: {
    name: 'Urbanico Yellow & Black',
    description: 'Official Urbanico brand palette with #FCB026 safety yellow and high-contrast black',
    light: {
      primary: '#FCB026',
      primaryLight: '#FFF8EB',
      primaryDark: '#B45309',
      primaryText: '#18181B',
      accent: '#FCB026',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#F1F5F9',
      headerBg: '#FFFFFF',
      headerText: '#18181B',
      overlay: 'rgba(24, 24, 27, 0.45)',
      textPrimary: '#18181B',
      textSecondary: '#64748B',
      textMuted: '#94A3B8',
      textInverse: '#FFFFFF',
      border: '#E4E4E7',
      borderLight: '#F4F4F5',
      borderFocus: '#FCB026',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#FCB026',
      warningBg: '#FFF8EB',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      buttonBg: '#FCB026',
      buttonText: '#18181B',
      buttonSecondaryBg: '#FFF8EB',
      buttonSecondaryText: '#92400E',
      cardShadow: 'rgba(252, 176, 38, 0.08)',
      elevationShadow: 'rgba(24, 24, 27, 0.12)',
    },
    dark: {
      primary: '#FCB026',
      primaryLight: '#2D1F00',
      primaryDark: '#FDBA74',
      primaryText: '#18181B',
      accent: '#FCB026',
      background: '#121214',
      surface: '#18181B',
      surfaceSecondary: '#27272A',
      surfaceTertiary: '#3F3F46',
      headerBg: '#151518',
      headerText: '#FAFAFA',
      overlay: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#FAFAFA',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      textInverse: '#18181B',
      border: '#27272A',
      borderLight: '#1F1F22',
      borderFocus: '#FCB026',
      success: '#10B981',
      successBg: '#064E3B',
      warning: '#FCB026',
      warningBg: '#2D1F00',
      error: '#EF4444',
      errorBg: '#450A0A',
      info: '#3B82F6',
      infoBg: '#172554',
      buttonBg: '#FCB026',
      buttonText: '#18181B',
      buttonSecondaryBg: '#27272A',
      buttonSecondaryText: '#FAFAFA',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
      elevationShadow: 'rgba(0, 0, 0, 0.65)',
    },
  },
  // 1. MODERN ONYX (Architectural luxury monochrome - Crisp slate & clean black)
  modern_onyx: {
    name: 'Modern Onyx',
    description: 'Minimalist architectural monochrome with deep onyx and clean neutral surfaces',
    light: {
      primary: '#0F172A',
      primaryLight: '#F1F5F9',
      primaryDark: '#020617',
      primaryText: '#FFFFFF',
      accent: '#0F172A',
      background: '#F4F5F7',
      surface: '#FFFFFF',
      surfaceSecondary: '#F9FAFB',
      surfaceTertiary: '#F3F4F6',
      headerBg: '#FFFFFF',
      headerText: '#0F172A',
      overlay: 'rgba(15, 23, 42, 0.45)',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      textMuted: '#94A3B8',
      textInverse: '#FFFFFF',
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      borderFocus: '#0F172A',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      buttonBg: '#0F172A',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#F1F5F9',
      buttonSecondaryText: '#0F172A',
      cardShadow: 'rgba(0, 0, 0, 0.05)',
      elevationShadow: 'rgba(15, 23, 42, 0.12)',
    },
    dark: {
      primary: '#FFFFFF',
      primaryLight: '#1E293B',
      primaryDark: '#F8FAFC',
      primaryText: '#0F172A',
      accent: '#38BDF8',
      background: '#090D16',
      surface: '#111827',
      surfaceSecondary: '#1F2937',
      surfaceTertiary: '#374151',
      headerBg: '#0B0F19',
      headerText: '#F8FAFC',
      overlay: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      textInverse: '#0F172A',
      border: '#1F2937',
      borderLight: '#162032',
      borderFocus: '#38BDF8',
      success: '#10B981',
      successBg: '#064E3B',
      warning: '#F59E0B',
      warningBg: '#451A03',
      error: '#EF4444',
      errorBg: '#450A0A',
      info: '#3B82F6',
      infoBg: '#172554',
      buttonBg: '#FFFFFF',
      buttonText: '#0F172A',
      buttonSecondaryBg: '#1F2937',
      buttonSecondaryText: '#F8FAFC',
      cardShadow: 'rgba(0, 0, 0, 0.35)',
      elevationShadow: 'rgba(0, 0, 0, 0.6)',
    },
  },

  // 2. DEEP NAVY (Engineering enterprise blue)
  deep_navy: {
    name: 'Deep Navy',
    description: 'Enterprise civil engineering blue with crisp contrast and structured elegance',
    light: {
      primary: '#1E3A8A',
      primaryLight: '#EFF6FF',
      primaryDark: '#172554',
      primaryText: '#FFFFFF',
      accent: '#2563EB',
      background: '#F5F7FB',
      surface: '#FFFFFF',
      surfaceSecondary: '#F8FAFC',
      surfaceTertiary: '#EDF2F7',
      headerBg: '#FFFFFF',
      headerText: '#1E3A8A',
      overlay: 'rgba(30, 58, 138, 0.4)',
      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',
      textInverse: '#FFFFFF',
      border: '#E2E8F0',
      borderLight: '#EDF2F7',
      borderFocus: '#1E3A8A',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#1E3A8A',
      infoBg: '#EFF6FF',
      buttonBg: '#1E3A8A',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#EFF6FF',
      buttonSecondaryText: '#1E3A8A',
      cardShadow: 'rgba(30, 58, 138, 0.06)',
      elevationShadow: 'rgba(30, 58, 138, 0.16)',
    },
    dark: {
      primary: '#60A5FA',
      primaryLight: '#1E293B',
      primaryDark: '#93C5FD',
      primaryText: '#0F172A',
      accent: '#60A5FA',
      background: '#0B1120',
      surface: '#111C33',
      surfaceSecondary: '#1B2A4A',
      surfaceTertiary: '#273E6B',
      headerBg: '#0C1427',
      headerText: '#F8FAFC',
      overlay: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      textInverse: '#0B1120',
      border: '#1E2F52',
      borderLight: '#162340',
      borderFocus: '#60A5FA',
      success: '#10B981',
      successBg: '#064E3B',
      warning: '#F59E0B',
      warningBg: '#451A03',
      error: '#EF4444',
      errorBg: '#450A0A',
      info: '#60A5FA',
      infoBg: '#172554',
      buttonBg: '#60A5FA',
      buttonText: '#0B1120',
      buttonSecondaryBg: '#1B2A4A',
      buttonSecondaryText: '#F8FAFC',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
      elevationShadow: 'rgba(0, 0, 0, 0.65)',
    },
  },

  // 3. CONSTRUCTION AMBER (Industrial construction site safety gold)
  construction_amber: {
    name: 'Construction Amber',
    description: 'High-visibility industrial builder aesthetic with safety amber and charcoal',
    light: {
      primary: '#D97706',
      primaryLight: '#FEF3C7',
      primaryDark: '#B45309',
      primaryText: '#FFFFFF',
      accent: '#F59E0B',
      background: '#F8F9FA',
      surface: '#FFFFFF',
      surfaceSecondary: '#FFFBEB',
      surfaceTertiary: '#F3F4F6',
      headerBg: '#FFFFFF',
      headerText: '#18181B',
      overlay: 'rgba(24, 24, 27, 0.5)',
      textPrimary: '#18181B',
      textSecondary: '#52525B',
      textMuted: '#A1A1AA',
      textInverse: '#FFFFFF',
      border: '#E4E4E7',
      borderLight: '#F4F4F5',
      borderFocus: '#D97706',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FEF3C7',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      buttonBg: '#D97706',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#FEF3C7',
      buttonSecondaryText: '#92400E',
      cardShadow: 'rgba(217, 119, 6, 0.08)',
      elevationShadow: 'rgba(24, 24, 27, 0.14)',
    },
    dark: {
      primary: '#F59E0B',
      primaryLight: '#3B240B',
      primaryDark: '#FBBF24',
      primaryText: '#18181B',
      accent: '#FBBF24',
      background: '#121214',
      surface: '#18181B',
      surfaceSecondary: '#27272A',
      surfaceTertiary: '#3F3F46',
      headerBg: '#151518',
      headerText: '#FAFAFA',
      overlay: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#FAFAFA',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A',
      textInverse: '#18181B',
      border: '#27272A',
      borderLight: '#1F1F22',
      borderFocus: '#F59E0B',
      success: '#10B981',
      successBg: '#064E3B',
      warning: '#F59E0B',
      warningBg: '#451A03',
      error: '#EF4444',
      errorBg: '#450A0A',
      info: '#3B82F6',
      infoBg: '#172554',
      buttonBg: '#F59E0B',
      buttonText: '#18181B',
      buttonSecondaryBg: '#27272A',
      buttonSecondaryText: '#FAFAFA',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
      elevationShadow: 'rgba(0, 0, 0, 0.65)',
    },
  },

  // 4. EMERALD PRO (Verified sustainable materials & eco-construction)
  emerald_pro: {
    name: 'Emerald Pro',
    description: 'Eco-certified verified construction green with modern high-contrast typography',
    light: {
      primary: '#059669',
      primaryLight: '#ECFDF5',
      primaryDark: '#047857',
      primaryText: '#FFFFFF',
      accent: '#10B981',
      background: '#F6FAF7',
      surface: '#FFFFFF',
      surfaceSecondary: '#F0FDF4',
      surfaceTertiary: '#E5E7EB',
      headerBg: '#FFFFFF',
      headerText: '#064E3B',
      overlay: 'rgba(6, 78, 59, 0.4)',
      textPrimary: '#111827',
      textSecondary: '#4B5563',
      textMuted: '#9CA3AF',
      textInverse: '#FFFFFF',
      border: '#E5E7EB',
      borderLight: '#F3F4F6',
      borderFocus: '#059669',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      buttonBg: '#059669',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#ECFDF5',
      buttonSecondaryText: '#065F46',
      cardShadow: 'rgba(5, 150, 105, 0.08)',
      elevationShadow: 'rgba(6, 78, 59, 0.15)',
    },
    dark: {
      primary: '#10B981',
      primaryLight: '#064E3B',
      primaryDark: '#34D399',
      primaryText: '#064E3B',
      accent: '#34D399',
      background: '#0B1511',
      surface: '#11221B',
      surfaceSecondary: '#193329',
      surfaceTertiary: '#234638',
      headerBg: '#0D1A15',
      headerText: '#ECFDF5',
      overlay: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#ECFDF5',
      textSecondary: '#A7F3D0',
      textMuted: '#6EE7B7',
      textInverse: '#0B1511',
      border: '#193329',
      borderLight: '#142921',
      borderFocus: '#10B981',
      success: '#10B981',
      successBg: '#064E3B',
      warning: '#F59E0B',
      warningBg: '#451A03',
      error: '#EF4444',
      errorBg: '#450A0A',
      info: '#3B82F6',
      infoBg: '#172554',
      buttonBg: '#10B981',
      buttonText: '#0B1511',
      buttonSecondaryBg: '#193329',
      buttonSecondaryText: '#ECFDF5',
      cardShadow: 'rgba(0, 0, 0, 0.4)',
      elevationShadow: 'rgba(0, 0, 0, 0.65)',
    },
  },

  // 5. CUSTOM (Quick user playground: easily customize in 10 seconds)
  custom: {
    name: 'Custom User Theme',
    description: 'Freely customize these hex codes when experimenting with new brand directions',
    light: {
      primary: '#0F172A',
      primaryLight: '#F1F5F9',
      primaryDark: '#020617',
      primaryText: '#FFFFFF',
      accent: '#3B82F6',
      background: '#F4F5F7',
      surface: '#FFFFFF',
      surfaceSecondary: '#F9FAFB',
      surfaceTertiary: '#F3F4F6',
      headerBg: '#FFFFFF',
      headerText: '#0F172A',
      overlay: 'rgba(0, 0, 0, 0.5)',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      textMuted: '#94A3B8',
      textInverse: '#FFFFFF',
      border: '#E2E8F0',
      borderLight: '#F1F5F9',
      borderFocus: '#0F172A',
      success: '#059669',
      successBg: '#ECFDF5',
      warning: '#D97706',
      warningBg: '#FFFBEB',
      error: '#DC2626',
      errorBg: '#FEF2F2',
      info: '#2563EB',
      infoBg: '#EFF6FF',
      buttonBg: '#0F172A',
      buttonText: '#FFFFFF',
      buttonSecondaryBg: '#F1F5F9',
      buttonSecondaryText: '#0F172A',
      cardShadow: 'rgba(0, 0, 0, 0.05)',
      elevationShadow: 'rgba(0, 0, 0, 0.12)',
    },
    dark: {
      primary: '#FFFFFF',
      primaryLight: '#1E293B',
      primaryDark: '#F8FAFC',
      primaryText: '#0F172A',
      accent: '#3B82F6',
      background: '#090D16',
      surface: '#111827',
      surfaceSecondary: '#1F2937',
      surfaceTertiary: '#374151',
      headerBg: '#0B0F19',
      headerText: '#F8FAFC',
      overlay: 'rgba(0, 0, 0, 0.75)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',
      textInverse: '#0F172A',
      border: '#1F2937',
      borderLight: '#162032',
      borderFocus: '#38BDF8',
      success: '#10B981',
      successBg: '#064E3B',
      warning: '#F59E0B',
      warningBg: '#451A03',
      error: '#EF4444',
      errorBg: '#450A0A',
      info: '#3B82F6',
      infoBg: '#172554',
      buttonBg: '#FFFFFF',
      buttonText: '#0F172A',
      buttonSecondaryBg: '#1F2937',
      buttonSecondaryText: '#F8FAFC',
      cardShadow: 'rgba(0, 0, 0, 0.35)',
      elevationShadow: 'rgba(0, 0, 0, 0.6)',
    },
  },
};

/**
 * Resolves full ThemeColorTokens for a given mode and preset key.
 * Fast, pure function without side effects.
 */
export function resolveThemeColors(
  mode: ThemeMode = 'light',
  presetKey: ThemePresetKey = ACTIVE_THEME_PRESET,
  isAppleDesign: boolean = false,
  overrides?: Partial<ThemeColorTokens>
): ThemeColorTokens {
  const preset = THEME_PRESETS[presetKey] || THEME_PRESETS.urbanico_yellow;
  const baseTokens = mode === 'light' ? preset.light : preset.dark;

  // Apple Design mode refinement (clean iOS-grade surface separation)
  if (isAppleDesign) {
    const appleTokens: ThemeColorTokens = {
      ...baseTokens,
      mode,
      statusBarStyle: mode === 'light' ? 'dark' : 'light',
      isAppleDesign: true,
      background: mode === 'light' ? '#F2F2F7' : '#000000',
      surface: mode === 'light' ? '#FFFFFF' : '#1C1C1E',
      surfaceSecondary: mode === 'light' ? '#F2F2F7' : '#2C2C2E',
      surfaceTertiary: mode === 'light' ? '#E5E5EA' : '#3A3A3C',
      headerBg: mode === 'light' ? '#FFFFFF' : '#000000',
      headerText: mode === 'light' ? '#000000' : '#FFFFFF',
      textPrimary: mode === 'light' ? '#000000' : '#FFFFFF',
      textSecondary: mode === 'light' ? '#6C6C70' : '#8E8E93',
      textMuted: mode === 'light' ? '#AEAEB2' : '#636366',
      border: mode === 'light' ? '#E5E5EA' : '#38383A',
      borderLight: mode === 'light' ? '#F2F2F7' : '#2C2C2E',
      ...overrides,
    };
    return appleTokens;
  }

  const tokens: ThemeColorTokens = {
    ...baseTokens,
    mode,
    statusBarStyle: mode === 'light' ? 'dark' : 'light',
    isAppleDesign: false,
    ...overrides,
  };

  return tokens;
}

/**
 * Statically accessible global theme colors for non-React files or static styles.
 */
export const GLOBAL_THEME_COLORS = resolveThemeColors('light', ACTIVE_THEME_PRESET);

/**
 * Injects CSS variables onto document.documentElement (:root)
 * Allows Tailwind CSS or regular CSS classes to reference:
 * - var(--color-primary)
 * - var(--color-bg)
 * - var(--color-surface)
 * - var(--color-text-primary)
 * - var(--color-border)
 * etc.
 */
export function applyThemeCssVariables(tokens: ThemeColorTokens): void {
  if (typeof document === 'undefined' || !document.documentElement) return;

  const root = document.documentElement;
  root.style.setProperty('--color-primary', tokens.primary);
  root.style.setProperty('--color-primary-light', tokens.primaryLight);
  root.style.setProperty('--color-primary-dark', tokens.primaryDark);
  root.style.setProperty('--color-primary-text', tokens.primaryText);
  root.style.setProperty('--color-bg', tokens.background);
  root.style.setProperty('--color-surface', tokens.surface);
  root.style.setProperty('--color-surface-secondary', tokens.surfaceSecondary);
  root.style.setProperty('--color-surface-tertiary', tokens.surfaceTertiary);
  root.style.setProperty('--color-text-primary', tokens.textPrimary);
  root.style.setProperty('--color-text-secondary', tokens.textSecondary);
  root.style.setProperty('--color-text-muted', tokens.textMuted);
  root.style.setProperty('--color-border', tokens.border);
  root.style.setProperty('--color-border-light', tokens.borderLight);
  root.style.setProperty('--color-success', tokens.success);
  root.style.setProperty('--color-warning', tokens.warning);
  root.style.setProperty('--color-error', tokens.error);
  root.style.setProperty('--color-info', tokens.info);
  root.style.setProperty('--color-btn-bg', tokens.buttonBg);
  root.style.setProperty('--color-btn-text', tokens.buttonText);
}
