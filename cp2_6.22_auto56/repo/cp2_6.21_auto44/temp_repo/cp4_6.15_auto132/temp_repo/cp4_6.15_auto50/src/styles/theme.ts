export const theme = {
  colors: {
    primary: '#6B8E23',
    primaryLight: '#8FB25E',
    primaryDark: '#476117',
    cream: '#FFFDF5',
    creamLight: '#FFF9E8',
    bark: '#5C4033',
    barkLight: '#9A7355',
    bgGradientFrom: '#F5F5F0',
    bgGradientTo: '#EDF5E1',
    severityMild: '#F59E0B',
    severityModerate: '#F97316',
    severitySevere: '#EF4444',
    severityMildStart: '#FDE68A',
    severitySevereEnd: '#EF4444',
    healthy: '#22C55E',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },
  fonts: {
    display: "'Nunito', sans-serif",
    body: "'Noto Sans SC', sans-serif",
  },
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    ripple: '600ms',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    pill: '9999px',
  },
  cardGradients: [
    'linear-gradient(135deg, #6B8E23 0%, #8FB25E 100%)',
    'linear-gradient(135deg, #476117 0%, #6B8E23 100%)',
    'linear-gradient(135deg, #5A7A1C 0%, #ABC484 100%)',
    'linear-gradient(135deg, #384E14 0%, #8FB25E 100%)',
  ],
  timelineColors: {
    healthy: '#22C55E',
    mild: '#F59E0B',
    moderate: '#F97316',
    severe: '#EF4444',
  },
  shadow: {
    card: '0 4px 20px rgba(71, 97, 23, 0.08)',
    hover: '0 8px 30px rgba(71, 97, 23, 0.15)',
    badge: '0 2px 8px rgba(0, 0, 0, 0.12)',
  },
} as const;

export type Theme = typeof theme;
