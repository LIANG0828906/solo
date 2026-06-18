import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ToolType = 'select' | 'text' | 'brush' | 'sticker';

export type LayerType = 'image' | 'text' | 'draw' | 'sticker';

export interface BaseLayer {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  visible: boolean;
}

export interface ImageLayer extends BaseLayer {
  type: 'image';
  src: string;
  width: number;
  height: number;
}

export interface TextLayer extends BaseLayer {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface DrawLayer extends BaseLayer {
  type: 'draw';
  points: { x: number; y: number }[];
  strokeWidth: number;
  color: string;
}

export interface StickerLayer extends BaseLayer {
  type: 'sticker';
  emoji: string;
  size: number;
}

export type Layer = ImageLayer | TextLayer | DrawLayer | StickerLayer;

export interface MemeCard {
  id: string;
  imageUrl: string;
  creatorName: string;
  createdAt: number;
  isFavorite: boolean;
}

interface EditorState {
  currentTool: ToolType;
  layers: Layer[];
  selectedLayerId: string | null;
  canvasScale: number;
  canvasOffset: { x: number; y: number };
  brushSize: number;
  textColor: string;
  fontSize: number;
  fontFamily: string;
  currentSticker: string;
  highlightedLayerId: string | null;
  communityMemes: MemeCard[];
  searchQuery: string;

  setCurrentTool: (tool: ToolType) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  setSelectedLayerId: (id: string | null) => void;
  setCanvasScale: (scale: number) => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setBrushSize: (size: number) => void;
  setTextColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (font: string) => void;
  setCurrentSticker: (sticker: string) => void;
  setHighlightedLayerId: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  addCommunityMeme: (meme: MemeCard) => void;
  toggleFavorite: (id: string) => void;
  setSearchQuery: (query: string) => void;
  loadFromStorage: () => void;
}

export const STICKERS = ['😀', '😂', '🤣', '😍', '🥳', '😎', '🤔', '👍', '❤️', '🔥', '✨', '💯'];

export const FONT_FAMILIES = [
  { name: '默认', value: 'system-ui, sans-serif' },
  { name: '黑体', value: '"Microsoft YaHei", sans-serif' },
  { name: '宋体', value: '"SimSun", serif' },
  { name: '楷体', value: '"KaiTi", serif' },
];

const getInitialCommunityMemes = (): MemeCard[] => {
  const stored = localStorage.getItem('memeCommunity');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [
    {
      id: uuidv4(),
      imageUrl: 'https://picsum.photos/seed/meme1/300/300',
      creatorName: '快乐小猫',
      createdAt: Date.now() - 86400000,
      isFavorite: false,
    },
    {
      id: uuidv4(),
      imageUrl: 'https://picsum.photos/seed/meme2/300/300',
      creatorName: '吐槽达人',
      createdAt: Date.now() - 172800000,
      isFavorite: true,
    },
    {
      id: uuidv4(),
      imageUrl: 'https://picsum.photos/seed/meme3/300/300',
      creatorName: '表情包大师',
      createdAt: Date.now() - 259200000,
      isFavorite: false,
    },
    {
      id: uuidv4(),
      imageUrl: 'https://picsum.photos/seed/meme4/300/300',
      creatorName: '搞怪小王',
      createdAt: Date.now() - 345600000,
      isFavorite: false,
    },
    {
      id: uuidv4(),
      imageUrl: 'https://picsum.photos/seed/meme5/300/300',
      creatorName: '萌萌酱',
      createdAt: Date.now() - 432000000,
      isFavorite: true,
    },
    {
      id: uuidv4(),
      imageUrl: 'https://picsum.photos/seed/meme6/300/300',
      creatorName: '梗图收藏家',
      createdAt: Date.now() - 518400000,
      isFavorite: false,
    },
  ];
};

export const useEditorStore = create<EditorState>((set, get) => ({
  currentTool: 'select',
  layers: [],
  selectedLayerId: null,
  canvasScale: 1,
  canvasOffset: { x: 0, y: 0 },
  brushSize: 3,
  textColor: '#ffffff',
  fontSize: 24,
  fontFamily: 'system-ui, sans-serif',
  currentSticker: STICKERS[0],
  highlightedLayerId: null,
  communityMemes: getInitialCommunityMemes(),
  searchQuery: '',

  setCurrentTool: (tool) => set({ currentTool: tool }),

  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
      selectedLayerId: layer.id,
    })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((layer) =>
        layer.id === id ? ({ ...layer, ...updates } as Layer) : layer
      ),
    })),

  deleteLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((layer) => layer.id !== id),
      selectedLayerId: state.selectedLayerId === id ? null : state.selectedLayerId,
    })),

  setSelectedLayerId: (id) => set({ selectedLayerId: id }),

  setCanvasScale: (scale) => set({ canvasScale: Math.max(0.1, Math.min(5, scale)) }),

  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  setBrushSize: (size) => set({ brushSize: size }),

  setTextColor: (color) => set({ textColor: color }),

  setFontSize: (size) => set({ fontSize: size }),

  setFontFamily: (font) => set({ fontFamily: font }),

  setCurrentSticker: (sticker) => set({ currentSticker: sticker }),

  setHighlightedLayerId: (id) => set({ highlightedLayerId: id }),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      const newLayers = [...state.layers];
      const [moved] = newLayers.splice(fromIndex, 1);
      newLayers.splice(toIndex, 0, moved);
      return { layers: newLayers };
    }),

  addCommunityMeme: (meme) => {
    set((state) => {
      const newMemes = [meme, ...state.communityMemes];
      localStorage.setItem('memeCommunity', JSON.stringify(newMemes));
      return { communityMemes: newMemes };
    });
  },

  toggleFavorite: (id) =>
    set((state) => {
      const newMemes = state.communityMemes.map((meme) =>
        meme.id === id ? { ...meme, isFavorite: !meme.isFavorite } : meme
      );
      localStorage.setItem('memeCommunity', JSON.stringify(newMemes));
      return { communityMemes: newMemes };
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadFromStorage: () => {
    const stored = localStorage.getItem('memeCommunity');
    if (stored) {
      try {
        set({ communityMemes: JSON.parse(stored) });
      } catch {
        // ignore
      }
    }
  },
}));
