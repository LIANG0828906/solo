export interface Photo {
  id: string;
  date: string;
  color: string;
  width: number;
  height: number;
}

type Listener = () => void;

const COLORS = [
  '#8B5CF6',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

class PhotoManagerClass {
  private photos: Map<string, Photo> = new Map();
  private listeners: Set<Listener> = new Set();

  constructor() {
    const today = new Date().toISOString().split('T')[0];
    for (let i = 0; i < 3; i++) {
      const id = generateId();
      this.photos.set(id, {
        id,
        date: today,
        color: randomColor(),
        width: 80,
        height: 80,
      });
    }
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }

  getPhotosByDate(date: string): Photo[] {
    return Array.from(this.photos.values()).filter((p) => p.date === date);
  }

  getPhotoById(id: string): Photo | undefined {
    return this.photos.get(id);
  }

  addPhoto(date: string): Photo {
    const id = generateId();
    const photo: Photo = {
      id,
      date,
      color: randomColor(),
      width: 80,
      height: 80,
    };
    this.photos.set(id, photo);
    this.notify();
    return photo;
  }

  removePhoto(id: string): void {
    this.photos.delete(id);
    this.notify();
  }

  getAllPhotos(): Photo[] {
    return Array.from(this.photos.values());
  }
}

export const PhotoManager = new PhotoManagerClass();
