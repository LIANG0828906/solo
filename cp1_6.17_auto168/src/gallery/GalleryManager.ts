import { v4 as uuidv4 } from 'uuid';
import { eventBus } from '../engine/EventBus';

export interface Comment {
  id: string;
  text: string;
  createdAt: number;
}

export interface GraffitiWork {
  id: string;
  dataURI: string;
  title: string;
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: number;
}

const STORAGE_KEY = 'graffiti_gallery';

class GalleryManager {
  private works: GraffitiWork[] = [];

  constructor() {
    this.loadFromStorage();
    eventBus.on('graffiti:submit', (data: { dataURI: string; title: string }) => {
      this.add(data.dataURI, data.title);
      eventBus.emit('gallery:updated', this.getWorks());
    });
  }

  add(dataURI: string, title: string): GraffitiWork {
    const work: GraffitiWork = {
      id: uuidv4(),
      dataURI,
      title: title || '无题涂鸦',
      likes: 0,
      liked: false,
      comments: [],
      createdAt: Date.now(),
    };
    this.works.unshift(work);
    this.saveToStorage();
    return work;
  }

  getWorks(sortBy: 'time' | 'likes' = 'time'): GraffitiWork[] {
    const sorted = [...this.works];
    if (sortBy === 'likes') {
      sorted.sort((a, b) => b.likes - a.likes);
    } else {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    }
    return sorted;
  }

  toggleLike(id: string): GraffitiWork | undefined {
    const work = this.works.find(w => w.id === id);
    if (work) {
      work.liked = !work.liked;
      work.likes += work.liked ? 1 : -1;
      this.saveToStorage();
      eventBus.emit('gallery:updated', this.getWorks());
    }
    return work;
  }

  addComment(workId: string, text: string): Comment | undefined {
    const work = this.works.find(w => w.id === workId);
    if (work) {
      const comment: Comment = {
        id: uuidv4(),
        text,
        createdAt: Date.now(),
      };
      work.comments.unshift(comment);
      this.saveToStorage();
      eventBus.emit('gallery:updated', this.getWorks());
      return comment;
    }
  }

  deleteWork(id: string): boolean {
    const idx = this.works.findIndex(w => w.id === id);
    if (idx > -1) {
      this.works.splice(idx, 1);
      this.saveToStorage();
      eventBus.emit('gallery:updated', this.getWorks());
      return true;
    }
    return false;
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.works = JSON.parse(data);
      }
    } catch {
      this.works = [];
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.works));
    } catch {
      // storage full
    }
  }
}

export const galleryManager = new GalleryManager();
export default GalleryManager;
