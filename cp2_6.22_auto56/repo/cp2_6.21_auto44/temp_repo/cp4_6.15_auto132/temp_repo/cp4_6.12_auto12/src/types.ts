export interface Formula {
  id: number;
  name: string;
  mainDye: string;
  mordant: string;
  temperature: number;
  duration: number;
  ph: number;
  colorFrom: string;
  colorTo: string;
  isAvailable: number;
  createdAt: string;
}

export interface Order {
  id: number;
  fabricType: string;
  size: string;
  formulaId: number;
  referenceImage?: string;
  status: string;
  customerName: string;
  customerPhone: string;
  createdAt: string;
  formulaName?: string;
  colorFrom?: string;
  colorTo?: string;
}

export interface StatusLog {
  id: number;
  orderId: number;
  status: string;
  timestamp: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  origin: string;
  currentStock: number;
  maxStock: number;
  safeThreshold: number;
  unit: string;
  dyeType: string;
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'soaking'
  | 'extracting'
  | 'dyeing'
  | 'fixing'
  | 'washing'
  | 'inspecting'
  | 'completed';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  soaking: '浸泡中',
  extracting: '萃取中',
  dyeing: '染色中',
  fixing: '固色中',
  washing: '洗净晾干中',
  inspecting: '质检中',
  completed: '已完成'
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#9E9E9E',
  confirmed: '#2196F3',
  soaking: '#00BCD4',
  extracting: '#9C27B0',
  dyeing: '#F44336',
  fixing: '#FF9800',
  washing: '#4CAF50',
  inspecting: '#795548',
  completed: '#4CAF50'
};

export const FABRIC_TYPES = [
  { value: 'cotton', label: '棉布', texture: '🧵' },
  { value: 'linen', label: '亚麻', texture: '🌿' },
  { value: 'silk', label: '真丝', texture: '🦋' },
  { value: 'blend', label: '混纺', texture: '🎨' }
];

export const SIZES = [
  { value: '30x30cm', label: '30 × 30 cm' },
  { value: '50x50cm', label: '50 × 50 cm' },
  { value: '1mx1m', label: '1 × 1 m' },
  { value: 'custom', label: '定制尺寸' }
];

export const MORDANTS = [
  { value: '明矾', label: '明矾' },
  { value: '硫酸亚铁', label: '硫酸亚铁' },
  { value: '碱液', label: '碱液' }
];

export const DYE_COLORS = [
  { name: '茜草红', from: '#D32F2F', to: '#FFEBEE' },
  { name: '栀子黄', from: '#F9A825', to: '#FFF8E1' },
  { name: '苏木紫', from: '#7B1FA2', to: '#F3E5F5' },
  { name: '蓝草蓝', from: '#1976D2', to: '#E3F2FD' },
  { name: '黄檗棕', from: '#795548', to: '#EFEBE9' },
  { name: '艾草绿', from: '#558B2F', to: '#F1F8E9' }
];
