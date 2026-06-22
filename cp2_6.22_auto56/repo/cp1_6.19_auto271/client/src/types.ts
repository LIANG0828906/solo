export interface Photo {
  id: string;
  originalUrl: string;
  thumbnailUrl: string;
  filename: string;
  uploadTime: number;
  width: number;
  height: number;
  filter: FilterType;
  brightness: number;
  contrast: number;
}

export type FilterType = 'original' | 'warm' | 'cool' | 'mono' | 'vintage';

export type OrderStatus = 'pending' | 'printing' | 'completed';

export type PrintSize = '6inch' | '7inch' | '8inch';

export interface OrderItem {
  photoId: string;
  photoUrl: string;
  size: PrintSize;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: number;
  customerName: string;
  customerPhone: string;
}

export interface CartItem {
  photo: Photo;
  size: PrintSize;
  quantity: number;
}

export const FILTER_CSS: Record<FilterType, string> = {
  original: 'none',
  warm: 'sepia(0.3) saturate(1.2) brightness(1.05)',
  cool: 'saturate(0.9) hue-rotate(-10deg) brightness(0.95)',
  mono: 'grayscale(1) contrast(1.1)',
  vintage: 'sepia(0.5) saturate(0.8) contrast(0.9) brightness(1.1)'
};

export const FILTER_NAMES: Record<FilterType, string> = {
  original: '原片',
  warm: '暖阳',
  cool: '冷调',
  mono: '黑白',
  vintage: '复古'
};

export const SIZE_PRICES: Record<PrintSize, number> = {
  '6inch': 1.5,
  '7inch': 2,
  '8inch': 3
};

export const SIZE_NAMES: Record<PrintSize, string> = {
  '6inch': '6寸',
  '7inch': '7寸',
  '8inch': '8寸'
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#F1C40F',
  printing: '#3498DB',
  completed: '#2ECC71'
};

export const STATUS_NAMES: Record<OrderStatus, string> = {
  pending: '待处理',
  printing: '冲印中',
  completed: '已完成'
};
