import { Snippet, Language } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'codecanvas_snippets';

export class StorageManager {
  static loadAll(): Snippet[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static save(name: string, code: string, language: Language): Snippet {
    const snippets = this.loadAll();
    const snippet: Snippet = {
      id: uuidv4(),
      name,
      code,
      language,
      lastModified: new Date().toISOString(),
    };
    snippets.push(snippet);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
    return snippet;
  }

  static delete(id: string): Snippet[] {
    const snippets = this.loadAll().filter((s) => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
    return snippets;
  }

  static getById(id: string): Snippet | undefined {
    return this.loadAll().find((s) => s.id === id);
  }
}
