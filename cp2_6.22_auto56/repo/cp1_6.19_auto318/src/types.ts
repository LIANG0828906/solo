export interface ThemeVariables {
  colorPrimary: string;
  bgColor: string;
  textColor: string;
  paddingMd: number;
  marginMd: number;
  borderRadius: number;
  fontSizeMd: number;
  shadowBlur: number;
}

export type ThemeKey = keyof ThemeVariables;

export interface ThemeControlConfig {
  key: ThemeKey;
  label: string;
  type: 'color' | 'number';
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
}
