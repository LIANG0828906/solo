import { v4 as uuidv4 } from 'uuid';
import type { Article, Task, Bookmark, CrossModuleReference, SearchResult } from './types';

const STORAGE_KEYS = {
  articles: 'kb_articles',
  tasks: 'kb_tasks',
  bookmarks: 'kb_bookmarks',
} as const;

function readData<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const articleApi = {
  getAll(): Article[] {
    return readData<Article>(STORAGE_KEYS.articles);
  },
  getById(id: string): Article | undefined {
    return this.getAll().find(a => a.id === id);
  },
  create(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>): Article {
    const articles = this.getAll();
    const now = new Date().toISOString();
    const article: Article = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    articles.push(article);
    writeData(STORAGE_KEYS.articles, articles);
    return article;
  },
  update(id: string, data: Partial<Article>): Article | undefined {
    const articles = this.getAll();
    const idx = articles.findIndex(a => a.id === id);
    if (idx === -1) return undefined;
    articles[idx] = { ...articles[idx], ...data, updatedAt: new Date().toISOString() };
    writeData(STORAGE_KEYS.articles, articles);
    return articles[idx];
  },
  delete(id: string): boolean {
    const articles = this.getAll();
    const filtered = articles.filter(a => a.id !== id);
    if (filtered.length === articles.length) return false;
    writeData(STORAGE_KEYS.articles, filtered);
    return true;
  },
  search(keyword: string): Article[] {
    const kw = keyword.toLowerCase();
    return this.getAll().filter(
      a => a.title.toLowerCase().includes(kw) || a.content.toLowerCase().includes(kw)
    );
  },
};

export const taskApi = {
  getAll(): Task[] {
    return readData<Task>(STORAGE_KEYS.tasks);
  },
  getById(id: string): Task | undefined {
    return this.getAll().find(t => t.id === id);
  },
  create(data: Omit<Task, 'id' | 'createdAt'>): Task {
    const tasks = this.getAll();
    const task: Task = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    writeData(STORAGE_KEYS.tasks, tasks);
    return task;
  },
  update(id: string, data: Partial<Task>): Task | undefined {
    const tasks = this.getAll();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    tasks[idx] = { ...tasks[idx], ...data };
    writeData(STORAGE_KEYS.tasks, tasks);
    return tasks[idx];
  },
  delete(id: string): boolean {
    const tasks = this.getAll();
    const filtered = tasks.filter(t => t.id !== id);
    if (filtered.length === tasks.length) return false;
    writeData(STORAGE_KEYS.tasks, filtered);
    return true;
  },
  search(keyword: string): Task[] {
    const kw = keyword.toLowerCase();
    return this.getAll().filter(
      t => t.title.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw)
    );
  },
};

export const bookmarkApi = {
  getAll(): Bookmark[] {
    return readData<Bookmark>(STORAGE_KEYS.bookmarks);
  },
  getById(id: string): Bookmark | undefined {
    return this.getAll().find(b => b.id === id);
  },
  create(data: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const bookmarks = this.getAll();
    const bookmark: Bookmark = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    bookmarks.push(bookmark);
    writeData(STORAGE_KEYS.bookmarks, bookmarks);
    return bookmark;
  },
  update(id: string, data: Partial<Bookmark>): Bookmark | undefined {
    const bookmarks = this.getAll();
    const idx = bookmarks.findIndex(b => b.id === id);
    if (idx === -1) return undefined;
    bookmarks[idx] = { ...bookmarks[idx], ...data };
    writeData(STORAGE_KEYS.bookmarks, bookmarks);
    return bookmarks[idx];
  },
  delete(id: string): boolean {
    const bookmarks = this.getAll();
    const filtered = bookmarks.filter(b => b.id !== id);
    if (filtered.length === bookmarks.length) return false;
    writeData(STORAGE_KEYS.bookmarks, filtered);
    return true;
  },
  search(keyword: string): Bookmark[] {
    const kw = keyword.toLowerCase();
    return this.getAll().filter(
      b => b.title.toLowerCase().includes(kw) || b.url.toLowerCase().includes(kw)
    );
  },
  getGroups(): string[] {
    const groups = new Set(this.getAll().map(b => b.group));
    return Array.from(groups);
  },
};

export function checkArticleReferences(articleId: string): CrossModuleReference[] {
  const tasks = taskApi.getAll();
  return tasks
    .filter(t => t.articleRef === articleId)
    .map(t => ({ type: 'task' as const, id: t.id, title: t.title }));
}

export function globalSearch(keyword: string): SearchResult[] {
  if (!keyword.trim()) return [];
  const results: SearchResult[] = [];
  articleApi.search(keyword).forEach(a => {
    results.push({
      module: 'article',
      id: a.id,
      title: a.title,
      excerpt: a.content.slice(0, 80),
    });
  });
  taskApi.search(keyword).forEach(t => {
    results.push({
      module: 'task',
      id: t.id,
      title: t.title,
      excerpt: t.description.slice(0, 80),
    });
  });
  bookmarkApi.search(keyword).forEach(b => {
    results.push({
      module: 'bookmark',
      id: b.id,
      title: b.title,
      excerpt: b.url,
    });
  });
  return results;
}

export function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return '';
  }
}
