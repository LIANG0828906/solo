import { create } from 'zustand';
import type { Photo, LayoutConfig, Portfolio, PortfolioItem, TemplateType } from '@/types';
import { generateId, validateFile, blobToObjectURL } from '@/utils/helpers';
import { generateThumbnail, exportPortfolioHTML } from '@/utils/imageProcessor';
import { db } from '@/utils/db';

interface AppState {
  photos: Photo[];
  portfolios: Portfolio[];
  currentPhotoId: string | null;
  currentLayout: LayoutConfig;
  currentPortfolioId: string | null;
  isInitialized: boolean;
  loadingMessage: string;

  init: () => Promise<void>;
  addPhoto: (file: File) => Promise<Photo>;
  deletePhoto: (id: string) => void;
  updatePhoto: (id: string, patch: Partial<Photo>) => void;
  setCurrentPhoto: (id: string | null) => void;
  updateLayout: (patch: Partial<LayoutConfig>) => void;
  resetLayoutForPhoto: (photoId?: string | null) => void;
  createPortfolio: (title?: string) => string;
  updatePortfolio: (id: string, patch: Partial<Portfolio>) => void;
  deletePortfolio: (id: string) => void;
  addPhotoToPortfolio: (portfolioId: string, photoId: string, layout?: LayoutConfig) => void;
  removeFromPortfolio: (portfolioId: string, index: number) => void;
  reorderPortfolio: (portfolioId: string, fromIndex: number, toIndex: number) => void;
  exportPortfolioHTML: (id: string) => Promise<Blob>;
  generateShareLink: (id: string) => string;
}

const defaultLayout: LayoutConfig = {
  templateType: 'border',
  subStyle: 0,
  margin: 24,
  borderColor: '#FFFFFF',
  borderRadius: 2,
  previewWidth: 1200,
};

const SAMPLE_PHOTO_COUNT = 6;

function createPlaceholderPhoto(index: number): Photo {
  const seed = (index * 37) % 1000;
  const themes = [
    { w: 1600, h: 1000, category: 'nature', title: '山岚晨曦', tags: ['风光'] },
    { w: 1200, h: 1600, category: 'people', title: '城市过客', tags: ['街拍', '人像'] },
    { w: 1600, h: 900, category: 'architecture', title: '几何之美', tags: ['建筑'] },
    { w: 1200, h: 1200, category: 'food', title: '静物练习', tags: ['静物'] },
    { w: 1600, h: 1067, category: 'city', title: '霓虹夜幕', tags: ['街拍'] },
    { w: 1400, h: 1800, category: 'portrait', title: '肖像 #01', tags: ['人像', '黑白'] },
  ];
  const theme = themes[index % themes.length];
  const placeholder = `https://picsum.photos/seed/lumen-${seed}/${theme.w}/${theme.h}`;
  return {
    id: generateId(),
    title: theme.title,
    originalUrl: placeholder,
    thumbnailUrl: `https://picsum.photos/seed/lumen-${seed}/400/400`,
    originalWidth: theme.w,
    originalHeight: theme.h,
    captureDate: new Date(Date.now() - (index + 1) * 86400000 * 5).toISOString(),
    tags: theme.tags,
    createdAt: Date.now() - index * 1000,
  };
}

