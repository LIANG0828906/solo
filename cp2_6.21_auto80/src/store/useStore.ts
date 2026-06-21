import { create } from 'zustand';
import { submitOrderApi, fetchOrderHistoryApi } from '../api/orderApi';

export type ChocolateShape = 'circle' | 'square' | 'heart' | 'shell';
export type SurfaceTexture = 'matte' | 'glossy' | 'crushed-nuts' | 'gold-foil';
export type BoxShape = 'square' | 'heart' | 'drawer';

export interface Flavor {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface ChocolateItem {
  id: string;
  flavorId: string;
  shape: ChocolateShape;
  color: string;
  texture: SurfaceTexture;
}

export interface GiftBoxConfig {
  boxShape: BoxShape;
  ribbonColor: string;
  cardText: string;
  cardFont: string;
  cardColor: string;
}

export const FLAVORS: Flavor[] = [
  { id: 'sea-salt-caramel', name: '海盐焦糖', icon: '🧂', description: '丝滑焦糖与海盐的完美碰撞' },
  { id: 'matcha', name: '抹茶', icon: '🍵', description: '日式宇治抹茶的清新回甘' },
  { id: 'dark-chocolate', name: '黑巧', icon: '🍫', description: '70%可可含量的醇厚苦甜' },
  { id: 'strawberry', name: '草莓', icon: '🍓', description: '鲜果草莓的自然酸甜' },
  { id: 'pistachio', name: '开心果', icon: '🟢', description: '西西里开心果的浓郁坚果香' },
  { id: 'baileys', name: '百利甜酒', icon: '🥃', description: '爱尔兰奶油利口酒的微醺风味' },
];

export const RIBBON_COLORS = [
  { name: '香槟金', value: 'linear-gradient(135deg,#D4AF37,#C5A028)' },
  { name: '酒红', value: 'linear-gradient(135deg,#722F37,#5B1A1A)' },
  { name: '玫瑰粉', value: 'linear-gradient(135deg,#E8A0BF,#C97B9E)' },
  { name: '翡翠绿', value: 'linear-gradient(135deg,#2E8B57,#1B6B3A)' },
  { name: '宝石蓝', value: 'linear-gradient(135deg,#2B5EA7,#1A3D6E)' },
  { name: '薰衣草紫', value: 'linear-gradient(135deg,#9B72AA,#7B5289)' },
  { name: '珍珠白', value: 'linear-gradient(135deg,#F5F5F0,#E8E8E0)' },
];

export const FONT_OPTIONS = [
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Inter', label: 'Inter' },
  { value: 'serif', label: '衬线体' },
  { value: 'cursive', label: '手写体' },
];

interface StoreState {
  selectedChocolates: ChocolateItem[];
  giftBox: GiftBoxConfig;
  selectedChocolateId: string | null;
  orderHistory: any[];
  addChocolate: (flavorId: string) => void;
  removeChocolate: (id: string) => void;
  updateChocolate: (id: string, updates: Partial<ChocolateItem>) => void;
  swapChocolates: (id1: string, id2: string) => void;
  selectChocolate: (id: string | null) => void;
  updateGiftBox: (updates: Partial<GiftBoxConfig>) => void;
  submitOrder: () => Promise<void>;
  fetchOrderHistory: () => Promise<void>;
}

export const useStore = create<StoreState>((set, get) => ({
  selectedChocolates: [],
  giftBox: {
    boxShape: 'square',
    ribbonColor: RIBBON_COLORS[0].value,
    cardText: '',
    cardFont: 'Playfair Display',
    cardColor: '#3E2723',
  },
  selectedChocolateId: null,
  orderHistory: [],

  addChocolate: (flavorId) => {
    const { selectedChocolates } = get();
    if (selectedChocolates.length >= 6) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newChocolate: ChocolateItem = {
      id,
      flavorId,
      shape: 'circle',
      color: '#5D4037',
      texture: 'glossy',
    };
    set({ selectedChocolates: [...selectedChocolates, newChocolate] });
  },

  removeChocolate: (id) => {
    set((state) => ({
      selectedChocolates: state.selectedChocolates.filter((c) => c.id !== id),
      selectedChocolateId: state.selectedChocolateId === id ? null : state.selectedChocolateId,
    }));
  },

  updateChocolate: (id, updates) => {
    set((state) => ({
      selectedChocolates: state.selectedChocolates.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }));
  },

  swapChocolates: (id1, id2) => {
    set((state) => {
      const arr = [...state.selectedChocolates];
      const index1 = arr.findIndex((c) => c.id === id1);
      const index2 = arr.findIndex((c) => c.id === id2);
      if (index1 === -1 || index2 === -1) return state;
      [arr[index1], arr[index2]] = [arr[index2], arr[index1]];
      return { selectedChocolates: arr };
    });
  },

  selectChocolate: (id) => {
    set({ selectedChocolateId: id });
  },

  updateGiftBox: (updates) => {
    set((state) => ({
      giftBox: { ...state.giftBox, ...updates },
    }));
  },

  submitOrder: async () => {
    const { selectedChocolates, giftBox } = get();
    const order = {
      chocolates: selectedChocolates,
      giftBox,
      createdAt: new Date().toISOString(),
    };
    const result = await submitOrderApi(order);
    set((state) => ({
      orderHistory: [...state.orderHistory, result],
    }));
  },

  fetchOrderHistory: async () => {
    const history = await fetchOrderHistoryApi();
    set({ orderHistory: history });
  },
}));
