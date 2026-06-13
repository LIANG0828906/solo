import { create } from 'zustand';
import {
  ClothingItem,
  Outfit,
  DailyOutfit,
  FilterCriteria,
  ClothingCategory,
  Season,
  generateId,
  analyzeColorHarmony,
} from '@/types';

const STORAGE_KEY_CLOSET = 'wardrobe_closet';
const STORAGE_KEY_OUTFITS = 'wardrobe_outfits';
const STORAGE_KEY_DAILY = 'wardrobe_daily';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

const MOCK_ITEMS: ClothingItem[] = [
  { id: generateId(), name: '白色衬衫', category: ClothingCategory.TOP, color: '#ffffff', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20dress%20shirt%20on%20hanger%20minimal%20background&image_size=square', season: Season.SPRING, createdAt: '2026-01-01' },
  { id: generateId(), name: '黑色西装外套', category: ClothingCategory.OUTERWEAR, color: '#2d2d2d', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=black%20blazer%20jacket%20minimal%20background&image_size=square', season: Season.AUTUMN, createdAt: '2026-01-02' },
  { id: generateId(), name: '蓝色牛仔裤', category: ClothingCategory.BOTTOM, color: '#30336b', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=blue%20denim%20jeans%20folded%20minimal&image_size=square', season: Season.SPRING, createdAt: '2026-01-03' },
  { id: generateId(), name: '红色高跟鞋', category: ClothingCategory.SHOES, color: '#e94560', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=red%20high%20heel%20shoes%20minimal&image_size=square', season: Season.SUMMER, createdAt: '2026-01-04' },
  { id: generateId(), name: '卡其风衣', category: ClothingCategory.OUTERWEAR, color: '#d2691e', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=khaki%20trench%20coat%20minimal%20background&image_size=square', season: Season.AUTUMN, createdAt: '2026-01-05' },
  { id: generateId(), name: '灰色卫衣', category: ClothingCategory.TOP, color: '#808080', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gray%20hoodie%20sweatshirt%20minimal&image_size=square', season: Season.WINTER, createdAt: '2026-01-06' },
  { id: generateId(), name: '白色运动鞋', category: ClothingCategory.SHOES, color: '#ffffff', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20sneakers%20minimal%20clean&image_size=square', season: Season.SPRING, createdAt: '2026-01-07' },
  { id: generateId(), name: '黑色休闲裤', category: ClothingCategory.BOTTOM, color: '#1a1a2e', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=black%20casual%20pants%20folded%20minimal&image_size=square', season: Season.AUTUMN, createdAt: '2026-01-08' },
  { id: generateId(), name: '粉色丝巾', category: ClothingCategory.ACCESSORY, color: '#fcbad3', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pink%20silk%20scarf%20elegant%20minimal&image_size=square', season: Season.SPRING, createdAt: '2026-01-09' },
  { id: generateId(), name: '驼色毛衣', category: ClothingCategory.TOP, color: '#d2691e', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=camel%20wool%20sweater%20cozy%20minimal&image_size=square', season: Season.WINTER, createdAt: '2026-01-10' },
  { id: generateId(), name: '海军蓝polo衫', category: ClothingCategory.TOP, color: '#0f3460', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=navy%20blue%20polo%20shirt%20minimal&image_size=square', season: Season.SUMMER, createdAt: '2026-01-11' },
  { id: generateId(), name: '米色阔腿裤', category: ClothingCategory.BOTTOM, color: '#ffe4b5', imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beige%20wide%20leg%20pants%20minimal&image_size=square', season: Season.SUMMER, createdAt: '2026-01-12' },
];

export interface WardrobeStore {
  items: ClothingItem[];
  outfits: Outfit[];
  dailyOutfits: DailyOutfit[];
  filter: FilterCriteria;

  addItem: (item: Omit<ClothingItem, 'id' | 'createdAt'>) => void;
  removeItem: (id: string) => void;
  setFilter: (filter: FilterCriteria) => void;
  clearFilter: () => void;
  getFilteredItems: () => ClothingItem[];
  getItemById: (id: string) => ClothingItem | undefined;

  createOutfit: (name: string, itemIds: string[]) => Outfit;
  removeOutfit: (id: string) => void;

  assignDailyOutfit: (date: string, outfitId: string) => void;
  removeDailyOutfit: (date: string) => void;
  getOutfitForDate: (date: string) => Outfit | undefined;
}

export const useWardrobeStore = create<WardrobeStore>((set, get) => ({
  items: loadFromStorage<ClothingItem[]>(STORAGE_KEY_CLOSET, MOCK_ITEMS),
  outfits: loadFromStorage<Outfit[]>(STORAGE_KEY_OUTFITS, []),
  dailyOutfits: loadFromStorage<DailyOutfit[]>(STORAGE_KEY_DAILY, []),
  filter: { category: null, color: null, season: null },

  addItem: (item) => {
    const newItem: ClothingItem = {
      ...item,
      id: generateId(),
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => {
      const items = [...state.items, newItem];
      saveToStorage(STORAGE_KEY_CLOSET, items);
      return { items };
    });
  },

  removeItem: (id) => {
    set((state) => {
      const items = state.items.filter((i) => i.id !== id);
      saveToStorage(STORAGE_KEY_CLOSET, items);
      return { items };
    });
  },

  setFilter: (filter) => set({ filter }),

  clearFilter: () => set({ filter: { category: null, color: null, season: null } }),

  getFilteredItems: () => {
    const { items, filter } = get();
    return items.filter((item) => {
      if (filter.category && item.category !== filter.category) return false;
      if (filter.color && item.color !== filter.color) return false;
      if (filter.season && item.season !== filter.season) return false;
      return true;
    });
  },

  getItemById: (id) => get().items.find((i) => i.id === id),

  createOutfit: (name, itemIds) => {
    const items = get().items.filter((i) => itemIds.includes(i.id));
    const colors = items.map((i) => i.color);
    const tags = analyzeColorHarmony(colors);
    const outfit: Outfit = {
      id: generateId(),
      name,
      items: itemIds,
      tags,
      createdAt: new Date().toISOString().split('T')[0],
    };
    set((state) => {
      const outfits = [...state.outfits, outfit];
      saveToStorage(STORAGE_KEY_OUTFITS, outfits);
      return { outfits };
    });
    return outfit;
  },

  removeOutfit: (id) => {
    set((state) => {
      const outfits = state.outfits.filter((o) => o.id !== id);
      saveToStorage(STORAGE_KEY_OUTFITS, outfits);
      return { outfits };
    });
  },

  assignDailyOutfit: (date, outfitId) => {
    set((state) => {
      const filtered = state.dailyOutfits.filter((d) => d.date !== date);
      const dailyOutfits = [...filtered, { date, outfitId }];
      saveToStorage(STORAGE_KEY_DAILY, dailyOutfits);
      return { dailyOutfits };
    });
  },

  removeDailyOutfit: (date) => {
    set((state) => {
      const dailyOutfits = state.dailyOutfits.filter((d) => d.date !== date);
      saveToStorage(STORAGE_KEY_DAILY, dailyOutfits);
      return { dailyOutfits };
    });
  },

  getOutfitForDate: (date) => {
    const { dailyOutfits, outfits } = get();
    const entry = dailyOutfits.find((d) => d.date === date);
    if (!entry) return undefined;
    return outfits.find((o) => o.id === entry.outfitId);
  },
}));
