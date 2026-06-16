import { Artwork, FilterCriteria } from './types';
import { EventBus } from './EventBus';
import mockData from './mockData.json';

export class DataManager {
  private artworks: Artwork[] = [];
  private eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.artworks = mockData as Artwork[];
    this.setupListeners();
  }

  private setupListeners(): void {
    this.eventBus.on<FilterCriteria>('filter', (criteria) => {
      const filtered = this.filterArtworks(criteria);
      this.eventBus.emit<Artwork[]>('filtered', filtered);
    });

    this.eventBus.on<Omit<Artwork, 'id' | 'createdAt'>>('add', (data) => {
      const newArtwork: Artwork = {
        ...data,
        id: `art-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      this.artworks.unshift(newArtwork);
      this.eventBus.emit<Artwork[]>('updated', [...this.artworks]);
      this.eventBus.emit<Artwork[]>('filtered', [...this.artworks]);
    });

    this.eventBus.on<{ id: string; updates: Partial<Artwork> }>('edit', ({ id, updates }) => {
      this.artworks = this.artworks.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      );
      this.eventBus.emit<Artwork[]>('updated', [...this.artworks]);
      this.eventBus.emit<Artwork[]>('filtered', [...this.artworks]);
    });

    this.eventBus.on<string>('delete', (id) => {
      this.artworks = this.artworks.filter((a) => a.id !== id);
      this.eventBus.emit<Artwork[]>('updated', [...this.artworks]);
      this.eventBus.emit<Artwork[]>('filtered', [...this.artworks]);
    });
  }

  private filterArtworks(criteria: FilterCriteria): Artwork[] {
    return this.artworks.filter((artwork) => {
      if (criteria.colors.length > 0) {
        const hasColor = criteria.colors.some((c) => artwork.colorTags.includes(c));
        if (!hasColor) return false;
      }

      if (criteria.styles.length > 0) {
        const hasStyle = criteria.styles.every((s) => artwork.styleTags.includes(s));
        if (!hasStyle) return false;
      }

      if (criteria.keyword.trim()) {
        const kw = criteria.keyword.trim().toLowerCase();
        const matchTitle = artwork.title.toLowerCase().includes(kw);
        const matchKeyword = artwork.keywords.some((k) => k.toLowerCase().includes(kw));
        if (!matchTitle && !matchKeyword) return false;
      }

      return true;
    });
  }

  getArtworks(): Artwork[] {
    return [...this.artworks];
  }
}
