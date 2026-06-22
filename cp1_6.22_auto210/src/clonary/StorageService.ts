import { PathData, PathPoint } from '../types';

const STORAGE_KEY = 'svg_path_clone_library';

export class StorageService {
  static getAll(): PathData[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw) as PathData[];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  static saveAll(paths: PathData[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
    } catch (e) {
      console.error('Failed to save paths:', e);
    }
  }

  static getById(id: string): PathData | null {
    const paths = this.getAll();
    return paths.find(p => p.id === id) || null;
  }

  static create(name: string, points: PathPoint[]): PathData {
    const paths = this.getAll();
    const now = Date.now();
    const newPath: PathData = {
      id: `path_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.slice(0, 20) || `路径 ${paths.length + 1}`,
      points: JSON.parse(JSON.stringify(points)),
      createdAt: now,
      updatedAt: now
    };
    paths.push(newPath);
    this.saveAll(paths);
    return newPath;
  }

  static update(id: string, updates: Partial<Omit<PathData, 'id' | 'createdAt'>>): PathData | null {
    const paths = this.getAll();
    const index = paths.findIndex(p => p.id === id);
    if (index === -1) return null;

    paths[index] = {
      ...paths[index],
      ...updates,
      points: updates.points ? JSON.parse(JSON.stringify(updates.points)) : paths[index].points,
      updatedAt: Date.now()
    };

    if (updates.name) {
      paths[index].name = updates.name.slice(0, 20);
    }

    this.saveAll(paths);
    return paths[index];
  }

  static delete(id: string): boolean {
    const paths = this.getAll();
    const filtered = paths.filter(p => p.id !== id);
    if (filtered.length === paths.length) return false;
    this.saveAll(filtered);
    return true;
  }

  static rename(id: string, name: string): PathData | null {
    return this.update(id, { name: name.slice(0, 20) });
  }

  static reorder(fromIndex: number, toIndex: number): PathData[] {
    const paths = this.getAll();
    if (fromIndex < 0 || fromIndex >= paths.length || toIndex < 0 || toIndex >= paths.length) {
      return paths;
    }
    const [removed] = paths.splice(fromIndex, 1);
    paths.splice(toIndex, 0, removed);
    this.saveAll(paths);
    return paths;
  }

  static clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
