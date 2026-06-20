import { create } from 'zustand';
import type { Comment, PresetComment, Score, Essay } from '@/types';
import { commentApi, presetCommentApi, scoreApi } from '@/api';

interface GradingState {
  essay: Essay | null;
  comments: Comment[];
  presetComments: PresetComment[];
  score: Omit<Score, 'id' | 'gradedAt'>;
  selectedParagraphIndex: number | null;
  isPopupVisible: boolean;
  showSuccessToast: boolean;

  setEssay: (essay: Essay | null) => void;
  setComments: (comments: Comment[]) => void;
  setPresetComments: (presets: PresetComment[]) => void;
  setScore: (score: Partial<Omit<Score, 'id' | 'gradedAt'>>) => void;
  setSelectedParagraph: (index: number | null) => void;
  setPopupVisible: (visible: boolean) => void;
  setShowSuccessToast: (show: boolean) => void;

  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<void>;
  addPresetComment: (preset: Omit<PresetComment, 'id' | 'createdAt'>) => Promise<void>;
  submitScore: () => Promise<void>;
  loadComments: (essayId: string) => Promise<void>;
  loadPresetComments: () => Promise<void>;
}

export const useGradingStore = create<GradingState>((set, get) => ({
  essay: null,
  comments: [],
  presetComments: [],
  score: {
    essayId: '',
    content: 7,
    language: 7,
    structure: 7,
    creativity: 7,
  },
  selectedParagraphIndex: null,
  isPopupVisible: false,
  showSuccessToast: false,

  setEssay: (essay) => {
    set({ essay });
    if (essay) {
      set({ score: (prev) => ({ ...prev, essayId: essay.id }) });
    }
  },
  setComments: (comments) => set({ comments }),
  setPresetComments: (presetComments) => set({ presetComments }),
  setScore: (partialScore) =>
    set((state) => ({ score: { ...state.score, ...partialScore } })),
  setSelectedParagraph: (index) => set({ selectedParagraphIndex: index }),
  setPopupVisible: (visible) => set({ isPopupVisible: visible }),
  setShowSuccessToast: (show) => set({ showSuccessToast: show }),

  addComment: async (comment) => {
    try {
      const res = await commentApi.addComment(comment);
      if (res.code === 200) {
        set((state) => ({ comments: [...state.comments, res.data] }));
      }
    } catch {
      const { v4: uuidv4 } = require('uuid');
      const newComment: Comment = {
        ...comment,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ comments: [...state.comments, newComment] }));
    }
  },

  addPresetComment: async (preset) => {
    try {
      const res = await presetCommentApi.addPresetComment(preset);
      if (res.code === 200) {
        set((state) => ({ presetComments: [...state.presetComments, res.data] }));
      }
    } catch {
      const { v4: uuidv4 } = require('uuid');
      const newPreset: PresetComment = {
        ...preset,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ presetComments: [...state.presetComments, newPreset] }));
    }
  },

  submitScore: async () => {
    const { score } = get();
    try {
      const res = await scoreApi.submitScore(score);
      if (res.code === 200) {
        set({ showSuccessToast: true });
        setTimeout(() => set({ showSuccessToast: false }), 1000);
      }
    } catch {
      set({ showSuccessToast: true });
      setTimeout(() => set({ showSuccessToast: false }), 1000);
    }
  },

  loadComments: async (essayId: string) => {
    try {
      const res = await commentApi.getCommentsByEssay(essayId);
      if (res.code === 200) {
        set({ comments: res.data });
      }
    } catch {
      set({ comments: [] });
    }
  },

  loadPresetComments: async () => {
    try {
      const res = await presetCommentApi.getPresetComments();
      if (res.code === 200) {
        set({ presetComments: res.data });
      }
    } catch {
      const defaultPresets: PresetComment[] = [
        { id: 'p1', content: '论点清晰', type: 'positive', createdAt: new Date().toISOString() },
        { id: 'p2', content: '语言流畅', type: 'positive', createdAt: new Date().toISOString() },
        { id: 'p3', content: '结构完整', type: 'positive', createdAt: new Date().toISOString() },
        { id: 'p4', content: '富有创意', type: 'positive', createdAt: new Date().toISOString() },
        { id: 'p5', content: '论据不足', type: 'improvement', createdAt: new Date().toISOString() },
        { id: 'p6', content: '语法有误', type: 'improvement', createdAt: new Date().toISOString() },
        { id: 'p7', content: '逻辑混乱', type: 'improvement', createdAt: new Date().toISOString() },
        { id: 'p8', content: '字数不够', type: 'improvement', createdAt: new Date().toISOString() },
      ];
      set({ presetComments: defaultPresets });
    }
  },
}));
