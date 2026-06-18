import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type FeedbackRating = 'useful' | 'useless';
export type FeedbackStatus = 'pending' | 'processing' | 'resolved';

export interface Feedback {
  id: string;
  question: string;
  chapterTitle: string;
  paragraph: string;
  confidence: number;
  rating: FeedbackRating;
  remark: string;
  createdAt: string;
  status: FeedbackStatus;
}

interface FeedbackState {
  feedbacks: Feedback[];
  addFeedback: (data: Omit<Feedback, 'id' | 'createdAt' | 'status'>) => void;
  deleteFeedback: (id: string) => void;
  updateStatus: (id: string, status: FeedbackStatus) => void;
  clearAll: () => void;
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set) => ({
      feedbacks: [],
      addFeedback: (data) =>
        set((state) => ({
          feedbacks: [
            {
              ...data,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
              status: 'pending'
            },
            ...state.feedbacks
          ]
        })),
      deleteFeedback: (id) =>
        set((state) => ({
          feedbacks: state.feedbacks.filter((f) => f.id !== id)
        })),
      updateStatus: (id, status) =>
        set((state) => ({
          feedbacks: state.feedbacks.map((f) =>
            f.id === id ? { ...f, status } : f
          )
        })),
      clearAll: () => set({ feedbacks: [] })
    }),
    {
      name: 'qa-feedback-storage',
      partialize: (state) => ({ feedbacks: state.feedbacks })
    }
  )
);
