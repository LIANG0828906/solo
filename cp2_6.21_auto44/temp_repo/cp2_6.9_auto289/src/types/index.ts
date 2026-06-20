export interface Product {
  id: string;
  name: string;
  icon: string;
  price: number;
  stock: number;
  maxStock: number;
  catchphrases: string[];
}

export type WeatherType = 'sunny' | 'rainy' | 'snowy';

export type TimeOfDay = 'dawn' | 'noon' | 'dusk' | 'night';

export interface Passerby {
  id: string;
  x: number;
  y: number;
  state: 'walking' | 'stopped' | 'leaving';
  targetProductId: string;
}

export interface FloatingCoin {
  id: string;
  x: number;
  y: number;
  value: number;
}

export type VendorExpression = 'normal' | 'helpless' | 'wiping';
