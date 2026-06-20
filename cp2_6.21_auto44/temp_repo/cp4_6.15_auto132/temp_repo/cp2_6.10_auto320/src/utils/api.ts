import type { Flower, BoxResult, GameState, GardenFlower, WeatherEvent, WeeklyReport, Season } from '@/types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

export const getFlowers = async (): Promise<Flower[]> => {
  return request<Flower[]>('/flowers');
};

export const getFlowerById = async (id: string): Promise<Flower> => {
  return request<Flower>(`/flowers/${id}`);
};

export const openBlindBox = async (season: Season, state: GameState): Promise<BoxResult> => {
  return request<BoxResult>('/box/open', {
    method: 'POST',
    body: JSON.stringify({ season, state }),
  });
};

export const generateReport = async (
  flowers: GardenFlower[],
  weatherEvents: WeatherEvent[]
): Promise<WeeklyReport> => {
  return request<WeeklyReport>('/report/generate', {
    method: 'POST',
    body: JSON.stringify({ flowers, weatherEvents }),
  });
};

export const mockFlowers: Flower[] = [
  { id: 'spring_001', name: '樱花', season: 'spring', rarity: 'rare', emoji: '🌸', color: '#ffb7c5', description: '春日最美的粉色精灵', growthTime: 3000, isMagic: false },
  { id: 'spring_002', name: '郁金香', season: 'spring', rarity: 'uncommon', emoji: '🌷', color: '#ff6b6b', description: '优雅的春日舞者', growthTime: 2500, isMagic: false },
  { id: 'spring_003', name: '迎春', season: 'spring', rarity: 'common', emoji: '🌼', color: '#ffd93d', description: '春天的第一缕阳光', growthTime: 2000, isMagic: false },
  { id: 'spring_004', name: '杜鹃', season: 'spring', rarity: 'uncommon', emoji: '🌺', color: '#ff4757', description: '满山遍野的热情', growthTime: 2800, isMagic: false },
  { id: 'spring_005', name: '紫藤', season: 'spring', rarity: 'rare', emoji: '💜', color: '#a855f7', description: '梦幻的紫色瀑布', growthTime: 3500, isMagic: false },
  { id: 'spring_006', name: '彩虹花', season: 'spring', rarity: 'legendary', emoji: '🌈', color: '#f472b6', description: '传说中的七色魔法花', growthTime: 5000, isMagic: true },
  { id: 'summer_001', name: '荷花', season: 'summer', rarity: 'uncommon', emoji: '🪷', color: '#f9a8d4', description: '出淤泥而不染', growthTime: 3000, isMagic: false },
  { id: 'summer_002', name: '向日葵', season: 'summer', rarity: 'common', emoji: '🌻', color: '#fbbf24', description: '永远追逐阳光', growthTime: 2500, isMagic: false },
  { id: 'summer_003', name: '玫瑰', season: 'summer', rarity: 'rare', emoji: '🌹', color: '#dc2626', description: '爱情的永恒象征', growthTime: 3200, isMagic: false },
  { id: 'summer_004', name: '茉莉', season: 'summer', rarity: 'uncommon', emoji: '🤍', color: '#fafafa', description: '夏夜的清香', growthTime: 2800, isMagic: false },
  { id: 'summer_005', name: '牵牛', season: 'summer', rarity: 'common', emoji: '🌊', color: '#60a5fa', description: '清晨的小喇叭', growthTime: 2000, isMagic: false },
  { id: 'summer_006', name: '太阳花', season: 'summer', rarity: 'legendary', emoji: '☀️', color: '#f59e0b', description: '凝聚阳光能量的魔法花', growthTime: 5500, isMagic: true },
  { id: 'autumn_001', name: '菊花', season: 'autumn', rarity: 'uncommon', emoji: '🏵️', color: '#f59e0b', description: '傲霜的秋日君子', growthTime: 3000, isMagic: false },
  { id: 'autumn_002', name: '桂花', season: 'autumn', rarity: 'common', emoji: '🍂', color: '#fcd34d', description: '金秋的甜香', growthTime: 2200, isMagic: false },
  { id: 'autumn_003', name: '木槿', season: 'autumn', rarity: 'uncommon', emoji: '🌺', color: '#ec4899', description: '坚韧的秋日之花', growthTime: 2600, isMagic: false },
  { id: 'autumn_004', name: '石蒜', season: 'autumn', rarity: 'rare', emoji: '🌶️', color: '#ef4444', description: '神秘的彼岸之花', growthTime: 3500, isMagic: false },
  { id: 'autumn_005', name: '秋海棠', season: 'autumn', rarity: 'uncommon', emoji: '🍁', color: '#dc2626', description: '秋日的热情', growthTime: 2800, isMagic: false },
  { id: 'autumn_006', name: '月光菊', season: 'autumn', rarity: 'legendary', emoji: '🌙', color: '#c4b5fd', description: '吸收月光精华的魔法花', growthTime: 5200, isMagic: true },
  { id: 'winter_001', name: '梅花', season: 'winter', rarity: 'rare', emoji: '❄️', color: '#fce7f3', description: '凌寒独自开', growthTime: 3500, isMagic: false },
  { id: 'winter_002', name: '水仙', season: 'winter', rarity: 'uncommon', emoji: '🤍', color: '#ffffff', description: '冬日的水中仙子', growthTime: 3000, isMagic: false },
  { id: 'winter_003', name: '山茶', season: 'winter', rarity: 'uncommon', emoji: '🌷', color: '#f43f5e', description: '冬日的热情', growthTime: 2800, isMagic: false },
  { id: 'winter_004', name: '一品红', season: 'winter', rarity: 'common', emoji: '🎄', color: '#dc2626', description: '节日的喜庆', growthTime: 2000, isMagic: false },
  { id: 'winter_005', name: '蟹爪兰', season: 'winter', rarity: 'uncommon', emoji: '💮', color: '#ec4899', description: '冬日的绽放', growthTime: 2600, isMagic: false },
  { id: 'winter_006', name: '雪莲', season: 'winter', rarity: 'legendary', emoji: '🏔️', color: '#e0f2fe', description: '雪山之巅的神圣魔法花', growthTime: 6000, isMagic: true },
];
