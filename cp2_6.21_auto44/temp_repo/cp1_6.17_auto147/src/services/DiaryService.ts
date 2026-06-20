import type { DiaryEntry } from '../types';

const API_BASE = '/api';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DiaryService = {
  async getEntriesByMonth(month: string): Promise<DiaryEntry[]> {
    const res = await fetch(`${API_BASE}/entries?month=${month}`);
    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
  },

  async getAllEntries(): Promise<DiaryEntry[]> {
    const res = await fetch(`${API_BASE}/entries`);
    if (!res.ok) throw new Error('Failed to fetch entries');
    return res.json();
  },

  async getEntry(id: string): Promise<DiaryEntry> {
    const res = await fetch(`${API_BASE}/entries/${id}`);
    if (!res.ok) throw new Error('Failed to fetch entry');
    return res.json();
  },

  async createEntry(entry: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<DiaryEntry> {
    await delay(100);
    const res = await fetch(`${API_BASE}/entries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to create entry');
    return res.json();
  },

  async updateEntry(id: string, entry: Partial<DiaryEntry>): Promise<DiaryEntry> {
    await delay(100);
    const res = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Failed to update entry');
    return res.json();
  },

  async deleteEntry(id: string): Promise<boolean> {
    await delay(80);
    const res = await fetch(`${API_BASE}/entries/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete entry');
    return true;
  }
};
