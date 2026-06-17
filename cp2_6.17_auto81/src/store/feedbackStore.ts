import { create } from 'zustand';
import {
  FeedbackItem,
  EmotionType,
  EmotionStats,
  addFeedback as dbAddFeedback,
  getAllFeedbacks,
  updateFeedbackEmotion as dbUpdateEmotion,
  clearAllFeedbacks as dbClearAll,
  getEmotionStats as dbGetEmotionStats,
  exportAllData as dbExportAll,
  initDB,
} from '../db';

const BORDER_COLORS = ['#FF6584', '#4ECDC4', '#FFD166', '#6C63FF'];

function generateAnonymousId(): string {
  const hex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0')
    .toUpperCase();
  return `User-${hex}`;
}

function getRandomBorderColor(): string {
  return BORDER_COLORS[Math.floor(Math.random() * BORDER_COLORS.length)];
}

const MAX_FEEDBACKS = 40;

interface FeedbackState {
  feedbacks: FeedbackItem[];
  emotionStats: EmotionStats;
  anonymousId: string;
  isLoaded: boolean;
  init: () => Promise<void>;
  submitFeedback: (content: string) => Promise<void>;
  setEmotion: (id: string, emotion: EmotionType) => Promise<void>;
  clearAll: () => Promise<void>;
  exportData: () => Promise<void>;
}

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedbacks: [],
  emotionStats: { happy: 0, neutral: 0, sad: 0 },
  anonymousId: '',
  isLoaded: false,

  init: async () => {
    await initDB();
    const feedbacks = (await getAllFeedbacks()).map((f) => ({
      ...f,
      borderColor: f.borderColor || getRandomBorderColor(),
    }));
    const emotionStats = await dbGetEmotionStats();
    const anonymousId = generateAnonymousId();
    set({ feedbacks, emotionStats, anonymousId, isLoaded: true });
  },

  submitFeedback: async (content: string) => {
    const { anonymousId, feedbacks } = get();
    const newFeedback: FeedbackItem = {
      id: crypto.randomUUID(),
      content,
      userId: anonymousId,
      createdAt: Date.now(),
      borderColor: getRandomBorderColor(),
    };

    await dbAddFeedback(newFeedback);

    const updatedFeedbacks = [newFeedback, ...feedbacks].slice(0, MAX_FEEDBACKS);
    set({ feedbacks: updatedFeedbacks });
  },

  setEmotion: async (id: string, emotion: EmotionType) => {
    const { feedbacks } = get();
    const feedback = feedbacks.find((f) => f.id === id);
    if (!feedback || feedback.emotion) return;

    await dbUpdateEmotion(id, emotion);

    const updatedFeedbacks = feedbacks.map((f) =>
      f.id === id ? { ...f, emotion } : f
    );
    const emotionStats = await dbGetEmotionStats();
    set({ feedbacks: updatedFeedbacks, emotionStats });
  },

  clearAll: async () => {
    await dbClearAll();
    set({ feedbacks: [], emotionStats: { happy: 0, neutral: 0, sad: 0 } });
  },

  exportData: async () => {
    const data = await dbExportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timestamp =
      now.getFullYear().toString() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      '_' +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback_export_${timestamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
}));
