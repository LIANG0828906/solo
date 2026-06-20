import type { Excerpt } from '../types';

const STORAGE_KEY = 'shuzhaige_excerpts';

export function loadExcerpts(): Excerpt[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as Excerpt[];
  } catch {
    return [];
  }
}

export function saveExcerpts(excerpts: Excerpt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(excerpts));
  } catch (e) {
    console.error('保存失败:', e);
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}
