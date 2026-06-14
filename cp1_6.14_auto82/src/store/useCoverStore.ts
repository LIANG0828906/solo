import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CoverData, CoverRecord } from '@/types';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface State {
  currentCover: CoverData;
  history: CoverRecord[];
  editingId: string | null;
}

interface Actions {
  setCoverField: <K extends keyof CoverData>(field: K, value: CoverData[K]) => void;
  setCover: (cover: Partial<CoverData>) => void;
  saveToHistory: (thumbnail?: string) => string;
  deleteFromHistory: (id: string) => void;
  loadFromHistory: (id: string) => void;
  clearEditing: () => void;
}

const initialCurrentCover: CoverData = {
  title: '重大新闻：科技创新引领未来',
  summary: '今日，在全球科技峰会上，多项突破性成果正式发布，专家预测这将深刻改变人类生活方式与社会结构。',
  date: getTodayDate(),
  author: '本报记者',
  template: 'serious',
};

export const useCoverStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      currentCover: initialCurrentCover,
      history: [],
      editingId: null,

      setCoverField: (field, value) => {
        set((state) => ({
          currentCover: {
            ...state.currentCover,
            [field]: value,
          },
        }));
      },

      setCover: (cover) => {
        set((state) => ({
          currentCover: {
            ...state.currentCover,
            ...cover,
          },
        }));
      },

      saveToHistory: (thumbnail) => {
        const id = generateUUID();
        const record: CoverRecord = {
          ...get().currentCover,
          id,
          createdAt: Date.now(),
          thumbnail,
        };
        set((state) => {
          const newHistory = [record, ...state.history];
          if (newHistory.length > 50) {
            newHistory.pop();
          }
          return { history: newHistory };
        });
        return id;
      },

      deleteFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        }));
      },

      loadFromHistory: (id) => {
        const record = get().history.find((item) => item.id === id);
        if (record) {
          set({
            currentCover: {
              title: record.title,
              summary: record.summary,
              date: record.date,
              author: record.author,
              template: record.template,
            },
            editingId: id,
          });
        }
      },

      clearEditing: () => {
        set({ editingId: null });
      },
    }),
    {
      name: 'newspaper_cover_history',
      partialize: (state) => ({ history: state.history }),
    }
  )
);
