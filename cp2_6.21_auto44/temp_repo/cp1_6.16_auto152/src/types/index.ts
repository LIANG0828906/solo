export interface FlowerItem {
  id: string;
  name: string;
  price: number;
  thumbnail: string;
  petalColor: string;
  stemColor: string;
  centerColor: string;
}

export interface SelectedFlower {
  flowerId: string;
  quantity: number;
}

export type WrappingStyle = 'plain-white' | 'gradient-pink' | 'vintage-brown' | 'forest-green' | 'starry-blue';
export type RibbonColor = 'gold' | 'silver' | 'red' | 'beige';

export interface WrappingOption {
  id: WrappingStyle;
  name: string;
  color: string;
  secondaryColor: string;
}

export interface RibbonOption {
  id: RibbonColor;
  name: string;
  color: string;
}

export interface Order {
  orderId: string;
  flowers: { name: string; quantity: number }[];
  wrappingStyle: WrappingStyle;
  ribbonColor: RibbonColor;
  totalPrice: number;
  timestamp: string;
}
