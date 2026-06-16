import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Trip, Item, ActivityType, Category } from './types';

const STORAGE_KEY = 'nomadpack-trips';

const PRESET_ITEMS: Record<ActivityType, { name: string; category: Category; weight: number }[]> = {
  '城市漫步': [
    { name: '棉T恤', category: '服装', weight: 0.2 },
    { name: '休闲裤', category: '服装', weight: 0.4 },
    { name: '轻便外套', category: '服装', weight: 0.5 },
    { name: '内衣', category: '服装', weight: 0.08 },
    { name: '袜子', category: '服装', weight: 0.05 },
    { name: '舒适步行鞋', category: '服装', weight: 0.6 },
    { name: '牙刷牙膏', category: '洗护', weight: 0.1 },
    { name: '洗面奶', category: '洗护', weight: 0.15 },
    { name: '防晒霜', category: '洗护', weight: 0.12 },
    { name: '手机充电器', category: '电子', weight: 0.08 },
    { name: '充电宝', category: '电子', weight: 0.2 },
    { name: '身份证/护照', category: '证件', weight: 0.03 },
    { name: '创可贴', category: '医疗', weight: 0.02 },
  ],
  '海滩度假': [
    { name: '泳衣', category: '服装', weight: 0.15 },
    { name: '沙滩裤', category: '服装', weight: 0.2 },
    { name: '防晒衫', category: '服装', weight: 0.15 },
    { name: '人字拖', category: '服装', weight: 0.25 },
    { name: '太阳帽', category: '服装', weight: 0.1 },
    { name: '太阳镜', category: '服装', weight: 0.04 },
    { name: '高倍防晒霜', category: '洗护', weight: 0.15 },
    { name: '晒后修复', category: '洗护', weight: 0.12 },
    { name: '牙刷牙膏', category: '洗护', weight: 0.1 },
    { name: '防水手机袋', category: '电子', weight: 0.03 },
    { name: '充电宝', category: '电子', weight: 0.2 },
    { name: '身份证/护照', category: '证件', weight: 0.03 },
    { name: '防蚊液', category: '医疗', weight: 0.1 },
    { name: '创可贴', category: '医疗', weight: 0.02 },
  ],
  '徒步登山': [
    { name: '速干T恤', category: '服装', weight: 0.15 },
    { name: '冲锋衣', category: '服装', weight: 0.6 },
    { name: '冲锋裤', category: '服装', weight: 0.45 },
    { name: '登山鞋', category: '服装', weight: 0.8 },
    { name: '保暖内衣', category: '服装', weight: 0.25 },
    { name: '登山袜', category: '服装', weight: 0.08 },
    { name: '抓绒衣', category: '服装', weight: 0.4 },
    { name: '防滑手套', category: '服装', weight: 0.1 },
    { name: '牙刷牙膏', category: '洗护', weight: 0.1 },
    { name: '毛巾', category: '洗护', weight: 0.15 },
    { name: '头灯', category: '电子', weight: 0.08 },
    { name: '充电宝', category: '电子', weight: 0.2 },
    { name: '身份证/护照', category: '证件', weight: 0.03 },
    { name: '急救包', category: '医疗', weight: 0.2 },
    { name: '高原药', category: '医疗', weight: 0.05 },
    { name: '登山杖', category: '其他', weight: 0.3 },
  ],
  '商务出差': [
    { name: '西装', category: '服装', weight: 0.8 },
    { name: '衬衫', category: '服装', weight: 0.2 },
    { name: '西裤', category: '服装', weight: 0.4 },
    { name: '皮鞋', category: '服装', weight: 0.7 },
    { name: '领带', category: '服装', weight: 0.03 },
    { name: '内衣', category: '服装', weight: 0.08 },
    { name: '袜子', category: '服装', weight: 0.05 },
    { name: '牙刷牙膏', category: '洗护', weight: 0.1 },
    { name: '剃须刀', category: '洗护', weight: 0.1 },
    { name: '笔记本电脑', category: '电子', weight: 1.5 },
    { name: '手机充电器', category: '电子', weight: 0.08 },
    { name: '名片盒', category: '其他', weight: 0.05 },
    { name: '身份证/护照', category: '证件', weight: 0.03 },
    { name: '合同文件', category: '证件', weight: 0.1 },
    { name: '肠胃药', category: '医疗', weight: 0.05 },
  ],
  '滑雪旅行': [
    { name: '滑雪服', category: '服装', weight: 1.0 },
    { name: '滑雪裤', category: '服装', weight: 0.6 },
    { name: '保暖内衣', category: '服装', weight: 0.25 },
    { name: '抓绒衣', category: '服装', weight: 0.4 },
    { name: '滑雪袜', category: '服装', weight: 0.1 },
    { name: '滑雪手套', category: '服装', weight: 0.15 },
    { name: '滑雪镜', category: '服装', weight: 0.12 },
    { name: '毛线帽', category: '服装', weight: 0.08 },
    { name: '牙刷牙膏', category: '洗护', weight: 0.1 },
    { name: '润唇膏', category: '洗护', weight: 0.02 },
    { name: '防晒霜', category: '洗护', weight: 0.12 },
    { name: '手机充电器', category: '电子', weight: 0.08 },
    { name: '运动相机', category: '电子', weight: 0.15 },
    { name: '身份证/护照', category: '证件', weight: 0.03 },
    { name: '急救包', category: '医疗', weight: 0.2 },
    { name: '暖宝宝', category: '其他', weight: 0.1 },
  ],
};

