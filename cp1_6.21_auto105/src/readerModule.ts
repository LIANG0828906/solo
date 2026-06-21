import { v4 as uuidv4 } from 'uuid';
import type { Annotation, Bookmark, ReadingState, SaveStatus } from './types';

type ChangeCallback = (state: ReadingState) => void;

interface ReaderModuleOptions {
  autoSaveInterval?: number;
  onSave?: (state: ReadingState) => Promise<void> | void;
}

export class ReaderModule {
  private state: ReadingState;
  private saveStatus: SaveStatus = 'idle';
  private callbacks: Set<ChangeCallback> = new Set();
  private autoSaveInterval: number;
  private onSave?: (state: ReadingState) => Promise<void> | void;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingChanges = false;

  constructor(initialState?: Partial<ReadingState>, options: ReaderModuleOptions = {}) {
    this.state = {
      currentChapter: 0,
      scrollPercentage: 0,
      annotations: [],
      bookmarks: [],
      ...initialState,
    };
    this.autoSaveInterval = options.autoSaveInterval ?? 5000;
    this.onSave = options.onSave;
  }

  private notify(): void {
    const snapshot = this.getState();
    this.callbacks.forEach((callback) => {
      try {
        callback(snapshot);
      } catch (error) {
        console.error('ReaderModule callback error:', error);
      }
    });
  }

  private scheduleSave(): void {
    this.pendingChanges = true;

    if (this.saveTimer) {
      return;
    }

    this.saveTimer = setTimeout(() => {
      void this.save();
    }, this.autoSaveInterval);
  }

  private async save(): Promise<void> {
    if (!this.pendingChanges || !this.onSave) {
      this.saveTimer = null;
      return;
    }

    try {
      this.saveStatus = 'saving';
      this.state.lastSavedAt = new Date();
      await this.onSave(this.getState());
      this.saveStatus = 'saved';
      this.pendingChanges = false;
    } catch (error) {
      this.saveStatus = 'error';
      console.error('ReaderModule save error:', error);
    } finally {
      this.saveTimer = null;

      if (this.pendingChanges) {
        this.scheduleSave();
      }
    }
  }

  setCurrentChapter(index: number): void {
    if (index === this.state.currentChapter) return;
    this.state.currentChapter = index;
    this.notify();
    this.scheduleSave();
  }

  setScrollPercentage(percent: number): void {
    const clampedPercent = Math.max(0, Math.min(100, percent));
    if (Math.abs(clampedPercent - this.state.scrollPercentage) < 0.01) return;
    this.state.scrollPercentage = clampedPercent;
    this.notify();
    this.scheduleSave();
  }

  addAnnotation(annotation: Omit<Annotation, 'id' | 'createdAt'>): Annotation {
    const newAnnotation: Annotation = {
      ...annotation,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.state.annotations.push(newAnnotation);
    this.notify();
    this.scheduleSave();
    return newAnnotation;
  }

  updateAnnotation(id: string, updates: Partial<Annotation>): boolean {
    const index = this.state.annotations.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.state.annotations[index] = {
      ...this.state.annotations[index],
      ...updates,
    };
    this.notify();
    this.scheduleSave();
    return true;
  }

  deleteAnnotation(id: string): boolean {
    const initialLength = this.state.annotations.length;
    this.state.annotations = this.state.annotations.filter((a) => a.id !== id);
    if (this.state.annotations.length === initialLength) return false;

    this.notify();
    this.scheduleSave();
    return true;
  }

  addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Bookmark {
    const newBookmark: Bookmark = {
      ...bookmark,
      id: uuidv4(),
      createdAt: new Date(),
    };
    this.state.bookmarks.push(newBookmark);
    this.notify();
    this.scheduleSave();
    return newBookmark;
  }

  deleteBookmark(id: string): boolean {
    const initialLength = this.state.bookmarks.length;
    this.state.bookmarks = this.state.bookmarks.filter((b) => b.id !== id);
    if (this.state.bookmarks.length === initialLength) return false;

    this.notify();
    this.scheduleSave();
    return true;
  }

  getState(): ReadingState {
    return {
      ...this.state,
      annotations: [...this.state.annotations],
      bookmarks: [...this.state.bookmarks],
    };
  }

  setState(state: Partial<ReadingState>): void {
    this.state = {
      ...this.state,
      ...state,
      annotations: state.annotations ?? this.state.annotations,
      bookmarks: state.bookmarks ?? this.state.bookmarks,
    };
    this.notify();
    this.scheduleSave();
  }

  on(event: 'change', callback: (state: ReadingState) => void): () => void {
    if (event !== 'change') {
      throw new Error(`Unsupported event: ${event}`);
    }

    this.callbacks.add(callback);

    return () => {
      this.callbacks.delete(callback);
    };
  }

  getSaveStatus(): SaveStatus {
    return this.saveStatus;
  }

  flushSave(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    return this.save();
  }

  destroy(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.callbacks.clear();
  }
}
