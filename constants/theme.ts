export const Colors = {
  primary: '#58CC02',
  primaryDark: '#46A302',
  primaryLight: '#89E219',
  primaryBg: '#E8F5D0',

  secondary: '#FF9600',
  secondaryDark: '#E68600',
  secondaryLight: '#FFB84D',
  secondaryBg: '#FFF3E0',

  accentBlue: '#1CB0F6',
  accentBlueBg: '#E3F6FF',
  accentPurple: '#CE82FF',
  accentPurpleBg: '#F5EEFF',

  error: '#FF4B4B',
  errorBg: '#FFDFE0',
  success: '#58CC02',
  successBg: '#D7FFB8',
  warning: '#FFC800',

  background: '#FFFFFF',
  surface: '#F7F7F7',
  surfaceElevated: '#FFFFFF',

  textPrimary: '#3C3C3C',
  textSecondary: '#777777',
  textMuted: '#AAAAAA',
  textOnPrimary: '#FFFFFF',

  border: '#E5E5E5',
  borderDark: '#CCCCCC',

  gold: '#FFD700',
  silver: '#C0C0C0',
  bronze: '#CD7F32',

  locked: '#AFAFAF',
  lockedBg: '#E5E5E5',

  heart: '#FF4B4B',
  streak: '#FF9600',
  xp: '#58CC02',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