export const useAppStore = create<AppState>((set, get) => ({
  photos: [],
  portfolios: [],
  currentPhotoId: null,
  currentLayout: { ...defaultLayout },
  currentPortfolioId: null,
  isInitialized: false,
  loadingMessage: '正在加载...',

  init: async () => {
    set({ loadingMessage: '正在读取本地作品库...' });
    try {
      const stored = (await db.getAllPhotos()) as Photo[];
      let photos: Photo[] = stored;
      if (stored.length === 0) {
        photos = Array.from({ length: SAMPLE_PHOTO_COUNT }, (_, i) => createPlaceholderPhoto(i));
      }

      const portfolioStored = (await db.getAllPortfolios()) as Portfolio[];
      let portfolios = portfolioStored;
      if (portfolios.length === 0 && photos.length > 0) {
        const demo: Portfolio = {
          id: generateId(),
          title: '2025 · 精选作品集',
          coverImageId: photos[0].id,
          coverColor: '#2D2D2D',
          coverTitle: 'Frames of the Year',
          backCoverColor: '#1A1A1A',
          items: photos.slice(0, 4).map((p) => ({
            photoId: p.id,
            layout: { ...defaultLayout },
          })),
          layoutPerPage: 1,
          createdAt: Date.now() - 3600000,
        };
        portfolios = [demo];
        await db.savePortfolio(demo.id, demo);
      }

      set({
        photos,
        portfolios,
        isInitialized: true,
        loadingMessage: '',
      });
    } catch (e) {
      console.error('init error', e);
      const fallback = Array.from({ length: SAMPLE_PHOTO_COUNT }, (_, i) => createPlaceholderPhoto(i));
      set({ photos: fallback, isInitialized: true, loadingMessage: '' });
    }
  },

  addPhoto: async (file: File) => {
    const check = validateFile(file);
    if (!check.ok) throw new Error(check.error);

    set({ loadingMessage: `正在处理 ${file.name}...` });

    const { blob: thumbBlob, width, height } = await generateThumbnail(file);
    const id = generateId();
    await db.saveBlob(id, file);
    const thumbId = `thumb-${id}`;
    await db.saveBlob(thumbId, thumbBlob);

    const originalUrl = blobToObjectURL(file);
    const thumbnailUrl = blobToObjectURL(thumbBlob);

    const title = file.name.replace(/\.[^.]+$/, '');
    const photo: Photo = {
      id,
      title,
      originalUrl,
      thumbnailUrl,
      originalWidth: width,
      originalHeight: height,
      captureDate: new Date().toISOString(),
      tags: [],
      createdAt: Date.now(),
    };

    await db.savePhoto(id, photo);
    set((s) => ({
      photos: [photo, ...s.photos],
      loadingMessage: '',
    }));
    return photo;
  },

  deletePhoto: (id) => {
    set((s) => {
      const photos = s.photos.filter((p) => p.id !== id);
      const portfolios = s.portfolios.map((pf) => ({
        ...pf,
        items: pf.items.filter((it) => it.photoId !== id),
        coverImageId: pf.coverImageId === id ? undefined : pf.coverImageId,
      }));
      void db.deletePhoto(id);
      portfolios.forEach((pf) => void db.savePortfolio(pf.id, pf));
      return { photos, portfolios };
    });
  },

  updatePhoto: (id, patch) => {
    set((s) => {
      const photos = s.photos.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const updated = photos.find((p) => p.id === id);
      if (updated) void db.savePhoto(id, updated);
      return { photos };
    });
  },

  setCurrentPhoto: (id) => {
    set({ currentPhotoId: id });
    if (id) get().resetLayoutForPhoto(id);
  },

  updateLayout: (patch) => {
    set((s) => ({ currentLayout: { ...s.currentLayout, ...patch } }));
  },

  resetLayoutForPhoto: () => {
    set({ currentLayout: { ...defaultLayout } });
  },

  createPortfolio: (title) => {
    const id = generateId();
    const p: Portfolio = {
      id,
      title: title ?? `未命名作品集 · ${new Date().toLocaleDateString()}`,
      coverColor: '#2D2D2D',
      coverTitle: title ?? 'Portfolio',
      backCoverColor: '#1A1A1A',
      items: [],
      layoutPerPage: 1,
      createdAt: Date.now(),
    };
    set((s) => ({ portfolios: [p, ...s.portfolios] }));
    void db.savePortfolio(id, p);
    return id;
  },

  updatePortfolio: (id, patch) => {
    set((s) => {
      const portfolios = s.portfolios.map((p) => (p.id === id ? { ...p, ...patch } : p));
      const updated = portfolios.find((p) => p.id === id);
      if (updated) void db.savePortfolio(id, updated);
      return { portfolios };
    });
  },

  deletePortfolio: (id) => {
    set((s) => ({ portfolios: s.portfolios.filter((p) => p.id !== id) }));
    void db.deletePortfolio(id);
  },

  addPhotoToPortfolio: (portfolioId, photoId, layout) => {
    set((s) => {
      const portfolios = s.portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        const item: PortfolioItem = {
          photoId,
          layout: layout ?? { ...s.currentLayout },
        };
        const next = { ...p, items: [...p.items, item] };
        void db.savePortfolio(next.id, next);
        return next;
      });
      return { portfolios };
    });
  },

  removeFromPortfolio: (portfolioId, index) => {
    set((s) => {
      const portfolios = s.portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        const items = p.items.filter((_, i) => i !== index);
        const next = { ...p, items };
        void db.savePortfolio(next.id, next);
        return next;
      });
      return { portfolios };
    });
  },

  reorderPortfolio: (portfolioId, fromIndex, toIndex) => {
    set((s) => {
      const portfolios = s.portfolios.map((p) => {
        if (p.id !== portfolioId) return p;
        const items = [...p.items];
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        const next = { ...p, items };
        void db.savePortfolio(next.id, next);
        return next;
      });
      return { portfolios };
    });
  },

  exportPortfolioHTML: async (id) => {
    const { portfolios, photos } = get();
    const pf = portfolios.find((p) => p.id === id);
    if (!pf) throw new Error('Portfolio not found');
    const map = new Map<string, Photo>();
    photos.forEach((p) => map.set(p.id, p));
    return exportPortfolioHTML(pf, map);
  },

  generateShareLink: (id) => {
    const { portfolios } = get();
    const pf = portfolios.find((p) => p.id === id);
    if (!pf) return '';
    const token = pf.shareToken ?? generateId().slice(0, 8);
    if (!pf.shareToken) {
      get().updatePortfolio(id, { shareToken: token });
    }
    return `${window.location.origin}${window.location.pathname}#/share/${pf.id}`;
  },
}));

export type { TemplateType };
