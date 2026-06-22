import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export interface Tile {
  id: string;
  shape: 'square' | 'circle' | 'triangle' | 'hexagon';
  color: string;
  gridX: number;
  gridY: number;
}

export interface InventoryItem {
  id: number;
  shape: string;
  color: string;
  colorName: string;
  quantity: number;
  threshold: number;
  batchNote?: string;
}

export interface OrderStatus {
  status: string;
  timestamp: string;
  note?: string;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail?: string;
  tiles: Tile[];
  statuses: OrderStatus[];
  currentStatus: string;
  createdAt: string;
  totalTiles: number;
}

export const inventoryApi = {
  getAll: () => api.get<InventoryItem[]>('/inventory'),
  update: (id: number, data: Partial<InventoryItem>) =>
    api.put<InventoryItem>(`/inventory/${id}`, data),
  getLowStock: () => api.get<InventoryItem[]>('/inventory/low-stock'),
};

export const orderApi = {
  getAll: () => api.get<Order[]>('/orders'),
  getById: (id: number) => api.get<Order>(`/orders/${id}`),
  create: (data: { tiles: Tile[]; customerName: string; customerEmail?: string }) =>
    api.post<Order>('/orders', data),
  updateStatus: (id: number, status: string, note?: string) =>
    api.post<Order>(`/orders/${id}/status`, { status, note }),
};

export const STATUS_FLOW = [
  '待确认',
  '已确认',
  '材料准备',
  '切割拼接',
  '注浆填缝',
  '打磨抛光',
  '质检包装',
  '已发货',
];

export const COLORS = [
  '#FF0000', '#FF6B6B', '#FF8C00', '#FFD700',
  '#FFFF00', '#9ACD32', '#32CD32', '#00FF00',
  '#00FA9A', '#00CED1', '#00BFFF', '#1E90FF',
  '#4169E1', '#0000FF', '#6A5ACD', '#8A2BE2',
  '#9400D3', '#FF00FF', '#FF1493', '#FF69B4',
  '#8B4513', '#A0522D', '#D2691E', '#DEB887',
];

export const COLOR_NAMES: Record<string, string> = {
  '#FF0000': '大红',
  '#FF6B6B': '浅红',
  '#FF8C00': '深橙',
  '#FFD700': '金色',
  '#FFFF00': '明黄',
  '#9ACD32': '黄绿',
  '#32CD32': '酸橙绿',
  '#00FF00': '鲜绿',
  '#00FA9A': '中海绿',
  '#00CED1': '深 Turquoise',
  '#00BFFF': '深天蓝',
  '#1E90FF': '道奇蓝',
  '#4169E1': '皇家蓝',
  '#0000FF': '纯蓝',
  '#6A5ACD': '板岩蓝',
  '#8A2BE2': '蓝紫罗兰',
  '#9400D3': '暗紫',
  '#FF00FF': '品红',
  '#FF1493': '深粉',
  '#FF69B4': '热粉',
  '#8B4513': '马鞍棕',
  '#A0522D': '赭色',
  '#D2691E': '巧克力',
  '#DEB887': '驼色',
};

export const SHAPES = ['square', 'circle', 'triangle', 'hexagon'] as const;
export const SHAPE_NAMES: Record<string, string> = {
  square: '方形',
  circle: '圆形',
  triangle: '三角形',
  hexagon: '六边形',
};

export default api;
