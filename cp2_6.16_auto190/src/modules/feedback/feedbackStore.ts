import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { addToStore, getFromStoreByIndex, getAllFromStore } from '@/utils/indexedDB';
import type { Feedback, EmotionStats, EmotionType } from '@/types';

interface FeedbackState {
  feedbacks: Feedback[];
  emotionStats: EmotionStats;

  submitFeedback: (eventId: string, checkInId: string, emotion: EmotionType) => Promise<void>;
  loadFeedbacks: (eventId?: string) => Promise<void>;
  getFeedbackStats: (eventId?: string) => EmotionStats;
  loadAllFeedbackStats: () => Promise<void>;
}

const initialStats: EmotionStats = {
  happy: 0,
  neutral: 0,
  sad: 0,
  angry: 0,
  excited: 0,
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedbacks: [],
  emotionStats: { ...initialStats },

  submitFeedback: async (eventId, checkInId, emotion) => {
    const feedback: Feedback = {
      id: uuidv4(),
      eventId,
      checkInId,
      emotion,
      timestamp: new Date().toISOString(),
    };
    await addToStore('feedbacks', feedback);

    set((state) => ({
      feedbacks: [...state.feedbacks, feedback],
      emotionStats: {
        ...state.emotionStats,
        [emotion]: state.emotionStats[emotion] + 1,
      },
    }));
  },

  loadFeedbacks: async (eventId) => {
    let feedbacks: Feedback[];
    if (eventId) {
      feedbacks = await getFromStoreByIndex<Feedback>('feedbacks', 'eventId', eventId);
    } else {
      feedbacks = await getAllFromStore<Feedback>('feedbacks');
    }

    const emotionStats: EmotionStats = { ...initialStats };
    feedbacks.forEach((f) => {
      emotionStats[f.emotion]++;
    });

    set({ feedbacks, emotionStats });
  },

  getFeedbackStats: (eventId) => {
    const { feedbacks } = get();
    const target = eventId ? feedbacks.filter((f) => f.eventId === eventId) : feedbacks;
    const stats: EmotionStats = { ...initialStats };
    target.forEach((f) => {
      stats[f.emotion]++;
    });
    return stats;
  },

  loadAllFeedbackStats: async () => {
    const feedbacks = await getAllFromStore<Feedback>('feedbacks');
    const emotionStats: EmotionStats = { ...initialStats };
    feedbacks.forEach((f) => {
      emotionStats[f.emotion]++;
    });
    set({ feedbacks, emotionStats });
  },
}));
