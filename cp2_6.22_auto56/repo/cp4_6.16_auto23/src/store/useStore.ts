import { create } from 'zustand';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

export type AnimationType = 'shake' | 'pulse' | 'swing' | 'blink' | 'none';
export type AnimationSpeed = 'slow' | 'medium' | 'fast';

export interface OverlayElement {
  id: string;
  type: 'text' | 'sticker';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  fontSize?: number;
  color?: string;
}

export interface AnimationConfig {
  type: AnimationType;
  speed: AnimationSpeed;
  loopCount: number | 'infinite';
}

export interface Meme {
  id: string;
  name: string;
  imageUrl: string;
  tags: string[];
  category: string;
  overlays: OverlayElement[];
  animation: AnimationConfig;
  createdAt: number;
  updatedAt: number;
}

interface MemeStore {
  memes: Meme[];
  categories: string[];
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  loadMemes: () => Promise<void>;
  addMeme: (meme: Omit<Meme, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMeme: (id: string, updates: Partial<Meme>) => Promise<void>;
  deleteMeme: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string) => void;
  addCategory: (category: string) => void;
  getFilteredMemes: () => Meme[];
}

const DEFAULT_CATEGORIES = ['日常吐槽', '萌宠', '沙雕图', '搞怪', '表情'];

export const useStore = create<MemeStore>((set, get) => ({
  memes: [],
  categories: [...DEFAULT_CATEGORIES],
  searchQuery: '',
  selectedCategory: '',
  isLoading: false,

  loadMemes: async () => {
    set({ isLoading: true });
    try {
      const storedMemes = (await idbGet('memes')) as Meme[] | undefined;
      const storedCategories = (await idbGet('categories')) as string[] | undefined;
      set({
        memes: storedMemes || [],
        categories: storedCategories || [...DEFAULT_CATEGORIES],
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to load memes:', error);
      set({ isLoading: false });
    }
  },

  addMeme: async (memeData) => {
    const newMeme: Meme = {
      ...memeData,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const memes = [...get().memes, newMeme];
    set({ memes });
    await idbSet('memes', memes);
  },

  updateMeme: async (id, updates) => {
    const memes = get().memes.map((meme) =>
      meme.id === id ? { ...meme, ...updates, updatedAt: Date.now() } : meme
    );
    set({ memes });
    await idbSet('memes', memes);
  },

  deleteMeme: async (id) => {
    const meme = get().memes.find((m) => m.id === id);
    const memes = get().memes.filter((m) => m.id !== id);
    set({ memes });
    await idbSet('memes', memes);
    if (meme && meme.imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(meme.imageUrl);
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  addCategory: (category) => {
    const categories = get().categories;
    if (!categories.includes(category)) {
      const newCategories = [...categories, category];
      set({ categories: newCategories });
      idbSet('categories', newCategories);
    }
  },

  getFilteredMemes: () => {
    const { memes, searchQuery, selectedCategory } = get();
    const query = searchQuery.toLowerCase().trim();
    return memes.filter((meme) => {
      const matchesCategory = !selectedCategory || meme.category === selectedCategory;
      const matchesSearch =
        !query ||
        meme.name.toLowerCase().includes(query) ||
        meme.tags.some((tag) => tag.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  },
}));
