export interface ColorGroup {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  neutral: string;
  onNeutral: string;
  neutralContainer: string;
  onNeutralContainer: string;
  neutralVariant: string;
  onNeutralVariant: string;
  neutralVariantContainer: string;
  onNeutralVariantContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  shadow: string;
}

export interface ColorCard {
  key: string;
  label: string;
  color: string;
  onColor?: string;
}

export type ExportFormat = 'css' | 'json';
