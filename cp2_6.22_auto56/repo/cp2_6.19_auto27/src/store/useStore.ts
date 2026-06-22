import { create } from 'zustand';
import { Wall, Artwork, CanvasViewport } from '../modules/layout/types';
import { LayoutEngine } from '../modules/layout/LayoutEngine';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'exhibition-layout-data';

interface LayoutState {
  walls: Wall[];
  artworks: Artwork[];
  viewport: CanvasViewport;
  selectedWallId: string | null;
  selectedArtworkId: string | null;
  detailModalArtworkId: string | null;
  isDetailModalOpen: boolean;
  layoutEngine: LayoutEngine;
  searchQuery: string;
}

interface LayoutActions {
  addWall: (type: 'rectangle' | 'L-shape', x: number, y: number, width: number, height: number) => void;
  moveWall: (id: string, x: number, y: number) => void;
  resizeWall: (id: string, corner: any, deltaX: number, deltaY: number) => void;
  rotateWall: (id: string, angle: number) => void;
  removeWall: (id: string) => void;
  selectWall: (id: string | null) => void;
  selectArtwork: (id: string | null) => void;
  adhereArtwork: (wallId: string, artworkId: string, position: number) => void;
  removeArtworkFromWall: (wallId: string, artworkId: string) => void;
  setViewport: (viewport: Partial<CanvasViewport>) => void;
  openDetailModal: (artworkId: string) => void;
  closeDetailModal: () => void;
  updateArtworkNotes: (artworkId: string, notes: string) => void;
  setSearchQuery: (query: string) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
  initDefaultData: () => void;
}

