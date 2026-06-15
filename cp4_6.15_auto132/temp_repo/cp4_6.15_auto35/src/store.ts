import { create } from 'zustand';
import type { Wine, Tasting, WineType } from './types';

interface WineStore {
  wines: Wine[];
  tastings: Tasting[];
  addWine: (wine: Omit<Wine, 'id' | 'imageColor'>) => void;
  addTasting: (tasting: Omit<Tasting, 'id'>) => void;
  getWineById: (id: string) => Wine | undefined;
  getTastingsByWineId: (wineId: string) => Tasting[];
}

const IMAGE_COLORS_BY_TYPE: Record<WineType, string[]> = {
  red: [
    'linear-gradient(135deg, #722F37, #4A1F24)',
    'linear-gradient(135deg, #8B3A3A, #5A2525)',
    'linear-gradient(135deg, #6B2831, #3D1A1F)',
  ],
  white: [
    'linear-gradient(135deg, #DAA520, #B8860B)',
    'linear-gradient(135deg, #E6C87A, #C8A95F)',
    'linear-gradient(135deg, #F0D99B, #D4B878)',
  ],
  sparkling: [
    'linear-gradient(135deg, #FFD700, #DAA520)',
    'linear-gradient(135deg, #FFE066, #E6C84D)',
    'linear-gradient(135deg, #F5D580, #D9B85A)',
  ],
  sweet: [
    'linear-gradient(135deg, #B4783C, #8B5A2B)',
    'linear-gradient(135deg, #CD853F, #A0652D)',
    'linear-gradient(135deg, #D2691E, #A0522D)',
  ],
};

function generateId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

const MOCK_WINES: Wine[] = [
  {
    id: 'wine-001',
    name: '拉菲古堡 2015',
    country: '法国',
    region: '波尔多',
    subRegion: '梅多克',
    grapeVarieties: ['赤霞珠', '梅洛'],
    vintage: 2015,
    type: 'red',
    quantity: 12,
    price: 5800,
    rating: 96,
    imageColor: 'linear-gradient(135deg, #722F37, #4A1F24)',
  },
  {
    id: 'wine-002',
    name: '罗曼尼康帝 2018',
    country: '法国',
    region: '勃艮第',
    subRegion: '科多尔',
    grapeVarieties: ['黑皮诺'],
    vintage: 2018,
    type: 'red',
    quantity: 3,
    price: 28000,
    rating: 99,
    imageColor: 'linear-gradient(135deg, #8B3A3A, #5A2525)',
  },
  {
    id: 'wine-003',
    name: '云雾之湾长相思 2022',
    country: '新西兰',
    region: '马尔堡',
    subRegion: '威劳河',
    grapeVarieties: ['长相思'],
    vintage: 2022,
    type: 'white',
    quantity: 6,
    price: 380,
    rating: 90,
    imageColor: 'linear-gradient(135deg, #DAA520, #B8860B)',
  },
  {
    id: 'wine-004',
    name: '酩悦香槟 2012',
    country: '法国',
    region: '香槟',
    subRegion: '兰斯山',
    grapeVarieties: ['霞多丽', '黑皮诺'],
    vintage: 2012,
    type: 'sparkling',
    quantity: 8,
    price: 1200,
    rating: 92,
    imageColor: 'linear-gradient(135deg, #FFD700, #DAA520)',
  },
  {
    id: 'wine-005',
    name: '奥普斯一号 2019',
    country: '美国',
    region: '纳帕谷',
    subRegion: '鹿跃区',
    grapeVarieties: ['赤霞珠', '梅洛', '品丽珠'],
    vintage: 2019,
    type: 'red',
    quantity: 5,
    price: 3800,
    rating: 94,
    imageColor: 'linear-gradient(135deg, #6B2831, #3D1A1F)',
  },
  {
    id: 'wine-006',
    name: '伊贡米勒雷司令 2021',
    country: '德国',
    region: '摩泽尔',
    subRegion: '贝恩卡斯特',
    grapeVarieties: ['雷司令'],
    vintage: 2021,
    type: 'white',
    quantity: 4,
    price: 850,
    rating: 93,
    imageColor: 'linear-gradient(135deg, #E6C87A, #C8A95F)',
  },
  {
    id: 'wine-007',
    name: '托卡伊贵腐酒 2017',
    country: '匈牙利',
    region: '托卡伊',
    subRegion: '马德',
    grapeVarieties: ['福尔明', '哈斯莱威路'],
    vintage: 2017,
    type: 'sweet',
    quantity: 6,
    price: 1200,
    rating: 95,
    imageColor: 'linear-gradient(135deg, #B4783C, #8B5A2B)',
  },
  {
    id: 'wine-008',
    name: '巴巴莱斯科 2016',
    country: '意大利',
    region: '皮埃蒙特',
    subRegion: '巴巴莱斯科',
    grapeVarieties: ['内比奥罗'],
    vintage: 2016,
    type: 'red',
    quantity: 3,
    price: 1600,
    rating: 93,
    imageColor: 'linear-gradient(135deg, #722F37, #4A1F24)',
  },
];

