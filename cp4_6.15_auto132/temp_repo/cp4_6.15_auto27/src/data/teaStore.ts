import type { Tea, TeaFilters } from '@/types';

const STORAGE_KEY = 'tea_archive';

const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const loadFromStorage = (): Tea[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  const seed: Tea[] = [
    {
      id: 't1',
      name: '西湖龙井',
      province: '浙江省',
      city: '杭州市',
      region: '西湖区',
      variety: '绿茶',
      year: 2024,
      season: '春',
      processType: '炒青',
      appearance: '扁平光滑，色泽翠绿',
      photos: [],
      description: '中国十大名茶之首，香气清高持久，滋味鲜醇甘爽。',
      lastBrewDate: '2025-05-10T08:30:00.000Z',
      createdAt: '2024-03-15T00:00:00.000Z',
      updatedAt: '2025-05-10T08:30:00.000Z',
    },
    {
      id: 't2',
      name: '正山小种',
      province: '福建省',
      city: '南平市',
      region: '武夷山市',
      variety: '红茶',
      year: 2023,
      season: '春',
      processType: '全发酵',
      appearance: '条索紧结，色泽乌润',
      photos: [],
      description: '世界红茶鼻祖，带有独特的松烟香和桂圆汤味。',
      lastBrewDate: '2025-04-22T14:00:00.000Z',
      createdAt: '2024-01-10T00:00:00.000Z',
      updatedAt: '2025-04-22T14:00:00.000Z',
    },
    {
      id: 't3',
      name: '铁观音',
      province: '福建省',
      city: '泉州市',
      region: '安溪县',
      variety: '乌龙茶',
      year: 2024,
      season: '秋',
      processType: '半发酵',
      appearance: '颗粒紧结，色泽砂绿',
      photos: [],
      description: '观音韵明显，兰花香馥郁，七泡有余香。',
      lastBrewDate: '2025-05-08T10:15:00.000Z',
      createdAt: '2024-10-20T00:00:00.000Z',
      updatedAt: '2025-05-08T10:15:00.000Z',
    },
    {
      id: 't4',
      name: '白毫银针',
      province: '福建省',
      city: '宁德市',
      region: '福鼎市',
      variety: '白茶',
      year: 2022,
      season: '春',
      processType: '微发酵',
      appearance: '芽头肥壮，满披白毫',
      photos: [],
      description: '白茶极品，汤色杏黄明亮，毫香显著，滋味清甜。',
      createdAt: '2023-05-01T00:00:00.000Z',
      updatedAt: '2023-05-01T00:00:00.000Z',
    },
    {
      id: 't5',
      name: '君山银针',
      province: '湖南省',
      city: '岳阳市',
      region: '君山区',
      variety: '黄茶',
      year: 2024,
      season: '春',
      processType: '闷黄',
      appearance: '芽头茁壮，金黄光亮',
      photos: [],
      description: '黄茶代表，汤色杏黄明净，香气清鲜，滋味甘醇。',
      createdAt: '2024-04-12T00:00:00.000Z',
      updatedAt: '2024-04-12T00:00:00.000Z',
    },
    {
      id: 't6',
      name: '普洱生茶',
      province: '云南省',
      city: '西双版纳',
      region: '勐海县',
      variety: '普洱',
      year: 2020,
      season: '春',
      processType: '后发酵',
      appearance: '条索肥壮，白毫显露',
      photos: [],
      description: '古树纯料，越陈越香，汤色黄绿，回甘强烈。',
      lastBrewDate: '2025-05-01T16:00:00.000Z',
      createdAt: '2021-06-18T00:00:00.000Z',
      updatedAt: '2025-05-01T16:00:00.000Z',
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

const saveToStorage = (data: Tea[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const teaStore = {
  async getAll(filters?: TeaFilters): Promise<Tea[]> {
    const list = loadFromStorage();
    if (!filters) return delay(list);
    const filtered = list.filter((t) => {
      if (filters.variety && t.variety !== filters.variety) return false;
      if (filters.province && t.province !== filters.province) return false;
      if (filters.city && t.city !== filters.city) return false;
      if (filters.region && t.region !== filters.region) return false;
      if (filters.year && t.year !== filters.year) return false;
      return true;
    });
    return delay(filtered);
  },

  async getById(id: string): Promise<Tea | null> {
    const list = loadFromStorage();
    return delay(list.find((t) => t.id === id) ?? null);
  },

  async add(data: Omit<Tea, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tea> {
    const list = loadFromStorage();
    const now = new Date().toISOString();
    const tea: Tea = {
      ...data,
      id: 't_' + Math.random().toString(36).slice(2, 10),
      createdAt: now,
      updatedAt: now,
    };
    list.unshift(tea);
    saveToStorage(list);
    return delay(tea);
  },

  async update(id: string, data: Partial<Tea>): Promise<Tea | null> {
    const list = loadFromStorage();
    const idx = list.findIndex((t) => t.id === id);
    if (idx === -1) return delay(null);
    list[idx] = {
      ...list[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveToStorage(list);
    return delay(list[idx]);
  },

  async delete(id: string): Promise<boolean> {
    const list = loadFromStorage();
    const filtered = list.filter((t) => t.id !== id);
    if (filtered.length === list.length) return delay(false);
    saveToStorage(filtered);
    return delay(true);
  },
};
