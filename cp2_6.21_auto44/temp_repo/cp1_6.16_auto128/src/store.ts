import { create } from 'zustand';
import type { ScentMarker, Filters, PendingMarker, ScentCategory, EmotionTag } from './types';

interface ScentState {
  markers: ScentMarker[];
  selectedId: string | null;
  pendingMarker: PendingMarker | null;
  filters: Filters;
  isFilterOpen: boolean;
  isCardOpen: boolean;
  searchQuery: string;
  addMarker: (marker: ScentMarker) => void;
  selectMarker: (id: string | null) => void;
  setPendingMarker: (marker: PendingMarker | null) => void;
  toggleCategoryFilter: (category: ScentCategory) => void;
  toggleEmotionFilter: (emotion: EmotionTag) => void;
  clearFilters: () => void;
  toggleFilterPanel: () => void;
  setCardOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  getVisibleMarkers: () => ScentMarker[];
}

const demoMarkers: ScentMarker[] = [
  {
    id: 'demo-1',
    lat: 39.9042,
    lng: 116.4074,
    date: '2024-03-15',
    description: '雨后北京的胡同，泥土混合着槐花的香气',
    category: 'environment',
    emotionTag: 'nostalgic',
    color: '#F4A261',
    recommendedColors: ['#F4A261', '#8B7355', '#A8E6CF', '#D4A574'],
    pattern: 'repeating-linear-gradient(0deg, transparent, transparent 6px, rgba(255,255,255,0.08) 6px, rgba(255,255,255,0.08) 12px)',
    poem: '雨后泥土的呼吸，像童年某个被遗忘的午后。',
    createdAt: new Date('2024-03-15T10:30:00'),
  },
  {
    id: 'demo-2',
    lat: 31.2304,
    lng: 121.4737,
    date: '2024-05-20',
    description: '外滩清晨的咖啡香，混着黄浦江的水汽',
    category: 'food',
    emotionTag: 'joyful',
    color: '#FF6B6B',
    recommendedColors: ['#FF6B6B', '#8B4513', '#D4A574', '#FFD93D'],
    pattern: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)',
    poem: '咖啡的苦味里，有深夜独自清醒的清醒。',
    createdAt: new Date('2024-05-20T08:15:00'),
  },
  {
    id: 'demo-3',
    lat: 30.5728,
    lng: 104.0668,
    date: '2024-09-01',
    description: '成都小巷里飘来的桂花香，甜甜的秋天',
    category: 'floral',
    emotionTag: 'nostalgic',
    color: '#F4A261',
    recommendedColors: ['#F4A261', '#FFCC5C', '#F8B500', '#D4A574'],
    pattern: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12) 0%, transparent 50%)',
    poem: '风穿过旧巷，带来桂花酿的甜香，那是祖母在的秋天。',
    createdAt: new Date('2024-09-01T16:45:00'),
  },
  {
    id: 'demo-4',
    lat: 22.5431,
    lng: 114.0579,
    date: '2024-07-10',
    description: '深圳海边的咸风，带着湿热的夏天味道',
    category: 'environment',
    emotionTag: 'fresh',
    color: '#00D2FF',
    recommendedColors: ['#00D2FF', '#7FDBDA', '#4ECDC4', '#98D8C8'],
    pattern: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
    poem: '海风中咸涩的味道，是那年夏天说不出口的告别。',
    createdAt: new Date('2024-07-10T14:20:00'),
  },
  {
    id: 'demo-5',
    lat: 45.8038,
    lng: 126.5349,
    date: '2024-01-05',
    description: '哈尔滨冬天的雪，冷冽中带着烤红薯的甜',
    category: 'environment',
    emotionTag: 'joyful',
    color: '#FF6B6B',
    recommendedColors: ['#FF6B6B', '#95E1D3', '#AA96DA', '#FFB347'],
    pattern: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 10px)',
    poem: '雪落下来的时候，世界安静得像一首未完成的诗。',
    createdAt: new Date('2024-01-05T11:00:00'),
  },
];

export const useScentStore = create<ScentState>((set, get) => ({
  markers: demoMarkers,
  selectedId: null,
  pendingMarker: null,
  filters: {
    categories: [],
    emotions: [],
  },
  isFilterOpen: false,
  isCardOpen: false,
  searchQuery: '',

  addMarker: (marker: ScentMarker) =>
    set((state) => ({ markers: [marker, ...state.markers] })),

  selectMarker: (id: string | null) =>
    set({ selectedId: id }),

  setPendingMarker: (marker: PendingMarker | null) =>
    set({ pendingMarker: marker }),

  toggleCategoryFilter: (category: ScentCategory) =>
    set((state) => {
      const exists = state.filters.categories.includes(category);
      return {
        filters: {
          ...state.filters,
          categories: exists
            ? state.filters.categories.filter((c) => c !== category)
            : [...state.filters.categories, category],
        },
      };
    }),

  toggleEmotionFilter: (emotion: EmotionTag) =>
    set((state) => {
      const exists = state.filters.emotions.includes(emotion);
      return {
        filters: {
          ...state.filters,
          emotions: exists
            ? state.filters.emotions.filter((e) => e !== emotion)
            : [...state.filters.emotions, emotion],
        },
      };
    }),

  clearFilters: () =>
    set({ filters: { categories: [], emotions: [] } }),

  toggleFilterPanel: () =>
    set((state) => ({ isFilterOpen: !state.isFilterOpen })),

  setCardOpen: (open: boolean) =>
    set({ isCardOpen: open }),

  setSearchQuery: (query: string) =>
    set({ searchQuery: query }),

  getVisibleMarkers: () => {
    const { markers, filters, searchQuery } = get();
    return markers.filter((m) => {
      if (filters.categories.length > 0 && !filters.categories.includes(m.category)) {
        return false;
      }
      if (filters.emotions.length > 0 && !filters.emotions.includes(m.emotionTag)) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!m.description.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  },
}));