const MOCK_TASTINGS: Tasting[] = [
  {
    id: 'tst-001',
    wineId: 'wine-001',
    date: '2024-06-10',
    color: '宝石红',
    aroma: '黑醋栗、雪松、烟草、香草',
    sweetness: 1,
    acidity: 3,
    tannin: 5,
    body: 5,
    rating: 95,
    summary: '结构宏大，单宁细腻丝滑，余韵悠长。',
  },
  {
    id: 'tst-002',
    wineId: 'wine-001',
    date: '2025-12-20',
    color: '石榴红',
    aroma: '黑莓、皮革、松露、烟熏',
    sweetness: 1,
    acidity: 3,
    tannin: 4,
    body: 5,
    rating: 97,
    summary: '陈年后复杂度提升，香气更加层次丰富。',
  },
  {
    id: 'tst-003',
    wineId: 'wine-003',
    date: '2025-03-15',
    color: '浅金黄',
    aroma: '柑橘、西柚、青草、矿物',
    sweetness: 1,
    acidity: 5,
    tannin: 0,
    body: 2,
    rating: 90,
    summary: '清爽活泼，酸度亮丽，热带水果风味明显。',
  },
  {
    id: 'tst-004',
    wineId: 'wine-004',
    date: '2025-01-01',
    color: '淡金黄',
    aroma: '烤面包、苹果、蜂蜜、酵母',
    sweetness: 2,
    acidity: 4,
    tannin: 0,
    body: 3,
    rating: 92,
    summary: '气泡细腻持久，烘烤类香气突出，优雅平衡。',
  },
  {
    id: 'tst-005',
    wineId: 'wine-005',
    date: '2025-08-08',
    color: '深红',
    aroma: '黑樱桃、巧克力、咖啡、香草',
    sweetness: 2,
    acidity: 3,
    tannin: 5,
    body: 5,
    rating: 94,
    summary: '新世界风格，果香浓郁，酒体饱满。',
  },
];

export const useWineStore = create<WineStore>((set, get) => ({
  wines: MOCK_WINES,
  tastings: MOCK_TASTINGS,

  addWine: (wineData) => {
    const colors = IMAGE_COLORS_BY_TYPE[wineData.type];
    const imageColor = colors[Math.floor(Math.random() * colors.length)];
    const newWine: Wine = {
      ...wineData,
      id: generateId(),
      imageColor,
    };
    set((state) => ({ wines: [...state.wines, newWine] }));
  },

  addTasting: (tastingData) => {
    const newTasting: Tasting = {
      ...tastingData,
      id: generateId(),
    };
    set((state) => ({ tastings: [...state.tastings, newTasting] }));
  },

  getWineById: (id) => {
    return get().wines.find((w) => w.id === id);
  },

  getTastingsByWineId: (wineId) => {
    return get().tastings
      .filter((t) => t.wineId === wineId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },
}));
