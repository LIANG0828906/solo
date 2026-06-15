import type { BookMark, CreateBookmarkDto, UpdateBookmarkDto } from '@/types';

const API_BASE = '/api/bookmarks';

export const bookmarkApi = {
  async getAll(): Promise<BookMark[]> {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to fetch bookmarks');
    return res.json();
  },

  async getById(id: string): Promise<BookMark> {
    const res = await fetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Failed to fetch bookmark');
    return res.json();
  },

  async create(data: CreateBookmarkDto): Promise<BookMark> {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create bookmark');
    return res.json();
  },

  async update(id: string, data: UpdateBookmarkDto): Promise<BookMark> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update bookmark');
    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete bookmark');
  },
};
