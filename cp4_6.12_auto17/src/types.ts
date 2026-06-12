export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'wiring'
  | 'mounting'
  | 'weaving'
  | 'finishing'
  | 'qc'
  | 'shipped'
  | 'completed';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  wiring: '配线中',
  mounting: '上机中',
  weaving: '编织中',
  finishing: '后整理中',
  qc: '质检中',
  shipped: '已发货',
  completed: '已完成'
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#888888',
  confirmed: '#8B7355',
  wiring: '#A67C52',
  mounting: '#B08050',
  weaving: '#A67C52',
  finishing: '#C4A484',
  qc: '#D2B48C',
  shipped: '#6B8E23',
  completed: '#228B22'
};

export const YARN_TYPES = [
  { value: 'wool', label: '羊毛' },
  { value: 'cashmere', label: '羊绒' },
  { value: 'cotton', label: '棉线' },
  { value: 'linen', label: '亚麻' }
] as const;

export const TASSEL_STYLES = [
  { value: 'none', label: '无' },
  { value: 'short', label: '短流苏' },
  { value: 'long', label: '长流苏' },
  { value: 'dual', label: '双色流苏' }
] as const;

export type YarnType = typeof YARN_TYPES[number]['value'];
export type TasselStyle = typeof TASSEL_STYLES[number]['value'];

export interface Pattern {
  id: number;
  name: string;
  grid_data: any[][];
  colors: string[];
  thumbnail?: string;
  created_at: string;
  updated_at?: string;
}

export interface StatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: number;
  order_no: string;
  customer_name: string;
  customer_phone?: string;
  pattern_id: number;
  pattern_name: string;
  size_length: number;
  size_width: number;
  yarn_type: YarnType;
  color_scheme: string[];
  tassel_style: TasselStyle;
  estimated_yarn: number;
  status: OrderStatus;
  status_history: StatusHistoryItem[];
  expected_date?: string;
  created_at: string;
}
