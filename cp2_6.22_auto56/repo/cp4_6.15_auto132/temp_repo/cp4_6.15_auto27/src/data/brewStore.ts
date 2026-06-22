import type { BrewRecord, TastingNote, StarScore } from '@/types';

const BREW_KEY = 'brew_records';
const NOTE_KEY = 'tasting_notes';

const delay = <T>(data: T, ms = 200): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const loadBrews = (): BrewRecord[] => {
  try {
    const raw = localStorage.getItem(BREW_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  const seed: BrewRecord[] = [
    {
      id: 'b1',
      teaId: 't1',
      temperature: 85,
      teaAmount: 3.0,
      brewTime: 30,
      brewCount: 1,
      pourMethod: '高冲',
      vessel: '玻璃杯',
      createdAt: '2025-05-10T08:30:00.000Z',
    },
    {
      id: 'b2',
      teaId: 't1',
      temperature: 85,
      teaAmount: 3.0,
      brewTime: 45,
      brewCount: 2,
      pourMethod: '高冲',
      vessel: '玻璃杯',
      createdAt: '2025-05-10T08:35:00.000Z',
    },
    {
      id: 'b3',
      teaId: 't3',
      temperature: 95,
      teaAmount: 7.0,
      brewTime: 20,
      brewCount: 1,
      pourMethod: '环绕',
      vessel: '盖碗',
      createdAt: '2025-05-08T10:15:00.000Z',
    },
  ];
  localStorage.setItem(BREW_KEY, JSON.stringify(seed));
  return seed;
};

const loadNotes = (): TastingNote[] => {
  try {
    const raw = localStorage.getItem(NOTE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* noop */
  }
  const seed: TastingNote[] = [
    {
      id: 'n1',
      brewRecordId: 'b1',
      dryAroma: '豆香浓郁，带有炒豆香',
      liquorColor: '浅绿',
      wetAroma: '兰花香清新',
      taste: '鲜爽',
      huiganScore: 4,
      leafCompleteness: 5,
      leafUniformity: 4,
      notes: '早春明前茶，香气高扬，回甘迅速，叶底嫩绿匀整。',
      overallScore: 92,
    },
    {
      id: 'n2',
      brewRecordId: 'b2',
      dryAroma: '豆香持久',
      liquorColor: '浅绿',
      wetAroma: '栗香明显',
      taste: '甘甜',
      huiganScore: 5,
      leafCompleteness: 5,
      leafUniformity: 5,
      notes: '第二泡滋味更醇厚，回甘绵长，令人愉悦。',
      overallScore: 95,
    },
    {
      id: 'n3',
      brewRecordId: 'b3',
      dryAroma: '兰花香馥郁，观音韵十足',
      liquorColor: '金黄',
      wetAroma: '花香果香交织',
      taste: '醇厚',
      huiganScore: 5,
      leafCompleteness: 4,
      leafUniformity: 5,
      notes: '秋茶铁观音，香气高锐，七泡仍有余香，不愧为极品。',
      overallScore: 96,
    },
  ];
  localStorage.setItem(NOTE_KEY, JSON.stringify(seed));
  return seed;
};

export const calculateOverallScore = (
  huigan: StarScore,
  completeness: StarScore,
  uniformity: StarScore
): number => {
  const avg = (huigan * 20 + completeness * 15 + uniformity * 15) / 50;
  return Math.round(avg * 100);
};

export const brewStore = {
  async getAllByTeaId(teaId: string): Promise<BrewRecord[]> {
    const list = loadBrews().filter((b) => b.teaId === teaId);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return delay(list);
  },

  async getById(id: string): Promise<BrewRecord | null> {
    return delay(loadBrews().find((b) => b.id === id) ?? null);
  },

  async add(
    data: Omit<BrewRecord, 'id' | 'createdAt'>
  ): Promise<BrewRecord> {
    const list = loadBrews();
    const now = new Date().toISOString();
    const record: BrewRecord = {
      ...data,
      id: 'b_' + Math.random().toString(36).slice(2, 10),
      createdAt: now,
    };
    list.push(record);
    localStorage.setItem(BREW_KEY, JSON.stringify(list));
    return delay(record);
  },

  async update(id: string, data: Partial<BrewRecord>): Promise<BrewRecord | null> {
    const list = loadBrews();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) return delay(null);
    list[idx] = { ...list[idx], ...data };
    localStorage.setItem(BREW_KEY, JSON.stringify(list));
    return delay(list[idx]);
  },

  async delete(id: string): Promise<boolean> {
    const list = loadBrews();
    const filtered = list.filter((b) => b.id !== id);
    if (filtered.length === list.length) return delay(false);
    localStorage.setItem(BREW_KEY, JSON.stringify(filtered));
    return delay(true);
  },
};

export const tastingNoteStore = {
  async getByBrewRecordId(brewRecordId: string): Promise<TastingNote | null> {
    return delay(loadNotes().find((n) => n.brewRecordId === brewRecordId) ?? null);
  },

  async getAllByTeaId(teaId: string): Promise<TastingNote[]> {
    const brews = loadBrews().filter((b) => b.teaId === teaId).map((b) => b.id);
    return delay(loadNotes().filter((n) => brews.includes(n.brewRecordId)));
  },

  async add(data: Omit<TastingNote, 'id'>): Promise<TastingNote> {
    const list = loadNotes();
    const note: TastingNote = {
      ...data,
      id: 'n_' + Math.random().toString(36).slice(2, 10),
    };
    list.push(note);
    localStorage.setItem(NOTE_KEY, JSON.stringify(list));
    return delay(note);
  },

  async update(id: string, data: Partial<TastingNote>): Promise<TastingNote | null> {
    const list = loadNotes();
    const idx = list.findIndex((n) => n.id === id);
    if (idx === -1) return delay(null);
    list[idx] = { ...list[idx], ...data };
    localStorage.setItem(NOTE_KEY, JSON.stringify(list));
    return delay(list[idx]);
  },

  async delete(id: string): Promise<boolean> {
    const list = loadNotes();
    const filtered = list.filter((n) => n.id !== id);
    if (filtered.length === list.length) return delay(false);
    localStorage.setItem(NOTE_KEY, JSON.stringify(filtered));
    return delay(true);
  },
};
