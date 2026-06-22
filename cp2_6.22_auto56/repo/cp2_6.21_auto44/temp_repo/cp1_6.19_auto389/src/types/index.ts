export type InstrumentType = '吉他' | '钢琴' | '鼓' | '小提琴' | '萨克斯' | '电子琴' | '贝斯';

export type Brand = '雅马哈' | '芬达' | '吉布森' | '卡西欧' | '罗兰' | '马丁' | '泰勒' | '塞尔玛';

export interface Instrument {
  id: string;
  brand: Brand;
  model: string;
  type: InstrumentType;
  purchaseYear: number;
  yearsUsed: number;
  condition: number;
  image: string;
  description: string;
  expectedPrice: number;
  estimatedPrice?: number;
  sellerId: string;
  createdAt: string;
}

export interface Bid {
  id: string;
  instrumentId: string;
  instrumentName: string;
  buyerName: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const BRAND_MODELS: Record<Brand, string[]> = {
  '雅马哈': ['FG830', 'F310', 'LL16', 'C40', 'P-125', 'DGX-670'],
  '芬达': ['Stratocaster', 'Telecaster', 'Jazz Bass', 'Precision Bass', 'Mustang'],
  '吉布森': ['Les Paul', 'SG', 'ES-335', 'Flying V', 'J-45'],
  '卡西欧': ['CT-S1', 'PX-S7000', 'AP-470', 'LK-S250', 'SA-76'],
  '罗兰': ['FP-30X', 'TD-17KV', 'GO:KEYS', 'R8', 'Rubix24'],
  '马丁': ['D-28', 'HD-28', '000-15M', 'D-45', 'LX1E'],
  '泰勒': ['814ce', '110e', '214ce', 'GS Mini', 'AD17'],
  '塞尔玛': ['Super Action 80', 'Series III', 'Reference 36', 'Axos', 'Seles'],
};
