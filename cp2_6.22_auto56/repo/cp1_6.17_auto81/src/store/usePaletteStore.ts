import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Palette, Comment, SortMode, User } from '../types';
import { normalizeHex } from '../utils/colorUtils';

const STORAGE_KEY = 'color-palettes-data';

const mockUsers: User[] = [
  { id: 'user-1', name: '设计小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' },
  { id: 'user-2', name: '创意总监', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka' },
  { id: 'user-3', name: '品牌设计师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna' },
  { id: 'user-4', name: 'UI工程师', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Max' },
  { id: 'user-5', name: '产品经理', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zoe' },
];

const generateMockPalettes = (): Palette[] => {
  const now = Date.now();
  return [
    {
      id: 'palette-1',
      name: '日落橙调',
      colors: ['#FF6B35', '#F7931E', '#FFB347', '#FFD700', '#FFF3CD'],
      author: '设计小王',
      votes: 24,
      voterIds: ['user-2', 'user-3', 'user-4', 'user-5'],
      createdAt: now - 1000 * 60 * 30,
    },
    {
      id: 'palette-2',
      name: '海洋蓝调',
      colors: ['#0077B6', '#00B4D8', '#90E0EF', '#CAF0F8', '#E0F7FA'],
      author: '创意总监',
      votes: 18,
      voterIds: ['user-1', 'user-3'],
      createdAt: now - 1000 * 60 * 60 * 2,
    },
    {
      id: 'palette-3',
      name: '森林绿意',
      colors: ['#2D6A4F', '#40916C', '#52B788', '#74C69D', '#B7E4C7'],
      author: '品牌设计师',
      votes: 32,
      voterIds: ['user-1', 'user-2', 'user-4', 'user-5'],
      createdAt: now - 1000 * 60 * 60 * 5,
    },
    {
      id: 'palette-4',
      name: '薰衣草紫',
      colors: ['#7B2CBF', '#9D4EDD', '#C77DFF', '#E0AAFF', '#F3D5FF'],
      author: 'UI工程师',
      votes: 15,
      voterIds: ['user-2', 'user-3'],
      createdAt: now - 1000 * 60 * 60 * 12,
    },
    {
      id: 'palette-5',
      name: '玫瑰粉红',
      colors: ['#E63946', '#F4849A', '#F8B7C5', '#FCD5CE', '#FFE5EC'],
      author: '产品经理',
      votes: 28,
      voterIds: ['user-1', 'user-2', 'user-3'],
      createdAt: now - 1000 * 60 * 60 * 24,
    },
    {
      id: 'palette-6',
      name: '深邃夜空',
      colors: ['#0D1B2A', '#1B263B', '#415A77', '#778DA9', '#E0E1DD'],
      author: '设计小王',
      votes: 42,
      voterIds: ['user-2', 'user-3', 'user-4', 'user-5'],
      createdAt: now - 1000 * 60 * 60 * 36,
    },
    {
      id: 'palette-7',
      name: '焦糖拿铁',
      colors: ['#6F4E37', '#A67B5B', '#C4A484', '#DEB887', '#F5DEB3'],
      author: '创意总监',
      votes: 21,
      voterIds: ['user-1', 'user-4'],
      createdAt: now - 1000 * 60 * 60 * 48,
    },
    {
      id: 'palette-8',
      name: '薄荷清新',
      colors: ['#006D77', '#009688', '#4DB6AC', '#80CBC4', '#B2DFDB'],
      author: '品牌设计师',
      votes: 19,
      voterIds: ['user-2', 'user-5'],
      createdAt: now - 1000 * 60 * 60 * 72,
    },
  ];
};

const generateMockComments = (): Comment[] => {
  const now = Date.now();
  return [
    {
      id: 'comment-1',
      paletteId: 'palette-1',
      author: '创意总监',
      avatar: mockUsers[1].avatar,
      content: '这个配色方案太棒了，很适合我们的夏季活动海报！',
      createdAt: now - 1000 * 60 * 20,
    },
    {
      id: 'comment-2',
      paletteId: 'palette-1',
      author: '品牌设计师',
      avatar: mockUsers[2].avatar,
      content: '同意，暖色调很有感染力。',
      createdAt: now - 1000 * 60 * 15,
    },
    {
      id: 'comment-3',
      paletteId: 'palette-3',
      author: 'UI工程师',
      avatar: mockUsers[3].avatar,
      content: '用于环保主题页面很合适，自然感很强。',
      createdAt: now - 1000 * 60 * 60,
    },
  ];
};

interface PaletteState {
  palettes: Palette[];
  comments: Comment[];
  searchQuery: string;
  sortMode: SortMode;
  currentUser: User;
  users: User[];
  addPalette: (data: { name: string; colors: string[] }) => void;
  deletePalette: (id: string) => void;
  updatePalette: (id: string, updates: Partial<Palette>) => void;
  toggleVote: (paletteId: string) => void;
  addComment: (paletteId: string, content: string) => void;
  setSearchQuery: (query: string) => void;
  setSortMode: (mode: SortMode) => void;
  getFilteredPalettes: () => Palette[];
  getPaletteById: (id: string) => Palette | undefined;
  getCommentsByPaletteId: (paletteId: string) => Comment[];
  getUserById: (userId: string) => User | undefined;
}

const loadFromStorage = (): { palettes: Palette[]; comments: Comment[] } => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  const palettes = generateMockPalettes();
  const comments = generateMockComments();
  return { palettes, comments };
};

const saveToStorage = (palettes: Palette[], comments: Comment[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ palettes, comments }));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

const initialData = loadFromStorage();

export const usePaletteStore = create<PaletteState>((set, get) => ({
  palettes: initialData.palettes,
  comments: initialData.comments,
  searchQuery: '',
  sortMode: 'latest',
  currentUser: mockUsers[0],
  users: mockUsers,

  addPalette: (data) => {
    const { currentUser, palettes, comments } = get();
    const newPalette: Palette = {
      id: uuidv4(),
      name: data.name,
      colors: data.colors.map(normalizeHex),
      author: currentUser.name,
      votes: 0,
      voterIds: [],
      createdAt: Date.now(),
    };
    const newPalettes = [newPalette, ...palettes];
    set({ palettes: newPalettes });
    saveToStorage(newPalettes, comments);
  },

  deletePalette: (id) => {
    const { palettes, comments } = get();
    const newPalettes = palettes.filter((p) => p.id !== id);
    const newComments = comments.filter((c) => c.paletteId !== id);
    set({ palettes: newPalettes, comments: newComments });
    saveToStorage(newPalettes, newComments);
  },

  updatePalette: (id, updates) => {
    const { palettes, comments } = get();
    const newPalettes = palettes.map((p) =>
      p.id === id ? { ...p, ...updates, colors: updates.colors?.map(normalizeHex) || p.colors } : p
    );
    set({ palettes: newPalettes });
    saveToStorage(newPalettes, comments);
  },

  toggleVote: (paletteId) => {
    const { palettes, currentUser, comments } = get();
    const newPalettes = palettes.map((p) => {
      if (p.id !== paletteId) return p;
      const hasVoted = p.voterIds.includes(currentUser.id);
      return {
        ...p,
        votes: hasVoted ? p.votes - 1 : p.votes + 1,
        voterIds: hasVoted
          ? p.voterIds.filter((id) => id !== currentUser.id)
          : [...p.voterIds, currentUser.id],
      };
    });
    set({ palettes: newPalettes });
    saveToStorage(newPalettes, comments);
  },

  addComment: (paletteId, content) => {
    const { comments, currentUser, palettes } = get();
    const newComment: Comment = {
      id: uuidv4(),
      paletteId,
      author: currentUser.name,
      avatar: currentUser.avatar,
      content,
      createdAt: Date.now(),
    };
    const newComments = [...comments, newComment];
    set({ comments: newComments });
    saveToStorage(palettes, newComments);
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSortMode: (mode) => {
    set({ sortMode: mode });
  },

  getFilteredPalettes: () => {
    const { palettes, searchQuery, sortMode } = get();
    let filtered = palettes;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.author.toLowerCase().includes(query)
      );
    }

    if (sortMode === 'latest') {
      filtered = [...filtered].sort((a, b) => b.createdAt - a.createdAt);
    } else {
      filtered = [...filtered].sort((a, b) => b.votes - a.votes);
    }

    return filtered;
  },

  getPaletteById: (id) => {
    return get().palettes.find((p) => p.id === id);
  },

  getCommentsByPaletteId: (paletteId) => {
    return get()
      .comments.filter((c) => c.paletteId === paletteId)
      .sort((a, b) => a.createdAt - b.createdAt);
  },

  getUserById: (userId) => {
    return get().users.find((u) => u.id === userId);
  },
}));
