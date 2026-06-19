import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Wall, Artwork, CanvasViewport, ArtworkOnWall } from '../modules/layout/types';

interface AppState {
  walls: Wall[];
  artworks: Artwork[];
  viewport: CanvasViewport;
  selectedWallId: string | null;
  selectedArtworkId: string | null;
  showDetailModal: boolean;
  detailArtworkId: string | null;

  setWalls: (walls: Wall[]) => void;
  setArtworks: (artworks: Artwork[]) => void;
  setViewport: (viewport: CanvasViewport) => void;
  setSelectedWallId: (id: string | null) => void;
  setSelectedArtworkId: (id: string | null) => void;

  addWall: (wall: Wall) => void;
  updateWall: (wall: Wall) => void;
  removeWall: (wallId: string) => void;

  addArtworkToWall: (wallId: string, artworkId: string, positionOnWall: number) => void;
  removeArtworkFromWall: (wallId: string, artworkOnWallId: string) => void;

  openDetailModal: (artworkId: string) => void;
  closeDetailModal: () => void;

  updateArtworkNote: (artworkId: string, note: string) => void;

  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'exhibition-layout-data';

const defaultArtworks: Artwork[] = [
  {
    id: uuidv4(),
    name: '星夜',
    thumbnail: '',
    width: 80,
    height: 60,
    orientation: 'landscape',
    description: '文森特·梵高的著名后印象派作品，描绘了夜空中旋转的星云和明亮的月亮。',
    createdAt: '2024-01-15',
    tags: ['油画', '后印象派', '星空'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '蒙娜丽莎',
    thumbnail: '',
    width: 50,
    height: 75,
    orientation: 'portrait',
    description: '列奥纳多·达·芬奇的文艺复兴时期杰作，以神秘的微笑闻名于世。',
    createdAt: '2024-02-20',
    tags: ['油画', '文艺复兴', '肖像'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '呐喊',
    thumbnail: '',
    width: 65,
    height: 85,
    orientation: 'portrait',
    description: '爱德华·蒙克的表现主义代表作，表达了现代人内心深处的焦虑与不安。',
    createdAt: '2024-03-10',
    tags: ['油画', '表现主义', '人物'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '向日葵',
    thumbnail: '',
    width: 70,
    height: 90,
    orientation: 'portrait',
    description: '梵高的系列作品之一，用鲜艳的黄色调表现向日葵的生命力。',
    createdAt: '2024-04-05',
    tags: ['油画', '后印象派', '花卉'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '睡莲',
    thumbnail: '',
    width: 100,
    height: 70,
    orientation: 'landscape',
    description: '克劳德·莫奈的印象派系列作品，描绘了吉维尼花园中的睡莲池。',
    createdAt: '2024-05-12',
    tags: ['油画', '印象派', '风景'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '记忆的永恒',
    thumbnail: '',
    width: 85,
    height: 65,
    orientation: 'landscape',
    description: '萨尔瓦多·达利的超现实主义代表作，以软化的时钟形象闻名。',
    createdAt: '2024-06-18',
    tags: ['油画', '超现实主义', '象征'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '戴珍珠耳环的少女',
    thumbnail: '',
    width: 55,
    height: 70,
    orientation: 'portrait',
    description: '约翰内斯·维米尔的荷兰黄金时代杰作，被誉为北方的蒙娜丽莎。',
    createdAt: '2024-07-22',
    tags: ['油画', '巴洛克', '肖像'],
    note: '',
  },
  {
    id: uuidv4(),
    name: '抽象构成',
    thumbnail: '',
    width: 60,
    height: 60,
    orientation: 'square',
    description: '现代抽象艺术作品，运用几何形状和鲜明色彩探索形式与空间的关系。',
    createdAt: '2024-08-30',
    tags: ['油画', '抽象', '几何'],
    note: '',
  },
];

const initialViewport: CanvasViewport = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

export const useStore = create<AppState>((set, get) => ({
  walls: [],
  artworks: defaultArtworks,
  viewport: initialViewport,
  selectedWallId: null,
  selectedArtworkId: null,
  showDetailModal: false,
  detailArtworkId: null,

  setWalls: (walls) => {
    set({ walls });
    get().saveToStorage();
  },

  setArtworks: (artworks) => set({ artworks }),

  setViewport: (viewport) => set({ viewport }),

  setSelectedWallId: (id) => set({ selectedWallId: id }),

  setSelectedArtworkId: (id) => set({ selectedArtworkId: id }),

  addWall: (wall) => {
    set((state) => ({ walls: [...state.walls, wall] }));
    get().saveToStorage();
  },

  updateWall: (wall) => {
    set((state) => ({
      walls: state.walls.map((w) => (w.id === wall.id ? wall : w)),
    }));
    get().saveToStorage();
  },

  removeWall: (wallId) => {
    set((state) => ({
      walls: state.walls.filter((w) => w.id !== wallId),
      selectedWallId: state.selectedWallId === wallId ? null : state.selectedWallId,
    }));
    get().saveToStorage();
  },

  addArtworkToWall: (wallId, artworkId, positionOnWall) => {
    set((state) => {
      const walls = state.walls.map((w) => {
        if (w.id !== wallId) return w;

        const existing = w.artworks.find((a) => a.artworkId === artworkId);
        let newArtworks: ArtworkOnWall[];

        if (existing) {
          newArtworks = w.artworks.map((a) =>
            a.id === existing.id ? { ...a, positionOnWall } : a
          );
        } else {
          newArtworks = [
            ...w.artworks,
            { id: uuidv4(), artworkId, positionOnWall },
          ];
        }

        const count = newArtworks.length;
        if (count > 1) {
          newArtworks.sort((a, b) => a.positionOnWall - b.positionOnWall);
          const padding = 0.08;
          const usableRange = 1 - 2 * padding;
          const step = usableRange / (count - 1);
          newArtworks = newArtworks.map((a, i) => ({
            ...a,
            positionOnWall: padding + step * i,
          }));
        } else if (count === 1) {
          newArtworks[0].positionOnWall = 0.5;
        }

        return { ...w, artworks: newArtworks };
      });

      return { walls };
    });
    get().saveToStorage();
  },

  removeArtworkFromWall: (wallId, artworkOnWallId) => {
    set((state) => {
      const walls = state.walls.map((w) => {
        if (w.id !== wallId) return w;
        const filtered = w.artworks.filter((a) => a.id !== artworkOnWallId);
        return { ...w, artworks: filtered };
      });
      return { walls };
    });
    get().saveToStorage();
  },

  openDetailModal: (artworkId) => {
    set({ showDetailModal: true, detailArtworkId: artworkId });
  },

  closeDetailModal: () => {
    set({ showDetailModal: false, detailArtworkId: null });
  },

  updateArtworkNote: (artworkId, note) => {
    set((state) => ({
      artworks: state.artworks.map((a) =>
        a.id === artworkId ? { ...a, note } : a
      ),
    }));
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.walls) {
          set({ walls: parsed.walls });
        }
        if (parsed.artworks && parsed.artworks.length > 0) {
          set({ artworks: parsed.artworks });
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          walls: state.walls,
          artworks: state.artworks,
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  },
}));
