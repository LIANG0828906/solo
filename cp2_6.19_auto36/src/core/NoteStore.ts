import { v4 as uuidv4 } from 'uuid';
import { NoteData, NoteImage } from '../types';

const STORAGE_KEY = 'mindmap_notes';

type EventCallback = (...args: any[]) => void;

class EventBus {
  private events: Map<string, EventCallback[]> = new Map();

  on(event: string, callback: EventCallback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args));
    }
  }
}

export class NoteStore {
  private notes: Map<string, NoteData> = new Map();
  public eventBus: EventBus = new EventBus();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.notes && Array.isArray(parsed.notes)) {
          parsed.notes.forEach((note: NoteData) => {
            this.notes.set(note.nodeId, note);
          });
        }
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage:', e);
    }
  }

  private saveToStorage() {
    try {
      const notesArray = Array.from(this.notes.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ notes: notesArray }));
    } catch (e) {
      console.error('Failed to save notes to localStorage:', e);
    }
  }

  getNote(nodeId: string): NoteData | undefined {
    return this.notes.get(nodeId);
  }

  getOrCreateNote(nodeId: string): NoteData {
    let note = this.notes.get(nodeId);
    if (!note) {
      note = {
        nodeId,
        content: '',
        images: [],
        updatedAt: Date.now(),
      };
      this.notes.set(nodeId, note);
    }
    return note;
  }

  updateContent(nodeId: string, content: string): NoteData {
    const note = this.getOrCreateNote(nodeId);
    note.content = content;
    note.updatedAt = Date.now();

    this.saveToStorage();
    this.eventBus.emit('note:updated', note);

    return note;
  }

  addImage(nodeId: string, dataUrl: string, width: number, height: number): NoteImage {
    const note = this.getOrCreateNote(nodeId);
    const image: NoteImage = {
      id: uuidv4(),
      dataUrl,
      width,
      height,
    };

    note.images.push(image);
    note.updatedAt = Date.now();

    this.saveToStorage();
    this.eventBus.emit('note:updated', note);
    this.eventBus.emit('note:image:added', { nodeId, image });

    return image;
  }

  removeImage(nodeId: string, imageId: string): boolean {
    const note = this.notes.get(nodeId);
    if (!note) return false;

    const index = note.images.findIndex((img) => img.id === imageId);
    if (index === -1) return false;

    note.images.splice(index, 1);
    note.updatedAt = Date.now();

    this.saveToStorage();
    this.eventBus.emit('note:updated', note);
    this.eventBus.emit('note:image:removed', { nodeId, imageId });

    return true;
  }

  deleteNote(nodeId: string): boolean {
    const deleted = this.notes.delete(nodeId);
    if (deleted) {
      this.saveToStorage();
      this.eventBus.emit('note:deleted', nodeId);
    }
    return deleted;
  }

  getAllNotes(): NoteData[] {
    return Array.from(this.notes.values());
  }

  compressImage(file: File, maxWidth: number = 800, maxHeight: number = 600): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.onload = () => {
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const noteStore = new NoteStore();
