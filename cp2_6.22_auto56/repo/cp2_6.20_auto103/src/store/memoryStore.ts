import { create } from 'zustand';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import type { Memory } from '../types';

interface MemoryState {
  memories: Memory[];
  editingId: string | null;
  isPlaying: boolean;
  currentPlayIndex: number;
  isLoading: boolean;

  fetchMemories: () => Promise<void>;
  addMemory: (memory: Omit<Memory, 'id'>) => Promise<void>;
  updateMemory: (id: string, memory: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  reorderMemories: (fromIndex: number, toIndex: number) => void;
  setEditingId: (id: string | null) => void;
  togglePlaying: () => void;
  setCurrentPlayIndex: (index: number) => void;
  nextPlayIndex: () => void;
  importMemories: (memories: Memory[]) => void;
  exportToHTML: () => void;
}

const buildHTMLStory = (memories: Memory[]): string => {
  const cardsHTML = memories
    .map(
      (m, i) => `
    <div class="story-card" data-index="${i}" style="
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      display: flex;
      gap: 20px;
      align-items: flex-start;
    ">
      <img src="${m.imageUrl}" alt="${m.title}" loading="lazy" style="
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 4px solid #d8f3dc;
      " />
      <div style="flex: 1;">
        <div style="color: #2d6a4f; font-weight: 700; font-size: 14px; margin-bottom: 6px;">${m.date}</div>
        <h3 style="color: #1a1a2e; font-size: 20px; margin-bottom: 8px;">${m.title}</h3>
        <p style="color: #4a4a6a; font-size: 14px; line-height: 1.6; margin: 0;">${m.description}</p>
      </div>
    </div>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>我的旅行故事册</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: linear-gradient(135deg, #fdf6e3 0%, #f5ead0 100%);
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 40px 20px;
    }
    .container { max-width: 800px; margin: 0 auto; }
    h1 {
      text-align: center;
      color: #2d6a4f;
      font-size: 36px;
      margin-bottom: 12px;
    }
    .subtitle {
      text-align: center;
      color: #4a4a6a;
      font-size: 16px;
      margin-bottom: 48px;
    }
    .timeline {
      position: relative;
      padding-left: 0;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 50%;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #d8f3dc;
      transform: translateX(-50%);
    }
    @media (max-width: 768px) {
      .story-card { flex-direction: column; }
      .story-card img { width: 80px; height: 80px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>✈️ 我的旅行故事</h1>
    <p class="subtitle">共 ${memories.length} 段难忘的记忆</p>
    <div class="timeline">
      ${cardsHTML}
    </div>
  </div>
</body>
</html>`;
};

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memories: [],
  editingId: null,
  isPlaying: false,
  currentPlayIndex: 0,
  isLoading: false,

  fetchMemories: async () => {
    set({ isLoading: true });
    try {
      const res = await axios.get('/api/memories');
      set({ memories: res.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      console.error('Failed to fetch memories', e);
    }
  },

  addMemory: async (memory) => {
    try {
      const res = await axios.post('/api/memories', memory);
      set((state) => ({ memories: [...state.memories, res.data] }));
    } catch (e) {
      const fallback: Memory = { ...memory, id: uuidv4() };
      set((state) => ({ memories: [...state.memories, fallback] }));
    }
  },

  updateMemory: async (id, partial) => {
    const current = get().memories.find((m) => m.id === id);
    if (!current) return;
    const updated = { ...current, ...partial };
    try {
      await axios.put(`/api/memories/${id}`, updated);
    } catch (e) {
      console.error('Update failed, using local state', e);
    }
    set((state) => ({
      memories: state.memories.map((m) => (m.id === id ? updated : m)),
    }));
  },

  deleteMemory: async (id) => {
    try {
      await axios.delete(`/api/memories/${id}`);
    } catch (e) {
      console.error('Delete failed', e);
    }
    set((state) => ({
      memories: state.memories.filter((m) => m.id !== id),
    }));
  },

  reorderMemories: (fromIndex, toIndex) => {
    set((state) => {
      const arr = [...state.memories];
      const [removed] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, removed);
      return { memories: arr };
    });
  },

  setEditingId: (id) => set({ editingId: id }),

  togglePlaying: () =>
    set((state) => ({
      isPlaying: !state.isPlaying,
      currentPlayIndex: state.isPlaying ? state.currentPlayIndex : 0,
    })),

  setCurrentPlayIndex: (index) => set({ currentPlayIndex: index }),

  nextPlayIndex: () =>
    set((state) => {
      const next = state.currentPlayIndex + 1;
      if (next >= state.memories.length) {
        return { isPlaying: false, currentPlayIndex: 0 };
      }
      return { currentPlayIndex: next };
    }),

  importMemories: (memories) => set({ memories }),

  exportToHTML: () => {
    const { memories } = get();
    const html = buildHTMLStory(memories);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `travel-story-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
