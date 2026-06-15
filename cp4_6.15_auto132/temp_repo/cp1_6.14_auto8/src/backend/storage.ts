import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Category = 'top' | 'bottom' | 'outerwear' | 'shoes' | 'accessory';
export type Mood = 'happy' | 'calm' | 'sad' | 'excited' | 'tired';

export interface Clothing {
  id: string;
  name: string;
  category: Category;
  color: string;
  imageUrl: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  clothingIds: string[];
  mood: Mood;
  note: string;
  outfitImage?: string;
}

export interface OutfitRecommendation {
  id: string;
  pattern: {
    color: string;
    category: Category;
  }[];
  frequency: number;
  sampleClothingIds: string[];
}

interface Database {
  clothing: Clothing[];
  diaries: DiaryEntry[];
}

const dbFilePath = path.join(__dirname, '../../data/db.json');

class Storage {
  private db: Low<Database>;

  private async initDb(): Promise<Low<Database>> {
    const adapter = new JSONFile<Database>(dbFilePath);
    const db = new Low(adapter, {
      clothing: [],
      diaries: [],
    });

    if (!fs.existsSync(dbFilePath)) {
      const dataDir = path.dirname(dbFilePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      await db.write();
    } else {
      await db.read();
    }

    return db;
  }

  constructor() {
    this.db = {} as Low<Database>;
    this.initDb().then((db) => {
      this.db = db;
    });
  }

  private async ensureDb(): Promise<void> {
    if (!this.db || !this.db.data) {
      this.db = await this.initDb();
    }
  }

  async getClothing(): Promise<Clothing[]> {
    await this.ensureDb();
    return [...this.db.data.clothing].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async addClothing(
    data: Omit<Clothing, 'id' | 'createdAt'>
  ): Promise<Clothing> {
    await this.ensureDb();
    const clothing: Clothing = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    this.db.data.clothing.push(clothing);
    await this.db.write();
    return clothing;
  }

  async updateClothing(
    id: string,
    data: Partial<Omit<Clothing, 'id' | 'createdAt'>>
  ): Promise<Clothing | null> {
    await this.ensureDb();
    const index = this.db.data.clothing.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.db.data.clothing[index] = {
      ...this.db.data.clothing[index],
      ...data,
    };
    await this.db.write();
    return this.db.data.clothing[index];
  }

  async deleteClothing(id: string): Promise<boolean> {
    await this.ensureDb();
    const index = this.db.data.clothing.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.db.data.clothing.splice(index, 1);

    this.db.data.diaries.forEach((diary) => {
      diary.clothingIds = diary.clothingIds.filter((cid) => cid !== id);
    });

    await this.db.write();
    return true;
  }

  async getDiaries(): Promise<DiaryEntry[]> {
    await this.ensureDb();
    return [...this.db.data.diaries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async addDiary(
    data: Omit<DiaryEntry, 'id'>
  ): Promise<DiaryEntry> {
    await this.ensureDb();
    const diary: DiaryEntry = {
      ...data,
      id: uuidv4(),
    };
    this.db.data.diaries.push(diary);
    await this.db.write();
    return diary;
  }

  async updateDiary(
    id: string,
    data: Partial<Omit<DiaryEntry, 'id'>>
  ): Promise<DiaryEntry | null> {
    await this.ensureDb();
    const index = this.db.data.diaries.findIndex((d) => d.id === id);
    if (index === -1) return null;
    this.db.data.diaries[index] = {
      ...this.db.data.diaries[index],
      ...data,
    };
    await this.db.write();
    return this.db.data.diaries[index];
  }

  async deleteDiary(id: string): Promise<boolean> {
    await this.ensureDb();
    const index = this.db.data.diaries.findIndex((d) => d.id === id);
    if (index === -1) return false;
    this.db.data.diaries.splice(index, 1);
    await this.db.write();
    return true;
  }

  async getRecommendations(): Promise<OutfitRecommendation[]> {
    await this.ensureDb();
    const { clothing, diaries } = this.db.data;

    if (diaries.length === 0 || clothing.length === 0) {
      return [];
    }

    const clothingMap = new Map<string, Clothing>();
    clothing.forEach((c) => clothingMap.set(c.id, c));

    const patternMap = new Map<string, { items: { color: string; category: Category }[]; count: number; sampleIds: string[] }>();

    for (const diary of diaries) {
      const items: { color: string; category: Category }[] = [];
      const ids: string[] = [];

      for (const cid of diary.clothingIds) {
        const c = clothingMap.get(cid);
        if (c) {
          items.push({ color: c.color, category: c.category });
          ids.push(c.id);
        }
      }

      if (items.length === 0) continue;

      const key = items
        .sort((a, b) => a.category.localeCompare(b.category))
        .map((i) => `${i.category}:${i.color}`)
        .join('|');

      const existing = patternMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        patternMap.set(key, {
          items: items.sort((a, b) => a.category.localeCompare(b.category)),
          count: 1,
          sampleIds: ids,
        });
      }
    }

    const sortedPatterns = [...patternMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return sortedPatterns.map((p, index) => ({
      id: `rec-${index}-${Date.now()}`,
      pattern: p.items,
      frequency: p.count,
      sampleClothingIds: p.sampleIds,
    }));
  }
}

export const storage = new Storage();
