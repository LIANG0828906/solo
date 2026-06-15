import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import { ScriptSegment, RoleType } from '@/types';

interface ScriptState {
  segments: ScriptSegment[];
  isLoading: boolean;
  isInitialized: boolean;
  addSegment: (data: Partial<Omit<ScriptSegment, 'id' | 'order' | 'createdAt' | 'updatedAt'>>) => void;
  updateSegment: (id: string, data: Partial<ScriptSegment>) => void;
  deleteSegment: (id: string) => void;
  reorderSegments: (fromIndex: number, toIndex: number) => void;
  getTotalDuration: () => number;
  getSegmentPercentages: () => Map<string, number>;
  loadFromStorage: () => Promise<void>;
  resetToDefaults: () => void;
}

const createDefaultSegments = (): ScriptSegment[] => {
  const now = new Date().toISOString();
  return [
    {
      id: uuidv4(),
      title: '开场白',
      content: '各位听众朋友们大家好，欢迎收听本期播客节目。我是你们的主播XXX。今天我们将一起探讨一个非常有趣的话题...',
      expectedDuration: 45,
      role: 'host' as RoleType,
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '话题引入',
      content: '在我们开始今天的主题之前，先给大家分享一个小故事。上周我在和一位朋友聊天的时候，他提到了这样一个观点...',
      expectedDuration: 60,
      role: 'host' as RoleType,
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '嘉宾分享',
      content: '今天我们非常荣幸地邀请到了业内资深专家XXX老师。XXX老师，能不能先和我们的听众朋友打个招呼，简单介绍一下您最近在关注哪些领域？',
      expectedDuration: 90,
      role: 'guest' as RoleType,
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '核心讨论',
      content: '关于这个话题，其实业内有很多不同的声音。有人认为... 而另一种观点则是... 您怎么看这两种截然不同的看法？',
      expectedDuration: 180,
      role: 'host' as RoleType,
      order: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      title: '结尾总结',
      content: '非常感谢XXX老师今天的精彩分享。总结一下我们今天讨论的要点：第一... 第二... 第三... 感谢大家的收听，我们下期节目再见！',
      expectedDuration: 60,
      role: 'narrator' as RoleType,
      order: 4,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

const STORAGE_KEY = 'podcast_script_segments';

const persist = (segments: ScriptSegment[]) => {
  set(STORAGE_KEY, JSON.stringify(segments)).catch(() => {});
};

export const useScriptStore = create<ScriptState>((set, get) => ({
  segments: [],
  isLoading: false,
  isInitialized: false,

  addSegment: (data) => {
    const state = get();
    const now = new Date().toISOString();
    const maxOrder = state.segments.length > 0
      ? Math.max(...state.segments.map(s => s.order))
      : -1;
    const newSegment: ScriptSegment = {
      id: uuidv4(),
      title: data.title || '新段落',
      content: data.content || '',
      expectedDuration: data.expectedDuration || 60,
      role: data.role || 'host',
      order: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };
    const newSegments = [...state.segments, newSegment];
    set({ segments: newSegments });
    persist(newSegments);
  },

  updateSegment: (id, data) => {
    const state = get();
    const now = new Date().toISOString();
    const newSegments = state.segments.map(s =>
      s.id === id ? { ...s, ...data, updatedAt: now } : s
    );
    set({ segments: newSegments });
    persist(newSegments);
  },

  deleteSegment: (id) => {
    const state = get();
    const newSegments = state.segments
      .filter(s => s.id !== id)
      .map((s, idx) => ({ ...s, order: idx }));
    set({ segments: newSegments });
    persist(newSegments);
  },

  reorderSegments: (fromIndex, toIndex) => {
    const state = get();
    const sorted = [...state.segments].sort((a, b) => a.order - b.order);
    const [removed] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, removed);
    const newSegments = sorted.map((s, idx) => ({ ...s, order: idx }));
    set({ segments: newSegments });
    persist(newSegments);
  },

  getTotalDuration: () => {
    const state = get();
    return state.segments.reduce((sum, s) => sum + s.expectedDuration, 0);
  },

  getSegmentPercentages: () => {
    const state = get();
    const total = state.segments.reduce((sum, s) => sum + s.expectedDuration, 0);
    const map = new Map<string, number>();
    state.segments.forEach(s => {
      map.set(s.id, total > 0 ? (s.expectedDuration / total) * 100 : 0);
    });
    return map;
  },

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const raw = await get(STORAGE_KEY);
      if (typeof raw === 'string' && raw) {
        const parsed = JSON.parse(raw) as ScriptSegment[];
        set({ segments: parsed, isLoading: false, isInitialized: true });
      } else {
        const defaults = createDefaultSegments();
        set({ segments: defaults, isLoading: false, isInitialized: true });
        persist(defaults);
      }
    } catch {
      const defaults = createDefaultSegments();
      set({ segments: defaults, isLoading: false, isInitialized: true });
      persist(defaults);
    }
  },

  resetToDefaults: () => {
    const defaults = createDefaultSegments();
    set({ segments: defaults });
    persist(defaults);
  },
}));
