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

interface PersistedState {
  feedbacks: Feedback[];
}

interface FeedbackState extends PersistedState {
  addFeedback: (data: Omit<Feedback, 'id' | 'createdAt' | 'status'>) => boolean;
  deleteFeedback: (id: string) => void;
  updateStatus: (id: string, status: FeedbackStatus) => void;
  clearAll: () => void;
  exportToJSON: () => string;
}

const STORAGE_KEY = 'qa-feedback-storage';

const validStatuses: FeedbackStatus[] = ['pending', 'processing', 'resolved'];
const validRatings: FeedbackRating[] = ['useful', 'useless'];

function isValidFeedback(f: unknown): f is Feedback {
  if (!f || typeof f !== 'object') return false;
  const obj = f as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    typeof obj.question === 'string' &&
    typeof obj.chapterTitle === 'string' &&
    typeof obj.paragraph === 'string' &&
    typeof obj.confidence === 'number' &&
    validRatings.includes(obj.rating as FeedbackRating) &&
    typeof obj.remark === 'string' &&
    typeof obj.createdAt === 'string' &&
    validStatuses.includes(obj.status as FeedbackStatus)
  );
}

function safeGetItem(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { feedbacks: [] };
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { feedbacks: [] };
      }
      if (!parsed.state || typeof parsed.state !== 'object') {
        return { feedbacks: [] };
      }
      if (!Array.isArray(parsed.state.feedbacks)) {
        return { feedbacks: [] };
      }
      return {
        feedbacks: parsed.state.feedbacks.filter(isValidFeedback)
      };
    } catch {
      console.warn('Failed to parse feedback storage JSON, returning empty state');
      return { feedbacks: [] };
    }
  } catch (e) {
    console.error('Failed to read from localStorage:', e);
    return { feedbacks: [] };
  }
}

function safeSetItem(state: PersistedState): void {
  try {
    const data = JSON.stringify({ state, version: 0 });
    localStorage.setItem(STORAGE_KEY, data);
  } catch (e) {
    console.error('Failed to write to localStorage:', e);
    if (e instanceof Error && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      try {
        const current = safeGetItem();
        if (current.feedbacks.length > 1) {
          const trimmed: PersistedState = {
            feedbacks: current.feedbacks.slice(0, Math.floor(current.feedbacks.length * 0.5))
          };
          const trimmedData = JSON.stringify({ state: { ...trimmed, ...state }, version: 0 });
          localStorage.setItem(STORAGE_KEY, trimmedData);
          return;
        }
      } catch {
        // ignore retry error
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore remove error
      }
    }
  }
}

export const useFeedbackStore = create<FeedbackState>()(
  persist(
    (set, get) => ({
      feedbacks: [],
      addFeedback: (data) => {
        try {
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
          }));
          return true;
        } catch (e) {
          console.error('Failed to add feedback:', e);
          return false;
        }
      },
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
      clearAll: () => set({ feedbacks: [] }),
      exportToJSON: () => {
        const { feedbacks } = get();
        return JSON.stringify({
          exportedAt: new Date().toISOString(),
          totalCount: feedbacks.length,
          feedbacks
        }, null, 2);
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state): PersistedState => ({ feedbacks: state.feedbacks }),
      onRehydrateStorage: () => {
        const initialState = safeGetItem();
        return (state, error) => {
          if (error) {
            console.error('Rehydration error:', error);
          }
          if (state) {
            state.feedbacks = initialState.feedbacks;
          }
        };
      },
      storage: {
        getItem: (name: string) => {
          try {
            const raw = localStorage.getItem(name);
            if (!raw) return null;
            try {
              const parsed = JSON.parse(raw);
              return parsed;
            } catch {
              return { state: { feedbacks: [] }, version: 0 };
            }
          } catch {
            return null;
          }
        },
        setItem: (name: string, value: unknown) => {
          try {
            safeSetItem((value as { state: PersistedState }).state);
          } catch {
            // ignore
          }
        },
        removeItem: (name: string) => {
          try {
            localStorage.removeItem(name);
          } catch {
            // ignore
          }
        }
      }
    }
  )
);
