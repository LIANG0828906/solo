export type WeatherTheme = 'sunny' | 'rainy' | 'snowy';

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
}

export interface Poem {
  id: string;
  title: string;
  content: string;
  theme: WeatherTheme;
  createdAt: string;
  likes: number;
  comments: number;
}

export interface DecorationElement {
  id: string;
  x: number;
  delay: number;
  duration: number;
  rotationDuration: number;
  opacity: number;
}
