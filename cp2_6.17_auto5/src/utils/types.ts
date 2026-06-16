export interface Color {
  id: string;
  hex: string;
  name?: string;
  percentage?: number;
  role?: 'primary' | 'secondary' | 'accent';
}

export type ColorRole =
  | 'background'
  | 'cardBackground'
  | 'button'
  | 'textPrimary'
  | 'textSecondary'
  | 'accent';

export interface ColorRules {
  background: string | null;
  cardBackground: string | null;
  button: string | null;
  textPrimary: string | null;
  textSecondary: string | null;
  accent: string | null;
}

export interface Project {
  id: string;
  name: string;
  colorIds: string[];
  rules: ColorRules;
  inviteLink: string;
  isReadonly: boolean;
}
