// ZenMala theme - dark zen as default, light optional
export type ThemeMode = 'dark' | 'light';

const lightColors = {
  surface: '#FDFBF7',
  surfaceSecondary: '#F3ECE2',
  surfaceTertiary: '#E9E0D3',
  surfaceInverse: '#141311',
  onSurface: '#2A2621',
  onSurfaceSecondary: '#4A443D',
  onSurfaceTertiary: '#5C544B',
  onSurfaceInverse: '#F7F4EB',
  brandPrimary: '#C95234',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#D89B3A',
  onBrandSecondary: '#141311',
  brandTertiary: '#8A3D2D',
  border: '#E9E0D3',
  borderStrong: '#C7BCAF',
  divider: '#E9E0D3',
  success: '#3D8A5E',
  error: '#9E2E2E',
};

const darkColors = {
  surface: '#141311',
  surfaceSecondary: '#201E1B',
  surfaceTertiary: '#2B2824',
  surfaceInverse: '#FDFBF7',
  onSurface: '#F7F4EB',
  onSurfaceSecondary: '#DCD7CE',
  onSurfaceTertiary: '#C0BBB2',
  onSurfaceInverse: '#2A2621',
  brandPrimary: '#D66144',
  onBrandPrimary: '#FFFFFF',
  brandSecondary: '#E2AA4E',
  onBrandSecondary: '#141311',
  brandTertiary: '#5C2C24',
  border: '#2B2824',
  borderStrong: '#4A4641',
  divider: '#2B2824',
  success: '#5BB07D',
  error: '#D66B6B',
};

export const getColors = (mode: ThemeMode) => (mode === 'dark' ? darkColors : lightColors);

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
  pill: 999,
};

export const fonts = {
  display: 'CormorantGaramond',
  text: 'PlusJakartaSans',
  displayFallback: 'serif',
};
