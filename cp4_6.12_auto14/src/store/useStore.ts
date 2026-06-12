import { create } from 'zustand';
import axios from 'axios';

export type OrderStatus =
  | 'pending'
  | 'designing'
  | 'cutting'
  | 'sewing'
  | 'hardware'
  | 'polishing'
  | 'finalcheck'
  | 'completed';

export type ProductType = 'wallet' | 'cardholder' | 'keychain' | 'bracelet' | 'belt';
export type HardwareColor = 'bronze' | 'silver' | 'black';
export type LeatherType = 'cowhide' | 'sheepskin' | 'veg-tanned' | 'croc-embossed';
export type LeatherColor = 'brown' | 'black' | 'navy' | 'red' | 'green';
export type LeatherThickness = '1.0mm' | '1.2mm' | '1.5mm' | '2.0mm';

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  productType: ProductType;
  referenceImage?: string | null;
  engravingText: string;
  hardwareColor: HardwareColor;
  preferredDeliveryDate: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string }[];
  leatherId?: number | null;
  createdAt: string;
}

export interface Leather {
  id: number;
  type: LeatherType;
  color: LeatherColor;
  thickness: LeatherThickness;
  area: number;
  unitCost: number;
  threshold: number;
}

export interface RestockSuggestion {
  id: number;
  leatherId: number;
  suggestedArea: number;
  createdAt: string;
  status: string;
  type: LeatherType;
  color: LeatherColor;
  thickness: LeatherThickness;
  currentArea: number;
  unitCost: number;
}

export interface CustomerPreference {
  id?: number;
  customerEmail: string;
  leatherType?: LeatherType | null;
  leatherColor?: LeatherColor | null;
  hardwareColor?: HardwareColor | null;
  engravingText?: string | null;
  orderCount: number;
}

interface AppState {
  orders: Order[];
  leathers: Leather[];
  restockSuggestions: RestockSuggestion[];
  preferences: Record<string, CustomerPreference>;
  loading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  fetchLeathers: () => Promise<void>;
  fetchRestockSuggestions: () => Promise<void>;
  fetchPreference: (email: string) => Promise<CustomerPreference | null>;
  createOrder: (data: Omit<Order, 'id' | 'status' | 'statusHistory' | 'createdAt' | 'leatherId'>) => Promise<Order>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<Order | void>;
  addLeather: (data: Omit<Leather, 'id'>) => Promise<Leather | void>;
  updateLeather: (id: number, data: Partial<Pick<Leather, 'area' | 'unitCost' | 'threshold'>>) => Promise<Leather | void>;
  resolveRestockSuggestion: (id: number) => Promise<void>;
}

const api = axios.create({ baseURL: '/api' });

export const STATUS_LIST: OrderStatus[] = [
  'pending',
  'designing',
  'cutting',
  'sewing',
  'hardware',
  'polishing',
  'finalcheck',
  'completed',
];

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待审核',
  designing: '设计中',
  cutting: '裁料中',
  sewing: '缝制中',
  hardware: '五金安装',
  polishing: '打磨封边',
  finalcheck: '最终检查',
  completed: '已完成',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#FFB74D',
  designing: '#64B5F6',
  cutting: '#81C784',
  sewing: '#4DB6AC',
  hardware: '#BA68C8',
  polishing: '#FF8A65',
  finalcheck: '#A1887F',
  completed: '#9E9E9E',
};

export const PRODUCT_LABELS: Record<ProductType, string> = {
  wallet: '钱包',
  cardholder: '卡包',
  keychain: '钥匙扣',
  bracelet: '手环',
  belt: '皮带',
};

export const PRODUCT_AREA: Record<ProductType, number> = {
  wallet: 0.3,
  cardholder: 0.15,
  keychain: 0.1,
  bracelet: 0.08,
  belt: 0.4,
};

export const HARDWARE_LABELS: Record<HardwareColor, string> = {
  bronze: '古铜',
  silver: '银色',
  black: '黑色',
};

export const HARDWARE_COLORS: Record<HardwareColor, string> = {
  bronze: '#D4A574',
  silver: '#C0C0C0',
  black: '#333333',
};

export const LEATHER_TYPE_LABELS: Record<LeatherType, string> = {
  'cowhide': '头层牛皮',
  'sheepskin': '羊皮',
  'veg-tanned': '植鞣革',
  'croc-embossed': '鳄鱼皮压纹',
};

export const LEATHER_COLOR_LABELS: Record<LeatherColor, string> = {
  brown: '棕色',
  black: '黑色',
  navy: '深蓝',
  red: '红色',
  green: '绿色',
};

export const LEATHER_COLOR_HEX: Record<LeatherColor, string> = {
  brown: '#8B4513',
  black: '#2C2C2C',
  navy: '#1E3A5F',
  red: '#8B0000',
  green: '#2E5339',
};

export const useStore = create<AppState>((set, get) => ({
  orders: [],
  leathers: [],
  restockSuggestions: [],
  preferences: {},
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<Order[]>('/orders');
      set({ orders: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchLeathers: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get<Leather[]>('/leathers');
      set({ leathers: data, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchRestockSuggestions: async () => {
    try {
      const { data } = await api.get<RestockSuggestion[]>('/restock-suggestions');
      set({ restockSuggestions: data });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  fetchPreference: async (email) => {
    try {
      const { data } = await api.get<CustomerPreference | null>(`/preferences/${encodeURIComponent(email)}`);
      if (data) {
        set((state) => ({ preferences: { ...state.preferences, [email]: data } }));
      }
      return data;
    } catch {
      return null;
    }
  },

  createOrder: async (data) => {
    const { data: newOrder } = await api.post<Order>('/orders', data);
    set((state) => ({ orders: [newOrder, ...state.orders] }));
    return newOrder;
  },

  updateOrderStatus: async (id, status) => {
    try {
      const { data: updated } = await api.put<Order>(`/orders/${id}/status`, { status });
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updated : o)),
      }));
      await get().fetchLeathers();
      await get().fetchRestockSuggestions();
      return updated;
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  addLeather: async (data) => {
    try {
      const { data: leather } = await api.post<Leather>('/leathers', data);
      set((state) => ({ leathers: [...state.leathers, leather] }));
      return leather;
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  updateLeather: async (id, data) => {
    try {
      const { data: leather } = await api.put<Leather>(`/leathers/${id}`, data);
      set((state) => ({
        leathers: state.leathers.map((l) => (l.id === id ? leather : l)),
      }));
      return leather;
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  resolveRestockSuggestion: async (id) => {
    try {
      await api.put(`/restock-suggestions/${id}/resolve`);
      set((state) => ({
        restockSuggestions: state.restockSuggestions.filter((s) => s.id !== id),
      }));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },
}));
