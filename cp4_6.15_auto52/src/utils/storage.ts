import type { Book, ReadingPlan } from '@/types';

const STORAGE_KEYS = {
  BOOKS: 'library_books',
  PLAN: 'library_plan',
};

export function saveBooks(books: Book[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  } catch (e) {
    console.error('Failed to save books to localStorage:', e);
  }
}

export function loadBooks(): Book[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.BOOKS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load books from localStorage:', e);
    return [];
  }
}

export function savePlan(plan: ReadingPlan | null): void {
  try {
    if (plan) {
      localStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PLAN);
    }
  } catch (e) {
    console.error('Failed to save plan to localStorage:', e);
  }
}

export function loadPlan(): ReadingPlan | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PLAN);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load plan from localStorage:', e);
    return null;
  }
}