function createPresetItems(activityTypes: ActivityType[], days: number): Item[] {
  const itemMap = new Map<string, { name: string; category: Category; weight: number; order: number }>();
  let order = 0;

  activityTypes.forEach(act => {
    const presets = PRESET_ITEMS[act] || [];
    presets.forEach(p => {
      if (!itemMap.has(p.name)) {
        itemMap.set(p.name, { ...p, order });
        order++;
      }
    });
  });

  const presets = Array.from(itemMap.values()).sort((a, b) => a.order - b.order);

  return presets.map(p => {
    let qty = 1;
    const isOuterwear = p.name === '登山鞋' || p.name === '皮鞋' || p.name === '舒适步行鞋' ||
      p.name === '人字拖' || p.name === '滑雪服' || p.name === '滑雪裤' ||
      p.name === '冲锋衣' || p.name === '冲锋裤' || p.name === '西装' ||
      p.name === '太阳帽' || p.name === '领带' || p.name === '滑雪手套' ||
      p.name === '滑雪镜' || p.name === '毛线帽' || p.name === '防滑手套' ||
      p.name === '抓绒衣';

    if (p.category === '服装' && !isOuterwear) {
      qty = Math.min(days, 7);
    }
    if (p.name === '内衣') qty = Math.min(days + 1, 8);
    if (p.name === '袜子') qty = Math.min(days + 1, 8);
    return {
      id: uuidv4(),
      name: p.name,
      category: p.category,
      weight: p.weight,
      quantity: qty,
      packed: false,
      order: p.order,
    };
  });
}

interface TripStore {
  trips: Trip[];
  currentTripId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addTrip: (destination: string, days: number, activityTypes: ActivityType[]) => string;
  removeTrip: (id: string) => void;
  setCurrentTripId: (id: string | null) => void;
  updateItemQuantity: (tripId: string, itemId: string, quantity: number) => void;
  togglePacked: (tripId: string, itemId: string) => void;
  reorderItems: (tripId: string, fromIndex: number, toIndex: number) => void;
  addItem: (tripId: string, name: string, category: Category, weight: number) => void;
  removeItem: (tripId: string, itemId: string) => void;
  persist: (trips: Trip[]) => Promise<void>;
}

export const useTripStore = create<TripStore>((set, get) => ({
  trips: [],
  currentTripId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const data = await idbGet<Trip[]>(STORAGE_KEY);
      if (data) {
        set({ trips: data, hydrated: true });
      } else {
        set({ hydrated: true });
      }
    } catch {
      set({ hydrated: true });
    }
  },

  persist: async (trips: Trip[]) => {
    try {
      await idbSet(STORAGE_KEY, trips);
    } catch { /* ignore */ }
  },

  addTrip: (destination, days, activityTypes) => {
    const id = uuidv4();
    const items = createPresetItems(activityTypes, days);
    const trip: Trip = {
      id,
      destination,
      days,
      activityTypes,
      items,
      createdAt: Date.now(),
    };
    const newTrips = [trip, ...get().trips];
    set({ trips: newTrips, currentTripId: id });
    get().persist(newTrips);
    return id;
  },

  removeTrip: (id) => {
    const newTrips = get().trips.filter(t => t.id !== id);
    const currentTripId = get().currentTripId === id ? null : get().currentTripId;
    set({ trips: newTrips, currentTripId });
    get().persist(newTrips);
  },

  setCurrentTripId: (id) => {
    set({ currentTripId: id });
  },

  updateItemQuantity: (tripId, itemId, quantity) => {
    const newTrips = get().trips.map(trip => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        items: trip.items.map(item =>
          item.id === itemId ? { ...item, quantity: Math.max(0, quantity) } : item
        ).filter(item => item.quantity > 0),
      };
    });
    set({ trips: newTrips });
    get().persist(newTrips);
  },

  togglePacked: (tripId, itemId) => {
    const newTrips = get().trips.map(trip => {
      if (trip.id !== tripId) return trip;
      return {
        ...trip,
        items: trip.items.map(item =>
          item.id === itemId ? { ...item, packed: !item.packed } : item
        ),
      };
    });
    set({ trips: newTrips });
    get().persist(newTrips);
  },

  reorderItems: (tripId, fromIndex, toIndex) => {
    const newTrips = get().trips.map(trip => {
      if (trip.id !== tripId) return trip;
      const newItems = [...trip.items];
      const [moved] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, moved);
      return { ...trip, items: newItems.map((item, i) => ({ ...item, order: i })) };
    });
    set({ trips: newTrips });
    get().persist(newTrips);
  },

  addItem: (tripId, name, category, weight) => {
    const newItem: Item = {
      id: uuidv4(),
      name,
      category,
      weight,
      quantity: 1,
      packed: false,
      order: get().trips.find(t => t.id === tripId)?.items.length ?? 0,
    };
    const newTrips = get().trips.map(trip => {
      if (trip.id !== tripId) return trip;
      return { ...trip, items: [...trip.items, newItem] };
    });
    set({ trips: newTrips });
    get().persist(newTrips);
  },

  removeItem: (tripId, itemId) => {
    const newTrips = get().trips.map(trip => {
      if (trip.id !== tripId) return trip;
      return { ...trip, items: trip.items.filter(item => item.id !== itemId) };
    });
    set({ trips: newTrips });
    get().persist(newTrips);
  },
}));

export { PRESET_ITEMS };