const defaultArtworks: Artwork[] = [
  {
    id: uuidv4(),
    name: '星月夜',
    thumbnail: '',
    width: 60,
    height: 80,
    orientation: 'portrait',
    description: '梵高著名的后印象派画作，描绘了夜空中旋转的星云和明亮的月亮。',
    createdAt: '2024-01-15',
    tags: ['印象派', '油画', '经典'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '蒙娜丽莎',
    thumbnail: '',
    width: 50,
    height: 70,
    orientation: 'portrait',
    description: '达芬奇的代表作，以其神秘的微笑闻名于世。',
    createdAt: '2024-02-20',
    tags: ['文艺复兴', '肖像', '经典'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '呐喊',
    thumbnail: '',
    width: 70,
    height: 90,
    orientation: 'portrait',
    description: '蒙克的表现主义代表作，表达了现代人内心的焦虑与不安。',
    createdAt: '2024-03-10',
    tags: ['表现主义', '象征', '现代'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '日出印象',
    thumbnail: '',
    width: 90,
    height: 60,
    orientation: 'landscape',
    description: '莫奈的印象派开山之作，描绘了勒阿弗尔港口的日出景象。',
    createdAt: '2024-04-05',
    tags: ['印象派', '风景', '经典'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '记忆的永恒',
    thumbnail: '',
    width: 80,
    height: 60,
    orientation: 'landscape',
    description: '达利的超现实主义代表作，以软化的时钟象征时间的相对性。',
    createdAt: '2024-05-12',
    tags: ['超现实主义', '达利', '现代'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '睡莲',
    thumbnail: '',
    width: 100,
    height: 70,
    orientation: 'landscape',
    description: '莫奈晚年的系列作品，描绘了他花园中的睡莲池。',
    createdAt: '2024-06-18',
    tags: ['印象派', '花卉', '系列'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '戴珍珠耳环的少女',
    thumbnail: '',
    width: 50,
    height: 60,
    orientation: 'portrait',
    description: '维米尔的代表作，被誉为"北方的蒙娜丽莎"。',
    createdAt: '2024-07-22',
    tags: ['巴洛克', '肖像', '经典'],
    notes: '',
  },
  {
    id: uuidv4(),
    name: '格尔尼卡',
    thumbnail: '',
    width: 120,
    height: 50,
    orientation: 'landscape',
    description: '毕加索的反战巨作，描绘了西班牙内战中格尔尼卡镇的悲剧。',
    createdAt: '2024-08-30',
    tags: ['立体主义', '毕加索', '反战'],
    notes: '',
  },
];

export const useStore = create<LayoutState & LayoutActions>((set, get) => {
  const layoutEngine = new LayoutEngine();

  const saveToStorage = () => {
    const state = get();
    const data = {
      walls: state.walls,
      artworks: state.artworks,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };

  const loadFromStorage = () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.walls && parsed.artworks) {
          layoutEngine.setWalls(parsed.walls);
          layoutEngine.setArtworks(parsed.artworks);
          set({
            walls: parsed.walls,
            artworks: parsed.artworks,
          });
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
    get().initDefaultData();
  };

  const initDefaultData = () => {
    layoutEngine.setArtworks(defaultArtworks);
    const wall1 = layoutEngine.addWall('rectangle', 300, 300, 300, 30);
    const wall2 = layoutEngine.addWall('rectangle', 650, 250, 250, 30);
    layoutEngine.rotateWall(wall2.id, 15);
    void wall1;
    
    set({
      walls: layoutEngine.getWalls(),
      artworks: defaultArtworks,
    });
    saveToStorage();
  };

  return {
    walls: [],
    artworks: [],
    viewport: {
      offsetX: 0,
      offsetY: 0,
      scale: 1,
    },
    selectedWallId: null,
    selectedArtworkId: null,
    detailModalArtworkId: null,
    isDetailModalOpen: false,
    layoutEngine,
    searchQuery: '',

    addWall: (type, x, y, width, height) => {
      layoutEngine.addWall(type, x, y, width, height);
      set({ walls: layoutEngine.getWalls() });
      saveToStorage();
    },

    moveWall: (id, x, y) => {
      layoutEngine.moveWall(id, x, y);
      set({ walls: layoutEngine.getWalls() });
    },

    resizeWall: (id, corner, deltaX, deltaY) => {
      layoutEngine.resizeWall(id, corner, deltaX, deltaY);
      set({ walls: layoutEngine.getWalls() });
    },

    rotateWall: (id, angle) => {
      layoutEngine.rotateWall(id, angle);
      set({ walls: layoutEngine.getWalls() });
    },

    removeWall: (id) => {
      layoutEngine.removeWall(id);
      set({ 
        walls: layoutEngine.getWalls(),
        selectedWallId: get().selectedWallId === id ? null : get().selectedWallId,
      });
      saveToStorage();
    },

    selectWall: (id) => {
      set({ selectedWallId: id, selectedArtworkId: null });
    },

    selectArtwork: (id) => {
      set({ selectedArtworkId: id, selectedWallId: null });
    },

    adhereArtwork: (wallId, artworkId, position) => {
      layoutEngine.adhereArtwork(wallId, artworkId, position);
      set({ walls: layoutEngine.getWalls() });
      saveToStorage();
    },

    removeArtworkFromWall: (wallId, artworkId) => {
      layoutEngine.removeArtworkFromWall(wallId, artworkId);
      set({ walls: layoutEngine.getWalls() });
      saveToStorage();
    },

    setViewport: (viewport) => {
      set((state) => ({
        viewport: { ...state.viewport, ...viewport },
      }));
    },

    openDetailModal: (artworkId) => {
      set({
        detailModalArtworkId: artworkId,
        isDetailModalOpen: true,
      });
    },

    closeDetailModal: () => {
      set({
        isDetailModalOpen: false,
      });
    },

    updateArtworkNotes: (artworkId, notes) => {
      layoutEngine.updateArtworkNotes(artworkId, notes);
      set({ artworks: layoutEngine.getArtworks() });
      saveToStorage();
    },

    setSearchQuery: (query) => {
      set({ searchQuery: query });
    },

    loadFromStorage,
    saveToStorage,
    initDefaultData,
  };
});
