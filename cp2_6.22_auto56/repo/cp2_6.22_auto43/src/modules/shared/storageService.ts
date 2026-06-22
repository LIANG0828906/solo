import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';
import type { EmotionRecord, EmotionType } from './types';

export class EmotionDatabase extends Dexie {
  records!: Table<EmotionRecord, string>;

  constructor() {
    super('EmotionTrackerDB');
    this.version(1).stores({
      records: 'id, date, timestamp, emotion'
    });
  }
}

const db = new EmotionDatabase();

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export const storageService = {
  async addRecord(record: Omit<EmotionRecord, 'id'>): Promise<string> {
    const id = uuidv4();
    await db.records.add({ ...record, id });
    return id;
  },

  async getRecordsByDateRange(startDate: string, endDate: string): Promise<EmotionRecord[]> {
    return db.records
      .where('date')
      .between(startDate, endDate, true, true)
      .reverse()
      .sortBy('timestamp');
  },

  async getRecordsByMonth(year: number, month: number): Promise<EmotionRecord[]> {
    const startDate = formatDate(new Date(year, month, 1));
    const endDate = formatDate(new Date(year, month + 1, 0));
    return this.getRecordsByDateRange(startDate, endDate);
  },

  async getRecordsByEmotion(emotion: EmotionType): Promise<EmotionRecord[]> {
    return db.records.where('emotion').equals(emotion).reverse().sortBy('timestamp');
  },

  async getRecentRecords(days: number): Promise<EmotionRecord[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    return this.getRecordsByDateRange(formatDate(startDate), formatDate(endDate));
  },

  async deleteRecord(id: string): Promise<void> {
    await db.records.delete(id);
  },

  exportToJson(records: EmotionRecord[]): string {
    return JSON.stringify(records, null, 2);
  },

  downloadJson(data: string, filename: string): void {
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

export { formatDate };
