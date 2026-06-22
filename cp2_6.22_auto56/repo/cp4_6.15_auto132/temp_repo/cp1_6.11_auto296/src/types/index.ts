
export type Grade = '极品' | '上品' | '中品' | '下品';

export interface Walnut {
  id: string;
  name: string;
  variety: string;
  textureDensity: number;
  symmetry: number;
  soundFrequency: number;
  grade: Grade;
  price: number;
  isForSale: boolean;
  ownerId: string | null;
  textureSeed: number;
}

export interface User {
  id: string;
  username: string;
  balance: number;
  favorites: string[];
  transactionCount: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export type ThemeColor = 'bamboo' | 'sandalwood' | 'inkGray';

export interface ThemeConfig {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
}
