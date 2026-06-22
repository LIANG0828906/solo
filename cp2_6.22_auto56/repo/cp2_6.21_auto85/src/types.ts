export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface LAB {
  L: number;
  a: number;
  b: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface LipstickProduct {
  id: string;
  name: string;
  color: string;
}

export interface EyeshadowProduct {
  id: string;
  name: string;
  color: string;
}

export interface BlushProduct {
  id: string;
  name: string;
  color: string;
}

export interface SelectedProducts {
  lipstick: LipstickProduct | null;
  eyeshadow: EyeshadowProduct | null;
  blush: BlushProduct | null;
}

export interface ProductSettings {
  lipstickOpacity: number;
  eyeshadowShimmer: number;
  blushSize: number;
}

export type InputMode = 'photo' | 'camera';

export type CompareMode = 'none' | 'split' | 'sidebyside';

export type CategoryTab = 'lipstick' | 'eyeshadow' | 'blush';

export const LIPSTICK_PRODUCTS: LipstickProduct[] = [
  { id: 'ruby-woo', name: 'Ruby Woo 正红', color: '#BC2649' },
  { id: 'mocha', name: 'Mocha 摩卡', color: '#8B6914' },
  { id: 'mauve-fantasy', name: 'Mauve Fantasy 紫调', color: '#B7416B' },
  { id: 'barely-there', name: 'Barely There 裸粉', color: '#D6A6A8' },
  { id: 'cherry-bomb', name: 'Cherry Bomb 深红', color: '#9B1B30' },
];

export const EYESHADOW_PRODUCTS: EyeshadowProduct[] = [
  { id: 'golden-sand', name: 'Golden Sand 香槟金', color: '#E3C565' },
  { id: 'smoky-gray', name: 'Smoky Gray 烟灰', color: '#706F6F' },
  { id: 'rose-quartz', name: 'Rose Quartz 玫瑰石英', color: '#B8698A' },
  { id: 'ocean-blue', name: 'Ocean Blue 海洋蓝', color: '#285184' },
];

export const BLUSH_PRODUCTS: BlushProduct[] = [
  { id: 'peach-sorbet', name: 'Peach Sorbet 蜜桃', color: '#FFA07A' },
  { id: 'coral-reef', name: 'Coral Reef 珊瑚', color: '#FF7F50' },
  { id: 'berry-bliss', name: 'Berry Bliss 浆果', color: '#CC537B' },
];
