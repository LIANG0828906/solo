import type { Collection } from '@/types';

const STORAGE_KEY = 'collections';

const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const load = (): Collection[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  const seed: Collection[] = [
    {
      id: 'c1',
      name: '日常口粮',
      description: '适合每天饮用的高性价比好茶',
      teaIds: ['t1', 't2'],
      sortOrder: 0,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'c2',
      name: '待客佳品',
      description: '招待亲友的精品茶叶',
      teaIds: ['t3', 't4'],
      sortOrder: 1,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'c3',
      name: '珍稀好茶',
      description: '珍藏的稀有茶叶，不轻易品鉴',
      teaIds: ['t5', 't6'],
      sortOrder: 2,
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

const save = (data: Collection[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const collectionStore = {
  async getAll(): Promise<Collection[]> {
    const list = load();
    list.sort((a, b) => a.sortOrder - b.sortOrder);
    return delay(list);
  },

  async getById(id: string): Promise<Collection | null> {
    return delay(load().find((c) => c.id === id) ?? null);
  },

  async add(
    data: Omit<Collection, 'id' | 'sortOrder' | 'createdAt'>
  ): Promise<Collection> {
    const list = load();
    const now = new Date().toISOString();
    const collection: Collection = {
      ...data,
      id: 'c_' + Math.random().toString(36).slice(2, 10),
      sortOrder: list.length,
      createdAt: now,
    };
    list.push(collection);
    save(list);
    return delay(collection);
  },

  async update(id: string, data: Partial<Collection>): Promise<Collection | null> {
    const list = load();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return delay(null);
    list[idx] = { ...list[idx], ...data };
    save(list);
    return delay(list[idx]);
  },

  async delete(id: string): Promise<boolean> {
    const list = load();
    const filtered = list.filter((c) => c.id !== id);
    if (filtered.length === list.length) return delay(false);
    save(filtered);
    return delay(true);
  },

  async reorder(orderedIds: string[]): Promise<boolean> {
    const list = load();
    orderedIds.forEach((id, idx) => {
      const item = list.find((c) => c.id === id);
      if (item) item.sortOrder = idx;
    });
    save(list);
    return delay(true);
  },
};
